'use client'

import * as React from 'react'
import type { PanelState, NewsStreamItem, MarketQuote, PredictionMarketItem, InstabilityScoreData } from './types'

/* ------------------------------------------------------------------ */
/*  useWorldData                                                      */
/* ------------------------------------------------------------------ */

export interface UseWorldDataOptions {
  /**
   * API origin. Default `''` → same-origin (`/v1/world/...`). Point at
   * `https://api.hanzo.ai` (or a customer gateway) to embed cross-origin.
   */
  baseUrl?: string
  /** Poll interval in ms. Omit / 0 to fetch once. */
  refreshMs?: number
  /** Query params appended to the request. */
  params?: Record<string, string | number | boolean | undefined>
  /** Set false to skip fetching (e.g. while a parent gate is closed). */
  enabled?: boolean
  /** Override fetch (SSR / auth-injecting wrappers). */
  fetcher?: typeof fetch
  /** Extra request headers (e.g. Authorization). */
  headers?: Record<string, string>
}

/**
 * Fetch + poll a `/v1/world/<path>` endpoint into a normalized PanelState.
 * Accepts a bare array, `{ items: [...] }`, or `{ data: ... , unavailable? }`.
 */
export function useWorldData<T>(path: string, options: UseWorldDataOptions = {}): PanelState<T> & { refresh: () => void } {
  const { baseUrl = '', refreshMs, params, enabled = true, fetcher, headers } = options

  const [state, setState] = React.useState<PanelState<T>>({ data: null, loading: enabled, error: null })

  // Serialize params so the effect only re-runs on real changes.
  const paramsKey = params ? JSON.stringify(params) : ''
  const headersKey = headers ? JSON.stringify(headers) : ''

  const url = React.useMemo(() => {
    const base = baseUrl.replace(/\/$/, '')
    const clean = path.replace(/^\//, '')
    const u = new URL(`${base}/v1/world/${clean}`, base || 'http://local.invalid')
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) u.searchParams.set(k, String(v))
      }
    }
    // Same-origin: emit a relative URL so it works in the browser.
    return base ? u.href : `${u.pathname}${u.search}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, path, paramsKey])

  const [nonce, setNonce] = React.useState(0)
  const refresh = React.useCallback(() => setNonce((n) => n + 1), [])

  React.useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }
    const controller = new AbortController()
    let active = true
    const doFetch = fetcher ?? fetch

    async function run() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }))
        const res = await doFetch(url, { signal: controller.signal, headers })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as unknown
        if (!active) return
        const { data, unavailable } = normalize<T>(json)
        setState({ data, loading: false, error: null, unavailable })
      } catch (err) {
        if (!active || controller.signal.aborted) return
        setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Request failed' })
      }
    }

    run()
    const timer = refreshMs && refreshMs > 0 ? setInterval(run, refreshMs) : null
    return () => {
      active = false
      controller.abort()
      if (timer) clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, refreshMs, nonce, headersKey])

  return { ...state, refresh }
}

/** Unwrap the common envelopes into `{ data, unavailable }`. */
function normalize<T>(json: unknown): { data: T | null; unavailable?: boolean } {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>
    const unavailable = obj.unavailable === true
    if ('items' in obj) return { data: obj.items as T, unavailable }
    if ('data' in obj) return { data: obj.data as T, unavailable }
    return { data: json as T, unavailable }
  }
  return { data: json as T }
}

/* ------------------------------------------------------------------ */
/*  Typed convenience hooks                                           */
/* ------------------------------------------------------------------ */

/** News feed → `NewsStreamItem[]`. Default 60s poll. */
export function useNewsStream(options: UseWorldDataOptions = {}) {
  return useWorldData<NewsStreamItem[]>('news', { refreshMs: 60_000, ...options })
}

/** Market quotes → `MarketQuote[]`. Default 30s poll. */
export function useMarketTicker(options: UseWorldDataOptions = {}) {
  return useWorldData<MarketQuote[]>('markets', { refreshMs: 30_000, ...options })
}

/** Prediction markets → `PredictionMarketItem[]`. Default 60s poll. */
export function usePredictionMarkets(options: UseWorldDataOptions = {}) {
  return useWorldData<PredictionMarketItem[]>('predictions', { refreshMs: 60_000, ...options })
}

/** Instability scores → `InstabilityScoreData[]`. Default 5m poll. */
export function useInstabilityScores(options: UseWorldDataOptions = {}) {
  return useWorldData<InstabilityScoreData[]>('instability', { refreshMs: 300_000, ...options })
}
