/**
 * @hanzo/canvas — the data contract.
 *
 * Every component in this package is presentational and data-prop-driven: the
 * host (a Hanzo console) fetches its `/v1` rows and maps them into these plain,
 * React-free view-models. This is the ONE place the shapes live, so the pure
 * folds (status, layout, time) are unit-tested in isolation and the visual
 * components never reach back into a data layer.
 */

/**
 * A service's live lifecycle, normalized to one small, glanceable vocabulary
 * (Railway-style). `unknown` is honest — a missing signal is never guessed up
 * to `active`.
 */
export type ServiceStatus =
  | "active" // running / live / healthy
  | "deploying" // deploying / building / provisioning
  | "queued" // queued / pending
  | "crashed" // error / failed / degraded
  | "sleeping" // stopped / idle / scaled-to-zero
  | "removed" // deleting / removed
  | "unknown" // no signal

/** What a node represents — drives the default glyph + accent tint. */
export type ServiceKind =
  | "app"
  | "web"
  | "worker"
  | "database"
  | "cache"
  | "vector"
  | "search"
  | "storage"
  | "queue"
  | "domain"
  | "function"
  | "cron"
  | "ai"
  | "service"

/** Where a service's code/image comes from. */
export interface ServiceSource {
  kind: "repo" | "image" | "template" | "database" | "managed"
  /** repo → `owner/name`; image → `repository:tag`; database → engine; … */
  ref: string
  /** git branch, when `kind === 'repo'`. */
  branch?: string
}

/**
 * A tiny time-series preview for the card (CPU / mem / requests). `points` may
 * be empty — the sparkline then renders an honest flat baseline, never a
 * fabricated trend.
 */
export interface ServiceMetric {
  label: string
  points: number[]
  /** Current formatted value, e.g. `42%` or `1.2k`. */
  value?: string
  /** Optional scale pins; else derived from `points`. */
  min?: number
  max?: number
}

/** The `/v1/<id>` Hanzo capability a node exposes (e.g. vector → `/v1/vector`). */
export interface ServiceCapability {
  id: string // 'vector'
  label: string // 'Vector'
  path?: string // '/v1/vector'
}

/**
 * Everything a ServiceNode card needs — pure data, no back-references, no React.
 * The console maps each `/v1` app/resource row into one of these.
 */
export interface ServiceNodeData {
  id: string
  name: string
  kind: ServiceKind
  status: ServiceStatus
  /** Raw lifecycle string the backend reported (shown verbatim in the drawer). */
  statusLabel?: string
  /** Short type label under the name, e.g. `App`, `PostgreSQL`, `Domain`. */
  typeLabel?: string
  source?: ServiceSource
  replicas?: number
  /** Epoch **ms** of the latest deploy — rendered as relative time. */
  deployedAt?: number
  metric?: ServiceMetric
  capability?: ServiceCapability
  region?: string
  /** In-app deep link opened by the node's primary action. */
  href?: string
  /** External URL (a domain's live site). */
  externalHref?: string
  /** Optional accent hex to tint the node (else derived from status). */
  accent?: string
}

/**
 * Why an edge exists — keeps the graph honest and drives the edge style:
 * `route` (a domain fronting an app, solid + animated), `reference` (a link
 * derived from an env var, dashed), `dependency` (a declared link, solid).
 */
export type ServiceEdgeReason = "route" | "reference" | "dependency"

export interface ServiceEdgeData {
  id: string
  source: string
  target: string
  reason?: ServiceEdgeReason
  label?: string
}

/** A deploy/build event for the DeployTimeline. */
export interface DeployEvent {
  id: string
  status: ServiceStatus | string
  /** e.g. `v12` or a short sha. */
  ref?: string
  source?: string
  message?: string
  /** Epoch **ms**. */
  createdAt?: number
}

/** An environment option for the EnvSwitcher. */
export interface EnvOption {
  id: string
  label: string
  /** Optional count badge (e.g. services in this env). */
  count?: number
}

/** An env var row for the Variables panel (secret-masked at the source). */
export interface EnvVarRow {
  key: string
  value: string
  secret?: boolean
}

/**
 * Overridable status palette — semantic (status), NOT brand. Each status maps to
 * a dot/text hue + a soft translucent chip background that reads in light and
 * dark. Consumers may override per brand.
 */
export interface StatusPalette {
  dot: string
  fg: string
  soft: string
}
