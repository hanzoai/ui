import { useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Line, type ChartPoint } from '../charts/Charts'
import { Kpi } from '../overview/primitives'
import { Loaded, RangeSwitch, TopList, useLoad } from './parts'
import type { Dimension, Range, Series, Source, Stats } from './source'

const TOPS: { dimension: Dimension; title: string }[] = [
  { dimension: 'path', title: 'Pages' },
  { dimension: 'referrer', title: 'Referrers' },
  { dimension: 'country', title: 'Countries' },
  { dimension: 'device', title: 'Devices' },
  { dimension: 'browser', title: 'Browsers' },
  { dimension: 'os', title: 'Operating systems' },
]

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)
const delta = (now: number, was?: number) => (was ? Math.round(((now - was) / was) * 1000) / 10 : null)

function points(series: Series, range: Range): ChartPoint[] {
  return series.pageviews.map((p) => {
    const d = new Date(p.x.replace(' ', 'T'))
    const label = Number.isNaN(d.getTime())
      ? p.x
      : range === '24h'
        ? d.toLocaleTimeString([], { hour: 'numeric' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    return { label, value: p.y }
  })
}

function Tiles({ s }: { s: Stats }) {
  const c = s.comparison
  const avg = s.visits > 0 ? Math.round(s.totaltime / s.visits) : 0
  return (
    <XStack gap="$3" flexWrap="wrap">
      <Kpi label="Visitors" value={s.visitors} deltaPct={delta(s.visitors, c?.visitors)} />
      <Kpi label="Visits" value={s.visits} deltaPct={delta(s.visits, c?.visits)} />
      <Kpi label="Pageviews" value={s.pageviews} deltaPct={delta(s.pageviews, c?.pageviews)} />
      <Kpi label="Bounce rate" value={pct(s.bounces, s.visits)} unit="pct" />
      <Kpi label="Visit duration" value={avg * 1000} unit="ms" />
    </XStack>
  )
}

/**
 * Web analytics for one website: visitors, visits, pageviews, bounce and duration,
 * the traffic series, and where it came from and on what. The same view on
 * analytics.hanzo.ai and on a project's page in the platform.
 */
export function WebAnalytics({ source, website, initial = '7d' }: { source: Source; website: string; initial?: Range }) {
  const [range, setRange] = useState<Range>(initial)
  const stats = useLoad(() => source.stats(website, range), [source, website, range])
  const series = useLoad(() => source.series(website, range), [source, website, range])
  return (
    <YStack gap="$4" width="100%">
      <XStack justify="space-between" items="center" gap="$3" flexWrap="wrap">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          Web analytics
        </Text>
        <RangeSwitch range={range} onRange={setRange} />
      </XStack>
      {stats.state === 'ok' ? <Tiles s={stats.value} /> : null}
      <Loaded title="Pageviews" load={series} empty={(v) => !v.pageviews?.length}>
        {(v) => <Line data={points(v, range)} formatValue={(n) => n.toLocaleString()} />}
      </Loaded>
      <XStack gap="$3" flexWrap="wrap">
        {TOPS.map((t) => (
          <Top key={t.dimension} source={source} website={website} range={range} {...t} />
        ))}
      </XStack>
    </YStack>
  )
}

function Top({ source, website, range, dimension, title }: { source: Source; website: string; range: Range; dimension: Dimension; title: string }) {
  const load = useLoad(() => source.top(website, dimension, range), [source, website, range, dimension])
  return (
    <Loaded title={title} load={load} empty={(v) => !v.length}>
      {(rows) => <TopList rows={rows} />}
    </Loaded>
  )
}
