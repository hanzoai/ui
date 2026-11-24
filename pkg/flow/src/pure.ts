/**
 * `@hanzo/flow/pure` — React-free workflow graph engine, palette, templates,
 * validator, deterministic auto-layout, topological executor, and HTTP/memory
 * backends. Zero DOM or UI dependencies — safe in bare Node, server routes,
 * and unit tests.
 */
import type {
  FlowBackend,
  FlowDefinition,
  FlowEdgeData,
  FlowEmbeddingModel,
  FlowEnsoModel,
  FlowExecuteOptions,
  FlowLayoutOptions,
  FlowNodeConfig,
  FlowNodeData,
  FlowNodeExecutor,
  FlowNodeKind,
  FlowPaletteCategory,
  FlowPaletteItem,
  FlowPosition,
  FlowPositionedNode,
  FlowRun,
  FlowStepResult,
  FlowStorageLike,
  FlowTemplate,
  FlowValidationIssue,
  FlowValidationResult,
  HttpFlowBackendOptions,
  MemoryFlowBackendOptions,
} from "./types"

export * from "./types"

export const ENSO_MODELS: readonly FlowEnsoModel[] = [
  "enso",
  "enso-auto",
  "enso-pro",
  "enso-max",
  "enso-flash",
  "enso-ultra",
  "zen6",
  "zen6-coder",
  "zen6-flash",
  "zen6-max",
] as const

export const EMBEDDING_MODELS: readonly FlowEmbeddingModel[] = [
  "zen-embedding-3",
  "zen-embedding",
] as const

export const FLOW_PALETTE_CATEGORIES: readonly FlowPaletteCategory[] = [
  "Triggers",
  "Enso AI",
  "Actions",
  "Logic",
  "Output",
] as const

export interface FlowKindMeta {
  label: string
  shortLabel: string
  category: FlowPaletteCategory
  hasInput: boolean
  hasOutput: boolean
}

export const FLOW_KIND_META: Record<FlowNodeKind, FlowKindMeta> = {
  trigger: {
    label: "Trigger",
    shortLabel: "TRG",
    category: "Triggers",
    hasInput: false,
    hasOutput: true,
  },
  agent: {
    label: "Enso Agent",
    shortLabel: "AI",
    category: "Enso AI",
    hasInput: true,
    hasOutput: true,
  },
  action: {
    label: "Action",
    shortLabel: "ACT",
    category: "Actions",
    hasInput: true,
    hasOutput: true,
  },
  condition: {
    label: "Condition",
    shortLabel: "IF",
    category: "Logic",
    hasInput: true,
    hasOutput: true,
  },
  memory: {
    label: "Knowledge",
    shortLabel: "RAG",
    category: "Enso AI",
    hasInput: true,
    hasOutput: true,
  },
  output: {
    label: "Output",
    shortLabel: "OUT",
    category: "Output",
    hasInput: true,
    hasOutput: false,
  },
}

export const DEFAULT_FLOW_PALETTE: readonly FlowPaletteItem[] = [
  // Triggers
  {
    id: "trigger-webhook",
    kind: "trigger",
    subtype: "webhook",
    category: "Triggers",
    label: "Webhook Trigger",
    description: "Start flow when an HTTP POST hits a signed /v1 webhook URL.",
    defaultConfig: {
      webhookPath: "/v1/hooks/inbound",
    },
  },
  {
    id: "trigger-schedule",
    kind: "trigger",
    subtype: "schedule",
    category: "Triggers",
    label: "Schedule Trigger",
    description: "Run automatically on a recurring cron schedule.",
    defaultConfig: {
      cron: "0 9 * * 1-5",
      timezone: "UTC",
    },
  },
  {
    id: "trigger-crm-event",
    kind: "trigger",
    subtype: "crm_event",
    category: "Triggers",
    label: "CRM Event",
    description: "Fire when a lead, deal, or contact event occurs in CRM.",
    defaultConfig: {
      eventType: "lead.created",
    },
  },
  // Enso AI
  {
    id: "agent-enso",
    kind: "agent",
    subtype: "enso_agent",
    category: "Enso AI",
    label: "Enso Agent",
    description: "Autonomous reasoning and structured drafting with Enso.",
    defaultConfig: {
      model: "enso",
      prompt:
        "Analyze the input and produce a concise structured response:\n{{input}}",
      temperature: 0.2,
    },
  },
  {
    id: "agent-enso-auto",
    kind: "agent",
    subtype: "enso_agent",
    category: "Enso AI",
    label: "Enso Auto Router",
    description:
      "Automatically routes to the optimal Enso tier per task complexity.",
    defaultConfig: {
      model: "enso-auto",
      prompt: "Evaluate and respond with next recommended action:\n{{input}}",
      temperature: 0.2,
    },
  },
  {
    id: "agent-enso-pro",
    kind: "agent",
    subtype: "enso_agent",
    category: "Enso AI",
    label: "Enso Pro Reasoner",
    description: "Deep multi-step planning and synthesis via enso-pro.",
    defaultConfig: {
      model: "enso-pro",
      prompt:
        "Reason step-by-step and output a verified action plan:\n{{input}}",
      temperature: 0.1,
    },
  },
  {
    id: "memory-rag",
    kind: "memory",
    subtype: "rag",
    category: "Enso AI",
    label: "Knowledge / RAG",
    description: "Retrieve grounded context chunks from a vector collection.",
    defaultConfig: {
      collection: "workspace-knowledge",
      embeddingModel: "zen-embedding-3",
      topK: 5,
      prompt: "{{input}}",
    },
  },
  // Actions
  {
    id: "action-sms",
    kind: "action",
    subtype: "sms",
    category: "Actions",
    label: "Send SMS",
    description: "Deliver a short SMS message via messaging connector.",
    defaultConfig: {
      channel: "sms",
      to: "{{input.phone}}",
      prompt: "Hi {{input.name}}, thanks for reaching out.",
    },
  },
  {
    id: "action-voice",
    kind: "action",
    subtype: "voice_call",
    category: "Actions",
    label: "Voice Call",
    description: "Initiate an outbound AI voice call with script instructions.",
    defaultConfig: {
      channel: "voice",
      to: "{{input.phone}}",
      prompt: "Greet {{input.name}} and confirm appointment availability.",
    },
  },
  {
    id: "action-email",
    kind: "action",
    subtype: "email",
    category: "Actions",
    label: "Send Email",
    description: "Send a transactional or follow-up email message.",
    defaultConfig: {
      channel: "email",
      to: "{{input.email}}",
      subject: "Follow-up from our team",
      prompt: "Hello {{input.name}},\n\nFollowing up on your recent inquiry.",
    },
  },
  {
    id: "action-http",
    kind: "action",
    subtype: "http",
    category: "Actions",
    label: "HTTP Request",
    description: "Call an external or Hanzo /v1 REST endpoint.",
    defaultConfig: {
      method: "POST",
      url: "https://api.hanzo.ai/v1/events",
      body: '{"payload": "{{input}}"}',
    },
  },
  {
    id: "action-wait",
    kind: "action",
    subtype: "wait",
    category: "Actions",
    label: "Wait / Delay",
    description: "Pause execution for a fixed delay interval.",
    defaultConfig: {
      delayMs: 300000,
    },
  },
  {
    id: "action-crm-update",
    kind: "action",
    subtype: "crm_update",
    category: "Actions",
    label: "CRM Update",
    description: "Update a record stage, score, or field in Hanzo CRM.",
    defaultConfig: {
      field: "stage",
      value: "qualified",
    },
  },
  // Logic
  {
    id: "condition-branch",
    kind: "condition",
    subtype: "branch",
    category: "Logic",
    label: "Condition / Branch",
    description: "Route execution down True or False branches by expression.",
    defaultConfig: {
      expression: "score >= 70",
      trueLabel: "Qualified",
      falseLabel: "Nurture",
    },
  },
  // Output
  {
    id: "output-notify",
    kind: "output",
    subtype: "notify",
    category: "Output",
    label: "Output / Notify",
    description: "Emit final workflow result and notify operators.",
    defaultConfig: {
      channel: "notify",
      subject: "Workflow completed",
      prompt: "Completed with result: {{input}}",
    },
  },
]

export const DEFAULT_FLOW_TEMPLATES: readonly FlowTemplate[] = [
  {
    id: "tpl-lead-qualification",
    name: "Lead Qualification & Outreach",
    description:
      "Qualifies inbound CRM leads with Enso, branches on score, and triggers instant SMS or email follow-up.",
    category: "CRM",
    nodes: [
      {
        id: "n-trigger",
        kind: "trigger",
        subtype: "crm_event",
        label: "Inbound Lead",
        description: "Fires when a new lead arrives in CRM.",
        position: { x: 48, y: 148 },
        config: { eventType: "lead.created" },
      },
      {
        id: "n-rag",
        kind: "memory",
        subtype: "rag",
        label: "Pricing & FAQ",
        description: "Pulls regional pricing and qualification rules.",
        position: { x: 368, y: 148 },
        config: { collection: "sales-playbook", topK: 4, prompt: "{{input}}" },
      },
      {
        id: "n-agent",
        kind: "agent",
        subtype: "enso_agent",
        label: "Enso Qualifier",
        description: "Scores lead intent and drafts personalized outreach.",
        position: { x: 688, y: 148 },
        config: {
          model: "enso-auto",
          prompt:
            "Score lead intent (0-100) and draft a 1-sentence outreach reply for {{input.name}}.",
          temperature: 0.2,
        },
      },
      {
        id: "n-cond",
        kind: "condition",
        subtype: "branch",
        label: "High Intent?",
        description: "Routes hot leads to SMS and others to email nurture.",
        position: { x: 1008, y: 148 },
        config: {
          expression: "score >= 70",
          trueLabel: "Hot",
          falseLabel: "Nurture",
        },
      },
      {
        id: "n-sms",
        kind: "action",
        subtype: "sms",
        label: "Instant SMS",
        description: "Texts hot leads within seconds.",
        position: { x: 1328, y: 64 },
        config: {
          channel: "sms",
          to: "{{input.phone}}",
          prompt: "Hi {{input.name}}, ready for your quick consultation?",
        },
      },
      {
        id: "n-email",
        kind: "action",
        subtype: "email",
        label: "Nurture Email",
        description: "Sends detailed overview packet.",
        position: { x: 1328, y: 232 },
        config: {
          channel: "email",
          to: "{{input.email}}",
          subject: "Your requested overview",
          prompt: "Hi {{input.name}}, here is the overview you requested.",
        },
      },
      {
        id: "n-crm",
        kind: "action",
        subtype: "crm_update",
        label: "Update CRM Stage",
        description: "Records outreach state on the lead record.",
        position: { x: 1648, y: 148 },
        config: { field: "stage", value: "contacted" },
      },
      {
        id: "n-out",
        kind: "output",
        subtype: "notify",
        label: "Notify Team",
        description: "Emits completion summary to operators.",
        position: { x: 1968, y: 148 },
        config: {
          channel: "notify",
          subject: "Lead processed",
          prompt: "Processed lead {{input.name}}",
        },
      },
    ],
    edges: [
      { id: "e-1", source: "n-trigger", target: "n-rag" },
      { id: "e-2", source: "n-rag", target: "n-agent" },
      { id: "e-3", source: "n-agent", target: "n-cond" },
      {
        id: "e-4",
        source: "n-cond",
        sourceHandle: "true",
        target: "n-sms",
        condition: "true",
        label: "Hot",
      },
      {
        id: "e-5",
        source: "n-cond",
        sourceHandle: "false",
        target: "n-email",
        condition: "false",
        label: "Nurture",
      },
      { id: "e-6", source: "n-sms", target: "n-crm" },
      { id: "e-7", source: "n-email", target: "n-crm" },
      { id: "e-8", source: "n-crm", target: "n-out" },
    ],
  },
  {
    id: "tpl-scheduled-briefing",
    name: "Scheduled Morning Briefing",
    description:
      "Runs weekdays at 08:00, gathers recent knowledge updates, synthesizes a digest with Enso Pro, and notifies the team.",
    category: "Operations",
    schedule: {
      cron: "0 8 * * 1-5",
      timezone: "America/Los_Angeles",
      enabled: true,
      label: "Weekdays 08:00 PT",
    },
    nodes: [
      {
        id: "n-sched",
        kind: "trigger",
        subtype: "schedule",
        label: "Weekday 08:00",
        position: { x: 48, y: 120 },
        config: { cron: "0 8 * * 1-5", timezone: "America/Los_Angeles" },
      },
      {
        id: "n-mem",
        kind: "memory",
        subtype: "rag",
        label: "Fetch Metrics",
        position: { x: 368, y: 120 },
        config: {
          collection: "daily-ops",
          topK: 8,
          prompt: "Last 24h KPIs and incidents",
        },
      },
      {
        id: "n-pro",
        kind: "agent",
        subtype: "enso_agent",
        label: "Enso Pro Digest",
        position: { x: 688, y: 120 },
        config: {
          model: "enso-pro",
          prompt:
            "Summarize key wins, blockers, and priorities in 5 bullets:\n{{input}}",
          temperature: 0.1,
        },
      },
      {
        id: "n-notify",
        kind: "output",
        subtype: "notify",
        label: "Send Digest",
        position: { x: 1008, y: 120 },
        config: {
          channel: "notify",
          subject: "Daily Executive Briefing",
          prompt: "{{input}}",
        },
      },
    ],
    edges: [
      { id: "e-1", source: "n-sched", target: "n-mem" },
      { id: "e-2", source: "n-mem", target: "n-pro" },
      { id: "e-3", source: "n-pro", target: "n-notify" },
    ],
  },
  {
    id: "tpl-webhook-triage",
    name: "Webhook Event Triage",
    description:
      "Classifies inbound webhook payloads with Enso Flash and forwards enriched alerts to a /v1 HTTP endpoint.",
    category: "Automation",
    nodes: [
      {
        id: "n-hook",
        kind: "trigger",
        subtype: "webhook",
        label: "Inbound Webhook",
        position: { x: 48, y: 120 },
        config: { webhookPath: "/v1/hooks/triage" },
      },
      {
        id: "n-flash",
        kind: "agent",
        subtype: "enso_agent",
        label: "Enso Flash Triage",
        position: { x: 368, y: 120 },
        config: {
          model: "enso-flash",
          prompt:
            "Classify severity (low/medium/high) and extract root cause:\n{{input}}",
          temperature: 0,
        },
      },
      {
        id: "n-http",
        kind: "action",
        subtype: "http",
        label: "Dispatch Webhook",
        position: { x: 688, y: 120 },
        config: {
          method: "POST",
          url: "https://api.hanzo.ai/v1/events",
          body: '{"triage": "{{input}}"}',
        },
      },
      {
        id: "n-out",
        kind: "output",
        subtype: "notify",
        label: "Audit Output",
        position: { x: 1008, y: 120 },
        config: {
          channel: "notify",
          subject: "Triage Complete",
          prompt: "{{input}}",
        },
      },
    ],
    edges: [
      { id: "e-1", source: "n-hook", target: "n-flash" },
      { id: "e-2", source: "n-flash", target: "n-http" },
      { id: "e-3", source: "n-http", target: "n-out" },
    ],
  },
]

let seqCounter = 0
function nextId(prefix: string): string {
  seqCounter += 1
  const rand = Math.random().toString(36).slice(2, 7)
  return `${prefix}-${Date.now().toString(36)}-${seqCounter}-${rand}`
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createFlowNodeFromPalette(
  item: FlowPaletteItem,
  position: FlowPosition = { x: 80, y: 80 },
  id?: string
): FlowNodeData {
  return {
    id: id ?? nextId(item.kind),
    kind: item.kind,
    subtype: item.subtype,
    label: item.label,
    description: item.description,
    position: { x: position.x, y: position.y },
    config: deepClone(item.defaultConfig),
  }
}

export function createEmptyFlow(
  name = "Untitled Flow",
  id?: string
): FlowDefinition {
  const trigger = createFlowNodeFromPalette(
    DEFAULT_FLOW_PALETTE[0],
    { x: 64, y: 140 },
    "node-trigger"
  )
  const agent = createFlowNodeFromPalette(
    DEFAULT_FLOW_PALETTE[3],
    { x: 384, y: 140 },
    "node-agent"
  )
  const output = createFlowNodeFromPalette(
    DEFAULT_FLOW_PALETTE[DEFAULT_FLOW_PALETTE.length - 1],
    { x: 704, y: 140 },
    "node-output"
  )
  return {
    id: id ?? nextId("flow"),
    name,
    description: "New AI workflow",
    enabled: false,
    nodes: [trigger, agent, output],
    edges: [
      { id: "edge-1", source: trigger.id, target: agent.id },
      { id: "edge-2", source: agent.id, target: output.id },
    ],
    updatedAt: new Date().toISOString(),
  }
}

export function createFlowFromTemplate(
  template: FlowTemplate,
  id?: string
): FlowDefinition {
  return {
    id: id ?? nextId("flow"),
    name: template.name,
    description: template.description,
    category: template.category,
    enabled: Boolean(template.schedule?.enabled),
    schedule: template.schedule ? deepClone(template.schedule) : undefined,
    nodes: deepClone(template.nodes),
    edges: deepClone(template.edges),
    updatedAt: new Date().toISOString(),
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

/** Read a dot-separated path from an unknown value safely. */
function readPath(root: unknown, path: string): unknown {
  if (!path) return root
  const parts = path.split(".").filter(Boolean)
  let cur: unknown = root
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

/** Safe `{{path}}` template interpolation (no eval). */
export function interpolateTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  if (!template) return ""
  return template.replace(
    /\{\{\s*([^}]+?)\s*\}\}/g,
    (_match, rawKey: string) => {
      const key = rawKey.trim()
      let val = readPath(context, key)
      if (
        val === undefined &&
        context.input !== undefined &&
        !key.startsWith("input.")
      ) {
        val = readPath(context.input, key)
      }
      if (val === undefined && context.initialInput !== undefined) {
        const stripped = key.startsWith("input.") ? key.slice(6) : key
        val = readPath(context.initialInput, stripped)
      }
      if (val === undefined || val === null) return ""
      if (typeof val === "string") return val
      if (typeof val === "number" || typeof val === "boolean")
        return String(val)
      try {
        return JSON.stringify(val)
      } catch {
        return String(val)
      }
    }
  )
}

function isValidCron(cron: string | undefined): boolean {
  if (!cron) return false
  const fields = cron.trim().split(/\s+/)
  return fields.length === 5 || fields.length === 6
}

/**
 * Deterministic safe condition evaluator for `condition` nodes (zero eval).
 * Supports:
 * - `"true"` / `"false"`
 * - `"contains:<substring>"`
 * - `"equals:<value>"`
 * - `"<path> >= <num>"`, `">"`, `"<="`, `"<"`, `"=="`, `"!="`
 * - `"<path>"` truthy check
 */
export function evaluateCondition(
  expression: string | undefined,
  input: unknown,
  fallbackInput?: unknown
): boolean {
  const expr = (expression ?? "").trim()
  if (!expr || expr.toLowerCase() === "true") return true
  if (expr.toLowerCase() === "false") return false

  if (expr.toLowerCase().startsWith("contains:")) {
    const needle = expr.slice("contains:".length).trim().toLowerCase()
    const hay =
      typeof input === "string"
        ? input.toLowerCase()
        : JSON.stringify(input ?? fallbackInput ?? "").toLowerCase()
    return hay.includes(needle)
  }

  if (expr.toLowerCase().startsWith("equals:")) {
    const expected = expr.slice("equals:".length).trim()
    return String(input ?? "").trim() === expected
  }

  const cmpMatch = expr.match(/^([a-zA-Z0-9_.-]+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/)
  if (cmpMatch) {
    const [, rawPath, op, rawRight] = cmpMatch
    const path = rawPath.startsWith("input.") ? rawPath.slice(6) : rawPath
    let leftVal = readPath(input, path)
    if (leftVal === undefined && fallbackInput !== undefined) {
      leftVal = readPath(fallbackInput, path)
    }
    const strippedRight = rawRight.trim().replace(/^["']|["']$/g, "")
    const numRight = Number(strippedRight)
    const numLeft = typeof leftVal === "number" ? leftVal : Number(leftVal)

    if (
      !Number.isNaN(numLeft) &&
      !Number.isNaN(numRight) &&
      leftVal !== undefined &&
      leftVal !== ""
    ) {
      switch (op) {
        case ">=":
          return numLeft >= numRight
        case "<=":
          return numLeft <= numRight
        case ">":
          return numLeft > numRight
        case "<":
          return numLeft < numRight
        case "==":
          return numLeft === numRight
        case "!=":
          return numLeft !== numRight
      }
    }
    const strLeft = leftVal == null ? "" : String(leftVal)
    switch (op) {
      case "==":
        return strLeft === strippedRight
      case "!=":
        return strLeft !== strippedRight
      default:
        return false
    }
  }

  const path = expr.startsWith("input.") ? expr.slice(6) : expr
  let val = readPath(input, path)
  if (val === undefined && fallbackInput !== undefined) {
    val = readPath(fallbackInput, path)
  }
  return Boolean(val)
}

/**
 * Validate a workflow graph for cycles, dangling edges, duplicate IDs,
 * disconnected nodes, missing triggers, and missing required node config.
 */
export function validateFlowGraph(
  flow: Pick<FlowDefinition, "nodes" | "edges">
): FlowValidationResult {
  const issues: FlowValidationIssue[] = []
  const nodes = flow.nodes ?? []
  const edges = flow.edges ?? []

  if (nodes.length === 0) {
    issues.push({
      code: "EMPTY_FLOW",
      severity: "warning",
      message:
        "Flow has no nodes yet. Add a trigger and an Enso agent to begin.",
    })
    return {
      valid: true,
      issues,
      errors: [],
      warnings: issues,
    }
  }

  // Duplicate IDs & lookup map
  const nodeMap = new Map<string, FlowNodeData>()
  for (const n of nodes) {
    if (nodeMap.has(n.id)) {
      issues.push({
        code: "DUPLICATE_NODE_ID",
        severity: "error",
        nodeId: n.id,
        message: `Duplicate node ID "${n.id}".`,
      })
    } else {
      nodeMap.set(n.id, n)
    }
  }

  // Dangling edges & adjacency lists
  const outgoing = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  const outdeg = new Map<string, number>()
  for (const id of nodeMap.keys()) {
    outgoing.set(id, [])
    indeg.set(id, 0)
    outdeg.set(id, 0)
  }

  for (const e of edges) {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) {
      issues.push({
        code: "DANGLING_EDGE",
        severity: "error",
        edgeId: e.id,
        message: `Edge "${e.id}" references a missing node (${e.source} -> ${e.target}).`,
      })
      continue
    }
    if (e.source === e.target) {
      issues.push({
        code: "CYCLE_DETECTED",
        severity: "error",
        nodeId: e.source,
        edgeId: e.id,
        message: `Node "${nodeMap.get(e.source)?.label ?? e.source}" connects to itself.`,
      })
      continue
    }
    outgoing.get(e.source)!.push(e.target)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
    outdeg.set(e.source, (outdeg.get(e.source) ?? 0) + 1)
  }

  // Cycle detection via Kahn's algorithm
  const remaining = new Map(indeg)
  const queue: string[] = []
  for (const [id, deg] of remaining) {
    if (deg === 0) queue.push(id)
  }
  let visited = 0
  while (queue.length > 0) {
    const u = queue.shift()!
    visited += 1
    for (const v of outgoing.get(u) ?? []) {
      const next = (remaining.get(v) ?? 0) - 1
      remaining.set(v, next)
      if (next === 0) queue.push(v)
    }
  }

  if (visited < nodeMap.size) {
    const cyclicIds = [...remaining.entries()]
      .filter(([, deg]) => deg > 0)
      .map(([id]) => id)
      .sort()
    for (const id of cyclicIds) {
      issues.push({
        code: "CYCLE_DETECTED",
        severity: "error",
        nodeId: id,
        message: `Cycle detected involving node "${nodeMap.get(id)?.label ?? id}". Workflows must be acyclic (DAG).`,
      })
    }
  }

  // Missing trigger warning
  const hasTrigger = nodes.some((n) => n.kind === "trigger")
  if (!hasTrigger) {
    issues.push({
      code: "MISSING_TRIGGER",
      severity: "warning",
      message: "Flow has no trigger node; it can only be executed manually.",
    })
  }

  // Disconnected nodes warning (when graph has > 1 node)
  if (nodes.length > 1) {
    for (const n of nodes) {
      if ((indeg.get(n.id) ?? 0) === 0 && (outdeg.get(n.id) ?? 0) === 0) {
        issues.push({
          code: "DISCONNECTED_NODE",
          severity: "warning",
          nodeId: n.id,
          message: `Node "${n.label}" is disconnected from the graph.`,
        })
      }
    }
  }

  // Required config validation per kind/subtype
  for (const n of nodes) {
    const cfg: FlowNodeConfig = n.config ?? {}
    if (!n.label || !n.label.trim()) {
      issues.push({
        code: "MISSING_CONFIG",
        severity: "error",
        nodeId: n.id,
        message: `Node "${n.id}" is missing a label.`,
      })
    }
    if (n.kind === "agent") {
      if (!cfg.model || !String(cfg.model).trim()) {
        issues.push({
          code: "MISSING_CONFIG",
          severity: "error",
          nodeId: n.id,
          message: `Agent "${n.label}" must specify an Enso model.`,
        })
      }
      if (!cfg.prompt || !String(cfg.prompt).trim()) {
        issues.push({
          code: "MISSING_CONFIG",
          severity: "warning",
          nodeId: n.id,
          message: `Agent "${n.label}" has an empty prompt.`,
        })
      }
    } else if (n.kind === "trigger" && n.subtype === "schedule") {
      if (!isValidCron(cfg.cron)) {
        issues.push({
          code: "MISSING_CONFIG",
          severity: "error",
          nodeId: n.id,
          message: `Schedule trigger "${n.label}" needs a valid 5-field cron expression.`,
        })
      }
    } else if (n.kind === "trigger" && n.subtype === "webhook") {
      if (!cfg.webhookPath || !String(cfg.webhookPath).trim()) {
        issues.push({
          code: "MISSING_CONFIG",
          severity: "error",
          nodeId: n.id,
          message: `Webhook trigger "${n.label}" needs a webhook path.`,
        })
      }
    } else if (n.kind === "action" && n.subtype === "http") {
      if (!cfg.url || !String(cfg.url).trim()) {
        issues.push({
          code: "MISSING_CONFIG",
          severity: "error",
          nodeId: n.id,
          message: `HTTP action "${n.label}" requires a target URL.`,
        })
      }
    } else if (n.kind === "condition") {
      if (!cfg.expression || !String(cfg.expression).trim()) {
        issues.push({
          code: "MISSING_CONFIG",
          severity: "error",
          nodeId: n.id,
          message: `Condition "${n.label}" requires a branch expression.`,
        })
      }
    }
  }

  const errors = issues.filter((i) => i.severity === "error")
  const warnings = issues.filter((i) => i.severity === "warning")

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
  }
}

const DEFAULT_LAYOUT = {
  columnGap: 320,
  rowGap: 148,
  originX: 48,
  originY: 48,
} as const

/**
 * Deterministic left-to-right topological auto-layout.
 * Assigns each node a column via longest-path Kahn layering and vertically
 * centers nodes within every column on a shared horizontal axis. Cycle-safe
 * and byte-identical for identical inputs.
 */
export function layoutFlowGraph(
  nodes: ReadonlyArray<Pick<FlowNodeData, "id">>,
  edges: ReadonlyArray<Pick<FlowEdgeData, "source" | "target">>,
  opts: FlowLayoutOptions = {}
): FlowPositionedNode[] {
  const columnGap = opts.columnGap ?? DEFAULT_LAYOUT.columnGap
  const rowGap = opts.rowGap ?? DEFAULT_LAYOUT.rowGap
  const originX = opts.originX ?? DEFAULT_LAYOUT.originX
  const originY = opts.originY ?? DEFAULT_LAYOUT.originY

  const ids = nodes.map((n) => n.id)
  const present = new Set(ids)
  const outgoing = new Map<string, string[]>()
  const indeg = new Map<string, number>()

  for (const id of ids) {
    outgoing.set(id, [])
    indeg.set(id, 0)
  }

  for (const e of edges) {
    if (
      !present.has(e.source) ||
      !present.has(e.target) ||
      e.source === e.target
    ) {
      continue
    }
    outgoing.get(e.source)!.push(e.target)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }

  const column = new Map<string, number>()
  for (const id of ids) column.set(id, 0)

  const remaining = new Map(indeg)
  const queue = ids.filter((id) => (remaining.get(id) ?? 0) === 0).sort()
  const seen = new Set<string>()

  while (queue.length > 0) {
    const u = queue.shift()!
    if (seen.has(u)) continue
    seen.add(u)
    const cu = column.get(u) ?? 0
    for (const v of outgoing.get(u) ?? []) {
      if (cu + 1 > (column.get(v) ?? 0)) column.set(v, cu + 1)
      const left = (remaining.get(v) ?? 0) - 1
      remaining.set(v, left)
      if (left <= 0 && !seen.has(v)) queue.push(v)
    }
    queue.sort()
  }

  const byColumn = new Map<number, string[]>()
  for (const id of ids) {
    const c = column.get(id) ?? 0
    const list = byColumn.get(c)
    if (list) list.push(id)
    else byColumn.set(c, [id])
  }
  for (const list of byColumn.values()) list.sort()

  const maxRows = Math.max(1, ...Array.from(byColumn.values(), (l) => l.length))
  const axis = originY + ((maxRows - 1) * rowGap) / 2

  const pos = new Map<string, FlowPosition>()
  for (const [c, list] of byColumn) {
    const top = axis - ((list.length - 1) * rowGap) / 2
    list.forEach((id, i) => {
      pos.set(id, {
        x: Math.round(originX + c * columnGap),
        y: Math.round(top + i * rowGap),
      })
    })
  }

  return nodes.map((n) => ({
    id: n.id,
    position: pos.get(n.id) ?? { x: originX, y: originY },
  }))
}

export function applyLayoutToFlow(
  flow: FlowDefinition,
  opts?: FlowLayoutOptions
): FlowDefinition {
  const positions = new Map(
    layoutFlowGraph(flow.nodes, flow.edges, opts).map((p) => [p.id, p.position])
  )
  return {
    ...flow,
    nodes: flow.nodes.map((n) => ({
      ...n,
      position: positions.get(n.id) ?? n.position ?? { x: 48, y: 48 },
    })),
  }
}

/** Built-in deterministic local node executor used when no custom executor is supplied. */
async function defaultNodeExecutor(
  node: FlowNodeData,
  input: unknown,
  initialInput: unknown
): Promise<unknown> {
  const cfg = node.config ?? {}
  const ctx = { input, initialInput }
  const renderedPrompt = cfg.prompt ? interpolateTemplate(cfg.prompt, ctx) : ""

  const baseObj = isPlainObject(input) ? input : {}

  switch (node.kind) {
    case "trigger":
      return {
        ...baseObj,
        triggeredBy: node.subtype ?? "manual",
        event: cfg.eventType ?? cfg.webhookPath ?? cfg.cron ?? "manual",
        payload: input,
      }

    case "memory":
      return {
        ...baseObj,
        collection: cfg.collection ?? "default",
        embeddingModel: cfg.embeddingModel ?? "zen-embedding-3",
        topK: cfg.topK ?? 5,
        query: renderedPrompt || input,
        matches: [
          {
            source: `${cfg.collection ?? "default"}/doc-1`,
            score: 0.94,
            snippet: `Context retrieved for ${node.label}`,
          },
        ],
      }

    case "agent": {
      const model = cfg.model ?? "enso"
      return {
        ...baseObj,
        model,
        response: renderedPrompt
          ? `[${model}] ${renderedPrompt}`
          : `[${model}] Completed ${node.label}`,
      }
    }

    case "condition": {
      const matched = evaluateCondition(cfg.expression, input, initialInput)
      return {
        ...baseObj,
        expression: cfg.expression ?? "true",
        matched,
        branch: matched ? "true" : "false",
      }
    }

    case "action": {
      if (node.subtype === "http") {
        return {
          action: "http",
          method: cfg.method ?? "POST",
          url: cfg.url ?? "",
          body: cfg.body ? interpolateTemplate(cfg.body, ctx) : undefined,
          status: 200,
        }
      }
      if (node.subtype === "wait") {
        return {
          action: "wait",
          delayMs: cfg.delayMs ?? 0,
          resumed: true,
          payload: input,
        }
      }
      if (node.subtype === "crm_update") {
        return {
          action: "crm_update",
          field: cfg.field ?? "stage",
          value: cfg.value ? interpolateTemplate(cfg.value, ctx) : "",
          updated: true,
          payload: input,
        }
      }
      return {
        action: node.subtype ?? cfg.channel ?? "action",
        channel: cfg.channel ?? node.subtype ?? "action",
        to: cfg.to ? interpolateTemplate(cfg.to, ctx) : undefined,
        subject: cfg.subject
          ? interpolateTemplate(cfg.subject, ctx)
          : undefined,
        message: renderedPrompt,
        sent: true,
      }
    }

    case "output":
      return {
        channel: cfg.channel ?? "notify",
        subject: cfg.subject
          ? interpolateTemplate(cfg.subject, ctx)
          : node.label,
        message: renderedPrompt || input,
        delivered: true,
      }
  }
}

/**
 * Topological DAG workflow execution engine.
 * Produces a complete `FlowRun` with per-step timing, inputs/outputs,
 * branch-aware skipping, and failure isolation.
 */
export async function executeFlowGraph(
  flow: FlowDefinition,
  input?: unknown,
  executor?: FlowNodeExecutor,
  options: FlowExecuteOptions = {}
): Promise<FlowRun> {
  const now = options.now ?? (() => Date.now())
  const runId = options.idGenerator ? options.idGenerator() : nextId("run")
  const runStartMs = now()
  const runStartedAt = new Date(runStartMs).toISOString()

  const validation = validateFlowGraph(flow)
  const fatalErrors = validation.errors.filter(
    (e) =>
      e.code === "CYCLE_DETECTED" ||
      e.code === "DANGLING_EDGE" ||
      e.code === "DUPLICATE_NODE_ID"
  )
  if (fatalErrors.length > 0) {
    const endMs = now()
    return {
      id: runId,
      flowId: flow.id,
      status: "failed",
      startedAt: runStartedAt,
      finishedAt: new Date(endMs).toISOString(),
      durationMs: Math.max(0, endMs - runStartMs),
      input,
      steps: [],
      error: fatalErrors.map((e) => e.message).join(" "),
    }
  }

  const nodeMap = new Map<string, FlowNodeData>()
  const outgoing = new Map<string, FlowEdgeData[]>()
  const incoming = new Map<string, FlowEdgeData[]>()
  const indeg = new Map<string, number>()

  for (const n of flow.nodes) {
    nodeMap.set(n.id, n)
    outgoing.set(n.id, [])
    incoming.set(n.id, [])
    indeg.set(n.id, 0)
  }

  for (const e of flow.edges) {
    if (
      !nodeMap.has(e.source) ||
      !nodeMap.has(e.target) ||
      e.source === e.target
    ) {
      continue
    }
    outgoing.get(e.source)!.push(e)
    incoming.get(e.target)!.push(e)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }

  // Deterministic topological order (Kahn)
  const remaining = new Map(indeg)
  const queue = flow.nodes
    .map((n) => n.id)
    .filter((id) => (remaining.get(id) ?? 0) === 0)
    .sort()
  const order: string[] = []

  while (queue.length > 0) {
    const u = queue.shift()!
    order.push(u)
    for (const e of outgoing.get(u) ?? []) {
      const next = (remaining.get(e.target) ?? 0) - 1
      remaining.set(e.target, next)
      if (next === 0) queue.push(e.target)
    }
    queue.sort()
  }

  const outputs: Record<string, unknown> = {}
  const activeEdges = new Set<string>()
  const steps: FlowStepResult[] = []
  let runFailed = false
  let firstError: string | undefined

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId)!
    const inc = incoming.get(nodeId) ?? []
    const stepStartMs = now()
    const stepStartedAt = new Date(stepStartMs).toISOString()

    if (options.signal?.aborted) {
      const endMs = now()
      runFailed = true
      firstError = firstError ?? "Execution aborted."
      steps.push({
        nodeId: node.id,
        nodeLabel: node.label,
        kind: node.kind,
        status: "skipped",
        startedAt: stepStartedAt,
        finishedAt: new Date(endMs).toISOString(),
        durationMs: Math.max(0, endMs - stepStartMs),
        error: "Execution aborted.",
      })
      continue
    }

    // If this node has incoming edges, at least one incoming edge must be active.
    const activeIncoming = inc.filter((e) => activeEdges.has(e.id))
    const shouldSkip =
      node.disabled || (inc.length > 0 && activeIncoming.length === 0)

    if (shouldSkip) {
      const endMs = now()
      steps.push({
        nodeId: node.id,
        nodeLabel: node.label,
        kind: node.kind,
        status: "skipped",
        startedAt: stepStartedAt,
        finishedAt: new Date(endMs).toISOString(),
        durationMs: Math.max(0, endMs - stepStartMs),
      })
      continue
    }

    // Build node input from active parent output(s), or initial run input for roots.
    let nodeInput: unknown
    if (activeIncoming.length === 0) {
      nodeInput = input
    } else if (activeIncoming.length === 1) {
      nodeInput = outputs[activeIncoming[0].source]
    } else {
      nodeInput = Object.fromEntries(
        activeIncoming.map((e) => [e.source, outputs[e.source]])
      )
    }

    try {
      const result = executor
        ? await executor({
            flow,
            node,
            input: nodeInput,
            initialInput: input,
            previousOutputs: { ...outputs },
            signal: options.signal,
          })
        : await defaultNodeExecutor(node, nodeInput, input)

      const endMs = now()
      outputs[node.id] = result
      steps.push({
        nodeId: node.id,
        nodeLabel: node.label,
        kind: node.kind,
        status: "succeeded",
        startedAt: stepStartedAt,
        finishedAt: new Date(endMs).toISOString(),
        durationMs: Math.max(0, endMs - stepStartMs),
        input: nodeInput,
        output: result,
      })

      // Activate outgoing edges (respecting condition branch handles)
      const outs = outgoing.get(node.id) ?? []
      if (node.kind === "condition") {
        const matched =
          typeof result === "boolean"
            ? result
            : Boolean(
                result &&
                  typeof result === "object" &&
                  "matched" in (result as Record<string, unknown>)
                  ? (result as Record<string, unknown>).matched
                  : result
              )
        for (const e of outs) {
          const branch = (e.sourceHandle ?? e.condition ?? "").toLowerCase()
          if (branch === "true" && matched) activeEdges.add(e.id)
          else if (branch === "false" && !matched) activeEdges.add(e.id)
          else if (!branch || branch === "default" || branch === "out") {
            activeEdges.add(e.id)
          }
        }
      } else {
        for (const e of outs) activeEdges.add(e.id)
      }
    } catch (err) {
      const endMs = now()
      const message = err instanceof Error ? err.message : String(err)
      runFailed = true
      firstError = firstError ?? message
      steps.push({
        nodeId: node.id,
        nodeLabel: node.label,
        kind: node.kind,
        status: "failed",
        startedAt: stepStartedAt,
        finishedAt: new Date(endMs).toISOString(),
        durationMs: Math.max(0, endMs - stepStartMs),
        input: nodeInput,
        error: message,
      })
    }
  }

  // Final output = last succeeded leaf node output (or map if multiple leaves succeeded)
  const succeededLeaves = steps.filter(
    (s) =>
      s.status === "succeeded" && (outgoing.get(s.nodeId)?.length ?? 0) === 0
  )
  const finalOutput =
    succeededLeaves.length === 1
      ? succeededLeaves[0].output
      : succeededLeaves.length > 1
        ? Object.fromEntries(succeededLeaves.map((s) => [s.nodeId, s.output]))
        : steps.filter((s) => s.status === "succeeded").at(-1)?.output

  const runEndMs = now()
  return {
    id: runId,
    flowId: flow.id,
    status: runFailed ? "failed" : "succeeded",
    startedAt: runStartedAt,
    finishedAt: new Date(runEndMs).toISOString(),
    durationMs: Math.max(0, runEndMs - runStartMs),
    input,
    output: finalOutput,
    steps,
    error: firstError,
  }
}

function unwrapList<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    for (const k of keys) {
      if (Array.isArray(obj[k])) return obj[k] as T[]
    }
  }
  return []
}

function unwrapItem<T>(payload: unknown, keys: string[]): T {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    for (const k of keys) {
      if (obj[k] && typeof obj[k] === "object") return obj[k] as T
    }
  }
  return payload as T
}

/**
 * Standard REST adapter talking to `flow.hanzo.ai` (`/v1/flows`) or
 * `/v1/workflow` with signed-in Hanzo IAM bearer auth.
 */
export function createHttpFlowBackend(
  options: HttpFlowBackendOptions
): FlowBackend {
  const base = options.baseUrl.replace(/\/+$/, "")
  const prefix = (options.pathPrefix ?? "/v1/flows").replace(/\/+$/, "")
  const endpoint = base.endsWith(prefix) ? base : `${base}${prefix}`
  const fetcher = options.fetchImpl ?? globalThis.fetch

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!fetcher) {
      throw new Error("fetch is not available in this environment")
    }
    const token = options.getToken ? await options.getToken() : undefined
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const res = await fetcher(`${endpoint}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as Record<string, string> | undefined),
      },
    })

    if (!res.ok) {
      let detail = res.statusText
      try {
        const text = await res.text()
        if (text) {
          try {
            const parsed = JSON.parse(text) as {
              error?: string
              message?: string
            }
            detail = parsed.error ?? parsed.message ?? text
          } catch {
            detail = text
          }
        }
      } catch {
        // ignore body read errors
      }
      throw new Error(`Flow API ${res.status}: ${detail}`)
    }

    if (res.status === 204) return undefined as T
    const text = await res.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  }

  return {
    async listFlows() {
      const data = await request<unknown>("")
      return unwrapList<FlowDefinition>(data, [
        "flows",
        "workflows",
        "items",
        "data",
      ])
    },

    async saveFlow(flow) {
      const body = JSON.stringify({
        ...flow,
        updatedAt: new Date().toISOString(),
      })
      try {
        const data = await request<unknown>(`/${encodeURIComponent(flow.id)}`, {
          method: "PUT",
          body,
        })
        return unwrapItem<FlowDefinition>(data, ["flow", "workflow", "data"])
      } catch (err) {
        const msg = err instanceof Error ? err.message : ""
        if (msg.includes("404") || msg.includes("405")) {
          const data = await request<unknown>("", { method: "POST", body })
          return unwrapItem<FlowDefinition>(data, ["flow", "workflow", "data"])
        }
        throw err
      }
    },

    async deleteFlow(id) {
      await request<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" })
    },

    async toggleFlow(id, enabled) {
      const data = await request<unknown>(`/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      })
      return unwrapItem<FlowDefinition>(data, ["flow", "workflow", "data"])
    },

    async runFlow(id, input) {
      const data = await request<unknown>(`/${encodeURIComponent(id)}/runs`, {
        method: "POST",
        body: JSON.stringify({ input }),
      })
      return unwrapItem<FlowRun>(data, ["run", "execution", "data"])
    },

    async listRuns(flowId) {
      const data = await request<unknown>(`/${encodeURIComponent(flowId)}/runs`)
      return unwrapList<FlowRun>(data, ["runs", "executions", "items", "data"])
    },
  }
}

function resolveStorage(custom?: FlowStorageLike): FlowStorageLike | null {
  if (custom) return custom
  try {
    if (
      typeof globalThis !== "undefined" &&
      "localStorage" in globalThis &&
      globalThis.localStorage
    ) {
      return globalThis.localStorage
    }
  } catch {
    // SSR / restricted iframe
  }
  return null
}

/**
 * In-memory (with optional `localStorage`) `FlowBackend` adapter for instant
 * zero-backend demos, offline editing, and unit tests.
 */
export function createMemoryFlowBackend(
  initialFlows: FlowDefinition[] = [],
  options: MemoryFlowBackendOptions = {}
): FlowBackend {
  const storage = options.storageKey ? resolveStorage(options.storage) : null

  let flows: FlowDefinition[] = deepClone(initialFlows)
  let runsByFlow: Record<string, FlowRun[]> = {}

  if (storage && options.storageKey) {
    try {
      const raw = storage.getItem(options.storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as {
          flows?: FlowDefinition[]
          runsByFlow?: Record<string, FlowRun[]>
        }
        if (Array.isArray(parsed.flows)) flows = parsed.flows
        if (parsed.runsByFlow && typeof parsed.runsByFlow === "object") {
          runsByFlow = parsed.runsByFlow
        }
      }
    } catch {
      // Fallback to initialFlows on corrupt storage
    }
  }

  function persist() {
    if (!storage || !options.storageKey) return
    try {
      storage.setItem(options.storageKey, JSON.stringify({ flows, runsByFlow }))
    } catch {
      // Quota exceeded or restricted storage
    }
  }

  return {
    async listFlows() {
      return deepClone(flows)
    },

    async saveFlow(flow) {
      const next: FlowDefinition = {
        ...deepClone(flow),
        updatedAt: new Date().toISOString(),
      }
      const idx = flows.findIndex((f) => f.id === next.id)
      if (idx >= 0) flows[idx] = next
      else flows = [next, ...flows]
      persist()
      return deepClone(next)
    },

    async deleteFlow(id) {
      flows = flows.filter((f) => f.id !== id)
      delete runsByFlow[id]
      persist()
    },

    async toggleFlow(id, enabled) {
      const idx = flows.findIndex((f) => f.id === id)
      if (idx < 0) throw new Error(`Flow "${id}" not found`)
      const updated: FlowDefinition = {
        ...flows[idx],
        enabled,
        updatedAt: new Date().toISOString(),
      }
      flows[idx] = updated
      persist()
      return deepClone(updated)
    },

    async runFlow(id, input) {
      const flow = flows.find((f) => f.id === id)
      if (!flow) throw new Error(`Flow "${id}" not found`)
      const run = await executeFlowGraph(flow, input, options.executor)
      const prev = runsByFlow[id] ?? []
      runsByFlow[id] = [run, ...prev].slice(0, 50)
      persist()
      return deepClone(run)
    },

    async listRuns(flowId) {
      return deepClone(runsByFlow[flowId] ?? [])
    },
  }
}
