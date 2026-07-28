/**
 * The CD data adapter — maps cloud's `/v1/deploy` DTOs INTO the shared view-models
 * of `@hanzo/cd` (GitopsApplication / ResourceTree / ManagedResource / LogLine
 * / RevisionHistory). Reuses each package's OWN pure folds (foldHealth/foldSync) so
 * status vocabulary is one way. No React, no I/O — unit-testable.
 *
 * Contract (cloud clients/deploy):
 *   applications: [{name,namespace,env,role,repository,version,runningVersion,
 *                  health,healthMessage,sync,phase,endpoints}]
 *   {name}/tree:  {application, nodes:[{group,version,kind,namespace,name,ref,uid,
 *                  createdAt,health,healthMessage,sync,version,parentRefs:[{…,ref}]}]}
 *   {name}/resource/{ref}: {ref, health, healthMessage, liveManifest:{…},
 *                  desiredSource, diff:{modified,desiredManifest:{…}}}
 *   {name}/logs:  {application, pod, container, logs:"…", note?}
 */
import {
  foldHealth,
  foldSync,
  type AppTreeNode,
  type GitopsApplication,
  type LogLine,
  type ManagedResource,
  type ResourceRef,
  type ResourceTree,
  type RevisionHistory,
} from "@hanzo/cd"

// ── optional-safe helpers (snake_case + camelCase tolerant) ──────────────────

const str = (v: unknown): string => (typeof v === "string" ? v : "")
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {}
const pick = (r: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const k of keys) if (r[k] !== undefined && r[k] !== null) return r[k]
  return undefined
}
const strList = (v: unknown): string[] => arr(v).map(str).filter(Boolean)
const epochMs = (v: unknown): number | undefined => {
  const s = str(v)
  if (!s) return undefined
  const t = Date.parse(s)
  return Number.isNaN(t) ? undefined : t
}

// The cloud wire uses hyphenated verdicts (`out-of-sync`); @hanzo/cd's folds
// strip whitespace but not hyphens, so normalize `[-_]` out before folding.
const fHealth = (raw: string) => foldHealth(raw.replace(/[-_]/g, ""))
const fSync = (raw: string) => foldSync(raw.replace(/[-_]/g, ""))

/** A manifest object → pretty JSON text; a string verbatim; else ''. */
export function manifestText(v: unknown): string {
  if (typeof v === "string") return v
  if (v && typeof v === "object") {
    try {
      return JSON.stringify(v, null, 2)
    } catch {
      return ""
    }
  }
  return ""
}

/** repo basename of an image repository: `ghcr.io/hanzoai/iam` → `iam`. */
export function repoBaseName(repository: string): string {
  const s = (repository || "").trim().replace(/:.*/, "")
  return (s.split("/").filter(Boolean).pop() ?? "").toLowerCase()
}

// ── Application ──────────────────────────────────────────────────────────────

export interface DeployApp {
  name: string
  namespace: string
  env: string
  role: string
  repository: string
  version: string
  runningVersion: string
  health: string
  healthMessage: string
  sync: string
  phase: string
  endpoints: string[]
  /** Prior release tags the plane records (forward-compat rollback source); [] today. */
  revisions: string[]
}

/** Normalize a raw /v1/deploy application row to a stable internal shape. */
/**
 * Normalize one application from EITHER wire shape:
 *
 *  - argoproj (what `/v1/deploy/applications` actually serves): the projection
 *    nests everything — `metadata.{name,namespace,labels}`, `spec.source.*`,
 *    `spec.project`, `status.{sync,health}.status`, `status.summary.images[]`.
 *  - flat native: `{name,namespace,env,repository,version,health,sync,…}`.
 *
 * Both are read here so the app binds regardless of which the plane returns —
 * flat keys win when present, then the nested argo fields fill in.
 */
export function normalizeDeployApp(raw: unknown): DeployApp {
  const r = rec(raw)
  const meta = rec(pick(r, "metadata"))
  const spec = rec(pick(r, "spec"))
  const status = rec(pick(r, "status"))
  const source = rec(pick(spec, "source"))
  const dest = rec(pick(spec, "destination"))
  const sync = rec(pick(status, "sync"))
  const health = rec(pick(status, "health"))
  const labels = rec(pick(meta, "labels"))
  const summary = rec(pick(status, "summary"))
  // `status.summary.images: ["ghcr.io/hanzoai/x:v1.2.3"]` → repository + tag.
  const image = strList(pick(summary, "images"))[0] ?? ""
  const cut = image.lastIndexOf(":")
  const imageRepo = cut > 0 ? image.slice(0, cut) : image
  const imageTag = cut > 0 ? image.slice(cut + 1) : ""

  return {
    name: str(pick(r, "name")) || str(pick(meta, "name")),
    namespace:
      str(pick(r, "namespace", "ns")) || str(pick(meta, "namespace")) || str(pick(dest, "namespace")) || "hanzo",
    env: str(pick(r, "env", "environment")) || str(pick(labels, "hanzo.ai/env")) || str(pick(source, "targetRevision")),
    role: str(pick(r, "role")),
    // Prefer the deployed image repository; fall back to the manifest repo URL.
    repository: str(pick(r, "repository", "repo")) || imageRepo || str(pick(source, "repoURL")),
    version: str(pick(r, "version", "tag")) || str(pick(sync, "revision")) || imageTag,
    runningVersion: str(pick(r, "runningVersion", "running_version")) || imageTag,
    health: str(pick(r, "health")) || str(pick(health, "status")),
    healthMessage:
      str(pick(r, "healthMessage", "health_message", "message")) || str(pick(health, "message")),
    sync: str(pick(r, "sync", "syncStatus", "sync_status")) || str(pick(sync, "status")),
    phase: str(pick(r, "phase")) || str(pick(health, "status")),
    endpoints: strList(pick(r, "endpoints", "urls")),
    revisions: strList(pick(r, "revisions", "history", "tags")),
  }
}

/** Parse the applications list payload (array or {applications|apps|items}). */
export function parseApplications(data: unknown): DeployApp[] {
  const rows = Array.isArray(data) ? data : arr(pick(rec(data), "applications", "apps", "items", "services"))
  return rows.map(normalizeDeployApp).filter((a) => a.name)
}

/** Fold a normalized app into the @hanzo/cd application view-model. */
export function toGitopsApp(a: DeployApp): GitopsApplication {
  return {
    name: a.name,
    namespace: a.namespace,
    project: a.env || undefined,
    health: fHealth(a.health),
    // desired (declared version) vs live (runningVersion): equal ⇒ Synced.
    sync: a.sync ? fSync(a.sync) : fSync(a.version === a.runningVersion ? "synced" : "outofsync"),
    revision: a.version || undefined,
    source: a.repository ? { repoURL: a.repository } : undefined,
    message: a.healthMessage || undefined,
  }
}

// ── tree → ResourceTree (AppTreeNode with linking parentRefs) ────────────────

/** Map a /v1/deploy ResourceRef DTO (carrying its `ref` token) to a linking ref.
 *  The `ref` token is the stable id shared by a node and its children's
 *  parentRefs, so it drives resourceId() — the tree links on it. */
function toRef(raw: unknown): ResourceRef {
  const r = rec(raw)
  const token = str(pick(r, "ref"))
  return {
    uid: token || str(pick(r, "uid")),
    group: str(pick(r, "group")),
    version: str(pick(r, "version")),
    kind: str(pick(r, "kind")),
    namespace: str(pick(r, "namespace", "ns")),
    name: str(pick(r, "name")),
  }
}

function toTreeNode(raw: unknown): AppTreeNode {
  const r = rec(raw)
  const self = toRef(r)
  const version = str(pick(r, "version"))
  return {
    ...self,
    parentRefs: arr(pick(r, "parentRefs", "parent_refs")).map(toRef),
    health: { status: fHealth(str(pick(r, "health"))), message: str(pick(r, "healthMessage")) || undefined },
    sync: pick(r, "sync") ? fSync(str(pick(r, "sync"))) : undefined,
    images: version ? [version] : [],
    createdAt: epochMs(pick(r, "createdAt", "created_at", "creationTimestamp")),
  }
}

export function toResourceTree(raw: unknown): ResourceTree {
  const r = rec(raw)
  const nodes = arr(pick(r, "nodes", "resources"))
    .map(toTreeNode)
    .filter((n) => n.name && n.kind)
    // Defense-in-depth: never render a Secret node (its live manifest carries
    // base64 data). Cloud already excludes Secrets from the tree; drop any that
    // slip through so the client never surfaces one.
    .filter((n) => n.kind !== "Secret")
  return { nodes }
}

// ── resource → ManagedResource (live + desired for the node drawer/diff) ─────

export function toManagedResource(raw: unknown): ManagedResource {
  const r = rec(raw)
  const refField = pick(r, "ref")
  const self: ResourceRef =
    typeof refField === "string"
      ? { uid: refField, group: "", version: "", kind: "", namespace: "", name: "" }
      : toRef(refField)
  const diffObj = rec(pick(r, "diff"))
  const desired = pick(r, "desiredManifest", "desired") ?? pick(diffObj, "desiredManifest", "desired")
  return {
    ...self,
    liveState: manifestText(pick(r, "liveManifest", "live_manifest", "live", "manifest")),
    targetState: manifestText(desired),
  }
}

// ── logs (blob OR array) → LogLine[], bounded ────────────────────────────────

// Client-side caps so one giant log payload can't bloat the DOM even if the
// server's `?tail` is absent or ignored: keep the last MAX_LOG_LINES, and clamp
// any single line (a newline-free megabyte otherwise renders as one huge node).
const MAX_LOG_LINES = 2000
const MAX_LOG_LINE = 4000

export function toLogLines(raw: unknown): LogLine[] {
  const r = rec(raw)
  const pod = str(pick(r, "pod")) || undefined
  // Tolerate both shapes: a newline blob (`logs:"…"`) and a line array
  // (`logs:[…]` / `lines:[…]`), which the blob-only path silently dropped to [].
  const listed = arr(pick(r, "logs", "lines", "log", "output"))
  const lines = listed.length
    ? listed.map(str)
    : str(pick(r, "logs", "log", "output")).split("\n")
  const kept = lines.filter((l) => l.length > 0).slice(-MAX_LOG_LINES)
  return kept.map((l) => ({ content: l.length > MAX_LOG_LINE ? l.slice(0, MAX_LOG_LINE) + "…" : l, podName: pod }))
}

// ── git tags → RevisionHistory[] (rollback targets; cloud takes a clean semver) ─

const SEMVER = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
export const isReleaseTag = (t: string): boolean => SEMVER.test(t.trim())

/** Build rollback history from an app's real git tags (clean semver, newest first,
 *  current excluded). `revision` carries the tag cloud's rollback endpoint accepts. */
export function toRollbackHistory(currentTag: string, tags: string[]): RevisionHistory[] {
  const seen = new Set<string>([currentTag.trim()])
  const clean: string[] = []
  for (const raw of tags) {
    const t = raw.trim()
    if (!t || seen.has(t) || !isReleaseTag(t)) continue
    seen.add(t)
    clean.push(t)
  }
  clean.sort(compareSemverDesc)
  return clean.map((revision, i) => ({ id: clean.length - i, revision }))
}

export function compareSemverDesc(a: string, b: string): number {
  const pa = semverParts(a)
  const pb = semverParts(b)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i]
  return b.localeCompare(a)
}
function semverParts(tag: string): [number, number, number] {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(tag.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [-1, -1, -1]
}
