// Hanzo Agent Cloud — Types
// Hanzo Agents types

// ============================================================================
// Agent Nodes
// ============================================================================

export type HealthStatus = 'starting' | 'ready' | 'degraded' | 'offline' | 'active' | 'inactive' | 'unknown'

export type LifecycleStatus =
  | 'starting'
  | 'ready'
  | 'degraded'
  | 'offline'
  | 'running'
  | 'stopped'
  | 'error'
  | 'unknown'

export type AgentState = 'active' | 'inactive' | 'starting' | 'stopping' | 'error'

export interface AgentNode {
  id: string
  base_url: string
  version: string
  team_id?: string
  health_status: HealthStatus
  lifecycle_status?: LifecycleStatus
  last_heartbeat?: string
  registered_at?: string
  deployment_type?: string
  invocation_url?: string
  mcp_summary?: MCPSummary
  mcp_servers?: MCPServerHealth[]
  reasoners?: ReasonerDefinition[]
  skills?: SkillDefinition[]
}

export interface AgentNodeSummary {
  id: string
  base_url: string
  version: string
  team_id: string
  health_status: HealthStatus
  lifecycle_status: LifecycleStatus
  last_heartbeat?: string
  deployment_type?: string
  invocation_url?: string
  mcp_summary?: MCPSummary
  reasoner_count: number
  skill_count: number
}

export interface AgentNodeDetails extends AgentNode {}

export interface AgentNodeDetailsWithPackage extends AgentNode {
  package_info?: { package_id: string }
}

export interface AgentStatus {
  status: string
  state?: AgentState
  state_transition?: {
    from: AgentState
    to: AgentState
    reason?: string
  }
  health_score?: number
  last_seen?: string
  health_status?: HealthStatus
  lifecycle_status?: LifecycleStatus
  mcp_status?: {
    running_servers: number
    total_servers: number
    service_status?: string
  }
}

export interface AgentStatusUpdate {
  status: string
  health_status?: string
  lifecycle_status?: string
  last_heartbeat?: string
}

// ============================================================================
// MCP (Model Context Protocol)
// ============================================================================

export type MCPServerStatus = 'running' | 'stopped' | 'error' | 'starting' | 'unknown'
export type MCPServerAction = 'start' | 'stop' | 'restart'
export type AppMode = 'user' | 'admin' | 'developer'

export interface MCPServerHealth {
  alias: string
  status: MCPServerStatus
  tool_count: number
  started_at?: string
  last_health_check?: string
  error_message?: string
  port?: number
  process_id?: number
  success_rate?: number
  avg_response_time_ms?: number
  status_icon?: string
  status_color?: string
  uptime_formatted?: string
}

export interface MCPSummary {
  service_status: string
  running_servers: number
  total_servers: number
  total_tools: number
  overall_health: number
  has_issues: boolean
  capabilities_available: boolean
}

export interface MCPTool {
  name: string
  description?: string
  input_schema?: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
  inputSchema?: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPHealthResponse {
  status: string
  mcp_servers?: MCPServerHealth[]
  mcp_summary?: MCPSummary
}

export interface MCPServerActionResponse {
  status: string
  success?: boolean
  error_details?: { message?: string; code?: string }
  server_alias?: string
}

export interface MCPToolsResponse {
  tools: MCPTool[]
}

export interface MCPToolTestResponse {
  success?: boolean
  error?: string
  execution_time_ms?: number
  result?: any
}

export interface MCPServerMetrics {
  alias: string
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time_ms: number
  peak_response_time_ms: number
  requests_per_minute: number
  uptime_seconds: number
  error_rate_percent: number
}

export interface MCPNodeMetrics {
  node_id: string
  total_requests: number
  avg_response_time: number
  error_rate: number
  timestamp: string
  servers: MCPServerMetrics[]
  total_servers: number
  active_servers: number
  overall_health_score: number
}

export interface MCPHealthEvent {
  timestamp: string
  type: string
  server_alias?: string
  node_id?: string
  message: string
  details?: any
  data?: any
}

// ============================================================================
// Reasoners & Skills
// ============================================================================

export interface ReasonerDefinition {
  id: string
  name: string
  description?: string
  input_schema?: any
  tags?: string[]
  memory_config?: {
    memory_retention?: string
    [key: string]: any
  }
}

export interface SkillDefinition {
  id: string
  name: string
  description?: string
  tags?: string[]
}

// ============================================================================
// Configuration
// ============================================================================

export type ConfigFieldType = 'text' | 'secret' | 'number' | 'boolean' | 'select'

export interface ConfigFieldOption {
  value: string
  label: string
  description?: string
}

export interface ConfigField {
  name: string
  type: ConfigFieldType
  label?: string
  description?: string
  required?: boolean
  default?: any
  options?: ConfigFieldOption[]
  validation?: { min?: number; max?: number; pattern?: string }
}

export interface ConfigurationSchema {
  fields?: ConfigField[]
  user_environment?: {
    required?: ConfigField[]
    optional?: ConfigField[]
  }
  metadata?: Record<string, any>
  version?: string
}

export type AgentConfigurationStatus = 'configured' | 'not_configured' | 'partially_configured' | 'unknown'

export interface AgentPackage {
  id: string
  package_id?: string
  name: string
  version: string
  description?: string
  author?: string
  tags?: string[]
  installed_at?: string
  configuration_status?: AgentConfigurationStatus
  configuration_schema?: ConfigurationSchema
}

// ============================================================================
// Status Normalization
// ============================================================================

/** Canonical status values for executions and workflows */
export type CanonicalStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'pending'
  | 'cancelled'
  | 'returned'
  | 'unknown'

// ============================================================================
// Workflows
// ============================================================================

export interface WorkflowSummary {
  run_id: string
  workflow_id: string
  root_execution_id?: string
  status: string
  root_reasoner: string
  current_task: string
  total_executions: number
  max_depth: number
  started_at: string
  latest_activity: string
  completed_at?: string
  duration_ms?: number
  display_name: string
  agent_id?: string
  agent_name?: string
  session_id?: string
  actor_id?: string
  status_counts: Record<string, number>
  active_executions: number
  terminal: boolean
}

export interface EnhancedExecution {
  execution_id: string
  workflow_id: string
  status: string
  task_name: string
  workflow_name: string
  agent_name: string
  relative_time: string
  duration_display: string
  workflow_context?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  session_id?: string
  actor_id?: string
}

export type ViewModeId = 'executions' | 'workflows' | 'sessions' | 'agents'

export interface ViewMode {
  id: ViewModeId
  label: string
  description: string
  icon: string
}

export interface ExecutionViewFilters {
  status?: string
  agent?: string
  workflow?: string
  session?: string
  timeRange?: string
  search?: string
}

export interface WorkflowsResponse {
  workflows: WorkflowSummary[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_more?: boolean
}

export interface EnhancedExecutionsResponse {
  executions: EnhancedExecution[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_more?: boolean
}

export interface ExecutionViewState {
  viewMode: ViewModeId
  filters: ExecutionViewFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface WorkflowTimelineNode {
  workflow_id: string
  execution_id: string
  agent_node_id: string
  reasoner_id: string
  status: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  parent_workflow_id?: string
  parent_execution_id?: string
  workflow_depth: number
  agent_name?: string
  task_name?: string
  input_data?: Record<string, unknown> | null
  output_data?: Record<string, unknown> | null
  webhook_registered?: boolean
  webhook_event_count?: number
  notes?: { message: string; tags: string[]; timestamp: string }[]
}

export interface WorkflowDAGLightweightNode {
  execution_id: string
  parent_execution_id?: string
  agent_node_id: string
  reasoner_id: string
  status: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  workflow_depth: number
}

export interface WorkflowDAGLightweightResponse {
  root_workflow_id: string
  workflow_status: string
  workflow_name: string
  session_id?: string
  actor_id?: string
  total_nodes: number
  max_depth: number
  timeline: WorkflowDAGLightweightNode[]
  mode: 'lightweight'
}

export interface WorkflowRunDetailResponse {
  run: {
    run_id: string
    root_workflow_id: string
    root_execution_id?: string
    status: string
    total_steps: number
    completed_steps: number
    failed_steps: number
    returned_steps?: number
    status_counts?: Record<string, number>
    created_at: string
    updated_at: string
    completed_at?: string
  }
  executions: {
    execution_id: string
    workflow_id: string
    parent_execution_id?: string
    parent_workflow_id?: string
    agent_node_id: string
    reasoner_id: string
    status: string
    started_at: string
    completed_at?: string
    workflow_depth: number
    active_children: number
    pending_children: number
  }[]
}

export interface WorkflowCleanupResult {
  workflow_id: string
  dry_run: boolean
  deleted_records: Record<string, number>
  freed_space_bytes: number
  duration_ms: number
  success: boolean
  error_message?: string
}

// ============================================================================
// Executions
// ============================================================================

export interface ExecutionSummary {
  id: number
  execution_id: string
  workflow_id: string
  session_id?: string
  agent_node_id: string
  reasoner_id: string
  status: string
  duration_ms: number
  input_size: number
  output_size: number
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  workflow_name?: string
  workflow_tags?: string[]
}

export interface GroupedExecutionSummary {
  group_key: string
  group_label: string
  count: number
  total_duration_ms: number
  avg_duration_ms: number
  status_summary: Record<string, number>
  latest_execution: string
  executions: ExecutionSummary[]
}

export interface ExecutionFilters {
  agent_node_id?: string
  workflow_id?: string
  session_id?: string
  actor_id?: string
  status?: string
  start_time?: string
  end_time?: string
  search?: string
  page: number
  page_size: number
}

export interface ExecutionGrouping {
  group_by: 'none' | 'workflow' | 'session' | 'actor' | 'agent' | 'status'
  sort_by: 'time' | 'duration' | 'status'
  sort_order: 'asc' | 'desc'
}

export interface PaginatedExecutions {
  executions: ExecutionSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
  total_count?: number
  has_next?: boolean
  has_prev?: boolean
}

export interface GroupedExecutions {
  groups: GroupedExecutionSummary[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ExecutionStats {
  total_executions: number
  successful_count: number
  failed_count: number
  running_count: number
  average_duration_ms: number
  executions_by_status: Record<string, number>
  executions_by_agent: Record<string, number>
}

export interface ExecutionEvent {
  type: 'execution_started' | 'execution_completed' | 'execution_failed'
  execution: ExecutionSummary
  timestamp: string
}

export interface WorkflowExecution {
  id: number
  workflow_id: string
  execution_id: string
  session_id?: string
  actor_id?: string
  agent_node_id: string
  parent_workflow_id?: string
  root_workflow_id?: string
  workflow_depth: number
  reasoner_id: string
  input_data: any
  output_data: any
  input_size: number
  output_size: number
  input_uri?: string | null
  result_uri?: string | null
  workflow_name?: string
  workflow_tags: string[]
  status: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  retry_count: number
  created_at: string
  updated_at: string
  notes?: ExecutionNote[]
  webhook_registered?: boolean
  webhook_events?: ExecutionWebhookEvent[]
}

export interface ExecutionNote {
  message: string
  tags: string[]
  timestamp: string
}

export interface ExecutionWebhookEvent {
  id: number
  execution_id: string
  event_type: string
  status: string
  http_status?: number
  payload?: any
  response_body?: string | null
  error_message?: string | null
  created_at: string
}

export interface ExecutionRequest {
  input: any
  context?: {
    workflow_id?: string
    session_id?: string
    user_id?: string
  }
  memory_options?: {
    auto_inject?: string[]
    store_result?: boolean
    result_ttl?: string
  }
  webhook?: {
    url: string
    secret?: string
    headers?: Record<string, string>
  }
}

export interface ExecutionResponse {
  execution_id: string
  result: any
  duration_ms: number
  cost?: number
  status: string
  error_message?: string
  timestamp: string
  node_id: string
  type: string
  target: string
  workflow_id: string
  run_id?: string
}

export interface ExecutionStatusResponse {
  execution_id: string
  workflow_id: string
  run_id?: string
  status: string
  target: string
  type: string
  progress: number
  result?: any
  error?: string
  started_at: string
  completed_at?: string
  duration?: number
}

export interface PerformanceMetrics {
  avg_response_time_ms: number
  success_rate: number
  total_executions: number
  executions_last_24h: number
  error_rate: number
  cost_last_24h?: number
  recent_executions: { execution_id: string; duration_ms: number; status: string; timestamp: string }[]
  performance_trend: { timestamp: string; avg_response_time: number; success_rate: number; execution_count: number }[]
}

// ============================================================================
// Execution Timeline
// ============================================================================

export interface TimelineDataPoint {
  timestamp: string
  hour: string
  executions: number
  successful: number
  failed: number
  running: number
  success_rate: number
  avg_duration_ms: number
  total_duration_ms: number
}

export interface TimelineSummary {
  total_executions: number
  avg_success_rate: number
  total_errors: number
  peak_hour: string
  peak_executions: number
}

export interface ExecutionTimelineResponse {
  timeline_data: TimelineDataPoint[]
  cache_timestamp: string
  summary: TimelineSummary
}

// ============================================================================
// DID / Verifiable Credentials
// ============================================================================

export type AgentDIDStatus = 'active' | 'inactive' | 'revoked'

export interface AgentDIDInfo {
  did: string
  agent_node_id: string
  public_key_jwk: any
  derivation_path: string
  reasoners: Record<string, ReasonerDIDInfo>
  skills: Record<string, SkillDIDInfo>
  status: AgentDIDStatus
  registered_at: string
}

export interface ReasonerDIDInfo {
  did: string
  function_name: string
  public_key_jwk: any
  derivation_path: string
  capabilities: string[]
  exposure_level: string
  created_at: string
}

export interface SkillDIDInfo {
  did: string
  function_name: string
  public_key_jwk: any
  derivation_path: string
  tags: string[]
  exposure_level: string
  created_at: string
}

export interface ExecutionVC {
  vc_id: string
  execution_id: string
  workflow_id: string
  session_id: string
  issuer_did: string
  target_did: string
  caller_did: string
  vc_document: any
  signature: string
  storage_uri?: string
  document_size_bytes?: number
  input_hash: string
  output_hash: string
  status: string
  created_at: string
  parent_vc_id?: string
  child_vc_ids?: string[]
}

export interface WorkflowVC {
  workflow_id: string
  session_id: string
  component_vcs: string[]
  workflow_vc_id: string
  status: string
  start_time: string
  end_time?: string
  total_steps: number
  completed_steps: number
  vc_document?: any
  signature?: string
  issuer_did?: string
}

export interface VCDocument {
  '@context': string[]
  type: string[]
  id: string
  issuer: string
  issuanceDate: string
  credentialSubject: VCCredentialSubject
  proof: VCProof
}

export interface VCCredentialSubject {
  executionId: string
  workflowId: string
  sessionId: string
  caller: VCCaller
  target: VCTarget
  execution: VCExecution
  audit: VCAudit
}

export interface VCCaller {
  did: string
  type: string
  agentNodeDid: string
}

export interface VCTarget {
  did: string
  agentNodeDid: string
  functionName: string
}

export interface VCExecution {
  inputHash: string
  outputHash: string
  timestamp: string
  durationMs: number
  status: string
  errorMessage?: string
}

export interface VCAudit {
  inputDataHash: string
  outputDataHash: string
  metadata: Record<string, any>
}

export interface VCProof {
  type: string
  created: string
  verificationMethod: string
  proofPurpose: string
  proofValue: string
}

export interface VerificationIssue {
  type: string
  severity: 'critical' | 'warning' | 'info'
  component: string
  field?: string
  expected?: string
  actual?: string
  description: string
}

export interface IntegrityCheckResults {
  metadata_consistency: boolean
  field_consistency: boolean
  timestamp_validation: boolean
  hash_validation: boolean
  structural_integrity: boolean
  issues: VerificationIssue[]
}

export interface SecurityAnalysis {
  signature_strength: string
  key_validation: boolean
  did_authenticity: boolean
  replay_protection: boolean
  tamper_evidence: string[]
  security_score: number
  issues: VerificationIssue[]
}

export interface ComplianceChecks {
  w3c_compliance: boolean
  standard_compliance: boolean
  audit_trail_integrity: boolean
  data_integrity_checks: boolean
  issues: VerificationIssue[]
}

export interface ComprehensiveVCVerificationResult {
  valid: boolean
  overall_score: number
  critical_issues: VerificationIssue[]
  warnings: VerificationIssue[]
  integrity_checks: IntegrityCheckResults
  security_analysis: SecurityAnalysis
  compliance_checks: ComplianceChecks
  verification_timestamp: string
}

export interface WorkflowVCChainResponse {
  workflow_id: string
  component_vcs: ExecutionVC[]
  workflow_vc: WorkflowVC
  total_steps: number
  status: string
  did_resolution_bundle?: DIDResolutionBundle
}

export interface DIDResolutionBundle {
  [did: string]: DIDResolutionEntry
}

export interface DIDResolutionEntry {
  method: string
  public_key_jwk: any
  resolved_from: string
  resolved_at: string
  error?: string
}

export interface DIDFilters {
  agent_node_id?: string
  component_type?: string
  status?: AgentDIDStatus
  exposure_level?: string
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
}

export interface VCFilters {
  execution_id?: string
  workflow_id?: string
  session_id?: string
  issuer_did?: string
  caller_did?: string
  target_did?: string
  status?: string
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
}

export interface VCExportResponse {
  agent_dids: string[]
  execution_vcs: ExecutionVCInfo[]
  workflow_vcs: WorkflowVC[]
  total_count: number
  filters_applied: VCFilters
}

export interface ExecutionVCInfo {
  vc_id: string
  execution_id: string
  workflow_id: string
  session_id: string
  issuer_did: string
  target_did: string
  caller_did: string
  status: string
  created_at: string
  storage_uri?: string
  document_size_bytes?: number
}

export interface DIDStatusSummary {
  has_did: boolean
  did_status: AgentDIDStatus
  reasoner_count: number
  skill_count: number
  last_updated: string
}

export interface VCStatusSummary {
  has_vcs: boolean
  vc_count: number
  verified_count: number
  failed_count: number
  last_vc_created: string
  verification_status: 'verified' | 'pending' | 'failed' | 'none'
}

export interface AuditTrailEntry {
  vc_id: string
  execution_id: string
  timestamp: string
  caller_did: string
  target_did: string
  status: string
  input_hash: string
  output_hash: string
  signature: string
}

/** DID search result from identity API */
export interface DIDSearchResult {
  type: 'agent' | 'reasoner' | 'skill'
  did: string
  id: string
  name: string
  parent_did?: string
  parent_name?: string
  derivation_path: string
  status?: string
  created_at: string
}

/** DID stats from identity API */
export interface DIDStats {
  total_agents: number
  total_reasoners: number
  total_skills: number
  total_dids: number
}

/** Agent DID response from identity API */
export interface AgentDIDResponse {
  did: string
  agent_node_id: string
  status: string
  derivation_path: string
  created_at: string
  reasoner_count: number
  skill_count: number
  reasoners?: ComponentDIDInfo[]
  skills?: ComponentDIDInfo[]
}

/** Component-level DID info */
export interface ComponentDIDInfo {
  did: string
  name: string
  component_name: string
  type: 'reasoner' | 'skill'
  derivation_path: string
  created_at: string
}

/** VC search result from identity API */
export interface VCSearchResult {
  vc_id: string
  execution_id: string
  workflow_id: string
  workflow_name?: string
  session_id: string
  issuer_did: string
  target_did: string
  caller_did: string
  status: string
  created_at: string
  duration_ms?: number
  reasoner_id?: string
  reasoner_name?: string
  agent_name?: string
  agent_node_id?: string
  verified: boolean
  input_hash?: string
  output_hash?: string
}

// ============================================================================
// Compute (Casvisor VMs)
// ============================================================================

export type VMStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'provisioning'

export interface VirtualMachine {
  id: string
  name: string
  provider: string
  status: VMStatus
  region?: string
  size?: string
  ip_address?: string
  created_at?: string
  agent_node_id?: string
  remote_access_url?: string
}

// ============================================================================
// SSE Events
// ============================================================================

export interface SSEEvent<T = any> {
  type: string
  data: T
  timestamp: Date
  id?: string
}

export interface SSEState {
  connected: boolean
  reconnecting: boolean
  reconnectAttempt: number
  lastError: Event | null
}

// ============================================================================
// Dashboard
// ============================================================================

export interface DashboardStats {
  total_nodes: number
  active_nodes: number
  total_workflows: number
  total_executions: number
  success_rate: number
  avg_response_time_ms: number
}

export interface ActivityEvent {
  id: string
  type: string
  message: string
  timestamp: string
  node_id?: string
  workflow_id?: string
  severity?: 'info' | 'warning' | 'error'
}

export interface DashboardSummary {
  agents: { running: number; total: number }
  executions: { today: number; yesterday: number }
  success_rate: number
  packages: { available: number; installed: number }
}

export type TimeRangePreset = '1h' | '24h' | '7d' | '30d' | 'custom'

export interface TimeRangeInfo {
  start_time: string
  end_time: string
  preset?: TimeRangePreset
}

export interface ComparisonData {
  previous_period: TimeRangeInfo
  overview_delta: EnhancedOverviewDelta
}

export interface EnhancedOverviewDelta {
  executions_delta: number
  executions_delta_pct: number
  success_rate_delta: number
  avg_duration_delta_ms: number
  avg_duration_delta_pct: number
}

export interface HotspotSummary {
  top_failing_reasoners: HotspotItem[]
}

export interface HotspotItem {
  reasoner_id: string
  total_executions: number
  failed_executions: number
  error_rate: number
  contribution_pct: number
  top_errors: ErrorCount[]
}

export interface ErrorCount {
  message: string
  count: number
}

export interface ActivityPatterns {
  hourly_heatmap: HeatmapCell[][]
}

export interface HeatmapCell {
  total: number
  failed: number
  error_rate: number
}

export interface EnhancedDashboardResponse {
  generated_at: string
  time_range: TimeRangeInfo
  overview: EnhancedDashboardOverview
  execution_trends: ExecutionTrendSummary
  agent_health: AgentHealthSummary
  workflows: EnhancedWorkflowInsights
  incidents: IncidentItem[]
  comparison?: ComparisonData
  hotspots: HotspotSummary
  activity_patterns: ActivityPatterns
}

export interface EnhancedDashboardOverview {
  total_agents: number
  active_agents: number
  degraded_agents: number
  offline_agents: number
  total_reasoners: number
  total_skills: number
  executions_last_24h: number
  executions_last_7d: number
  success_rate_24h: number
  average_duration_ms_24h: number
  median_duration_ms_24h: number
}

export interface ExecutionTrendSummary {
  last_24h: ExecutionWindowMetrics
  last_7_days: ExecutionTrendPoint[]
}

export interface ExecutionWindowMetrics {
  total: number
  succeeded: number
  failed: number
  success_rate: number
  average_duration_ms: number
  throughput_per_hour: number
}

export interface ExecutionTrendPoint {
  date: string
  total: number
  succeeded: number
  failed: number
}

export interface AgentHealthSummary {
  total: number
  active: number
  degraded: number
  offline: number
  agents: AgentHealthItem[]
}

export interface AgentHealthItem {
  id: string
  team_id: string
  version: string
  status: string
  health: string
  lifecycle: string
  last_heartbeat: string
  reasoners: number
  skills: number
  uptime?: string
}

export interface EnhancedWorkflowInsights {
  top_workflows: WorkflowStat[]
  active_runs: ActiveWorkflowRun[]
  longest_executions: CompletedExecutionStat[]
}

export interface WorkflowStat {
  workflow_id: string
  name?: string
  total_executions: number
  success_rate: number
  failed_executions: number
  average_duration_ms: number
  last_activity: string
}

export interface ActiveWorkflowRun {
  execution_id: string
  workflow_id: string
  name?: string
  started_at: string
  elapsed_ms: number
  agent_node_id: string
  reasoner_id: string
  status: string
}

export interface CompletedExecutionStat {
  execution_id: string
  workflow_id: string
  name?: string
  duration_ms: number
  completed_at?: string
  status: string
}

export interface IncidentItem {
  execution_id: string
  workflow_id: string
  name?: string
  status: string
  started_at: string
  completed_at?: string
  agent_node_id: string
  reasoner_id: string
  error?: string
}

// ============================================================================
// Status Theme
// ============================================================================

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export type TimeRangeValue = '1h' | '24h' | '7d' | '30d' | 'all'
