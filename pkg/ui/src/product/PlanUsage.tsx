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
import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'
import { Switch } from '../backends/gui/switch'
import { LimitActions, LimitedBanner } from './LimitedBanner'
import {
  limitsOf,
  paidPlan,
  relativeTime,
  resetLimits,
  type LimitAction,
  type LimitNotice,
  type LimitReset,
  type Limits,
} from './limits'
import { UsageMeter } from './UsageMeter'

/** What a paid plan includes, and what happens past it. English, drawn through the host's `t`. */
export const PLAN_TERMS = [
  phrase('Your plan includes monthly usage of Hanzo models (Enso, Zen, Kai). Third-party models are prepaid only.'),
  phrase('Beyond it, prepaid credit pays when you choose to continue with credits.'),
  phrase('Otherwise you continue in limited mode on free models.'),
] as const

/** What the free plan includes. */
export const FREE_TERMS = [
  phrase('The free plan includes limited usage of free models.'),
  phrase('Upgrade for monthly Hanzo model usage, or add prepaid credits for third-party models and pay as you go.'),
] as const

/** The opt-in, in one sentence. */
export const CREDITS_TERMS = phrase("When your plan's included usage runs out, keep using any model and pay from your credits.")

/** A slug as a name: "max-20x" reads "Max 20x". */
const named = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')

const day = (iso?: string) => {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isNaN(t)
    ? ''
    : new Date(t).toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
      })
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
  /** Resets the weekly usage allowance (`POST /v1/ai/limits/reset`). Return updated limits to update immediately. */
  onReset?: () => Promise<Limits | void> | Limits | void
  /** Fallback API base URL for `POST /v1/ai/limits/reset` when `onReset` is omitted. */
  apiBase?: string
  /** Fallback Bearer token for `POST /v1/ai/limits/reset` when `onReset` is omitted. */
  token?: string | null
  /** Called with refreshed limits after a successful built-in or callback reset. */
  onLimitsChange?: (next: Limits) => void
  /** Where the org's credits balance is read. */
  creditsHref?: string
  /** Where credits are added. */
  addCreditsHref?: string
  now?: number
}

function ResetUsage({
  reset,
  canReset,
  onRunReset,
  now,
}: {
  reset: LimitReset
  canReset: boolean
  onRunReset: () => Promise<void>
  now?: number
}) {
  const { t } = useI18n()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const run = async () => {
    setBusy(true)
    setErr('')
    try {
      await onRunReset()
      setConfirming(false)
    } catch (e: unknown) {
      setErr(e instanceof Error && e.message ? e.message : t('Could not reset usage. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  if (!reset.available) {
    const avail = relativeTime(reset.next_at, now, t)
    return (
      <YStack gap="$1" {...slot('plan-usage-reset')}>
        <Text fontSize="$2" color="$soft">
          {avail
            ? t('Free weekly reset available {when}', { when: avail })
            : t('Free weekly reset already used this week.')}
        </Text>
        {err ? (
          <Text role="alert" fontSize="$2" color="$bad">
            {err}
          </Text>
        ) : null}
      </YStack>
    )
  }

  if (!canReset) return null

  return (
    <YStack gap="$2" {...slot('plan-usage-reset')}>
      {confirming ? (
        <YStack
          gap="$2"
          p="$3"
          rounded="$4"
          borderWidth={1}
          borderColor="$edge"
          bg="$panel"
          {...slot('plan-usage-reset-confirm')}
        >
          <Text fontSize="$2" color="$ink">
            {t('Reset your current usage counters to 0%? You get 1 free reset per week.')}
          </Text>
          <XStack gap="$2" flexWrap="wrap" items="center">
            <Button size="sm" variant="primary" disabled={busy} onPress={() => void run()}>
              {busy ? t('Resetting…') : t('Confirm reset')}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onPress={() => setConfirming(false)}>
              {t('Cancel')}
            </Button>
          </XStack>
        </YStack>
      ) : (
        <XStack items="center" gap="$2" flexWrap="wrap">
          <Button
            size="sm"
            variant="default"
            disabled={busy}
            data-slot="plan-usage-reset-button"
            onPress={() => {
              setErr('')
              setConfirming(true)
            }}
          >
            {t('Reset usage (1 free/week)')}
          </Button>
        </XStack>
      )}
      {err ? (
        <Text role="alert" fontSize="$2" color="$bad">
          {err}
        </Text>
      ) : null}
    </YStack>
  )
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

export function PlanUsage({
  limits,
  plan,
  notice,
  onAction,
  onCredits,
  onReset,
  apiBase,
  token,
  onLimitsChange,
  creditsHref,
  addCreditsHref,
  now,
}: PlanUsageProps) {
  const { t } = useI18n()
  const [override, setOverride] = useState<{ source: Limits; next: Limits } | null>(null)
  const shown = override && override.source === limits ? override.next : limits
  const free = !paidPlan(shown)
  const name = plan || (free ? t('Free') : named(shown.plan))
  const from = day(shown.period_start)
  const to = day(shown.period_end)
  const terms = free ? FREE_TERMS : PLAN_TERMS
  const canReset = Boolean(onReset || (apiBase && token))

  const handleReset = async () => {
    const result = onReset ? await onReset() : await resetLimits(apiBase!, token!)
    if (result) {
      const parsed = limitsOf(result) ?? result
      setOverride({ source: limits, next: parsed })
      onLimitsChange?.(parsed)
    }
  }

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
      <UsageMeter limits={shown} now={now} />
      {shown.reset ? <ResetUsage reset={shown.reset} canReset={canReset} onRunReset={handleReset} now={now} /> : null}
      <YStack gap="$1" {...slot('plan-usage-terms')}>
        {terms.map((line) => (
          <Text key={line} fontSize="$2" color="$soft">
            {t(line)}
          </Text>
        ))}
      </YStack>
      {shown.creditsAfterAllowance !== undefined && onCredits ? <Credits on={shown.creditsAfterAllowance} onCredits={onCredits} creditsHref={creditsHref} addCreditsHref={addCreditsHref} /> : null}
      {!notice ? <LimitActions actions={shown.actions} onAction={onAction} /> : null}
    </YStack>
  )
}
