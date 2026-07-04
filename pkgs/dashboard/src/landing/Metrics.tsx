'use client'

/**
 * Metrics — the live KPI row for a landing. Count-up values + real sparklines +
 * honest deltas, reusing the motion system (`useCountUp`/`usePoll`/
 * `useReducedMotion`) and the shared `Sparkline`. Two modes:
 *  - controlled: the parent passes `config.metrics` (it owns the data / reload);
 *  - self-loading: `config.loadMetrics` (+ optional `pollMs`) fetches + polls here.
 * Honest throughout: a null value renders "—", a background poll failure keeps the
 * last real data, and a first-load failure shows a quiet note (metrics are
 * supplementary — never a full error card).
 */
import { useEffect, useRef, useState } from 'react'
import { Card, Text, XStack, YStack } from '@hanzo/gui'

import { CHART_PALETTE, Sparkline } from '../charts/Charts'
import { useCountUp, usePoll, useReducedMotion } from '../motion/hooks'
import { DeltaChip } from './parts'
import type { LandingConfig, LandingMetric } from './types'

export function Metrics({ config }: { config: LandingConfig }) {
  const reduced = useReducedMotion()
  const controlled = config.metrics !== undefined
  const load = config.loadMetrics
  const accent = config.accent ?? CHART_PALETTE[0]

  const [metrics, setMetrics] = useState<LandingMetric[] | null>(config.metrics ?? null)
  const [failed, setFailed] = useState(false)
  const hasData = useRef(false)
  hasData.current = metrics !== null

  const { tick } = usePoll(!controlled && load && config.pollMs ? config.pollMs : 0)

  // Controlled: mirror the parent-provided metrics.
  useEffect(() => {
    if (controlled) setMetrics(config.metrics ?? null)
  }, [controlled, config.metrics])

  // Self-loading: fetch (and re-fetch on each poll tick). Keep last-good on error.
  useEffect(() => {
    if (controlled || !load) return
    let cancelled = false
    void load()
      .then((m) => {
        if (!cancelled) {
          setMetrics(m)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled && !hasData.current) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [controlled, load, tick])

  if (!metrics) {
    if (failed) return <MetricsNote text="Live metrics aren’t connected for your organization yet — nothing is fabricated." />
    if (!controlled && load) return <MetricsSkeleton />
    return null
  }
  if (metrics.length === 0) return null

  return (
    <XStack flexWrap="wrap" gap="$3">
      {metrics.map((m) => (
        <MetricCard key={m.key} metric={m} reduced={reduced} accent={accent} />
      ))}
    </XStack>
  )
}

function MetricCard({ metric, reduced, accent }: { metric: LandingMetric; reduced: boolean; accent: string }) {
  const finite = metric.value != null && Number.isFinite(metric.value)
  const target = finite ? (metric.value as number) : 0

  // Count up from zero on first mount (then re-animate on every value change). Seeding
  // via an after-mount effect means `useCountUp` animates 0 → value instead of snapping.
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    setSeeded(true)
  }, [])
  const shown = useCountUp(seeded ? target : 0, !reduced && finite)
  const fmt = metric.format ?? ((n: number) => Math.round(n).toLocaleString())

  return (
    <Card p="$3.5" gap="$2" borderWidth={1} borderColor="$borderColor" bg="$color2" flex={1} minW={168}>
      <XStack items="center" justify="space-between" gap="$2">
        <Text fontSize="$2" color="$color10" numberOfLines={1}>
          {metric.label}
        </Text>
        {metric.icon ?? null}
      </XStack>
      <Text fontSize="$8" fontWeight="900" color={finite ? '$color12' : '$color10'} numberOfLines={1}>
        {finite ? fmt(shown) : '—'}
      </Text>
      <XStack items="center" justify="space-between" gap="$2" minH={22}>
        {metric.deltaPct !== undefined ? <DeltaChip pct={metric.deltaPct ?? null} /> : <YStack />}
        {metric.series && metric.series.filter((v) => Number.isFinite(v)).length >= 2 ? (
          <Sparkline values={metric.series} width={72} height={22} color={accent} />
        ) : metric.hint ? (
          <Text fontSize="$1" color="$color9" numberOfLines={1}>
            {metric.hint}
          </Text>
        ) : null}
      </XStack>
    </Card>
  )
}

function MetricsSkeleton() {
  return (
    <XStack flexWrap="wrap" gap="$3">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} p="$3.5" gap="$2.5" borderWidth={1} borderColor="$borderColor" bg="$color2" flex={1} minW={168}>
          <div className="hz-skeleton" style={{ height: 10, width: '55%', borderRadius: 4 }} />
          <div className="hz-skeleton" style={{ height: 26, width: '72%', borderRadius: 6 }} />
          <div className="hz-skeleton" style={{ height: 10, width: '40%', borderRadius: 4 }} />
        </Card>
      ))}
    </XStack>
  )
}

function MetricsNote({ text }: { text: string }) {
  return (
    <Card p="$3.5" borderWidth={1} borderColor="$borderColor" bg="$color2">
      <Text fontSize="$2" color="$color10">
        {text}
      </Text>
    </Card>
  )
}
