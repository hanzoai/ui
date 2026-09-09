'use client'

/**
 * Inline SVG glyphs — zero icon dependency. Two families:
 *   • health / sync status marks, mirroring Argo CD's icon semantics (heart,
 *     broken heart, ghost, pause, spinner, check-circle, arrow-up-circle,
 *     question), tinted from the resolved status palette; and
 *   • resource-kind icons, keyed by a small category map (workload, network,
 *     config, storage, security, app, namespace) with a generic fallback.
 */
import type { ReactNode } from 'react'

import { healthColors, healthSpins } from './health'
import { syncColors, syncSpins } from './sync'
import type { HealthStatus, StatusPalette, SyncStatus } from './types'

function Svg({
  size = 16,
  fill = 'none',
  spin,
  color,
  children,
}: {
  size?: number
  fill?: string
  spin?: boolean
  color?: string
  children: ReactNode
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={fill === 'none' ? 'currentColor' : 'none'}
      strokeWidth={fill === 'none' ? 2 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spin ? 'hz-gitops-spin' : undefined}
      style={{ color, display: 'inline-block', flexShrink: 0 }}
      aria-hidden
    >
      {children}
    </svg>
  )
}

// ── Health marks ────────────────────────────────────────────────────────────

const HEART = <path d="M12 20.5 3.8 12.3a5 5 0 0 1 7.1-7l1.1 1 1.1-1a5 5 0 0 1 7.1 7Z" />
const BROKEN_HEART = (
  <path d="M12 20.5 3.8 12.3a5 5 0 0 1 7.1-7l1.1 1 1.1-1a5 5 0 0 1 7.1 7ZM12 5l-2 5 3 3-2 4" />
)
const GHOST = (
  <path d="M5 21v-9a7 7 0 0 1 14 0v9l-2.3-1.6L14.3 21 12 19.4 9.7 21l-2.4-1.6ZM9.5 10h.01M14.5 10h.01" />
)
const PAUSE_CIRCLE = <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10 9v6M14 9v6" />
const SPINNER = <path d="M21 12a9 9 0 1 1-6.2-8.6" />
const QUESTION = (
  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
)

const HEALTH_GLYPH: Record<HealthStatus, ReactNode> = {
  Healthy: HEART,
  Degraded: BROKEN_HEART,
  Missing: GHOST,
  Suspended: PAUSE_CIRCLE,
  Progressing: SPINNER,
  Unknown: QUESTION,
}

export function HealthMark({
  status,
  size = 16,
  palette,
}: {
  status: HealthStatus
  size?: number
  palette?: Partial<Record<HealthStatus, StatusPalette>>
}) {
  const c = healthColors(status, palette)
  const filled = status === 'Healthy' || status === 'Degraded' || status === 'Missing'
  return (
    <Svg size={size} color={c.dot} fill={filled ? c.dot : 'none'} spin={healthSpins(status)}>
      {HEALTH_GLYPH[status]}
    </Svg>
  )
}

// ── Sync marks ──────────────────────────────────────────────────────────────

const CHECK_CIRCLE = <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12l2.5 2.5 4.5-5" />
const ARROW_UP_CIRCLE = <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16V9M8.5 12.5 12 9l3.5 3.5" />

const SYNC_GLYPH: Record<SyncStatus, ReactNode> = {
  Synced: CHECK_CIRCLE,
  OutOfSync: ARROW_UP_CIRCLE,
  Unknown: SPINNER,
}

export function SyncMark({
  status,
  size = 16,
  palette,
}: {
  status: SyncStatus
  size?: number
  palette?: Partial<Record<SyncStatus, StatusPalette>>
}) {
  const c = syncColors(status, palette)
  return (
    <Svg size={size} color={c.dot} spin={syncSpins(status)}>
      {SYNC_GLYPH[status]}
    </Svg>
  )
}

// ── Resource-kind glyphs ──────────────────────────────────────────────────────

type KindCategory =
  | 'app'
  | 'workload'
  | 'pod'
  | 'network'
  | 'config'
  | 'storage'
  | 'security'
  | 'namespace'
  | 'generic'

const KIND_CATEGORY: Record<string, KindCategory> = {
  application: 'app',
  applicationset: 'app',
  rollout: 'app',
  deployment: 'workload',
  statefulset: 'workload',
  daemonset: 'workload',
  replicaset: 'workload',
  replicationcontroller: 'workload',
  job: 'workload',
  cronjob: 'workload',
  pod: 'pod',
  service: 'network',
  ingress: 'network',
  endpoints: 'network',
  endpointslice: 'network',
  networkpolicy: 'network',
  route: 'network',
  gateway: 'network',
  httproute: 'network',
  configmap: 'config',
  secret: 'config',
  persistentvolume: 'storage',
  persistentvolumeclaim: 'storage',
  storageclass: 'storage',
  volumesnapshot: 'storage',
  serviceaccount: 'security',
  role: 'security',
  rolebinding: 'security',
  clusterrole: 'security',
  clusterrolebinding: 'security',
  certificate: 'security',
  issuer: 'security',
  clusterissuer: 'security',
  namespace: 'namespace',
}

const CATEGORY_GLYPH: Record<KindCategory, ReactNode> = {
  app: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9Z" />,
  workload: <path d="M4 8l8-4 8 4-8 4Zm0 4 8 4 8-4M4 16l8 4 8-4" />,
  pod: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9ZM12 12l8-4.5M12 12v9M12 12 4 7.5" />,
  network: <path d="M12 5a2.5 2.5 0 1 0 0-.01ZM5 19a2.5 2.5 0 1 0 0-.01ZM19 19a2.5 2.5 0 1 0 0-.01ZM12 7.5v4M12 11.5 6.5 17M12 11.5 17.5 17" />,
  config: <path d="M5 4h11l3 3v13H5ZM15 4v4h4M8 12h8M8 16h5" />,
  storage: <path d="M4 6c0-1.5 3.6-2.5 8-2.5S20 4.5 20 6s-3.6 2.5-8 2.5S4 7.5 4 6ZM4 6v12c0 1.5 3.6 2.5 8 2.5s8-1 8-2.5V6M4 12c0 1.5 3.6 2.5 8 2.5s8-1 8-2.5" />,
  security: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6ZM9.5 12l2 2 3.5-4" />,
  namespace: <path d="M4 5h16v14H4ZM4 9h16M8 5v4" />,
  generic: <path d="M5 5h14v14H5Z" />,
}

/** The glyph node for a Kubernetes resource kind (category-mapped, stroked). */
export function ResourceKindGlyph({ kind, size = 16 }: { kind: string; size?: number }) {
  const cat = KIND_CATEGORY[kind.toLowerCase()] ?? 'generic'
  return <Svg size={size}>{CATEGORY_GLYPH[cat]}</Svg>
}

/** Small chevron used by the tree's collapse toggle. */
export function Chevron({ open, size = 11 }: { open: boolean; size?: number }) {
  return <Svg size={size}>{open ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}</Svg>
}
