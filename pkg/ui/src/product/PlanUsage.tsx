'use client'

/**
 * PlanUsage — the plan, its period, what it includes in plain words, a
 * UsageMeter, the org's choice to keep paying from credits once included usage
 * runs out, and the server's ways to more. A paused class leads with its
 * LimitedBanner. Shares only, never an amount or a count.
 */
import { useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import { Anchor } from '../backends/gui'
import { Switch } from '../backends/gui/switch'
import { slot } from '../backends/gui/slot'
import { LimitActions, LimitedBanner } from './LimitedBanner'
import { UsageMeter } from './UsageMeter'
import { paidPlan, type LimitAction, type LimitNotice, type Limits } from './limits'

/** What a paid plan includes, and what happens past it. English, drawn through the host's `t`. */
export const PLAN_TERMS = [
  phrase('Your plan includes usage of premium and Hanzo models each period.'),
  phrase('Beyond it, prepaid credit pays when you choose to continue with credits.'),
  phrase('Otherwise you continue in limited mode on free models.'),
] as const

/** What the free plan includes. */
export const FREE_TERMS = [
  phrase('The free plan includes limited usage of free models.'),
  phrase('Upgrade for premium and Hanzo models, or add credits to pay as you go.'),
] as const

/** The opt-in, in one sentence. */
export const CREDITS_TERMS = phrase("When your plan's included usage runs out, keep using any model and pay from your credits.")

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
  /** Takes an action; without one only the pages are offered. */
  onAction?: (action: LimitAction) => void
  /** Writes the org's continue-with-credits choice; the switch shows only when the limits carry it. */
  onCredits?: (on: boolean) => Promise<void>
  /** Where the org's credits balance is read. */
  creditsHref?: string
  /** Where credits are added. */
  addCreditsHref?: string
  now?: number
}

function Credits({
  on,
  onCredits,
  creditsHref,
  addCreditsHref,
}: {
  on: boolean
  onCredits: (on: boolean) => Promise<void>
  creditsHref?: string
  addCreditsHref?: string
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState('')
  const flip = (next: boolean) => {
    setBusy(true)
    setWrong('')
    onCredits(next)
      .catch((e: unknown) => setWrong(e instanceof Error && e.message ? e.message : `${t('That did not save.')} ${t('Try again.')}`))
      .finally(() => setBusy(false))
  }
  return (
    <YStack gap="$2" {...slot('plan-usage-credits')}>
      <XStack gap="$3" items="center" justify="space-between">
        <Text fontSize="$2" color="$ink" flex={1} minW={0}>
          {t(CREDITS_TERMS)}
        </Text>
        <Switch checked={on} disabled={busy} onCheckedChange={flip} aria-label={t('Continue with credits')} />
      </XStack>
      {creditsHref || addCreditsHref ? (
        <XStack gap="$4" flexWrap="wrap">
          {creditsHref ? (
            <Anchor href={creditsHref} fontSize="$2" color="$soft">
              {t('Credits balance')}
            </Anchor>
          ) : null}
          {addCreditsHref ? (
            <Anchor href={addCreditsHref} fontSize="$2" color="$soft">
              {t('Add credits')}
            </Anchor>
          ) : null}
        </XStack>
      ) : null}
      {wrong ? (
        <Text role="alert" fontSize="$2" color="$bad">
          {wrong}
        </Text>
      ) : null}
    </YStack>
  )
}

export function PlanUsage({ limits, plan, notice, onAction, onCredits, creditsHref, addCreditsHref, now }: PlanUsageProps) {
  const { t } = useI18n()
  const free = !paidPlan(limits)
  const name = plan || (free ? t('Free') : named(limits.plan))
  const from = day(limits.period_start)
  const to = day(limits.period_end)
  const terms = free ? FREE_TERMS : PLAN_TERMS
  return (
    <YStack gap="$4" width="100%" minW={0} {...slot('plan-usage')}>
      <YStack gap="$1">
        <Text fontSize="$5" fontWeight="600" color="$ink">
          {t('{plan} plan', { plan: name })}
        </Text>
        {from && to ? (
          <Text fontSize="$2" color="$soft">
            {t('Current period {from} – {to}', { from, to })}
          </Text>
        ) : null}
      </YStack>
      {notice ? <LimitedBanner message={notice.message} actions={notice.actions} onAction={onAction} /> : null}
      <UsageMeter limits={limits} now={now} />
      <YStack gap="$1" {...slot('plan-usage-terms')}>
        {terms.map((line) => (
          <Text key={line} fontSize="$2" color="$soft">
            {t(line)}
          </Text>
        ))}
      </YStack>
      {limits.creditsAfterAllowance !== undefined && onCredits ? (
        <Credits on={limits.creditsAfterAllowance} onCredits={onCredits} creditsHref={creditsHref} addCreditsHref={addCreditsHref} />
      ) : null}
      {!notice ? <LimitActions actions={limits.actions} onAction={onAction} /> : null}
    </YStack>
  )
}
