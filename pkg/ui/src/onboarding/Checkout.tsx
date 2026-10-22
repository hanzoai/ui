'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { readConsent, renderConsent } from '@hanzo/event'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import { PALETTE } from '@hanzo/pay'
import { load, pin, PRODUCTION, SANDBOX, style } from '@hanzo/pay/web'
import { Checkbox } from '../backends/gui/checkbox'
import { Field, FieldError, FieldLabel } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, XStack, YStack } from '../backends/gui/layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../backends/gui/select'
import { bearer, currentOrg } from '../auth/session'
import { ApiError, API, call } from './api'
import { keyFor, purchase, settle, uncharged } from './attempt'
import { useCatalog } from './catalog'
import { IntervalToggle, Line, Page, Panel } from './frame'
import { IntervalChoice, Primary } from './screens'
import type { Track } from './hooks'
import { ChoiceCard, ChoiceGroup, RadioCircle } from '../backends/gui/choice'
import { SizableText } from '../backends/gui/layout'
import { item, lines, money, offer, period, saving, SLUG, unit, usd, type Interval, type PlanId } from './plans'

/**
 * THE checkout: one component for the personal path, the team path and every
 * in-app Upgrade entry. Commerce prices the plan (POST /v1/billing/subscribe/card
 * names a catalog plan, never an amount); the card is a Square Web Payments
 * field mounted here, so no card data touches this page or this code.
 *
 * Before it charges, it reads the catalog and refuses if the catalog's price is
 * not the one on screen, so a person is never billed a different amount than the
 * one they agreed to.
 *
 * Its words are the reader's language (@hanzo/i18n `t`); amounts and the renewal
 * date are formatted as before, and the events it sends stay in English.
 */

export interface CheckoutProps {
  site?: string
  api?: string
  /** The IAM org the plan is bought for; omitted, the caller's own. */
  org?: string
  token?: string
  plan: PlanId
  seats?: number
  interval: Interval
  setInterval: (i: Interval) => void
  /** Where more than one tier of the plan is sold (Max 5x and 20x), the tier is picked here. */
  setPlan?: (p: PlanId) => void
  track?: Track
  termsPath?: string
  back?: () => void
  onPaid: (r: { orderId: string }) => void
}

interface Settings {
  applicationId: string
  locationId: string
  environment?: string
}

interface Catalog {
  slug: string
  price: number
  annualTotal?: number
}

const COUNTRIES: [string, string][] = [
  ['US', phrase('United States')], ['CA', phrase('Canada')], ['GB', phrase('United Kingdom')], ['AU', phrase('Australia')], ['DE', phrase('Germany')], ['FR', phrase('France')], ['ES', phrase('Spain')], ['IT', phrase('Italy')], ['NL', phrase('Netherlands')], ['SE', phrase('Sweden')], ['IE', phrase('Ireland')], ['CH', phrase('Switzerland')], ['JP', phrase('Japan')], ['SG', phrase('Singapore')], ['IN', phrase('India')], ['BR', phrase('Brazil')], ['MX', phrase('Mexico')], ['NZ', phrase('New Zealand')], ['ZA', phrase('South Africa')], ['AE', phrase('United Arab Emirates')],
]

const renews = (interval: Interval): string => {
  const d = new Date()
  if (interval === 'annual') d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

export function Checkout(props: CheckoutProps) {
  const { t } = useI18n()
  const loaded = useCatalog(props.api ?? API)
  if (loaded === null) return <Page site={props.site ?? 'Hanzo'} title="" busy />
  if (!loaded) return <Page site={props.site ?? 'Hanzo'} title={t('Plans could not be loaded just now')} lede={`${t('That is ours to fix.')} ${t('Reload to try again.')}`} center />
  return <CheckoutForm {...props} />
}

function CheckoutForm({ site = 'Hanzo', api = API, org, token: propToken, plan, seats = 1, interval, setInterval, setPlan, track, termsPath = '/terms', back, onPaid }: CheckoutProps) {
  const { t } = useI18n()
  const o = offer(plan)
  const l = useMemo(() => lines(plan, interval, seats), [plan, interval, seats])
  const activeOrg = org || currentOrg() || undefined
  const scope = useMemo(() => (activeOrg ? { 'X-Org-Id': activeOrg } : undefined), [activeOrg])
  const sale = purchase(activeOrg, SLUG[plan], interval, l.seats)
  const token = propToken || bearer() || undefined

  const [settings, setSettings] = useState<Settings | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const [agree, setAgree] = useState(true)
  const [form, setForm] = useState({ name: '', country: 'US', address: '', invoice: '' })
  const card = useRef<{ tokenize: () => Promise<{ status: string; token?: string; errors?: { message?: string }[] }>; destroy: () => Promise<void> } | null>(null)
  const started = useRef(false)

  // The billing form is shown with a total: checkout has started.
  useEffect(() => {
    if (started.current) return
    started.current = true
    track?.('plan_selected', { plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
    track?.('checkout_started', { plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
    // Once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let live = true
    call<Settings>(api, '/v1/billing/settings', { headers: scope }, token)
      .then((s) => live && setSettings(s))
      .catch((e: unknown) => live && setWrong(e instanceof Error ? e.message : t('Payments are not available right now.')))
    return () => {
      live = false
    }
  }, [api, scope, token])

  // The Square card field, drawn once the settings say which application it is.
  useEffect(() => {
    if (!settings) return
    let cancelled = false
    const theme = document.documentElement.classList.contains('light') ? 'light' : 'dark'
    pin(PALETTE[theme])
    void (async () => {
      try {
        await load((settings.environment ?? 'production').toLowerCase() === 'production' ? PRODUCTION : SANDBOX)
        const square = (window as unknown as { Square?: { payments: (a: string, l: string) => Promise<{ card: (o: unknown) => Promise<typeof card.current & { attach: (sel: string) => Promise<void> }> }> } }).Square
        if (cancelled || !square) return
        const payments = await square.payments(settings.applicationId, settings.locationId)
        const c = await payments.card({ style: style(PALETTE[theme]) })
        if (cancelled) {
          await c!.destroy()
          return
        }
        await c!.attach('#hanzo-square')
        card.current = c
        setReady(true)
      } catch (e) {
        if (!cancelled) setWrong(e instanceof Error ? e.message : t('The card form did not load.'))
      }
    })()
    return () => {
      cancelled = true
      const c = card.current
      card.current = null
      setReady(false)
      if (c) void c.destroy().catch(() => undefined)
    }
  }, [settings])

  const fail = useCallback(
    (reason: string, say: string) => {
      track?.('checkout_failed', { reason, plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD' })
      setWrong(say)
      setBusy(false)
    },
    [track, plan, interval, l.seats, l.subtotal],
  )

  async function submit(e?: FormEvent) {
    if (e?.preventDefault) e.preventDefault()
    if (busy || !ready || !card.current) return
    if (!agree) {
      setWrong(t('Please agree to recurring charges to continue.'))
      return
    }
    if (!form.name.trim() || !form.address.trim()) {
      setWrong(t('Enter your full name and address.'))
      return
    }
    setBusy(true)
    setWrong(null)

    if (typeof document !== 'undefined') {
      ;(document.activeElement as HTMLElement)?.blur?.()
    }

    try {
      // The catalog is the price. If it disagrees with the screen, nobody is charged.
      const plans = await call<Catalog[] | { plans: Catalog[] }>(api, '/v1/billing/plans', { headers: scope }, token)
      const row = (Array.isArray(plans) ? plans : plans.plans).find((p) => p.slug === SLUG[plan])
      const cents = Math.round(period(plan, interval) * 100)
      const listed = interval === 'annual' ? row?.annualTotal : row?.price
      if (!row || listed !== cents) {
        fail('catalog', `${t('This plan’s price is being updated, so we have not charged you.')} ${t('Please try again shortly.')}`)
        return
      }

      let result = await card.current.tokenize()
      if (result.status !== 'OK' || !result.token) {
        await new Promise((r) => setTimeout(r, 200))
        result = await card.current.tokenize()
      }

      if (result.status !== 'OK' || !result.token) {
        settle(sale)
        fail('card', result.errors?.[0]?.message ?? `${t('The card could not be read.')} ${t('Check the details and try again.')}`)
        return
      }
      track?.('payment_info_added', { plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
      const paid = await call<{ subscriptionId: string; invoiceId: string; eventId?: string }>(
        api,
        '/v1/billing/subscribe/card',
        {
          method: 'POST',
          headers: { ...scope, 'X-Idempotency-Key': keyFor(sale) },
          // The visitor's choice rides the sale: cloud sends the sale to an ad platform only under it.
          body: JSON.stringify({ sourceId: result.token, planId: SLUG[plan], quantity: l.seats, consent: renderConsent(readConsent()), ...(interval === 'annual' ? { interval: 'year' } : {}) }),
        },
        token,
      )
      settle(sale)
      track?.('order_completed', { ...(paid.eventId ? { event_id: paid.eventId } : {}), order_id: paid.invoiceId || paid.subscriptionId, plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
      onPaid({ orderId: paid.invoiceId || paid.subscriptionId })
    } catch (err) {
      settle(sale)
      fail('declined', err instanceof Error ? err.message : `${t('We could not confirm the payment.')} ${t('Check Billing before you try again.')}`)
    }
  }

  const annual = interval === 'annual'
  const team = o.category === 'team'
  const label = team ? (plan === 'team_premium' ? t('{n} premium seats', { n: l.seats }) : t('{n} standard seats', { n: l.seats })) : o.name
  const charged = usd(l.subtotal)
  const seat = usd(unit(plan, interval))
  const terms = (
    <Anchor href={termsPath} color="$ink" textDecorationLine="underline">
      {t('terms')}
    </Anchor>
  )
  return (
    <Page site={site} title={t('Configure your plan')} back={back} width={1000} start>
      <XStack render={<form onSubmit={submit} noValidate />} flexWrap="wrap" gap="$7" items="flex-start" width="100%">
        <YStack flex={1} flexBasis={360} minW={0} gap="$4">
          {setPlan && plan.startsWith('max') ? (
            <YStack gap="$3" width="100%">
              <XStack justify="space-between" items="center" width="100%">
                <Heading render="h2" size="$4" fontWeight="600" color="$ink" m={0}>
                  {t('Plan')}
                </Heading>
                <IntervalToggle
                  interval={interval}
                  onChange={(i) => {
                    track?.('plan_changed', { from: interval, to: i, field: 'interval', plan })
                    setInterval(i)
                  }}
                  name={o.name}
                  save={saving(plan)}
                />
              </XStack>
              <ChoiceGroup label={t('Plan')} flexWrap="wrap">
                {(['max_5x', 'max_20x'] as const).map((tier) => (
                  <ChoiceCard
                    key={tier}
                    selected={plan === tier}
                    onSelect={() => {
                      track?.('plan_changed', { from: plan, to: tier, field: 'plan' })
                      setPlan(tier)
                    }}
                    flex={1}
                    flexBasis={200}
                  >
                    <XStack justify="space-between" items="center" width="100%">
                      <SizableText size="$3" fontWeight="600" color="$ink">
                        {offer(tier).name}
                      </SizableText>
                      <RadioCircle selected={plan === tier} />
                    </XStack>
                    <SizableText size="$2" color="$ink">
                      {annual ? t('{price}/month · billed yearly', { price: money(unit(tier, interval)) }) : t('{price}/month', { price: money(unit(tier, interval)) })}
                    </SizableText>
                  </ChoiceCard>
                ))}
              </ChoiceGroup>
            </YStack>
          ) : (
            <IntervalChoice
              save={saving(plan)}
              interval={interval}
              setInterval={(i) => {
                track?.('plan_changed', { from: interval, to: i, field: 'interval', plan })
                setInterval(i)
              }}
              price={(i) => {
                const price = usd(lines(plan, i, seats).subtotal)
                return i === 'annual' ? t('{price} / year · billed yearly', { price }) : t('{price} / month', { price })
              }}
            />
          )}

          <Heading render="h2" size="$4" fontWeight="600" color="$ink" mt="$4" m={0}>
            {t('Billing information')}
          </Heading>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-name">{t('Full name')}</FieldLabel>
            <Input id="hanzo-bill-name" name="name" autoComplete="name" value={form.name} onChangeText={(v: string) => setForm((f) => ({ ...f, name: v }))} />
          </Field>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-country">{t('Country or region')}</FieldLabel>
            <Select value={form.country} onValueChange={(v: string) => setForm((f) => ({ ...f, country: v }))}>
              <SelectTrigger id="hanzo-bill-country" aria-label={t('Country or region')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(([c, n]) => (
                  <SelectItem key={c} value={c}>
                    {t(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-address">{t('Address')}</FieldLabel>
            <Input id="hanzo-bill-address" name="address" autoComplete="street-address" value={form.address} onChangeText={(v: string) => setForm((f) => ({ ...f, address: v }))} />
          </Field>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-invoice">{t('Use a different name on invoices (optional)')}</FieldLabel>
            <Input id="hanzo-bill-invoice" name="invoice" value={form.invoice} onChangeText={(v: string) => setForm((f) => ({ ...f, invoice: v }))} />
          </Field>

          <Heading render="h2" size="$4" fontWeight="600" color="$ink" mt="$4" m={0}>
            {t('Payment method')}
          </Heading>
          <YStack id="hanzo-square" aria-label={t('Card details')} minH={90} />
          {!ready && !wrong ? (
            <Paragraph size="$1" color="$quiet" m={0}>
              {t('Loading the card form…')}
            </Paragraph>
          ) : null}
        </YStack>

        <YStack flex={1} flexBasis={360} minW={0}>
          <Panel label={t('Order summary')}>
            <Heading render="h2" size="$5" fontWeight="600" color="$ink" m={0}>
              {team ? t('Team plan') : t('{plan} plan', { plan: o.name })}
            </Heading>
            <Line muted label={annual ? t('{item} annual', { item: label }) : t('{item} monthly', { item: label })} value={charged} />
            <Line muted label={t('Subtotal')} value={charged} />
            <Line muted label={t('Tax')} value={t('Calculated at payment')} />
            <Line strong label={t('Total due today')} value={charged} />
            <Paragraph size="$2" color="$ink" m={0} p="$3" borderWidth={1} borderColor="$borderColor" rounded="$3">
              {[
                t('Your subscription will auto-renew on {date}.', { date: renews(interval) }),
                team
                  ? annual
                    ? t('You will be charged {price}/year ({n} seats × {seat}/seat/month, billed yearly).', { price: charged, n: l.seats, seat })
                    : t('You will be charged {price}/month ({n} seats × {seat}/seat/month).', { price: charged, n: l.seats, seat })
                  : annual
                    ? t('You will be charged {price}/year.', { price: charged })
                    : t('You will be charged {price}/month.', { price: charged }),
                t('Cancel any time in Settings → Billing.'),
              ].join(' ')}
            </Paragraph>
            <XStack items="flex-start" gap="$3">
              <Checkbox id="hanzo-consent" checked={agree} onCheckedChange={(v: boolean | 'indeterminate') => setAgree(v === true)} mt="$1" aria-label={t('Agree to recurring charges')} />
              <Paragraph render="label" htmlFor="hanzo-consent" size="$2" color="$ink" flex={1} m={0}>
                {annual
                  ? t('You agree that {site} will charge your card in the amount above now and on a recurring yearly basis until you cancel in accordance with our {terms}.', { site, terms })
                  : t('You agree that {site} will charge your card in the amount above now and on a recurring monthly basis until you cancel in accordance with our {terms}.', { site, terms })}
                {` ${t('You can cancel at any time in your account settings.')}`}
              </Paragraph>
            </XStack>
            {wrong ? <FieldError>{t(wrong)}</FieldError> : null}
            <Primary
              type="button"
              disabled={!ready || busy}
              onClick={() => void submit()}
              onPress={() => void submit()}
            >
              {busy ? t('One moment…') : t('Subscribe')}
            </Primary>
          </Panel>
        </YStack>
      </XStack>
    </Page>
  )
}
