/**
 * Pure headless workflow types for `@hanzo/flow`.
 * Zero React, zero DOM, zero external imports — safe in bare Node, server
 * components, and Go/Rust/TypeScript API adapters.
 */

export type FlowNodeKind =
  "trigger" | "agent" | "action" | "condition" | "memory" | "output"

export type FlowEnsoModel =
  | "enso"
  | "enso-auto"
  | "enso-pro"
  | "enso-max"
  | "enso-flash"
  | "enso-ultra"
  | "zen6"
  | "zen6-coder"
  | "zen6-flash"
  | "zen6-max"
  | (string & {})

export type FlowEmbeddingModel =
  "zen-embedding" | "zen-embedding-3" | (string & {})

export type FlowNodeSubtype =
  | "webhook"
  | "schedule"
  | "crm_event"
  | "manual"
  | "enso_agent"
  | "sms"
  | "voice_call"
  | "email"
  | "http"
  | "wait"
  | "crm_update"
  | "branch"
  | "rag"
  | "notify"
  | (string & {})

export type FlowPaletteCategory =
  "Triggers" | "Enso AI" | "Actions" | "Logic" | "Output"

export type FlowTheme = "dark" | "light"

export type FlowNodeExecutionStatus =
  "idle" | "running" | "succeeded" | "failed" | "skipped"

export interface FlowPosition {
  x: number
  y: number
}

export interface FlowNodeConfig {
  /** Enso model identifier for `agent` nodes. */
  model?: FlowEnsoModel
  /** Prompt, message template, or instruction text (supports `{{path}}`). */
  prompt?: string
  /** Optional system prompt for `agent` nodes. */
  systemPrompt?: string
  /** Sampling temperature for `agent` nodes. */
  temperature?: number
  /** 5-field cron expression for `schedule` triggers. */
  cron?: string
  /** IANA timezone for `schedule` triggers (e.g. `America/Los_Angeles`). */
  timezone?: string
  /** Relative webhook route path for `webhook` triggers. */
  webhookPath?: string
  /** Event name for `crm_event` triggers (e.g. `lead.created`). */
  eventType?: string
  /** Delivery channel for `action` or `output` nodes. */
  channel?:
    "sms" | "voice" | "email" | "slack" | "webhook" | "notify" | (string & {})
  /** Recipient phone, email, handle, or channel target. */
  to?: string
  /** Subject line for email or notification title. */
  subject?: string
  /** HTTP method for `http` action nodes. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Target URL for `http` action nodes. */
  url?: string
  /** Request headers for `http` action nodes. */
  headers?: Record<string, string>
  /** Request body template for `http` action nodes. */
  body?: string
  /** Delay duration in milliseconds for `wait` action nodes. */
  delayMs?: number
  /** Deterministic condition expression for `condition` nodes. */
  expression?: string
  /** Display label for the true branch of a `condition` node. */
  trueLabel?: string
  /** Display label for the false branch of a `condition` node. */
  falseLabel?: string
  /** Knowledge/RAG collection name for `memory` nodes. */
  collection?: string
  /** Embedding model for `memory` nodes (`zen-embedding` / `zen-embedding-3`). */
  embeddingModel?: FlowEmbeddingModel
  /** Top-K retrieval count for `memory` nodes. */
  topK?: number
  /** Target field name for `crm_update` action nodes. */
  field?: string
  /** Target field value template for `crm_update` action nodes. */
  value?: string
  /** Extensible node configuration bag. */
  [key: string]: unknown
}

export interface FlowNodeData {
  id: string
  kind: FlowNodeKind
  subtype?: FlowNodeSubtype
  label: string
  description?: string
  position?: FlowPosition
  config?: FlowNodeConfig
  /** Optional custom pill badge override on the node card. */
  badge?: string
  disabled?: boolean
}

export interface FlowEdgeData {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  condition?: "true" | "false" | "default" | (string & {})
  animated?: boolean
}

export interface FlowSchedule {
  cron: string
  timezone: string
  enabled: boolean
  nextRunAt?: string
  label?: string
}

export interface FlowDefinition {
  id: string
  name: string
  description?: string
  enabled: boolean
  schedule?: FlowSchedule
  nodes: FlowNodeData[]
  edges: FlowEdgeData[]
  updatedAt: string
  category?: string
  tags?: string[]
}

export type FlowStepStatus =
  "pending" | "running" | "succeeded" | "failed" | "skipped"

export interface FlowStepResult {
  nodeId: string
  nodeLabel: string
  kind: FlowNodeKind
  status: FlowStepStatus
  startedAt: string
  finishedAt: string
  durationMs: number
  input?: unknown
  output?: unknown
  error?: string
}

export type FlowRunStatus = "running" | "succeeded" | "failed"

export interface FlowRun {
  id: string
  flowId: string
  status: FlowRunStatus
  startedAt: string
  finishedAt?: string
  durationMs: number
  input?: unknown
  output?: unknown
  steps: FlowStepResult[]
  error?: string
}

export interface FlowPaletteItem {
  id: string
  kind: FlowNodeKind
  subtype: FlowNodeSubtype
  category: FlowPaletteCategory
  label: string
  description: string
  defaultConfig: FlowNodeConfig
}

export interface FlowTemplate {
  id: string
  name: string
  description: string
  category?: string
  schedule?: FlowSchedule
  nodes: FlowNodeData[]
  edges: FlowEdgeData[]
}

export type FlowValidationSeverity = "error" | "warning"

export type FlowValidationCode =
  | "EMPTY_FLOW"
  | "CYCLE_DETECTED"
  | "DISCONNECTED_NODE"
  | "MISSING_TRIGGER"
  | "MISSING_CONFIG"
  | "DANGLING_EDGE"
  | "DUPLICATE_NODE_ID"

export interface FlowValidationIssue {
  code: FlowValidationCode
  severity: FlowValidationSeverity
  message: string
  nodeId?: string
  edgeId?: string
}

export interface FlowValidationResult {
  valid: boolean
  issues: FlowValidationIssue[]
  errors: FlowValidationIssue[]
  warnings: FlowValidationIssue[]
}

export interface FlowLayoutOptions {
  /** Horizontal center-to-center distance between topological columns. */
  columnGap?: number
  /** Vertical center-to-center distance between stacked nodes in a column. */
  rowGap?: number
  /** Left margin offset. */
  originX?: number
  /** Top margin offset. */
  originY?: number
}

export interface FlowPositionedNode {
  id: string
  position: FlowPosition
}

export interface FlowNodeExecutorContext {
  flow: FlowDefinition
  node: FlowNodeData
  input: unknown
  initialInput: unknown
  previousOutputs: Record<string, unknown>
  signal?: AbortSignal
}

export type FlowNodeExecutor = (
  ctx: FlowNodeExecutorContext
) => Promise<unknown> | unknown

export interface FlowExecuteOptions {
  signal?: AbortSignal
  now?: () => number
  idGenerator?: () => string
}

export interface FlowBackend {
  listFlows: () => Promise<FlowDefinition[]>
  saveFlow: (flow: FlowDefinition) => Promise<FlowDefinition>
  deleteFlow: (id: string) => Promise<void>
  toggleFlow: (id: string, enabled: boolean) => Promise<FlowDefinition>
  runFlow: (id: string, input?: unknown) => Promise<FlowRun>
  listRuns: (flowId: string) => Promise<FlowRun[]>
}

export interface HttpFlowBackendOptions {
  /** Base origin or URL, e.g. `https://flow.hanzo.ai` or `https://api.hanzo.ai`. */
  baseUrl: string
  /** Optional Hanzo IAM bearer token provider. */
  getToken?: () =>
    string | null | undefined | Promise<string | null | undefined>
  /** API resource prefix. Defaults to `/v1/flows` (set `/v1/workflow` for workflow APIs). */
  pathPrefix?: string
  /** Optional custom fetch implementation (for tests or SSR). */
  fetchImpl?: typeof fetch
  /** Optional extra static headers. */
  headers?: Record<string, string>
}

export interface FlowStorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface MemoryFlowBackendOptions {
  /** Optional `localStorage` key for browser persistence. */
  storageKey?: string
  /** Custom storage implementation (defaults to `globalThis.localStorage` if available). */
  storage?: FlowStorageLike
  /** Optional custom node executor used by `runFlow`. */
  executor?: FlowNodeExecutor
}
