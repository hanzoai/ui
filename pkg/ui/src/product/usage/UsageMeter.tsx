'use client'

/**
 * Usage meter — the ONE labeled rate-limit bar every Hanzo app renders for an AI
 * quota (session / weekly / a custom window). A thin track + tone-by-value fill
 * (green calm → amber → red hot, the same `utilColor` semantics as the console's
 * `UtilBar`), a "% left" read-out, and an honest reset countdown ("resets in 2h
 * 14m") computed from a real `resetsAt` — never a fabricated number.
 *
 * Built only from @hanzo/gui primitives (the nested-YStack track/fill is the house
 * bar idiom from `Charts.BarRows`), so it themes to the shell and works web +
 * native + desktop. No DOM APIs: `Date` only.
 */
import { Text, XStack, YStack } from '@hanzo/gui'

import { utilColor } from '../Metric'

/** A single quota window: how much is spent (0–100) and when it refills. */
export type UsageWindow = {
  usedPercent: number
  /** ISO string or Date the window resets — drives the honest countdown. */
  resetsAt?: string | Date
}

/** "resets in 2h 14m" from a real reset time, or null when there is none/past. */
export function resetCountdown(resetsAt?: string | Date): string | null {
  if (resetsAt == null) return null
  const t = typeof resetsAt === 'string' ? Date.parse(resetsAt) : resetsAt.getTime()
  if (!Number.isFinite(t)) return null
  const mins = Math.floor((t - Date.now()) / 60000)
  if (mins <= 0) return 'resets now'
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `resets in ${d}d ${h}h`
  if (h > 0) return `resets in ${h}h ${m}m`
  return `resets in ${m}m`
}

export function UsageMeter({
  label,
  usedPercent,
  resetsAt,
  compact,
}: {
  label: string
  usedPercent: number
  resetsAt?: string | Date
  compact?: boolean
}) {
  const used = Math.max(0, Math.min(100, usedPercent))
  const left = Math.round(100 - used)
  const reset = resetCountdown(resetsAt)
  const h = compact ? 6 : 8
  return (
    <YStack gap={compact ? '$1' : '$1.5'}>
      <XStack items="center" justify="space-between" gap="$2">
        <Text fontSize="$2" color="$color11" numberOfLines={1} flex={1}>
          {label}
        </Text>
        <Text fontSize="$2" color="$color12" fontWeight="600">
          {left}% left
        </Text>
      </XStack>
      <YStack height={h} bg="$color3" rounded="$2" overflow="hidden">
        <YStack height={h} width={`${Math.max(2, used)}%`} bg={utilColor(used) as never} rounded="$2" />
      </YStack>
      {reset && !compact ? (
        <Text fontSize="$1" color="$color10">
          {reset}
        </Text>
      ) : null}
    </YStack>
  )
}
