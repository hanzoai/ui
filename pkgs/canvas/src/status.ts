/**
 * Pure status logic — the one place a free-form backend lifecycle string is
 * folded into the small `ServiceStatus` vocabulary, plus the default semantic
 * palette. No React, no DOM — unit-tested in isolation.
 */
import type { ServiceStatus, StatusPalette } from "./types"

const ACTIVE = new Set([
  "active",
  "running",
  "ready",
  "live",
  "ok",
  "succeeded",
  "success",
  "connected",
  "healthy",
  "green",
  "up",
  "online",
  "available",
])
const DEPLOYING = new Set([
  "deploying",
  "building",
  "provisioning",
  "creating",
  "updating",
  "attaching",
  "starting",
  "restarting",
  "yellow",
  "pending_deploy",
  "uploading",
  "initializing",
])
const QUEUED = new Set(["queued", "pending", "waiting", "scheduled"])
const CRASHED = new Set([
  "crashed",
  "error",
  "errored",
  "failed",
  "failure",
  "degraded",
  "down",
  "unhealthy",
  "crashloopbackoff",
  "red",
  "canceled",
  "cancelled",
])
const SLEEPING = new Set([
  "sleeping",
  "stopped",
  "idle",
  "paused",
  "scaled_to_zero",
  "asleep",
  "suspended",
  "inactive",
])
const REMOVED = new Set([
  "removed",
  "removing",
  "deleting",
  "deleted",
  "terminated",
  "superseded",
])

/**
 * Normalize any lifecycle/health string to a status tone. Exact match first,
 * then a contained-substring fallback for compound strings (e.g. `1/2 running`).
 * Empty/unknown is honest `unknown` — never guessed up to `active`.
 */
export function normalizeServiceStatus(
  raw: string | undefined | null
): ServiceStatus {
  const s = (raw ?? "").toString().toLowerCase().trim()
  if (!s) return "unknown"
  if (ACTIVE.has(s)) return "active"
  if (DEPLOYING.has(s)) return "deploying"
  if (QUEUED.has(s)) return "queued"
  if (CRASHED.has(s)) return "crashed"
  if (SLEEPING.has(s)) return "sleeping"
  if (REMOVED.has(s)) return "removed"
  if (/\b(error|fail|crash|degrad)/.test(s)) return "crashed"
  if (/\b(deploy|build|provision|creat|updat)/.test(s)) return "deploying"
  if (/\b(running|healthy|live|active|ready)/.test(s)) return "active"
  if (/\b(stop|idle|sleep|paus|suspend)/.test(s)) return "sleeping"
  if (/\b(queue|pending|wait)/.test(s)) return "queued"
  return "unknown"
}

/**
 * Default semantic status palette — tuned to read on both light and dark
 * surfaces (GitHub-family hues). Semantic, NOT brand; a consumer may override
 * per brand via the `statusPalette` prop on the components.
 */
export const DEFAULT_STATUS_PALETTE: Record<ServiceStatus, StatusPalette> = {
  active: { dot: "#3fb950", fg: "#2ea043", soft: "rgba(63,185,80,0.14)" },
  deploying: { dot: "#d29922", fg: "#bb8009", soft: "rgba(210,153,34,0.16)" },
  queued: { dot: "#539bf5", fg: "#4184e4", soft: "rgba(83,155,245,0.15)" },
  crashed: { dot: "#f85149", fg: "#e5534b", soft: "rgba(248,81,73,0.15)" },
  sleeping: { dot: "#8b949e", fg: "#768390", soft: "rgba(139,148,158,0.14)" },
  removed: { dot: "#6e7681", fg: "#6e7681", soft: "rgba(110,118,129,0.13)" },
  unknown: { dot: "#8b949e", fg: "#768390", soft: "rgba(139,148,158,0.12)" },
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  active: "Active",
  deploying: "Deploying",
  queued: "Queued",
  crashed: "Crashed",
  sleeping: "Sleeping",
  removed: "Removed",
  unknown: "Unknown",
}

export const statusLabel = (s: ServiceStatus): string => STATUS_LABEL[s]

/** Resolve a status → its palette entry, honoring an override map. */
export function statusColors(
  status: ServiceStatus,
  override?: Partial<Record<ServiceStatus, StatusPalette>>
): StatusPalette {
  return override?.[status] ?? DEFAULT_STATUS_PALETTE[status]
}

/** Whether a status should pulse (a live thing breathing / in-flight). */
export const statusPulses = (s: ServiceStatus): boolean =>
  s === "active" || s === "deploying"
