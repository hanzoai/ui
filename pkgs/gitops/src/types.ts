/**
 * @hanzo/gitops — the data contract.
 *
 * Every component in this package is presentational and data-prop-driven: the
 * host maps its `/v1/gitops` rows into these plain, React-free view-models. This
 * is the ONE place the shapes live, so the pure folds (health, sync, tree layout,
 * diff) are unit-tested in isolation and the visual components never reach back
 * into a data layer.
 *
 * The two status vocabularies mirror Argo CD exactly and stay orthogonal — a
 * resource's health (is it working?) is never conflated with its sync state (does
 * live match desired?).
 */

/** A resource/application health verdict (Argo CD's `HealthStatusCode`). */
export type HealthStatus =
  | 'Healthy'
  | 'Progressing'
  | 'Degraded'
  | 'Suspended'
  | 'Missing'
  | 'Unknown'

/** Whether live state matches desired state (Argo CD's `SyncStatusCode`). */
export type SyncStatus = 'Synced' | 'OutOfSync' | 'Unknown'

/** A sync/rollback operation's phase. */
export type OperationPhase = 'Running' | 'Succeeded' | 'Failed' | 'Error' | 'Terminating'

/**
 * A status color triple — a dot/icon hue, a text hue, and a soft translucent chip
 * background that reads on both light and dark surfaces. Semantic (status), not
 * brand; overridable per component via the palette props.
 */
export interface StatusPalette {
  dot: string
  fg: string
  soft: string
}

/** A Kubernetes object reference — the identity of a tree node / managed resource. */
export interface ResourceRef {
  group?: string
  version?: string
  kind: string
  namespace?: string
  name: string
  /** Server-assigned uid; when absent an id is synthesized from group/kind/ns/name. */
  uid?: string
}

/** A reported health verdict plus an optional human message. */
export interface ResourceHealth {
  status: HealthStatus
  message?: string
}

/** A `name: value` info chip a tree node may carry (e.g. `Revision: abc123`). */
export interface ResourceInfo {
  name: string
  value: string
}

/**
 * One node in an application's resource tree. Owned Kubernetes objects link to
 * their owners via `parentRefs` (mirroring ownerReferences plus a few derived
 * links such as Ingress → Service); a node with no present parent is a root.
 */
export interface AppTreeNode extends ResourceRef {
  parentRefs?: ResourceRef[]
  health?: ResourceHealth
  /** Per-resource sync state, when the app reports one. */
  sync?: SyncStatus
  info?: ResourceInfo[]
  images?: string[]
  /** Epoch **ms** the object was created. */
  createdAt?: number
  resourceVersion?: string
}

/** An application's resource tree (the `{name}/tree` payload). */
export interface ResourceTree {
  nodes: AppTreeNode[]
  /** Objects in the destination namespace not owned by the application. */
  orphanedNodes?: AppTreeNode[]
}

/** Where an application's manifests come from. */
export interface AppSource {
  repoURL?: string
  path?: string
  targetRevision?: string
  chart?: string
}

/** Where an application deploys to. */
export interface AppDestination {
  server?: string
  name?: string
  namespace?: string
}

/**
 * An application summary — one row in the applications list and the header of the
 * detail view. Health and sync are already folded to the canonical vocabularies.
 */
export interface GitopsApplication {
  name: string
  namespace?: string
  project?: string
  health: HealthStatus
  sync: SyncStatus
  /** Short revision the app is currently at (sha or tag). */
  revision?: string
  source?: AppSource
  destination?: AppDestination
  operationPhase?: OperationPhase
  labels?: Record<string, string>
  /** Epoch **ms**. */
  createdAt?: number
  /** Optional condition/health message surfaced on the card. */
  message?: string
}

/**
 * A managed resource for the diff view — carries the desired (`targetState`) and
 * live (`liveState`) manifests, or a pre-computed unified `diff`.
 */
export interface ManagedResource extends ResourceRef {
  /** Desired manifest, as a YAML/JSON string. */
  targetState?: string
  /** Live manifest, as a YAML/JSON string. */
  liveState?: string
  /** A pre-computed unified diff; when present it is rendered verbatim. */
  diff?: string
  hook?: boolean
  /** Live-only object that a sync would delete when pruning is enabled. */
  requiresPruning?: boolean
}

/** The classification of a single line in a rendered diff. */
export type DiffLineType = 'add' | 'del' | 'context' | 'hunk' | 'meta'

/** One classified, positioned line of a diff. */
export interface DiffLine {
  type: DiffLineType
  text: string
  /** 1-based line number in the live (old) manifest, when applicable. */
  oldLine?: number
  /** 1-based line number in the desired (new) manifest, when applicable. */
  newLine?: number
}

/** Additions/deletions tally for a diff. */
export interface DiffStats {
  additions: number
  deletions: number
}

/** A Kubernetes event for the events tab. */
export interface AppEvent {
  reason?: string
  message?: string
  type?: 'Normal' | 'Warning'
  count?: number
  /** Epoch **ms**. */
  firstTimestamp?: number
  /** Epoch **ms**. */
  lastTimestamp?: number
  involvedObject?: ResourceRef
}

/** A single container log line for the logs tab. */
export interface LogLine {
  content: string
  /** Epoch **ms**. */
  timestamp?: number
  podName?: string
  containerName?: string
}

/** A past deployed revision, for the rollback history. */
export interface RevisionHistory {
  id: number
  revision: string
  /** Epoch **ms**. */
  deployedAt?: number
  source?: AppSource
}
