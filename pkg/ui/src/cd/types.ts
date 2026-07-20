/**
 * @hanzo/ui/cd — the Hanzo CD (continuous-delivery) data contract.
 *
 * This is the FE↔BE handshake for the `/v1/gitops` API. Every component in this
 * module is presentational and data-prop-driven: a host console fetches these
 * rows (via the injected `GitopsClient`) and hands them to the views. The shapes
 * live in ONE place so the pure folds (status → tone, tree → graph, diff → hunks)
 * are unit-tested in isolation and the visual components never reach into a data
 * layer.
 *
 * The vocabulary mirrors a GitOps engine's model (health/sync verdicts, the
 * owner-reference resource graph, operation phases) so a backend that projects a
 * cluster's live state maps onto it directly, but the names are engine-neutral.
 *
 * Attribution: the information design of these views is a derivative port of the
 * Argo CD web UI (Apache-2.0). See ./NOTICE.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Status vocabularies — small, glanceable, closed unions.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * A resource/application health verdict. `Unknown` is honest — a missing signal
 * is never guessed up to `Healthy`.
 */
export type HealthStatus =
  | 'Healthy'
  | 'Progressing'
  | 'Degraded'
  | 'Suspended'
  | 'Missing'
  | 'Unknown'

/** Whether live state matches the desired (Git) state. */
export type SyncStatus = 'Synced' | 'OutOfSync' | 'Unknown'

/** The phase of an in-flight sync/rollback operation. */
export type OperationPhase =
  | 'Running'
  | 'Terminating'
  | 'Failed'
  | 'Error'
  | 'Succeeded'
  | 'Pending'

/** A pod's lifecycle phase (drives the pod-status dot). */
export type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown'

/** Per-resource result code within a sync operation. */
export type SyncResultCode = 'Synced' | 'Pruned' | 'SyncFailed' | 'Unknown'

// ──────────────────────────────────────────────────────────────────────────────
// Resource graph — the owner-reference tree of live cluster objects.
// ──────────────────────────────────────────────────────────────────────────────

/** A group/version/kind/namespace/name coordinate for a cluster object. */
export interface ResourceRef {
  /** Stable unique id (k8s uid, or a synthesized `group/kind/ns/name`). */
  uid: string
  group: string
  version: string
  kind: string
  namespace: string
  name: string
}

/** A labelled datum shown as a chip on a node / in the summary (e.g. `Revision: 3`). */
export interface InfoItem {
  name: string
  value: string
}

/** Ingress/service surface of a networked resource (Service, Ingress). */
export interface ResourceNetworking {
  /** Objects this resource routes to (Service → Pods, Ingress → Service). */
  targetRefs?: ResourceRef[]
  labels?: Record<string, string>
  /** Externally reachable URLs (a domain's live site). */
  externalURLs?: string[]
  ingress?: { hostname?: string; ip?: string }[]
}

/**
 * One node of the live resource graph. Ownership is expressed by `parentRefs`
 * (an object may have several owners); the graph is the transitive closure of
 * those edges rooted at the application. Pure data — no React, no back-refs.
 */
export interface ResourceNode extends ResourceRef {
  /** The object(s) that own this one — the edges of the graph. */
  parentRefs?: ResourceRef[]
  /** Health verdict for this object, when the engine computes one. */
  health?: { status: HealthStatus; message?: string }
  /** Sync verdict for this object (managed objects only). */
  status?: SyncStatus
  /** Glanceable facts shown as chips (revision, replicas, image tag, …). */
  info?: InfoItem[]
  networkingInfo?: ResourceNetworking
  images?: string[]
  createdAt?: string
  /** True for hook/sync-operation objects; `resourceVersion` for freshness. */
  hook?: boolean
  resourceVersion?: string
  /** Present on Pod nodes — drives pod-specific rendering. */
  podInfo?: PodInfo
}

/** Extra facts a Pod node carries (containers, phase, restarts, node/host). */
export interface PodInfo {
  phase: PodPhase
  /** Reason string when the phase alone is ambiguous (CrashLoopBackOff, …). */
  reason?: string
  ready?: string // e.g. "2/3"
  restarts?: number
  node?: string
  age?: string
}

/**
 * The full resource graph for an application: the managed nodes plus any
 * orphaned objects (live in the app's namespace but not owned by it).
 */
export interface ResourceTree {
  nodes: ResourceNode[]
  orphanedNodes?: ResourceNode[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Application — the deployable unit the list shows and the detail drills into.
// ──────────────────────────────────────────────────────────────────────────────

/** Where an application's desired state comes from (a Git repo path @ revision). */
export interface AppSource {
  repoURL: string
  path?: string
  targetRevision?: string
  chart?: string
}

/** The destination cluster + namespace an application deploys to. */
export interface AppDestination {
  server?: string
  name?: string
  namespace: string
}

/** Revision metadata resolved from the source repo (for the status panel). */
export interface RevisionMetadata {
  revision: string
  author?: string
  date?: string
  message?: string
  tags?: string[]
}

/**
 * A summary of one application — the shape the list/tiles render. Enough to draw
 * a row without fetching the tree.
 */
export interface AppSummary {
  name: string
  namespace?: string
  project?: string
  health: HealthStatus
  sync: SyncStatus
  /** Short revision (sha/tag) currently reconciled. */
  revision?: string
  source?: AppSource
  destination?: AppDestination
  /** Epoch ms of the last successful sync (rendered relative). */
  lastSyncedAt?: number
  /** Phase of an in-flight operation, when one is running. */
  operationPhase?: OperationPhase
  /** Rollup counts of managed resources by health, for the tile mini-bar. */
  resourceCounts?: Partial<Record<HealthStatus, number>>
  labels?: Record<string, string>
}

/** A single sync/deploy in the history (for the rollback list). */
export interface DeployRevision {
  /** Monotonic history id — the handle passed to `rollback`. */
  id: number
  revision: string
  deployedAt?: number
  source?: AppSource
  metadata?: RevisionMetadata
}

/** The result of (or progress of) the most recent sync/rollback operation. */
export interface OperationState {
  phase: OperationPhase
  message?: string
  startedAt?: number
  finishedAt?: number
  /** The revision the operation targeted. */
  revision?: string
  /** Per-resource results (kind/name → code + message). */
  syncResult?: {
    ref: ResourceRef
    result: SyncResultCode
    message?: string
    hookPhase?: string
  }[]
}

/**
 * The full application detail — everything the status panel + controls need
 * beyond the tree. Returned by `getApp`.
 */
export interface AppDetail extends AppSummary {
  /** Resolved metadata for the reconciled revision. */
  revisionMetadata?: RevisionMetadata
  /** Deploy/rollout history, newest last (matches engine ordering). */
  history?: DeployRevision[]
  /** In-flight or last-completed operation. */
  operationState?: OperationState
  /** Free-form conditions/warnings surfaced by the engine. */
  conditions?: { type: string; message: string; lastTransitionTime?: string }[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Node detail — manifest + events + logs for the drawer.
// ──────────────────────────────────────────────────────────────────────────────

/** A k8s-style event row shown in the node drawer's Events tab. */
export interface ResourceEvent {
  reason: string
  message: string
  type?: 'Normal' | 'Warning'
  count?: number
  firstSeen?: string
  lastSeen?: string
  source?: string
}

/** One log line (optionally tagged with its container + a parsed timestamp). */
export interface LogEntry {
  content: string
  timestamp?: string
  container?: string
  /** True for stderr — rendered in the warn tone. */
  err?: boolean
}

/**
 * Everything the node drawer needs for a single resource: the live manifest
 * (YAML), recent events, a recent-logs snapshot (pods), and the desired/live
 * pair for the inline diff. Returned by `getResource`.
 */
export interface ResourceDetail {
  ref: ResourceRef
  health?: { status: HealthStatus; message?: string }
  syncStatus?: SyncStatus
  /** Live manifest as YAML (or JSON) text. */
  liveManifest?: string
  /** Desired manifest as YAML text — enables the drawer's inline diff. */
  desiredManifest?: string
  events?: ResourceEvent[]
  /** Recent log lines for a pod/container (a snapshot; streaming is optional). */
  logs?: LogEntry[]
  /** Container names, when the resource is a Pod (drives the log selector). */
  containers?: string[]
  info?: InfoItem[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Diff — desired vs live for the whole application.
// ──────────────────────────────────────────────────────────────────────────────

/** One resource's desired/live manifest pair for the application diff view. */
export interface ResourceDiff {
  ref: ResourceRef
  /** Sync verdict for this resource (drives the section pill). */
  status?: SyncStatus
  desired?: string
  live?: string
  /** True when the resource is unmanaged/hook (rendered muted). */
  hook?: boolean
}

/** The full application diff payload. Returned by `getDiff`. */
export interface AppDiff {
  items: ResourceDiff[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Mutations — sync + rollback request bodies.
// ──────────────────────────────────────────────────────────────────────────────

/** Body for `POST /v1/gitops/{name}/sync`. */
export interface SyncRequest {
  /** Target revision; omit to sync to the source's configured revision. */
  revision?: string
  /** Prune resources that no longer exist in the desired state. */
  prune?: boolean
  /** Server-side dry-run (compute the plan without applying). */
  dryRun?: boolean
  /** Restrict the sync to specific resources (default: all). */
  resources?: ResourceRef[]
}

/** Body for `POST /v1/gitops/{name}/rollback`. */
export interface RollbackRequest {
  /** The history id (from `DeployRevision.id`) to roll back to. */
  id: number
  prune?: boolean
  dryRun?: boolean
}

/** The response to a sync/rollback — the operation the engine kicked off. */
export interface OperationResponse {
  operationState: OperationState
}

/** The apps-list response: `GET /v1/gitops`. */
export interface AppListResponse {
  items: AppSummary[]
}
