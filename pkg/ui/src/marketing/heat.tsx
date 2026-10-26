'use client'

/**
 * A year of days as one grid, and a run of values as one line of bars.
 *
 *   Heatmap    a count a day over a window, a week a column, four shades; the
 *              day under the pointer is named in the line beneath
 *   Sparkline  a run of values as bars, tallest to the height given
 *
 * Both take their data as props and fetch nothing: a figure the caller does not
 * hold is not passed, and a grid with no count in it draws nothing. The shades
 * are the ink at a share of its strength, so the grid retunes with the theme,
 * and four of them are cut at the quartiles of the days that had any count, so
 * it reads the same in a quiet year and a loud one. The grid is wiped into place
 * once, the first time it is seen, and stands drawn for a reader who wants no
 * motion (`reveal`).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Text, View, XStack, YStack } from '@hanzo/gui'

import { slot } from '../backends/gui/slot'

const DAY = 86_400_000
const WEEK = 7

/** The day, UTC, as `YYYY-MM-DD`. */
const key = (t: number) => new Date(t).toISOString().slice(0, 10)

/** The days of a window, oldest first, `from` and `to` included. */
export function span(from: string, to: string): string[] {
  const out: string[] = []
  for (
    let t = Date.parse(`${from}T00:00:00Z`);
    t <= Date.parse(`${to}T00:00:00Z`);
    t += DAY
  )
    out.push(key(t))
  return out
}

/**
 * The three cuts between four shades: the quartiles of the days that had any
 * count. A year with none has nothing to cut.
 */
export function cuts(days: Record<string, number>): [number, number, number] {
  const counts = Object.values(days)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
  const at = (q: number) =>
    counts[Math.min(counts.length - 1, Math.floor(q * counts.length))] ?? 0
  return [at(0.25), at(0.5), at(0.75)]
}

/** The shade a count earns: 0 for none, then 1 to 4 up the quartiles. */
export const shade = (n: number, cut: readonly [number, number, number]) =>
  n <= 0 ? 0 : n <= cut[0] ? 1 : n <= cut[1] ? 2 : n <= cut[2] ? 3 : 4

/** A fill the colour table does not name: a page's own CSS value, which gui emits as written. */
const fill = (c: string) => ({ backgroundColor: c }) as object

/** The ink of each shade, from the page's own so the grid follows the theme. */
const INK = [
  'var(--muted)',
  'color-mix(in srgb, var(--foreground) 22%, transparent)',
  'color-mix(in srgb, var(--foreground) 42%, transparent)',
  'color-mix(in srgb, var(--foreground) 68%, transparent)',
  'var(--foreground)',
] as const

type Cell = { day: string; count: number; level: number; shown: boolean }

/** The weeks of a window, Sunday first, with the days outside it kept as unseen cells so the columns stay whole. */
export function weeks(
  days: Record<string, number>,
  from: string,
  to: string
): Cell[][] {
  const first = Date.parse(`${from}T00:00:00Z`)
  const last = Date.parse(`${to}T00:00:00Z`)
  const cut = cuts(days)
  const start = first - new Date(first).getUTCDay() * DAY
  const out: Cell[][] = []
  for (let t = start; t <= last; t += WEEK * DAY) {
    out.push(
      Array.from({ length: WEEK }, (_, d) => {
        const at = t + d * DAY
        const count = days[key(at)] ?? 0
        return {
          day: key(at),
          count,
          level: shade(count, cut),
          shown: at >= first && at <= last,
        }
      })
    )
  }
  return out
}

/**
 * Each week's month label: a month is named over the first week that holds its
 * first seven days, and the window's first column is named too, unless the next
 * month is named within two columns of it and the two would run together.
 */
export function monthLabels(
  grid: Cell[][],
  from: string,
  locale?: string
): string[] {
  const name = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, {
      timeZone: 'UTC',
      month: 'short',
    })
  const labels = grid.map((w, i) => {
    const first = w.find((c) => c.shown)?.day ?? from
    return i === 0 || Number(first.slice(8, 10)) <= 7 ? name(first) : ''
  })
  const next = labels.findIndex((l, i) => i > 0 && l)
  if (labels[0] && next > 0 && next < 3) labels[0] = ''
  return labels
}

export type HeatmapProps = {
  /** The count of each day, keyed `YYYY-MM-DD`; a day not named had none. */
  days: Record<string, number>
  /** The first and last day shown, inclusive. */
  from: string
  to: string
  /** What the grid says to a reader who cannot see it. */
  label: string
  /** The line for the day under the pointer. */
  line?: (day: string, count: number) => ReactNode
  /** The line when no day is under the pointer. */
  rest?: ReactNode
  /** The two ends of the legend; with none the legend is not drawn. */
  legend?: { less: ReactNode; more: ReactNode }
  /** The language month names are written in; the reader's by default. */
  locale?: string
  /** Wipe the grid in the first time it is seen. */
  reveal?: boolean
}

/** The least width a week's column may be drawn at: a cell is nine pixels and a gap three. */
const CELL = 12

const still = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

export function Heatmap({
  days,
  from,
  to,
  label,
  line,
  rest,
  legend,
  locale,
  reveal = true,
}: HeatmapProps) {
  const grid = useMemo(() => weeks(days, from, to), [days, from, to])
  const [at, setAt] = useState<string | null>(null)
  // The container is watched and the grid inside it is wiped: a grid clipped to nothing is never seen to intersect.
  const box = useRef<HTMLElement | null>(null)
  const wipe = useRef<HTMLElement | null>(null)

  // A narrow screen scrolls the year sideways, and starts at its newest week.
  useEffect(() => {
    const el = wipe.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days, from, to])

  // The grid waits fully clipped from its first frame, so it needs no style of its own to hide it,
  // and plays when it is first seen. Where animation or observation is missing it stays drawn.
  useEffect(() => {
    const el = wipe.current
    const watched = box.current
    if (
      !reveal ||
      !el ||
      !watched ||
      typeof el.animate !== 'function' ||
      typeof IntersectionObserver === 'undefined' ||
      still()
    )
      return
    const a = el.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 1100, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'both' }
    )
    a.pause()
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        a.play()
        io.disconnect()
      },
      { threshold: 0.3 }
    )
    io.observe(watched)
    return () => {
      io.disconnect()
      a.cancel()
    }
  }, [reveal])

  if (!Object.values(days).some((n) => n > 0)) return null
  const columns = `repeat(${grid.length}, minmax(0, 1fr))`
  const named = at && at >= from && at <= to ? at : null
  const months = monthLabels(grid, from, locale)

  return (
    <YStack gap={14} {...slot('heatmap')}>
      <View ref={box as never}>
        <View ref={wipe as never} overflowX="auto">
          <View minW={grid.length * CELL}>
            <View
              display="grid"
              gridTemplateColumns={columns}
              gap={3}
              pb={6}
              aria-hidden
            >
              {months.map((m, i) => (
                <Text
                  key={i}
                  fontFamily="$mono"
                  fontSize="$1"
                  lineHeight="$1"
                  color="var(--muted-foreground)"
                  whiteSpace="nowrap"
                  overflow="visible"
                >
                  {m}
                </Text>
              ))}
            </View>
            <View
              role="img"
              aria-label={label}
              display="grid"
              gridTemplateColumns={columns}
              gridTemplateRows="repeat(7, auto)"
              gap={3}
              gridAutoFlow="column"
              onPointerMove={(e: { target: unknown }) =>
                setAt((e.target as HTMLElement).dataset?.day ?? null)
              }
              onPointerLeave={() => setAt(null)}
            >
              {grid.flat().map((c) => (
                <View
                  key={c.day}
                  data-day={c.shown ? c.day : undefined}
                  aspectRatio={1}
                  rounded={2}
                  opacity={c.shown ? 1 : 0}
                  {...fill(INK[c.level])}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
      <XStack justify="space-between" items="center" flexWrap="wrap" gap={12}>
        <Text
          fontFamily="$mono"
          fontSize="$1"
          lineHeight="$1"
          color="var(--muted-foreground)"
          aria-live="polite"
          {...slot('heatmap-line')}
        >
          {named && line ? line(named, days[named] ?? 0) : rest}
        </Text>
        {legend ? (
          <XStack items="center" gap={6} aria-hidden>
            <Text
              fontFamily="$mono"
              fontSize="$1"
              color="var(--muted-foreground)"
            >
              {legend.less}
            </Text>
            {INK.map((s) => (
              <View key={s} width={11} height={11} rounded={2} {...fill(s)} />
            ))}
            <Text
              fontFamily="$mono"
              fontSize="$1"
              color="var(--muted-foreground)"
            >
              {legend.more}
            </Text>
          </XStack>
        ) : null}
      </XStack>
    </YStack>
  )
}

export type SparklineProps = {
  /** The values, oldest first. */
  values: readonly number[]
  /** What the bars say to a reader who cannot see them. */
  label: string
  /** The height of the tallest bar, in px. */
  height?: number
}

export function Sparkline({ values, label, height = 40 }: SparklineProps) {
  const top = Math.max(0, ...values)
  if (!values.length || top <= 0) return null
  return (
    <XStack
      role="img"
      aria-label={label}
      items="flex-end"
      gap={2}
      height={height}
      {...slot('sparkline')}
    >
      {values.map((v, i) => (
        <View
          key={i}
          flex={1}
          minW={1}
          height={(v > 0 ? `${Math.max(4, (100 * v) / top)}%` : 1) as never}
          rounded={1}
          {...fill(v > 0 ? 'var(--foreground)' : 'var(--muted)')}
        />
      ))}
    </XStack>
  )
}
