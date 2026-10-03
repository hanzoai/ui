'use client'

/**
 * PlanUsage — the plan, its period, what it includes in plain words, a
 * UsageMeter, and the ways to more (Upgrade, Add prepaid credit). A paused class
 * leads with its LimitedBanner. Shares only, never an amount or a count.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'
import { LimitedBanner } from './LimitedBanner'
import { UsageMeter } from './UsageMeter'
import type { LimitAction, LimitNotice, Limits } from './limits'

/** What a paid plan includes, and what happens past it. */
export const PLAN_TERMS = [
  'Your plan includes usage of premium and Hanzo models each period.',
  'Beyond it, prepaid credit pays.',
  'Without prepaid credit, you continue in limited mode on free models.',
] as const

/** What the free plan includes. */
export const FREE_TERMS = [
  'The free plan includes limited usage of free models.',
  'Upgrade for premium and Hanzo models, or add prepaid credit to pay as you go.',
] as const

/** A slug as a name: "max-20x" reads "Max 20x". */
const named = (slug: string) => slug.split('-').map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w)).join(' ')

const day = (iso?: string) => {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isNaN(t) ? '' : new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
}

export interface PlanUsageProps {
  limits: Limits
  /** The plan's display name; the slug made readable when absent. */
  plan?: string
  notice?: LimitNotice | null
  onAction?: (action: LimitAction) => void
  now?: number
}

const go = (a: LimitAction) => {
  if (typeof window !== 'undefined') window.location.assign(a.url)
}

export function PlanUsage({ limits, plan, notice, onAction = go, now }: PlanUsageProps) {
  const free = !limits.plan
  const name = plan || (free ? 'Free' : named(limits.plan))
  const from = day(limits.period_start)
  const to = day(limits.period_end)
  const terms = free ? FREE_TERMS : PLAN_TERMS
  return (
    <YStack gap="$4" width="100%" minW={0} {...slot('plan-usage')}>
      <YStack gap="$1">
        <Text fontSize="$5" fontWeight="600" color="$ink">
          {name} plan
        </Text>
        {from && to ? (
          <Text fontSize="$2" color="$soft">
            Current period {from} – {to}
          </Text>
        ) : null}
      </YStack>
      {notice ? <LimitedBanner message={notice.message} actions={notice.actions} onAction={onAction} /> : null}
      <UsageMeter limits={limits} now={now} />
      <YStack gap="$1" {...slot('plan-usage-terms')}>
        {terms.map((line) => (
          <Text key={line} fontSize="$2" color="$soft">
            {line}
          </Text>
        ))}
      </YStack>
      {!notice && limits.actions.length ? (
        <XStack gap="$2" flexWrap="wrap">
          {limits.actions.map((a) => (
            <Button
              key={`${a.kind}:${a.url}`}
              size="sm"
              variant={a.kind === 'upgrade' ? 'default' : 'outline'}
              data-kind={a.kind}
              onPress={() => onAction(a)}
            >
              {a.label}
            </Button>
          ))}
        </XStack>
      ) : null}
    </YStack>
  )
}
