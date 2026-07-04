'use client'

/**
 * Composable dashboard primitives — the small, honest building blocks a consumer
 * mixes directly (without the full `Overview` driver): `Kpi` (an animated stat
 * tile), `Feed` (a virtualized activity stream), `Board` (a service-health board),
 * plus the shared `Panel`/`SkeletonBar`/`EmptyPanel`/`PanelSpinner` chrome.
 *
 * Every primitive is driven by direct props (data in, view out) and is honest by
 * construction: a null/absent value renders an em-dash, a <2-point series draws no
 * trend, reduced motion snaps to the end state. Style props are the @hanzo/gui v5
 * shorthand set; raw/SVG colors go through inline `style`.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Card, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Clock, TrendingDown, TrendingUp } from '@hanzogui/lucide-icons-2'

import { Sparkline } from '../charts/Charts'
import { useCountUp, useReducedMotion } from '../motion/hooks'
import { CHART_PALETTE } from '../charts/Charts'
import { ago, formatMetric, hasTrend, healthColor, healthTally, statusColor, windowRows, worstHealth, OK, MUTED } from './logic'
import type { MetricUnit, OverviewEvent, OverviewHealth } from './config'
import type { IconComponent } from '../types'

const UP = '#23c562'
const DOWN = '#ff5d8f'

// ── Kpi (count-up stat tile + optional live sparkline + delta) ───────────────

export interface KpiProps {
  label: string
  /** The value; `null`/`undefined` → an honest em-dash (backend doesn't report it). */
  value: number | null | undefined
  unit?: MetricUnit
  /** Signed ±% vs the prior window; `null`/`undefined` → honest "— vs prior". */
  deltaPct?: number | null
  /** A recent dense series for the sparkline (≥2 finite points, else omitted). */
  series?: number[]
  icon?: IconComponent
  /** Sparkline accent (defaults to the palette head). */
  color?: string
  /** A small caption under the value. */
  caption?: string
  /** Count the value up on change (respects reduced motion). Default true. */
  animate?: boolean
  /** Show the loading skeleton for the value + delta. */
  loading?: boolean
}

/** An animated KPI / stat tile — the canonical dashboard number. */
export function Kpi({ label, value, unit, deltaPct, series, icon: Icon, color, caption, animate = true, loading = false }: KpiProps) {
  const reduced = useReducedMotion()
  const finite = value != null && Number.isFinite(value)
  const target = finite ? (value as number) : 0
  const shown = useCountUp(target, animate && !reduced && finite)
  const accent = color ?? CHART_PALETTE[0]

  return (
    // Responsive KPI columns so a 4-card row balances instead of wrapping 3+1: one
    // column on phones, two from md, four from xl. flexGrow equalizes the widths.
    <Card
      borderWidth={1}
      borderColor="$borderColor"
      p="$4"
      gap="$2"
      flexGrow={1}
      flexShrink={1}
      flexBasis="100%"
      $md={{ flexBasis: '48%' }}
      $xl={{ flexBasis: '22%' }}
      minW={200}
    >
      <XStack items="center" gap="$2">
        {Icon ? <Icon size={15} opacity={0.7} /> : null}
        <Text fontSize="$2" color="$color10" numberOfLines={1}>
          {label}
        </Text>
      </XStack>

      {loading && !finite ? (
        <SkeletonBar w={110} h={34} />
      ) : (
        <Text fontSize="$9" fontWeight="500" color={finite ? '$color12' : '$color10'} numberOfLines={1} className="hz-tnum">
          {finite ? formatMetric(shown, unit) : '—'}
        </Text>
      )}

      <XStack justify="space-between" items="flex-end" gap="$2">
        <YStack gap="$1">
          {caption ? (
            <Text fontSize="$1" color="$color10" numberOfLines={1}>
              {caption}
            </Text>
          ) : null}
          <DeltaPill pct={deltaPct ?? null} loading={loading && !finite} />
        </YStack>
        {hasTrend(series) ? <Sparkline values={series!} color={accent} /> : null}
      </XStack>
    </Card>
  )
}

function DeltaPill({ pct, loading }: { pct: number | null; loading: boolean }) {
  if (loading) return <SkeletonBar w={80} h={12} />
  if (pct == null || !Number.isFinite(pct)) {
    return (
      <Text fontSize="$1" color="$color10">
        — vs prior
      </Text>
    )
  }
  const up = pct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  const color = up ? UP : DOWN
  return (
    <XStack items="center" gap="$1">
      <Icon size={12} color={color} />
      <Text fontSize="$1" fontWeight="700" style={{ color }}>
        {`${up ? '+' : ''}${Math.round(pct)}%`}
      </Text>
      <Text fontSize="$1" color="$color10">
        vs prior
      </Text>
    </XStack>
  )
}

// ── Feed (virtualized live activity stream) ──────────────────────────────────

const ROW_H = 52
const VIEWPORT_H = 360

export interface FeedProps {
  items: OverviewEvent[]
  title?: string
  empty?: string
  loading?: boolean
}

/** A live activity stream — newest rows on top, virtualized past a viewport. */
export function Feed({ items, title = 'Live activity', empty = 'No activity in this range yet.', loading = false }: FeedProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const nowRef = useRef(Date.now())
  nowRef.current = Date.now()
  const rows = items ?? []
  // Virtualize only when the stream is long; small feeds render whole (no scroll jank).
  const virtualize = rows.length > Math.ceil(VIEWPORT_H / ROW_H)
  const win = useMemo(() => windowRows(rows, scrollTop, ROW_H, VIEWPORT_H), [rows, scrollTop])

  return (
    <Panel title={title} right={<LiveDot on={!loading && rows.length > 0} />}>
      {loading && rows.length === 0 ? (
        <YStack gap="$2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBar key={i} w="100%" h={ROW_H - 12} />
          ))}
        </YStack>
      ) : rows.length === 0 ? (
        <EmptyPanel note={empty} />
      ) : virtualize ? (
        <div style={{ height: VIEWPORT_H, overflowY: 'auto' }} onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}>
          <div style={{ height: win.padTop }} />
          {win.slice.map((e) => (
            <FeedRow key={e.id || `${e.time}-${e.title}`} title={e.title} subtitle={e.subtitle} status={e.status} when={ago(e.time, nowRef.current)} />
          ))}
          <div style={{ height: win.padBottom }} />
        </div>
      ) : (
        <YStack>
          {rows.map((e) => (
            <FeedRow key={e.id || `${e.time}-${e.title}`} title={e.title} subtitle={e.subtitle} status={e.status} when={ago(e.time, nowRef.current)} />
          ))}
        </YStack>
      )}
    </Panel>
  )
}

function FeedRow({ title, subtitle, status, when }: { title: string; subtitle?: string; status: string; when: string }) {
  return (
    <XStack items="center" gap="$3" py="$2.5" borderBottomWidth={1} borderColor="$borderColor" style={{ height: ROW_H }}>
      <YStack width={8} height={8} rounded="$10" style={{ backgroundColor: statusColor(status) }} />
      <YStack flex={1}>
        <Text fontSize="$3" color="$color12" numberOfLines={1}>
          {title || 'Event'}
        </Text>
        {subtitle ? (
          <Text fontSize="$1" color="$color10" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      <XStack items="center" gap="$1.5">
        <Clock size={12} opacity={0.6} />
        <Text fontSize="$2" color="$color11">
          {when}
        </Text>
      </XStack>
    </XStack>
  )
}

// ── Board (service-health board) ─────────────────────────────────────────────

export interface BoardProps {
  items: OverviewHealth[]
  title?: string
  empty?: string
  loading?: boolean
}

/** A service-health board — a healthy/total header + per-service dots. */
export function Board({ items, title = 'System health', empty = 'Health is reported once the control plane is reachable.', loading = false }: BoardProps) {
  const rows = items ?? []
  const worst = worstHealth(rows)
  const { healthy, total } = healthTally(rows)
  const headColor = worst === 'red' ? DOWN : worst === 'yellow' ? '#f0a868' : worst === 'green' ? OK : MUTED

  return (
    <Panel
      title={title}
      right={
        total > 0 ? (
          <XStack items="center" gap="$2">
            <YStack width={9} height={9} rounded="$10" style={{ backgroundColor: headColor }} />
            <Text fontSize="$2" color="$color10">
              {healthy}/{total} healthy
            </Text>
          </XStack>
        ) : undefined
      }
    >
      {loading && rows.length === 0 ? (
        <SkeletonBar w="100%" h={40} />
      ) : rows.length === 0 ? (
        <EmptyPanel note={empty} />
      ) : (
        <XStack flexWrap="wrap" gap="$2">
          {rows.map((r) => (
            <XStack key={r.service} items="center" gap="$2" bg="$color2" px="$2.5" py="$1.5" rounded="$10" borderWidth={1} borderColor="$borderColor">
              <YStack width={8} height={8} rounded="$10" style={{ backgroundColor: healthColor(r.health) }} />
              <Text fontSize="$2" color="$color11" numberOfLines={1}>
                {r.service}
              </Text>
            </XStack>
          ))}
        </XStack>
      )}
    </Panel>
  )
}

// ── shared chrome ────────────────────────────────────────────────────────────

/** A titled panel shell — the ONE section container across the dashboard. */
export function Panel({ title, right, children, minW = 320, flex }: { title: string; right?: ReactNode; children: ReactNode; minW?: number; flex?: number }) {
  return (
    <Card borderWidth={1} borderColor="$borderColor" p="$4" gap="$3" flex={flex} minW={minW}>
      <XStack items="center" justify="space-between" gap="$2">
        <Text fontSize="$4" fontWeight="500" color="$color12">
          {title}
        </Text>
        {right}
      </XStack>
      {children}
    </Card>
  )
}

/** A pulsing "live" indicator (steady dot under reduced motion). */
export function LiveDot({ on }: { on: boolean }) {
  const reduced = useReducedMotion()
  if (!on) return null
  return (
    <XStack items="center" gap="$1.5">
      <YStack width={7} height={7} rounded="$10" style={{ backgroundColor: OK, animation: reduced ? undefined : 'hz-pulse 1.6s ease-in-out infinite' }} />
      <Text fontSize="$1" color="$color10">
        Live
      </Text>
    </XStack>
  )
}

/** A shimmer skeleton block (honest "loading", not fabricated content). */
export function SkeletonBar({ w, h, rounded }: { w: number | string; h: number; rounded?: boolean }) {
  return <div className="hz-skeleton" style={{ width: w, height: h, borderRadius: rounded ? '50%' : 8 }} aria-hidden />
}

/** An honest empty-state note inside a panel. */
export function EmptyPanel({ note }: { note: string }) {
  return (
    <YStack p="$5" items="center" gap="$1">
      <Text fontSize="$3" color="$color11">
        {note}
      </Text>
    </YStack>
  )
}

/** A loading spinner centered in a panel (used by the driver's first paint). */
export function PanelSpinner() {
  return (
    <XStack p="$6" justify="center">
      <Spinner size="large" color="$color11" />
    </XStack>
  )
}
