// Hanzo Agent Cloud — React Hooks
// SSE management and specialized hooks for agent monitoring

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getApiKey, getConfig, getDashboardSummary, getEnhancedDashboardSummary } from '../services'
import type { EnhancedDashboardParams } from '../services'
import type {
  SSEEvent,
  SSEState,
  DashboardSummary,
  EnhancedDashboardResponse,
  TimeRangePreset,
} from '../types'

// ============================================================================
// SSE Options
// ============================================================================

export interface SSEOptions {
  /** Whether to automatically reconnect on connection loss */
  autoReconnect?: boolean
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number
  /** Base delay between reconnection attempts (ms) */
  reconnectDelayMs?: number
  /** Whether to use exponential backoff for reconnection delays */
  exponentialBackoff?: boolean
  /** Custom event types to listen for */
  eventTypes?: string[]
  /** Callback for connection state changes */
  onConnectionChange?: (connected: boolean) => void
  /** Callback for errors */
  onError?: (error: Event) => void
}

// ============================================================================
// useSSE — Core SSE Hook
// ============================================================================

/**
 * Manage a Server-Sent Events connection with automatic reconnection
 * and event filtering.
 */
export function useSSE<T = any>(url: string | null, options: SSEOptions = {}) {
  const {
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelayMs = 1000,
    exponentialBackoff = true,
    eventTypes = [],
    onConnectionChange,
    onError,
  } = options

  const [state, setState] = useState<SSEState>({
    connected: false,
    reconnecting: false,
    reconnectAttempt: 0,
    lastError: null,
  })

  const [events, setEvents] = useState<SSEEvent<T>[]>([])
  const [latestEvent, setLatestEvent] = useState<SSEEvent<T> | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    clearReconnectTimeout()
  }, [clearReconnectTimeout])

  const attemptReconnect = useCallback(() => {
    if (!mountedRef.current || !autoReconnect || !url) return

    setState((prev) => {
      if (prev.reconnectAttempt >= maxReconnectAttempts) {
        return { ...prev, reconnecting: false }
      }

      const delay = exponentialBackoff
        ? reconnectDelayMs * Math.pow(2, prev.reconnectAttempt)
        : reconnectDelayMs

      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect()
        }
      }, delay)

      return {
        ...prev,
        reconnecting: true,
        reconnectAttempt: prev.reconnectAttempt + 1,
      }
    })
  }, [autoReconnect, url, maxReconnectAttempts, reconnectDelayMs, exponentialBackoff])

  const handleEvent = useCallback(
    (event: MessageEvent, eventType: string = 'message') => {
      if (!mountedRef.current) return

      try {
        if (!event.data) return

        const data = JSON.parse(event.data)
        if (!data || typeof data !== 'object') return

        const actualEventType =
          data.type && typeof data.type === 'string' ? data.type : eventType

        const sseEvent: SSEEvent<T> = {
          type: actualEventType,
          data,
          timestamp: new Date(),
          id: event.lastEventId || undefined,
        }

        setLatestEvent(sseEvent)
        setEvents((prev) => [...prev.slice(-99), sseEvent])
      } catch {
        // Silently ignore unparseable events
      }
    },
    []
  )

  const connect = useCallback(() => {
    if (!url || !mountedRef.current) return

    closeConnection()

    try {
      let finalUrl = url
      const apiKey = getApiKey()
      if (apiKey) {
        const separator = url.includes('?') ? '&' : '?'
        finalUrl = `${url}${separator}api_key=${encodeURIComponent(apiKey)}`
      }

      const eventSource = new EventSource(finalUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (!mountedRef.current) return
        setState((prev) => ({
          ...prev,
          connected: true,
          reconnecting: false,
          reconnectAttempt: 0,
          lastError: null,
        }))
        onConnectionChange?.(true)
      }

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return
        setState((prev) => ({
          ...prev,
          connected: false,
          lastError: error,
        }))
        onConnectionChange?.(false)
        onError?.(error)

        if (eventSource.readyState === EventSource.CLOSED) {
          attemptReconnect()
        }
      }

      eventSource.onmessage = (event) => handleEvent(event, 'message')

      eventTypes.forEach((type) => {
        eventSource.addEventListener(type, (event) =>
          handleEvent(event as MessageEvent, type)
        )
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        connected: false,
        lastError: error as Event,
      }))
    }
  }, [url, eventTypes, handleEvent, closeConnection, attemptReconnect, onConnectionChange, onError])

  const reconnect = useCallback(() => {
    setState((prev) => ({ ...prev, reconnectAttempt: 0 }))
    connect()
  }, [connect])

  const clearEvents = useCallback(() => {
    setEvents([])
    setLatestEvent(null)
  }, [])

  const getEventsByType = useCallback(
    (type: string): SSEEvent<T>[] => {
      return events.filter((event) => event.type === type)
    },
    [events]
  )

  // Connect when URL changes
  useEffect(() => {
    if (url && !state.connected && !eventSourceRef.current) {
      connect()
    } else if (!url) {
      closeConnection()
      setState((prev) => ({ ...prev, connected: false }))
    }

    return () => {
      closeConnection()
    }
  }, [url])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      closeConnection()
    }
  }, [])

  return {
    connected: state.connected,
    reconnecting: state.reconnecting,
    reconnectAttempt: state.reconnectAttempt,
    lastError: state.lastError,
    events,
    latestEvent,
    reconnect,
    disconnect: closeConnection,
    clearEvents,
    getEventsByType,
    hasEvents: events.length > 0,
    eventCount: events.length,
  }
}

// ============================================================================
// Specialized SSE Hooks
// ============================================================================

/** MCP health events for a specific node. */
export function useMCPHealthSSE(nodeId: string | null) {
  const { baseUrl } = getConfig()
  const url = nodeId ? `${baseUrl}/nodes/${nodeId}/mcp/events` : null

  return useSSE(url, {
    eventTypes: ['server_status_change', 'tool_execution', 'health_update', 'error'],
    autoReconnect: true,
    maxReconnectAttempts: 3,
    reconnectDelayMs: 2000,
    exponentialBackoff: true,
  })
}

/** Agent node events including status changes. */
export function useNodeEventsSSE() {
  const { baseUrl } = getConfig()
  const url = `${baseUrl}/nodes/events`

  return useSSE(url, {
    eventTypes: [
      'node_registered',
      'node_online',
      'node_offline',
      'node_status_updated',
      'node_health_changed',
      'node_removed',
      'mcp_health_changed',
      'node_unified_status_changed',
      'node_state_transition',
      'node_status_refreshed',
      'bulk_status_update',
    ],
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelayMs: 1000,
    exponentialBackoff: true,
  })
}

/** Unified status events for all nodes. */
export function useUnifiedStatusSSE() {
  const { baseUrl } = getConfig()
  const url = `${baseUrl}/nodes/events`

  return useSSE(url, {
    eventTypes: [
      'node_unified_status_changed',
      'node_state_transition',
      'node_status_refreshed',
      'bulk_status_update',
    ],
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelayMs: 1000,
    exponentialBackoff: true,
  })
}

/** Unified status events for a specific node. */
export function useNodeUnifiedStatusSSE(nodeId: string | null) {
  const { baseUrl } = getConfig()
  const url = `${baseUrl}/nodes/events`

  return useSSE(url, {
    eventTypes: [
      'node_unified_status_changed',
      'node_state_transition',
      'node_status_refreshed',
    ],
    autoReconnect: true,
    maxReconnectAttempts: 3,
    reconnectDelayMs: 2000,
    exponentialBackoff: true,
  })
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

interface DashboardState {
  data: DashboardSummary | null
  loading: boolean
  error: Error | null
  lastFetch: Date | null
  isStale: boolean
}

/** Basic dashboard data with caching and auto-refresh. */
export function useDashboard(options: {
  refreshInterval?: number
  cacheTtlMs?: number
  onError?: (error: Error) => void
} = {}) {
  const {
    refreshInterval = 30000,
    cacheTtlMs = 60000,
    onError,
  } = options

  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    isStale: false,
  })

  const mountedRef = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await getDashboardSummary()
      if (!mountedRef.current) return
      setState({
        data,
        loading: false,
        error: null,
        lastFetch: new Date(),
        isStale: false,
      })
    } catch (err) {
      if (!mountedRef.current) return
      const error = err instanceof Error ? err : new Error(String(err))
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
        isStale: prev.data !== null,
      }))
      onError?.(error)
    }
  }, [onError])

  const refresh = useCallback(() => fetchData(), [fetchData])

  useEffect(() => {
    fetchData()

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchData, refreshInterval])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { ...state, refresh }
}

interface EnhancedDashboardState {
  data: EnhancedDashboardResponse | null
  loading: boolean
  error: Error | null
  lastFetch: Date | null
}

/** Enhanced dashboard with time-range aware caching. */
export function useEnhancedDashboard(options: {
  preset?: TimeRangePreset
  startTime?: string
  endTime?: string
  compare?: boolean
  cacheTtlMs?: number
  onError?: (error: Error) => void
} = {}) {
  const {
    preset = '24h',
    startTime,
    endTime,
    compare = false,
    cacheTtlMs,
    onError,
  } = options

  const [state, setState] = useState<EnhancedDashboardState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
  })

  const mountedRef = useRef(true)
  const cacheRef = useRef<{
    key: string
    data: EnhancedDashboardResponse | null
    timestamp: number
  }>({ key: '', data: null, timestamp: 0 })

  const defaultTtl = useMemo(() => {
    switch (preset) {
      case '1h': return 30000
      case '24h': return 60000
      case '7d': return 120000
      case '30d': return 300000
      default: return 60000
    }
  }, [preset])

  const ttl = cacheTtlMs ?? defaultTtl

  const params: EnhancedDashboardParams = useMemo(
    () => ({ preset, startTime, endTime, compare }),
    [preset, startTime, endTime, compare]
  )

  const cacheKey = useMemo(
    () => JSON.stringify(params),
    [params]
  )

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return

    // Check cache
    const cached = cacheRef.current
    if (cached.key === cacheKey && cached.data && Date.now() - cached.timestamp < ttl) {
      setState({ data: cached.data, loading: false, error: null, lastFetch: new Date(cached.timestamp) })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await getEnhancedDashboardSummary(params)
      if (!mountedRef.current) return
      cacheRef.current = { key: cacheKey, data, timestamp: Date.now() }
      setState({ data, loading: false, error: null, lastFetch: new Date() })
    } catch (err) {
      if (!mountedRef.current) return
      const error = err instanceof Error ? err : new Error(String(err))
      setState((prev) => ({ ...prev, loading: false, error }))
      onError?.(error)
    }
  }, [params, cacheKey, ttl, onError])

  const refresh = useCallback(() => {
    cacheRef.current = { key: '', data: null, timestamp: 0 }
    return fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { ...state, refresh }
}

// ============================================================================
// Time Range Hook
// ============================================================================

const PRESET_LABELS: Record<TimeRangePreset, string> = {
  '1h': 'Last hour',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  'custom': 'Custom range',
}

export interface TimeRangeState {
  preset: TimeRangePreset
  startTime: Date | null
  endTime: Date | null
  compare: boolean
}

/**
 * Time range state management for dashboards.
 * NOTE: Does not persist to URL (no router dependency).
 * Consumers can sync to URL themselves if needed.
 */
export function useDashboardTimeRange(defaultPreset: TimeRangePreset = '24h') {
  const [timeRange, setTimeRange] = useState<TimeRangeState>({
    preset: defaultPreset,
    startTime: null,
    endTime: null,
    compare: false,
  })

  const setPreset = useCallback((preset: TimeRangePreset) => {
    setTimeRange((prev) => ({
      ...prev,
      preset,
      startTime: preset === 'custom' ? prev.startTime : null,
      endTime: preset === 'custom' ? prev.endTime : null,
    }))
  }, [])

  const setCustomRange = useCallback((startTime: Date, endTime: Date) => {
    setTimeRange((prev) => ({
      ...prev,
      preset: 'custom' as TimeRangePreset,
      startTime,
      endTime,
    }))
  }, [])

  const toggleCompare = useCallback(() => {
    setTimeRange((prev) => ({ ...prev, compare: !prev.compare }))
  }, [])

  const setCompare = useCallback((compare: boolean) => {
    setTimeRange((prev) => ({ ...prev, compare }))
  }, [])

  const getApiParams = useCallback(() => {
    const params: {
      preset: TimeRangePreset
      startTime?: string
      endTime?: string
      compare: boolean
    } = {
      preset: timeRange.preset,
      compare: timeRange.compare,
    }

    if (timeRange.preset === 'custom' && timeRange.startTime && timeRange.endTime) {
      params.startTime = timeRange.startTime.toISOString()
      params.endTime = timeRange.endTime.toISOString()
    }

    return params
  }, [timeRange])

  const label = useMemo(() => {
    if (timeRange.preset === 'custom' && timeRange.startTime && timeRange.endTime) {
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
      const start = timeRange.startTime.toLocaleDateString(undefined, opts)
      const end = timeRange.endTime.toLocaleDateString(undefined, opts)
      return `${start} - ${end}`
    }
    return PRESET_LABELS[timeRange.preset]
  }, [timeRange])

  return {
    timeRange,
    setPreset,
    setCustomRange,
    toggleCompare,
    setCompare,
    getApiParams,
    label,
  }
}
