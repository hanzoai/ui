'use client'

/**
 * Usage dashboard — the ONE shared AI-usage screen every Hanzo app (console,
 * desktop, app, chat) renders: a summary header of totals (spend / tokens /
 * requests) as `Metric` tiles, above a responsive grid of `UsageProviderCard`s.
 *
 * Presentational + honest: totals are pre-summed by the caller and formatted here
 * (an absent total is an em-dash, never fabricated); the grid simply lays out the
 * providers it is given. @hanzo/gui primitives only — web + native + desktop.
 */
import { XStack, YStack } from '@hanzo/gui'
import { Activity, Coins, DollarSign } from '@hanzogui/lucide-icons-2'

import { MetricCard } from '../Metric'
import { UsageProviderCard, type UsageProviderCardProps, formatUsageCount, formatUsageCurrency } from './UsageProviderCard'

export function UsageDashboard({
  providers,
  totals,
}: {
  providers: UsageProviderCardProps[]
  totals?: { spendUSD?: number; tokens?: number; requests?: number }
}) {
  return (
    <YStack gap="$4">
      {totals ? (
        <XStack gap="$3" flexWrap="wrap">
          <MetricCard
            icon={<DollarSign size={16} color="$color11" />}
            label="Total spend"
            value={totals.spendUSD != null ? formatUsageCurrency(totals.spendUSD, 'USD') : '—'}
          />
          <MetricCard
            icon={<Coins size={16} color="$color11" />}
            label="Tokens"
            value={totals.tokens != null ? formatUsageCount(totals.tokens) : '—'}
          />
          <MetricCard
            icon={<Activity size={16} color="$color11" />}
            label="Requests"
            value={totals.requests != null ? formatUsageCount(totals.requests) : '—'}
          />
        </XStack>
      ) : null}

      <XStack gap="$3" flexWrap="wrap">
        {providers.map((p) => (
          <UsageProviderCard key={p.name} {...p} />
        ))}
      </XStack>
    </YStack>
  )
}
