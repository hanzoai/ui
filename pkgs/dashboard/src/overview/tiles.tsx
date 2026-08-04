'use client'

/**
 * Overview tiles — the config-tile adapters that select a slice out of the
 * normalized `OverviewData` and render the matching primitive. Thin by design:
 * the presentation lives in the composable primitives (`Kpi`/`Feed`/`Board`) and
 * the charts (`Line`/`Columns`/`Donut`); these adapters only pick the slice and
 * hand it over. `Tile` routes a declared tile spec to its adapter (exhaustive on
 * the `tile` discriminant), which is what the `Overview` driver renders per row.
 */
import { Text, XStack, YStack } from '@hanzo/gui'

import { CHART_OTHER, CHART_PALETTE, Columns, Donut, Line, type ChartPoint, type Slice } from '../charts/Charts'
import { Board, EmptyPanel, Feed, Kpi, Panel, SkeletonBar } from './primitives'
import {
  deltaOf,
  distributionTotal,
  formatMetric,
  selectDistribution,
  selectKpi,
  selectSeries,
  severityColor,
  OK,
} from './logic'
import type {
  ActivityTile,
  AlertsTile,
  DistributionTile,
  HealthTile,
  MetricTile,
  OverviewData,
  OverviewTile,
  TimeseriesTile,
} from './config'

/** Format an axis label for a series interval. */
const fmtAxis = (iso: string, interval: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return interval === 'day'
    ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// ── Metric tile → Kpi ────────────────────────────────────────────────────────

export function MetricTileView({ tile, data, loading, live, index }: { tile: MetricTile; data: OverviewData | null; loading: boolean; live: boolean; index: number }) {
  const kpi = data ? selectKpi(data, tile.key) : undefined
  const delta = deltaOf(kpi)
  return (
    <Kpi
      label={tile.label}
      icon={tile.icon}
      unit={tile.unit}
      caption={tile.caption}
      color={tile.color ?? CHART_PALETTE[index % CHART_PALETTE.length]}
      value={kpi === undefined ? null : kpi.value}
      deltaPct={delta ? delta.pct : null}
      series={kpi?.series}
      animate={live}
      loading={loading && kpi === undefined}
    />
  )
}

// ── Timeseries tile → Line / Columns ─────────────────────────────────────────

export function TimeseriesTileView({ tile, data, loading }: { tile: TimeseriesTile; data: OverviewData | null; loading: boolean }) {
  const series = data ? selectSeries(data, tile.key) : undefined
  const points: ChartPoint[] = (series?.points ?? []).map((p) => ({ label: fmtAxis(p.t, series?.interval ?? 'day'), value: p.value }))
  const fmt = (v: number) => formatMetric(v, tile.unit)
  const total = points.reduce((s, p) => s + p.value, 0)

  return (
    <Panel title={tile.title} flex={1} right={points.length ? <Text fontSize="$2" color="$color10" className="tnum">{fmt(total)}</Text> : undefined}>
      {loading && series === undefined ? (
        <SkeletonBar w="100%" h={200} />
      ) : points.length < 2 ? (
        <EmptyPanel note="Not enough data in this range yet." />
      ) : tile.kind === 'bar' ? (
        <Columns data={points} color={CHART_PALETTE[1]} formatValue={fmt} />
      ) : (
        <Line data={points} color={CHART_PALETTE[0]} formatValue={fmt} />
      )}
    </Panel>
  )
}

// ── Distribution tile → Donut + legend ───────────────────────────────────────

export function DistributionTileView({ tile, data, loading }: { tile: DistributionTile; data: OverviewData | null; loading: boolean }) {
  const raw = data ? selectDistribution(data, tile.key) : []
  const total = distributionTotal(raw)
  const slices: Slice[] = raw
    .filter((s) => s.value > 0)
    .map((s, i) => ({ label: s.label, value: s.value, color: i < CHART_PALETTE.length ? CHART_PALETTE[i] : CHART_OTHER }))
  const fmt = (v: number) => formatMetric(v, tile.unit)

  return (
    <Panel title={tile.title} flex={1} minW={340}>
      {loading && raw.length === 0 ? (
        <XStack p="$4" justify="center">
          <SkeletonBar w={160} h={160} rounded />
        </XStack>
      ) : total <= 0 ? (
        <EmptyPanel note="No breakdown recorded in this range." />
      ) : (
        <XStack flexWrap="wrap" gap="$4" items="center">
          <Donut
            slices={slices}
            center={
              <>
                <Text fontSize="$5" fontWeight="500" color="$color12" className="tnum">
                  {fmt(total)}
                </Text>
                {tile.centerLabel ? (
                  <Text fontSize="$1" color="$color10">
                    {tile.centerLabel}
                  </Text>
                ) : null}
              </>
            }
          />
          <YStack flex={1} minW={200} gap="$2">
            {raw.filter((s) => s.value > 0).map((s, i) => (
              <XStack key={s.label} items="center" gap="$2.5">
                <YStack width={10} height={10} rounded="$10" style={{ backgroundColor: i < CHART_PALETTE.length ? CHART_PALETTE[i] : CHART_OTHER }} />
                <YStack flex={1}>
                  <Text fontSize="$3" fontWeight="600" color="$color12" numberOfLines={1}>
                    {s.label}
                  </Text>
                  {s.sub ? (
                    <Text fontSize="$1" color="$color10" numberOfLines={1}>
                      {s.sub}
                    </Text>
                  ) : null}
                </YStack>
                <YStack items="flex-end">
                  <Text fontSize="$3" fontWeight="500" color="$color12" className="tnum">
                    {fmt(s.value)}
                  </Text>
                  <Text fontSize="$1" color="$color10" className="tnum">
                    {Math.round((s.value / total) * 100)}%
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </XStack>
      )}
    </Panel>
  )
}

// ── Activity tile → Feed ─────────────────────────────────────────────────────

export function ActivityTileView({ tile, data, loading }: { tile: ActivityTile; data: OverviewData | null; loading: boolean }) {
  return <Feed items={data?.activity ?? []} title={tile.title} empty={tile.empty} loading={loading} />
}

// ── Alerts tile ──────────────────────────────────────────────────────────────

export function AlertsTileView({ tile, data, loading }: { tile: AlertsTile; data: OverviewData | null; loading: boolean }) {
  const alerts = data?.alerts ?? []
  return (
    <Panel title={tile.title ?? 'Alerts'}>
      {loading && alerts.length === 0 ? (
        <SkeletonBar w="100%" h={44} />
      ) : alerts.length === 0 ? (
        <XStack items="center" gap="$2">
          <YStack width={9} height={9} rounded="$10" style={{ backgroundColor: OK }} />
          <Text fontSize="$3" color="$color11">
            No active alerts.
          </Text>
        </XStack>
      ) : (
        <YStack gap="$2.5">
          {alerts.map((a) => (
            <XStack key={a.id || a.title} items="flex-start" gap="$2.5">
              <YStack width={9} height={9} rounded="$10" mt="$1.5" style={{ backgroundColor: severityColor(a.severity) }} />
              <YStack flex={1}>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {a.title}
                </Text>
                {a.detail ? (
                  <Text fontSize="$1" color="$color10">
                    {a.detail}
                  </Text>
                ) : null}
              </YStack>
            </XStack>
          ))}
        </YStack>
      )}
    </Panel>
  )
}

// ── Health tile → Board ──────────────────────────────────────────────────────

export function HealthTileView({ tile, data, loading }: { tile: HealthTile; data: OverviewData | null; loading: boolean }) {
  return <Board items={data?.health ?? []} title={tile.title} empty={tile.empty} loading={loading} />
}

// ── Tile router ──────────────────────────────────────────────────────────────

/** Render one declared tile spec against the normalized `OverviewData`. */
export function Tile({ tile, data, loading, live, index }: { tile: OverviewTile; data: OverviewData | null; loading: boolean; live: boolean; index: number }) {
  switch (tile.tile) {
    case 'metric':
      return <MetricTileView tile={tile} data={data} loading={loading} live={live} index={index} />
    case 'timeseries':
      return <TimeseriesTileView tile={tile} data={data} loading={loading} />
    case 'distribution':
      return <DistributionTileView tile={tile} data={data} loading={loading} />
    case 'activity':
      return <ActivityTileView tile={tile} data={data} loading={loading} />
    case 'alerts':
      return <AlertsTileView tile={tile} data={data} loading={loading} />
    case 'health':
      return <HealthTileView tile={tile} data={data} loading={loading} />
  }
}
