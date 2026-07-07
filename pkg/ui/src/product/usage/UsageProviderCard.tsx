'use client'

/**
 * Usage provider card — one AI provider's quota at a glance, mirroring the Codex
 * menu card: a session bar, a weekly bar, any extra windows, credits/spend, and a
 * used-% history Sparkline. Composes `UsageMeter` rows + the canonical
 * `Charts.Sparkline` + `Metric` idioms; nothing is fabricated (a missing window
 * renders no row, a <2-point history renders no spark, `error`/`sourceLabel`/
 * `updatedAt` surface honest provenance).
 *
 * @hanzo/gui primitives only — themes to the shell, works web + native + desktop.
 */
import { Card, Text, XStack, YStack } from '@hanzo/gui'

import { Sparkline } from '../Charts'
import { UsageMeter, type UsageWindow } from './UsageMeter'

/** Format a monetary amount; falls back to "12.34 USD" where Intl currency is absent. */
export function formatUsageCurrency(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`
  }
}

/** Compact count (1.2K / 3.4M / 5.6B) for token/request totals. */
export function formatUsageCount(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

/** "updated 2m ago" from a real timestamp, or null when there is none. */
function updatedLabel(t?: string | Date): string | null {
  if (t == null) return null
  const ms = typeof t === 'string' ? Date.parse(t) : t.getTime()
  if (!Number.isFinite(ms)) return null
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'updated just now'
  if (mins < 60) return `updated ${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `updated ${h}h ago`
  return `updated ${Math.floor(h / 24)}d ago`
}

export type UsageProviderCardProps = {
  name: string
  /** Accent dot color (hex/rgb) — the provider's brand mark. */
  color?: string
  /** Plan/tier badge (e.g. "Pro", "Team"). */
  plan?: string
  session?: UsageWindow
  weekly?: UsageWindow
  /** Additional named windows (e.g. per-model or per-tool quotas). */
  extras?: Array<{ id: string; title: string; usedPercent: number; resetsAt?: string | Date }>
  spend?: { used: number; limit?: number; currencyCode: string }
  /** Used-% samples over time — drawn with the canonical Sparkline. */
  history?: number[]
  /** An honest load/refresh error for this provider. */
  error?: string
  /** Where the numbers came from (e.g. "OAuth", "API key"). */
  sourceLabel?: string
  updatedAt?: string | Date
}

export function UsageProviderCard({
  name,
  color,
  plan,
  session,
  weekly,
  extras,
  spend,
  history,
  error,
  sourceLabel,
  updatedAt,
}: UsageProviderCardProps) {
  const updated = updatedLabel(updatedAt)
  return (
    <Card p="$4" gap="$3" borderWidth={1} borderColor="$borderColor" flex={1} minW={260}>
      <XStack items="center" justify="space-between" gap="$2">
        <XStack items="center" gap="$2" flex={1}>
          {color ? <YStack width={10} height={10} rounded="$2" bg={color as never} /> : null}
          <Text fontSize="$4" fontWeight="800" color="$color12" numberOfLines={1}>
            {name}
          </Text>
        </XStack>
        {plan ? (
          <Text fontSize="$1" px="$2" py="$1" rounded="$2" bg="$color3" color="$color11">
            {plan}
          </Text>
        ) : null}
      </XStack>

      {error ? (
        <Text fontSize="$2" color="#e5534b">
          {error}
        </Text>
      ) : null}

      {session ? <UsageMeter label="Session" usedPercent={session.usedPercent} resetsAt={session.resetsAt} /> : null}
      {weekly ? <UsageMeter label="Weekly" usedPercent={weekly.usedPercent} resetsAt={weekly.resetsAt} /> : null}
      {extras?.map((e) => (
        <UsageMeter key={e.id} label={e.title} usedPercent={e.usedPercent} resetsAt={e.resetsAt} />
      ))}

      {spend ? (
        spend.limit != null ? (
          <UsageMeter
            label={`Spend · ${formatUsageCurrency(spend.used, spend.currencyCode)} / ${formatUsageCurrency(spend.limit, spend.currencyCode)}`}
            usedPercent={spend.limit > 0 ? (spend.used / spend.limit) * 100 : 0}
            compact
          />
        ) : (
          <XStack items="center" justify="space-between" gap="$2">
            <Text fontSize="$2" color="$color11">
              Spend
            </Text>
            <Text fontSize="$2" color="$color12" fontWeight="600">
              {formatUsageCurrency(spend.used, spend.currencyCode)}
            </Text>
          </XStack>
        )
      ) : null}

      {history && history.length >= 2 ? (
        <XStack justify="flex-end">
          <Sparkline values={history} />
        </XStack>
      ) : null}

      {sourceLabel || updated ? (
        <XStack items="center" justify="space-between" gap="$2">
          {sourceLabel ? (
            <Text fontSize="$1" color="$color10" numberOfLines={1}>
              {sourceLabel}
            </Text>
          ) : null}
          {updated ? (
            <Text fontSize="$1" color="$color10">
              {updated}
            </Text>
          ) : null}
        </XStack>
      ) : null}
    </Card>
  )
}
