'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { PALETTE } from '@hanzo/pay'
import { load, pin, PRODUCTION, SANDBOX, style } from '@hanzo/pay/web'
import { Checkbox } from '../backends/gui/checkbox'
import { Field, FieldError, FieldLabel } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, XStack, YStack } from '../backends/gui/layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../backends/gui/select'
import { ApiError, API, call } from './api'
import { Line, Page, Panel } from './frame'
import { IntervalChoice, Primary } from './screens'
import type { Track } from './hooks'
import { item, lines, OFFERS, period, SLUG, unit, usd, type Interval, type PlanId } from './plans'

/**
 * THE checkout: one component for the personal path, the team path and every
 * in-app Upgrade entry. Commerce prices the plan (POST /v1/billing/subscribe/card
 * names a catalog plan, never an amount); the card is a Square Web Payments
 * field mounted here, so no card data touches this page or this code.
 *
 * Before it charges, it reads the catalog and refuses if the catalog's price is
 * not the one on screen, so a person is never billed a different amount than the
 * one they agreed to.
 */

export interface CheckoutProps {
  site?: string
  api?: string
  /** The IAM org the plan is bought for; omitted, the caller's own. */
  org?: string
  plan: PlanId
  seats?: number
  interval: Interval
  setInterval: (i: Interval) => void
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
  ['US', 'United States'], ['CA', 'Canada'], ['GB', 'United Kingdom'], ['AU', 'Australia'], ['DE', 'Germany'], ['FR', 'France'], ['ES', 'Spain'], ['IT', 'Italy'], ['NL', 'Netherlands'], ['SE', 'Sweden'], ['IE', 'Ireland'], ['CH', 'Switzerland'], ['JP', 'Japan'], ['SG', 'Singapore'], ['IN', 'India'], ['BR', 'Brazil'], ['MX', 'Mexico'], ['NZ', 'New Zealand'], ['ZA', 'South Africa'], ['AE', 'United Arab Emirates'],
]

const key = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
const renews = (interval: Interval): string => {
  const d = new Date()
  if (interval === 'annual') d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

export function Checkout({ site = 'Hanzo', api = API, org, plan, seats = 1, interval, setInterval, track, termsPath = '/terms', back, onPaid }: CheckoutProps) {
  const offer = OFFERS[plan]
  const l = useMemo(() => lines(plan, interval, seats), [plan, interval, seats])
  const scope = useMemo(() => (org ? { 'X-Org-Id': org } : undefined), [org])

  const [settings, setSettings] = useState<Settings | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const [agree, setAgree] = useState(false)
  const [form, setForm] = useState({ name: '', country: 'US', address: '', invoice: '' })
  const card = useRef<{ tokenize: () => Promise<{ status: string; token?: string; errors?: { message?: string }[] }>; destroy: () => Promise<void> } | null>(null)
  const attempt = useRef(key())
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
    call<Settings>(api, '/v1/billing/settings', { headers: scope })
      .then((s) => live && setSettings(s))
      .catch((e: unknown) => live && setWrong(e instanceof Error ? e.message : 'Payments are not available right now.'))
    return () => {
      live = false
    }
  }, [api, scope])

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
        if (!cancelled) setWrong(e instanceof Error ? e.message : 'The card form did not load.')
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

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy || !agree || !ready || !card.current) return
    if (!form.name.trim() || !form.address.trim()) {
      setWrong('Enter your full name and address.')
      return
    }
    setBusy(true)
    setWrong(null)
    try {
      // The catalog is the price. If it disagrees with the screen, nobody is charged.
      const plans = await call<Catalog[] | { plans: Catalog[] }>(api, '/v1/billing/plans', { headers: scope })
      const row = (Array.isArray(plans) ? plans : plans.plans).find((p) => p.slug === SLUG[plan])
      const cents = Math.round(period(plan, interval) * 100)
      const listed = interval === 'annual' ? row?.annualTotal : row?.price
      if (!row || listed !== cents) {
        fail('catalog', 'This plan’s price is being updated, so we have not charged you. Please try again shortly.')
        return
      }
      const result = await card.current.tokenize()
      if (result.status !== 'OK' || !result.token) {
        fail('card', result.errors?.[0]?.message ?? 'The card could not be read. Check the details and try again.')
        return
      }
      track?.('payment_info_added', { plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
      const paid = await call<{ subscriptionId: string; invoiceId: string }>(api, '/v1/billing/subscribe/card', {
        method: 'POST',
        headers: { ...scope, 'X-Idempotency-Key': attempt.current },
        body: JSON.stringify({ sourceId: result.token, planId: SLUG[plan], quantity: l.seats, ...(interval === 'annual' ? { interval: 'year' } : {}) }),
      })
      track?.('order_completed', { order_id: paid.invoiceId, plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
      onPaid({ orderId: paid.invoiceId })
    } catch (err) {
      attempt.current = key()
      fail('declined', err instanceof ApiError ? err.message : 'The payment did not go through. You have not been charged.')
    }
  }

  const per = interval === 'annual' ? 'year' : 'month'
  const label = offer.category === 'team' ? `${l.seats} ${offer.name.toLowerCase()}s` : offer.name
  const every = interval === 'annual' ? 'yearly' : 'monthly'
  return (
    <Page site={site} title="Configure your plan" back={back} width={1000} start>
      <XStack render={<form onSubmit={submit} noValidate />} flexWrap="wrap" gap="$7" items="flex-start" width="100%">
        <YStack flex={1} flexBasis={360} minW={0} gap="$4">
          <IntervalChoice
            interval={interval}
            setInterval={(i) => {
              track?.('plan_changed', { from: interval, to: i, field: 'interval', plan })
              setInterval(i)
            }}
            price={(i) => `${offer.name} ${i === 'annual' ? 'annual' : 'monthly'} · USD ${usd(lines(plan, i, seats).subtotal)} · billed ${i === 'annual' ? 'yearly' : 'monthly'}`}
          />

          <Heading render="h2" size="$4" fontWeight="600" color="$ink" mt="$4" m={0}>
            Billing information
          </Heading>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-name">Full name</FieldLabel>
            <Input id="hanzo-bill-name" name="name" autoComplete="name" value={form.name} onChangeText={(v: string) => setForm((f) => ({ ...f, name: v }))} />
          </Field>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-country">Country or region</FieldLabel>
            <Select value={form.country} onValueChange={(v: string) => setForm((f) => ({ ...f, country: v }))}>
              <SelectTrigger id="hanzo-bill-country" aria-label="Country or region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(([c, n]) => (
                  <SelectItem key={c} value={c}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-address">Address</FieldLabel>
            <Input id="hanzo-bill-address" name="address" autoComplete="street-address" value={form.address} onChangeText={(v: string) => setForm((f) => ({ ...f, address: v }))} />
          </Field>
          <Field gap="$2">
            <FieldLabel htmlFor="hanzo-bill-invoice">Use a different name on invoices (optional)</FieldLabel>
            <Input id="hanzo-bill-invoice" name="invoice" value={form.invoice} onChangeText={(v: string) => setForm((f) => ({ ...f, invoice: v }))} />
          </Field>

          <Heading render="h2" size="$4" fontWeight="600" color="$ink" mt="$4" m={0}>
            Payment method
          </Heading>
          <YStack id="hanzo-square" aria-label="Card details" minH={90} />
          {!ready && !wrong ? (
            <Paragraph size="$1" color="$quiet" m={0}>
              Loading the card form…
            </Paragraph>
          ) : null}
        </YStack>

        <YStack flex={1} flexBasis={360} minW={0}>
          <Panel label="Order summary">
            <Heading render="h2" size="$5" fontWeight="600" color="$ink" m={0}>
              {offer.category === 'team' ? 'Team plan' : `${offer.name} plan`}
            </Heading>
            <Line muted label={`${label} ${interval === 'annual' ? 'annual' : 'monthly'}`} value={usd(l.subtotal)} />
            <Line muted label="Subtotal" value={usd(l.subtotal)} />
            <Line muted label="Tax" value="Calculated at payment" />
            <Line strong label="Total due today" value={usd(l.subtotal)} />
            <Paragraph size="$2" color="$ink" m={0} p="$3" borderWidth={1} borderColor="$borderColor" rounded="$3">
              Your subscription will auto-renew on {renews(interval)}. You will be charged {usd(l.subtotal)}/{per}
              {offer.category === 'team' ? ` (${l.seats} seats × ${usd(unit(plan, interval))}/seat/month${interval === 'annual' ? ', billed yearly' : ''})` : ''}. Cancel any time in Settings → Billing.
            </Paragraph>
            <XStack items="flex-start" gap="$3">
              <Checkbox id="hanzo-consent" checked={agree} onCheckedChange={(v: boolean | 'indeterminate') => setAgree(v === true)} mt="$1" aria-label="Agree to recurring charges" />
              <Paragraph render="label" htmlFor="hanzo-consent" size="$2" color="$ink" flex={1} m={0}>
                You agree that {site} will charge your card in the amount above now and on a recurring {every} basis until you cancel in accordance with our{' '}
                <Anchor href={termsPath} color="$ink" textDecorationLine="underline">
                  terms
                </Anchor>
                . You can cancel at any time in your account settings.
              </Paragraph>
            </XStack>
            {wrong ? <FieldError>{wrong}</FieldError> : null}
            <Primary type="submit" disabled={!agree || !ready || busy}>
              {busy ? 'One moment…' : 'Subscribe'}
            </Primary>
          </Panel>
        </YStack>
      </XStack>
    </Page>
  )
}
