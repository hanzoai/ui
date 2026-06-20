// Hanzo Agent Cloud — API Services
// Configurable API client for control plane communication

import type {
  AgentNode,
  AgentNodeSummary,
  AgentNodeDetails,
  AgentNodeDetailsWithPackage,
  MCPHealthResponse,
  MCPServerActionResponse,
  MCPToolsResponse,
  MCPToolTestResponse,
  MCPServerMetrics,
  MCPNodeMetrics,
  MCPHealthEvent,
  AgentStatus,
  AgentStatusUpdate,
  AgentPackage,
  ConfigurationSchema,
  AppMode,
  HealthStatus,
  LifecycleStatus,
} from '../types'

// ============================================================================
// Configuration
// ============================================================================

interface HanzoAgentConfig {
  baseUrl: string
  apiKey?: string | null
  timeout?: number
  onAuthError?: () => void
}

let config: HanzoAgentConfig = {
  baseUrl: '/api/ui/v1',
  apiKey: null,
  timeout: 10000,
}

/** Configure the API client. Call once at app initialization. */
export function configure(options: Partial<HanzoAgentConfig>) {
  config = { ...config, ...options }
}

/** Get current configuration (read-only). */
export function getConfig(): Readonly<HanzoAgentConfig> {
  return config
}

/** Set or clear the API key at runtime. */
export function setApiKey(key: string | null) {
  config.apiKey = key
}

/** Get the current API key. */
export function getApiKey(): string | null {
  return config.apiKey ?? null
}

// ============================================================================
// MCP Error Type
// ============================================================================

export interface MCPError extends Error {
  code?: string
  details?: any
  isRetryable?: boolean
  retryAfterMs?: number
}

// ============================================================================
// Fetch Wrapper
// ============================================================================

async function fetchWrapper<T>(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const { timeout = config.timeout ?? 10000, ...fetchOptions } = options || {}

  const headers = new Headers(fetchOptions.headers || {})
  if (config.apiKey) {
    headers.set('X-API-Key', config.apiKey)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${config.baseUrl}${url}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        config.onAuthError?.()
      }

      const errorData = await response.json().catch(() => ({
        message: 'Request failed with status ' + response.status,
      }))

      if (url.includes('/mcp/') && errorData.code) {
        const mcpError = new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        ) as MCPError
        mcpError.code = errorData.code
        mcpError.details = errorData.details
        mcpError.isRetryable = errorData.is_retryable || false
        mcpError.retryAfterMs = errorData.retry_after_ms
        throw mcpError
      }

      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      )
    }

    return response.json() as Promise<T>
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }

    throw error
  }
}

/** Retry wrapper for MCP operations with exponential backoff. */
async function retryMCPOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: MCPError | Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as MCPError | Error

      if (!('isRetryable' in lastError) || !lastError.isRetryable) {
        throw lastError
      }

      if (attempt === maxRetries) {
        throw lastError
      }

      const delay =
        lastError.retryAfterMs || baseDelayMs * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// ============================================================================
// Node APIs
// ============================================================================

export async function getNodesSummary(): Promise<{
  nodes: AgentNodeSummary[]
  count: number
}> {
  return fetchWrapper('/nodes/summary')
}

export async function getNodeDetails(nodeId: string): Promise<AgentNode> {
  return fetchWrapper(`/nodes/${nodeId}/details`)
}

export async function getNodeDetailsWithMCP(
  nodeId: string,
  mode: AppMode = 'user'
): Promise<AgentNodeDetails> {
  return fetchWrapper(
    `/nodes/${nodeId}/details?include_mcp=true&mode=${mode}`,
    { timeout: 8000 }
  )
}

export async function getNodeDetailsWithPackageInfo(
  nodeId: string,
  mode: AppMode = 'user'
): Promise<AgentNodeDetailsWithPackage> {
  return fetchWrapper(
    `/nodes/${nodeId}/details?include_mcp=true&mode=${mode}`,
    { timeout: 8000 }
  )
}

/** Create an EventSource for node event streaming. */
export function streamNodeEvents(): EventSource {
  const apiKey = getApiKey()
  const url = apiKey
    ? `${config.baseUrl}/nodes/events?api_key=${encodeURIComponent(apiKey)}`
    : `${config.baseUrl}/nodes/events`
  return new EventSource(url)
}

// ============================================================================
// MCP Health
// ============================================================================

export async function getMCPHealth(
  nodeId: string,
  mode: AppMode = 'user'
): Promise<MCPHealthResponse> {
  return fetchWrapper(`/nodes/${nodeId}/mcp/health?mode=${mode}`)
}

export async function getMCPHealthEvents(
  nodeId: string,
  limit: number = 50,
  since?: string
): Promise<{ events: MCPHealthEvent[] }> {
  const params = new URLSearchParams({ limit: limit.toString() })
  if (since) {
    params.append('since', since)
  }
  return fetchWrapper(`/nodes/${nodeId}/mcp/events/history?${params}`)
}

/** Subscribe to MCP health events via SSE. */
export function subscribeMCPHealthEvents(nodeId: string): EventSource {
  const apiKey = getApiKey()
  const url = apiKey
    ? `${config.baseUrl}/nodes/${nodeId}/mcp/events?api_key=${encodeURIComponent(apiKey)}`
    : `${config.baseUrl}/nodes/${nodeId}/mcp/events`
  return new EventSource(url)
}

// ============================================================================
// MCP Server Management
// ============================================================================

export async function startMCPServer(
  nodeId: string,
  serverId: string
): Promise<MCPServerActionResponse> {
  return retryMCPOperation(() =>
    fetchWrapper(`/nodes/${nodeId}/mcp/servers/${serverId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function stopMCPServer(
  nodeId: string,
  serverId: string
): Promise<MCPServerActionResponse> {
  return retryMCPOperation(() =>
    fetchWrapper(`/nodes/${nodeId}/mcp/servers/${serverId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function restartMCPServer(
  nodeId: string,
  serverId: string
): Promise<MCPServerActionResponse> {
  return retryMCPOperation(() =>
    fetchWrapper(`/nodes/${nodeId}/mcp/servers/${serverId}/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function bulkMCPServerAction(
  nodeId: string,
  serverIds: string[],
  action: 'start' | 'stop' | 'restart'
): Promise<MCPServerActionResponse[]> {
  return retryMCPOperation(() =>
    fetchWrapper(`/nodes/${nodeId}/mcp/servers/bulk/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server_ids: serverIds }),
    })
  )
}

// ============================================================================
// MCP Tools
// ============================================================================

export async function getMCPTools(
  nodeId: string,
  alias: string
): Promise<{ tools: import('../types').MCPTool[] }> {
  return fetchWrapper(`/nodes/${nodeId}/mcp/servers/${alias}/tools`)
}

export async function testMCPTool(
  nodeId: string,
  serverId: string,
  toolName: string,
  params: Record<string, any>,
  timeoutMs?: number
): Promise<MCPToolTestResponse> {
  return retryMCPOperation(() =>
    fetchWrapper(
      `/nodes/${nodeId}/mcp/servers/${serverId}/tools/${toolName}/test`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          server_alias: serverId,
          tool_name: toolName,
          parameters: params,
          timeout_ms: timeoutMs,
        }),
      }
    )
  )
}

// ============================================================================
// MCP Metrics
// ============================================================================

export async function getMCPServerMetrics(
  nodeId: string,
  serverId?: string
): Promise<MCPNodeMetrics> {
  const endpoint = serverId
    ? `/nodes/${nodeId}/mcp/servers/${serverId}/metrics`
    : `/nodes/${nodeId}/mcp/metrics`
  return fetchWrapper(endpoint)
}

// ============================================================================
// MCP Configuration
// ============================================================================

export async function getMCPServerConfig(
  nodeId: string,
  serverId: string
): Promise<{ config: Record<string, any>; schema?: Record<string, any> }> {
  return fetchWrapper(`/nodes/${nodeId}/mcp/servers/${serverId}/config`)
}

export async function updateMCPServerConfig(
  nodeId: string,
  serverId: string,
  serverConfig: Record<string, any>
): Promise<MCPServerActionResponse> {
  return retryMCPOperation(() =>
    fetchWrapper(`/nodes/${nodeId}/mcp/servers/${serverId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: serverConfig }),
    })
  )
}

// ============================================================================
// Environment Variables
// ============================================================================

export async function getAgentEnvironmentVariables(
  agentId: string,
  packageId: string
): Promise<{ variables: Record<string, string> }> {
  return fetchWrapper(`/agents/${agentId}/env?packageId=${packageId}`)
}

export async function updateAgentEnvironmentVariables(
  agentId: string,
  packageId: string,
  variables: Record<string, string>
): Promise<{ message: string; agent_id: string; package_id: string }> {
  return fetchWrapper(`/agents/${agentId}/env?packageId=${packageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables }),
  })
}

// ============================================================================
// Agent Configuration
// ============================================================================

export async function getAgentConfigurationSchema(
  agentId: string,
  packageId: string
): Promise<ConfigurationSchema> {
  return fetchWrapper(
    `/agents/${agentId}/config/schema?packageId=${packageId}`
  )
}

// ============================================================================
// Unified Status Management
// ============================================================================

export async function getNodeStatus(nodeId: string): Promise<AgentStatus> {
  return fetchWrapper(`/nodes/${nodeId}/status`)
}

export async function refreshNodeStatus(nodeId: string): Promise<AgentStatus> {
  return fetchWrapper(`/nodes/${nodeId}/status/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function bulkNodeStatus(
  nodeIds: string[]
): Promise<Record<string, AgentStatus>> {
  return fetchWrapper('/nodes/status/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node_ids: nodeIds }),
  })
}

export async function updateNodeStatus(
  nodeId: string,
  update: AgentStatusUpdate
): Promise<AgentStatus> {
  return fetchWrapper(`/nodes/${nodeId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
}

// ============================================================================
// Agent Lifecycle
// ============================================================================

export async function startAgent(nodeId: string): Promise<AgentStatus> {
  return fetchWrapper(`/nodes/${nodeId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function stopAgent(nodeId: string): Promise<AgentStatus> {
  return fetchWrapper(`/nodes/${nodeId}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

// ============================================================================
// Serverless Registration
// ============================================================================

export async function registerServerlessAgent(invocationUrl: string): Promise<{
  success: boolean
  message: string
  node: {
    id: string
    version: string
    deployment_type: string
    invocation_url: string
    reasoners_count: number
    skills_count: number
  }
}> {
  const API_V1_BASE = config.baseUrl.replace('/ui/v1', '/v1')

  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (config.apiKey) {
    headers.set('X-API-Key', config.apiKey)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${API_V1_BASE}/nodes/register-serverless`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invocation_url: invocationUrl }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Request failed with status ' + response.status,
      }))
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      )
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 15000ms')
    }
    throw error
  }
}

// ============================================================================
// SSE Helpers
// ============================================================================

/** Subscribe to unified status events via SSE. */
export function subscribeToStatusEvents(): EventSource {
  const apiKey = getApiKey()
  const url = apiKey
    ? `${config.baseUrl}/nodes/events?api_key=${encodeURIComponent(apiKey)}`
    : `${config.baseUrl}/nodes/events`
  return new EventSource(url)
}

// ============================================================================
// Dashboard
// ============================================================================

export interface EnhancedDashboardParams {
  preset?: '1h' | '24h' | '7d' | '30d' | 'custom'
  startTime?: string
  endTime?: string
  compare?: boolean
}

function buildDashboardQueryString(params: EnhancedDashboardParams): string {
  const queryParams = new URLSearchParams()
  if (params.preset) queryParams.set('preset', params.preset)
  if (params.preset === 'custom' && params.startTime && params.endTime) {
    queryParams.set('start_time', params.startTime)
    queryParams.set('end_time', params.endTime)
  }
  if (params.compare) queryParams.set('compare', 'true')
  const qs = queryParams.toString()
  return qs ? `?${qs}` : ''
}

export async function getDashboardSummary(): Promise<
  import('../types').DashboardSummary
> {
  return retryOperation(() =>
    fetchWrapper('/dashboard/summary', { timeout: 8000 })
  )
}

export async function getEnhancedDashboardSummary(
  params: EnhancedDashboardParams = {}
): Promise<import('../types').EnhancedDashboardResponse> {
  const qs = buildDashboardQueryString(params)
  return retryOperation(() =>
    fetchWrapper(`/dashboard/enhanced${qs}`, { timeout: 15000 })
  )
}

// Generic retry for non-MCP operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt === maxRetries) throw lastError
      const delay = baseDelayMs * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError!
}

// ============================================================================
// Query String Helper
// ============================================================================

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })
  return searchParams.toString()
}

// ============================================================================
// Workflow APIs
// ============================================================================

/** Get workflows summary with pagination, filtering, and sorting. */
export async function getWorkflowsSummary(
  options: {
    filters?: import('../types').ExecutionViewFilters
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    signal?: AbortSignal
  } = {}
): Promise<import('../types').WorkflowsResponse> {
  const {
    filters = {},
    page = 1,
    pageSize = 20,
    sortBy = 'updated_at',
    sortOrder = 'desc',
    signal,
  } = options

  const queryParams: Record<string, unknown> = {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
  }

  if (filters.status && filters.status !== 'all') {
    queryParams['status'] = filters.status
  }
  if (filters.session) queryParams['session_id'] = filters.session
  if (filters.workflow) queryParams['workflow_id'] = filters.workflow
  if (filters.search) queryParams['search'] = filters.search

  const qs = buildQueryString(queryParams)
  const url = `/workflow-runs${qs ? `?${qs}` : ''}`

  // Use v2 base URL for workflow-runs
  const v2Base = config.baseUrl.replace('/v1', '/v2')
  const headers = new Headers()
  if (config.apiKey) headers.set('X-API-Key', config.apiKey)

  const response = await fetch(`${v2Base}${url}`, { headers, signal })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Request failed with status ' + response.status,
    }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  const workflows = (data.runs || []).map((run: any) => ({
    run_id: run.run_id,
    workflow_id: run.workflow_id,
    root_execution_id: run.root_execution_id ?? undefined,
    status: run.status ?? 'unknown',
    root_reasoner: run.root_reasoner || run.display_name,
    current_task: run.current_task || run.root_reasoner || run.display_name,
    total_executions: run.total_executions,
    max_depth: run.max_depth,
    started_at: run.started_at,
    latest_activity: run.latest_activity || run.updated_at,
    completed_at: run.completed_at ?? undefined,
    duration_ms: run.duration_ms ?? undefined,
    display_name: run.display_name,
    agent_id: run.agent_id ?? undefined,
    agent_name: run.agent_id ?? undefined,
    session_id: run.session_id ?? undefined,
    actor_id: run.actor_id ?? undefined,
    status_counts: run.status_counts ?? {},
    active_executions: run.active_executions ?? 0,
    terminal: run.terminal,
  }))

  const totalPages = data.page_size > 0
    ? Math.ceil(data.total_count / data.page_size)
    : 0

  return {
    workflows,
    total_count: data.total_count,
    page: data.page,
    page_size: data.page_size,
    total_pages: totalPages,
    has_more: data.has_more,
  }
}

/** Get workflow details for a specific workflow. */
export async function getWorkflowDetails(workflowId: string): Promise<any> {
  return fetchWrapper(`/workflows/${workflowId}/details`)
}

/** Get workflow DAG data, optionally in lightweight mode. */
export async function getWorkflowDAG<T = any>(
  workflowId: string,
  options: { lightweight?: boolean; signal?: AbortSignal } = {}
): Promise<T> {
  const { lightweight = false, signal } = options
  const query = lightweight ? '?mode=lightweight' : ''
  return fetchWrapper(`/workflows/${workflowId}/dag${query}`, { signal })
}

/** Get lightweight workflow DAG. */
export async function getWorkflowDAGLightweight(
  workflowId: string,
  signal?: AbortSignal
): Promise<import('../types').WorkflowDAGLightweightResponse> {
  return getWorkflowDAG(workflowId, { lightweight: true, signal })
}

/** Get workflow run detail (v2 API). */
export async function getWorkflowRunDetail(
  runId: string,
  signal?: AbortSignal
): Promise<import('../types').WorkflowRunDetailResponse> {
  const v2Base = config.baseUrl.replace('/v1', '/v2')
  const headers = new Headers()
  if (config.apiKey) headers.set('X-API-Key', config.apiKey)

  const response = await fetch(`${v2Base}/workflow-runs/${runId}`, { headers, signal })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Request failed with status ' + response.status,
    }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

/** Delete a workflow and all related data. */
export async function deleteWorkflow(
  workflowId: string,
  dryRun: boolean = false
): Promise<import('../types').WorkflowCleanupResult> {
  const query = dryRun ? '?dry_run=true&confirm=true' : '?confirm=true'
  return fetchWrapper(`/workflows/${workflowId}/cleanup${query}`, {
    method: 'DELETE',
  })
}

/** Delete multiple workflows sequentially. */
export async function deleteWorkflows(
  workflowIds: string[],
  dryRun: boolean = false
): Promise<import('../types').WorkflowCleanupResult[]> {
  const uniqueIds = [...new Set(workflowIds.map((id) => id?.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) return []

  const results: import('../types').WorkflowCleanupResult[] = []
  for (const workflowId of uniqueIds) {
    try {
      results.push(await deleteWorkflow(workflowId, dryRun))
    } catch (error) {
      results.push({
        workflow_id: workflowId,
        dry_run: dryRun,
        deleted_records: {},
        freed_space_bytes: 0,
        duration_ms: 0,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  return results
}

/** Get available filter options for executions. */
export async function getFilterOptions(): Promise<{
  agents: string[]
  workflows: string[]
  sessions: string[]
  statuses: string[]
}> {
  return fetchWrapper('/executions/filter-options')
}

// ============================================================================
// Execution APIs
// ============================================================================

/** Get paginated execution summary with optional grouping. */
export async function getExecutionsSummary(
  filters: Partial<import('../types').ExecutionFilters> = {},
  grouping?: import('../types').ExecutionGrouping
): Promise<import('../types').PaginatedExecutions | import('../types').GroupedExecutions> {
  const queryParams = { ...filters, ...grouping }
  const qs = buildQueryString(queryParams)
  const url = `/executions/summary${qs ? `?${qs}` : ''}`
  return fetchWrapper(url)
}

/** Get detailed execution information. */
export async function getExecutionDetails(
  executionId: string
): Promise<import('../types').WorkflowExecution> {
  return fetchWrapper(`/executions/${executionId}/details`)
}

/** Get execution statistics. */
export async function getExecutionStats(
  filters: Partial<import('../types').ExecutionFilters> = {}
): Promise<import('../types').ExecutionStats> {
  const qs = buildQueryString(filters)
  const url = `/executions/stats${qs ? `?${qs}` : ''}`
  return fetchWrapper(url)
}

/** Create an EventSource for execution event streaming. */
export function streamExecutionEvents(): EventSource {
  const apiKey = getApiKey()
  const url = apiKey
    ? `${config.baseUrl}/executions/events?api_key=${encodeURIComponent(apiKey)}`
    : `${config.baseUrl}/executions/events`
  return new EventSource(url)
}

/** Search executions by term. */
export async function searchExecutions(
  searchTerm: string,
  filters: Partial<import('../types').ExecutionFilters> = {},
  page: number = 1,
  pageSize: number = 20
): Promise<import('../types').PaginatedExecutions> {
  return getExecutionsSummary({
    ...filters,
    search: searchTerm,
    page,
    page_size: pageSize,
  }) as Promise<import('../types').PaginatedExecutions>
}

/** Get recent executions (last N hours). */
export async function getRecentExecutions(
  hours: number = 24,
  page: number = 1,
  pageSize: number = 20
): Promise<import('../types').PaginatedExecutions> {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)
  return getExecutionsSummary({
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    page,
    page_size: pageSize,
  }) as Promise<import('../types').PaginatedExecutions>
}

/** Get execution notes. */
export async function getExecutionNotes(
  executionId: string,
  tags?: string[]
): Promise<{ notes: import('../types').ExecutionNote[] }> {
  const params: Record<string, any> = {}
  if (tags && tags.length > 0) params.tags = tags.join(',')
  const qs = buildQueryString(params)
  const url = `/executions/${executionId}/notes${qs ? `?${qs}` : ''}`
  return fetchWrapper(url)
}

/** Add a note to an execution. */
export async function addExecutionNote(
  executionId: string,
  note: { message: string; tags?: string[] }
): Promise<{ success: boolean }> {
  return fetchWrapper('/executions/note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Execution-ID': executionId,
    },
    body: JSON.stringify(note),
  })
}

/** Retry a failed execution webhook. */
export async function retryExecutionWebhook(executionId: string): Promise<void> {
  await fetchWrapper(`/executions/${executionId}/webhook/retry`, {
    method: 'POST',
  })
}

/** Get execution timeline data (hourly statistics). */
export async function getExecutionTimeline(): Promise<
  import('../types').ExecutionTimelineResponse
> {
  return fetchWrapper('/executions/timeline', { timeout: 8000 })
}

// ============================================================================
// Identity / DID APIs
// ============================================================================

/** Get DID statistics. */
export async function getDIDStats(): Promise<import('../types').DIDStats> {
  return fetchWrapper('/identity/dids/stats')
}

/** Search DIDs by query. */
export async function searchDIDs(
  query: string,
  type: 'all' | 'agent' | 'reasoner' | 'skill' = 'all',
  limit: number = 20,
  offset: number = 0
): Promise<{
  results: import('../types').DIDSearchResult[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}> {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: limit.toString(),
    offset: offset.toString(),
  })
  return fetchWrapper(`/identity/dids/search?${params}`)
}

/** List agents with DID information. */
export async function listIdentityAgents(
  limit: number = 10,
  offset: number = 0
): Promise<{
  agents: import('../types').AgentDIDResponse[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })
  return fetchWrapper(`/identity/agents?${params}`)
}

/** Get agent DID details. */
export async function getIdentityAgentDetails(
  agentId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  agent: import('../types').AgentDIDResponse
  total_reasoners: number
  reasoners_limit: number
  reasoners_offset: number
  reasoners_has_more: boolean
}> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })
  return fetchWrapper(`/identity/agents/${agentId}/details?${params}`)
}

/** Search verifiable credentials. */
export async function searchCredentials(filters: {
  workflow_id?: string
  session_id?: string
  status?: string
  issuer_did?: string
  agent_node_id?: string
  execution_id?: string
  caller_did?: string
  target_did?: string
  query?: string
  start_time?: string
  end_time?: string
  limit?: number
  offset?: number
}): Promise<{
  credentials: import('../types').VCSearchResult[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString())
    }
  })
  return fetchWrapper(`/identity/credentials/search?${params}`)
}

/** Get agent's component DIDs. */
export async function getAgentDIDs(
  agentId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  reasoners: import('../types').ComponentDIDInfo[]
  skills: import('../types').ComponentDIDInfo[]
  total_reasoners: number
  total_skills: number
}> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })
  return fetchWrapper(`/identity/agents/${agentId}/dids?${params}`)
}

// ============================================================================
// DID Management APIs
// ============================================================================

/** Get DID information for a specific agent node. */
export async function getAgentDIDInfo(
  nodeId: string
): Promise<import('../types').AgentDIDInfo> {
  return fetchWrapper(`/nodes/${nodeId}/did`)
}

/** Get DID status summary for a node. */
export async function getDIDStatusSummary(
  nodeId: string
): Promise<import('../types').DIDStatusSummary> {
  try {
    const didInfo = await getAgentDIDInfo(nodeId)
    return {
      has_did: true,
      did_status: didInfo.status,
      reasoner_count: Object.keys(didInfo.reasoners).length,
      skill_count: Object.keys(didInfo.skills).length,
      last_updated: didInfo.registered_at,
    }
  } catch {
    return {
      has_did: false,
      did_status: 'inactive',
      reasoner_count: 0,
      skill_count: 0,
      last_updated: '',
    }
  }
}

/** Get W3C DID Document. */
export async function getDIDDocument(did: string): Promise<{
  '@context': string[]
  id: string
  verificationMethod: any[]
  authentication: string[]
  assertionMethod: string[]
  service: any[]
}> {
  return fetchWrapper(`/did/document/${encodeURIComponent(did)}`)
}

/** Resolve a DID to get identity info. */
export async function resolveDID(did: string): Promise<{
  did: string
  public_key_jwk: any
  component_type: string
  function_name?: string
  derivation_path: string
}> {
  return fetchWrapper(`/did/resolve/${encodeURIComponent(did)}`)
}

/** Get DID system status. */
export async function getDIDSystemStatus(): Promise<{
  status: string
  message: string
  timestamp: string
}> {
  return fetchWrapper('/did/status')
}

// ============================================================================
// VC Management APIs
// ============================================================================

/** Verify a Verifiable Credential. */
export async function verifyVC(
  vcDocument: any
): Promise<{ valid: boolean; issuer_did?: string; message?: string; error?: string }> {
  return fetchWrapper('/did/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vc_document: vcDocument }),
  })
}

/** Get workflow VC chain. */
export async function getWorkflowVCChain(
  workflowId: string
): Promise<import('../types').WorkflowVCChainResponse> {
  return fetchWrapper(`/workflows/${workflowId}/vc-chain`)
}

/** Comprehensive VC verification for an execution. */
export async function verifyExecutionVCComprehensive(
  executionId: string
): Promise<import('../types').ComprehensiveVCVerificationResult> {
  return fetchWrapper(`/executions/${executionId}/verify-vc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Comprehensive VC verification for a workflow. */
export async function verifyWorkflowVCComprehensive(
  workflowId: string
): Promise<import('../types').ComprehensiveVCVerificationResult> {
  return fetchWrapper(`/workflows/${workflowId}/verify-vc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Get VC status summaries for a batch of workflows. */
export async function getWorkflowVCStatuses(
  workflowIds: string[]
): Promise<Record<string, import('../types').VCStatusSummary>> {
  if (!workflowIds || workflowIds.length === 0) return {}

  const response = await fetchWrapper<{
    summaries: (import('../types').VCStatusSummary & { workflow_id: string })[]
  }>('/workflows/vc-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_ids: workflowIds }),
  })

  const summaries: Record<string, import('../types').VCStatusSummary> = {}
  response.summaries?.forEach((s) => {
    summaries[s.workflow_id] = {
      has_vcs: s.has_vcs,
      vc_count: s.vc_count,
      verified_count: s.verified_count,
      failed_count: s.failed_count ?? 0,
      last_vc_created: s.last_vc_created,
      verification_status: s.verification_status,
    }
  })

  // Fill in defaults for missing workflows
  workflowIds.forEach((id) => {
    if (!summaries[id]) {
      summaries[id] = {
        has_vcs: false,
        vc_count: 0,
        verified_count: 0,
        failed_count: 0,
        last_vc_created: '',
        verification_status: 'none',
      }
    }
  })
  return summaries
}

/** Get audit trail for a workflow. */
export async function getWorkflowAuditTrail(
  workflowId: string
): Promise<import('../types').AuditTrailEntry[]> {
  const vcChain = await getWorkflowVCChain(workflowId)
  return vcChain.component_vcs.map((vc) => ({
    vc_id: vc.vc_id,
    execution_id: vc.execution_id,
    timestamp: vc.created_at,
    caller_did: vc.caller_did,
    target_did: vc.target_did,
    status: vc.status,
    input_hash: vc.input_hash,
    output_hash: vc.output_hash,
    signature: vc.signature,
  }))
}

/** Export VCs with optional filtering. */
export async function exportVCs(
  filters?: import('../types').VCFilters
): Promise<import('../types').VCExportResponse> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
  }
  const qs = params.toString()
  return fetchWrapper(`/did/export/vcs${qs ? `?${qs}` : ''}`)
}

// ============================================================================
// DID Utility Functions
// ============================================================================

/** Format a DID for display (truncate middle). */
export function formatDIDForDisplay(did: string, maxLength: number = 20): string {
  if (did.length <= maxLength) return did
  const start = did.substring(0, Math.floor(maxLength / 2) - 2)
  const end = did.substring(did.length - Math.floor(maxLength / 2) + 2)
  return `${start}...${end}`
}

/** Validate DID format (did:method:identifier). */
export function isValidDID(did: string): boolean {
  return /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/.test(did)
}

/** Get the method portion of a DID. */
export function getDIDMethod(did: string): string | null {
  const parts = did.split(':')
  return parts.length >= 2 ? parts[1] : null
}
