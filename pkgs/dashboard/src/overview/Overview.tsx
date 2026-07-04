'use client'

/**
 * Overview — the ONE reusable, videogame-like dashboard driver. Given an
 * `OverviewConfig` (a product's tiles + its REAL data loader + live/motion
 * settings) it renders the board and keeps it alive: a single throttled poll loop
 * refetches on an interval (paused on a hidden tab), the range selector re-scopes,
 * and every number counts up on change (unless reduced motion / count-up off).
 *
 * DRY + orthogonal: this file knows nothing about any specific product or endpoint.
 * The tiles read their slice out of the normalized `OverviewData` the loader returns;
 * a product is added by writing a config, never overview UI.
 *
 * Honest by construction: the FIRST load shows a spinner; a failure shows the error
 * card; thereafter a background refetch never blanks the board (the last real data
 * stays until new real data lands), and any tile whose slice is absent renders its
 * own skeleton/empty. Style props are the @hanzo/gui v5 shorthand set.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from '@hanzo/gui'

import { effectiveInterval } from '../motion/motion'
import { usePageHidden, usePoll } from '../motion/hooks'
import { type Loadable } from './logic'
import { PanelSpinner } from './primitives'
import { Tile } from './tiles'
import type { OverviewConfig, OverviewData, OverviewRange } from './config'

/** Throttle floor: a config can ask for faster, but never faster than this. */
const POLL_FLOOR_MS = 5000

const RANGES: { key: OverviewRange; label: string }[] = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
]

export function Overview({ config, allOrgs, isGlobalAdmin = false }: { config: OverviewConfig; allOrgs?: boolean; isGlobalAdmin?: boolean }) {
  const [range, setRange] = useState<OverviewRange>('24h')
  const [state, setState] = useState<Loadable<OverviewData>>({ s: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const reqRef = useRef(0)

  const hidden = usePageHidden()
  // Pause polling while the tab is hidden OR the board is in its error state — an
  // errored source should not be hammered on a loop; the user retries explicitly.
  const pollMs = effectiveInterval(config.live?.pollMs ?? 0, POLL_FLOOR_MS, hidden || state.s === 'error')
  const { tick, bump } = usePoll(pollMs)
  const live = (config.live?.pollMs ?? 0) > 0
  const countUp = config.live?.countUp !== false

  // One load path for the first paint, the range change, and every poll tick. The
  // reqRef guard drops a stale in-flight response so a fast range toggle can't
  // render older data over newer.
  useEffect(() => {
    const id = ++reqRef.current
    const first = state.s === 'loading'
    if (!first) setRefreshing(true)
    config
      .load({ range, allOrgs, isGlobalAdmin })
      .then((v) => {
        if (id === reqRef.current) setState({ s: 'ready', v })
      })
      .catch((e) => {
        // A background refetch that fails must NOT blank a board that already has
        // real data — keep the last data, surface the error only on the first load.
        if (id !== reqRef.current) return
        if (first) {
          const err = asLoadError(e)
          setState({ s: 'error', message: err.message, status: err.status })
        }
      })
      .finally(() => {
        if (id === reqRef.current) setRefreshing(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, allOrgs, isGlobalAdmin, tick, config])

  const onRange = (k: OverviewRange) => {
    setRange(k)
    bump()
  }

  const data = state.s === 'ready' ? state.v : null

  return (
    <YStack gap="$4">
      <Header
        title={allOrgs ? `${config.title} — all orgs` : config.title}
        subtitle={config.subtitle}
        actions={
          <XStack gap="$2" items="center">
            {refreshing ? <Spinner size="small" color="$color10" /> : null}
            {config.ranged === false ? null : <RangeSelector value={range} onChange={onRange} />}
          </XStack>
        }
      />

      {state.s === 'error' ? (
        <ErrorState
          message={state.message}
          status={state.status}
          onRetry={() => {
            setState({ s: 'loading' })
            bump()
          }}
        />
      ) : state.s === 'loading' ? (
        <PanelSpinner />
      ) : (
        <YStack gap="$4">
          {config.rows.map((row, ri) => (
            <FadeIn key={ri} index={ri} step={60}>
              <XStack flexWrap="wrap" gap="$3">
                {row.map((tile, ti) => (
                  <Tile key={ti} tile={tile} data={data} loading={false} live={live && countUp} index={ti} />
                ))}
              </XStack>
            </FadeIn>
          ))}
        </YStack>
      )}
    </YStack>
  )
}

// ── chrome (self-contained — no host-app coupling) ───────────────────────────

/** Extract an honest message + status from an unknown thrown value. */
function asLoadError(e: unknown): { message: string; status: number } {
  if (e && typeof e === 'object') {
    const anyE = e as { message?: unknown; status?: unknown }
    return {
      message: typeof anyE.message === 'string' ? anyE.message : 'Something went wrong.',
      status: typeof anyE.status === 'number' ? anyE.status : 0,
    }
  }
  return { message: typeof e === 'string' ? e : 'Something went wrong.', status: 0 }
}

/** Section title + optional subtitle and right-aligned actions. */
function Header({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <XStack justify="space-between" items="flex-start" gap="$3" flexWrap="wrap">
      <YStack gap="$1" flex={1} minW={200}>
        <Text fontSize="$7" fontWeight="500" letterSpacing={-0.4}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="$3" color="$color11">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {actions ? <XStack gap="$2" items="center">{actions}</XStack> : null}
    </XStack>
  )
}

/** A fade-up entrance (staggered by index). Honors reduced motion via the CSS. */
function FadeIn({ children, index = 0, step = 50 }: { children: ReactNode; index?: number; step?: number }) {
  return (
    <div className="hz-fade-up" style={{ animationDelay: `${index * step}ms` }}>
      {children}
    </div>
  )
}

/** The first-load / retry error card (honest, with a retry). */
function ErrorState({ message, status, onRetry }: { message: string; status: number; onRetry: () => void }) {
  const note =
    status === 404
      ? 'This overview’s data source is not routed on this deployment yet — it appears automatically once the backend is reachable for your org.'
      : message
  return (
    <Card borderWidth={1} borderColor="$borderColor" p="$5" gap="$3" items="flex-start">
      <Text fontSize="$5" fontWeight="600" color="$color12">
        Could not load
      </Text>
      <Text fontSize="$3" color="$color11" maxW={620}>
        {note}
      </Text>
      <Button onPress={onRetry}>Retry</Button>
    </Card>
  )
}

function RangeSelector({ value, onChange }: { value: OverviewRange; onChange: (k: OverviewRange) => void }) {
  return (
    <XStack borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
      {RANGES.map((r) => {
        const active = r.key === value
        return (
          <Button key={r.key} size="$2" chromeless={!active} bg={active ? '$color5' : 'transparent'} rounded="$0" onPress={() => onChange(r.key)}>
            <Text fontSize="$2" fontWeight={active ? '700' : '500'} color={active ? '$color12' : '$color10'}>
              {r.label}
            </Text>
          </Button>
        )
      })}
    </XStack>
  )
}
