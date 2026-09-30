'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Check, ChevronDown, User, Users } from '@hanzogui/lucide-icons-2'
import { Button } from '../backends/gui/button'
import { Card, CardContent } from '../backends/gui/card'
import { ChoiceCard, ChoiceGroup } from '../backends/gui/choice'
import { Field, FieldError, FieldLabel } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, SizableText, XStack, YStack } from '../backends/gui/layout'
import { Stepper } from '../backends/gui/stepper'
import { Textarea } from '../backends/gui/textarea'
import { ApiError, call } from './api'
import { IntervalToggle, Line, Panel } from './frame'
import { ENTERPRISE_FROM, MAX_SEATS, MIN_SEATS, OFFERS, SEAT_ADDON, lines, money, saving, unit, usd, type Interval, type PlanId } from './plans'
import type { Use } from './state'

/** A team's IAM handle from its name: lowercase words joined by hyphens, 39 characters at most. */
export const slug = (name: string): string =>
  name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 39)
    .replace(/-+$/, '')

/** The filled, full-width action of a screen. */
export function Primary({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" size="lg" rounded="$10" bg="$ink" color="$background" borderColor="$ink" hoverStyle={{ opacity: 0.92 }} {...props}>
      {children}
    </Button>
  )
}

/** A quiet text-sized action set inside a sentence. */
function Ask({ onAsk }: { onAsk?: () => void }) {
  return onAsk ? (
    <Button type="button" variant="link" size="sm" px={0} minH={0} onClick={onAsk}>
      Ask our buying specialist
    </Button>
  ) : (
    <Anchor href="/contact-sales" color="$ink" textDecorationLine="underline">
      Ask our buying specialist
    </Anchor>
  )
}

/* ------------------------------------------------------------------ use */

function UseCard({ icon, name, note, on, dim, onPress, size = 'large' }: { icon?: React.ReactNode; name: string; note: string; on?: boolean; dim?: boolean; onPress: () => void; size?: 'large' | 'small' }) {
  return (
    <Card interactive aria-expanded={on} onPress={onPress} flex={1} flexBasis={280} maxW={320} minH={size === 'large' ? 340 : 0} bg="$panel" opacity={dim ? 0.5 : 1} borderColor={on ? '$ink' : '$borderColor'} items="center" justify="center" gap="$3" p="$5">
      {icon}
      <Heading render="h2" size="$7" fontWeight="500" color="$ink" text="center" m={0}>
        {name}
      </Heading>
      <Paragraph size="$3" color="$quiet" text="center" m={0}>
        {note}
      </Paragraph>
    </Card>
  )
}

export function UseCards({ onPick, onAsk }: { onPick: (u: Use) => void; onAsk?: () => void }) {
  const [team, setTeam] = useState(false)
  return (
    <YStack items="center" gap="$5" width="100%">
      <XStack role="group" aria-label="How you will use Hanzo" flexWrap="wrap" justify="center" gap="$6" width="100%">
        <UseCard icon={<User size={64} />} name="For personal use" note="For individuals who want to build and experiment with their own projects" dim={team} onPress={() => onPick('personal')} />
        <UseCard icon={<Users size={64} />} name="With my team" note="For organizations who want to collaborate and build at scale" on={team} onPress={() => setTeam(true)} />
      </XStack>
      {team ? (
        <>
          <XStack role="group" aria-label="Team size" flexWrap="wrap" justify="center" gap="$6" width="100%">
            <UseCard size="small" name="Team" note={`For ${MIN_SEATS}–${MAX_SEATS} people. Predictable per-seat pricing, set up in minutes.`} onPress={() => onPick('team')} />
            <UseCard size="small" name="Enterprise" note={`For ${ENTERPRISE_FROM} or more people. Pooled usage, advanced admin and security controls.`} onPress={() => onPick('enterprise')} />
          </XStack>
          <XStack items="center" gap="$1">
            <SizableText size="$2" color="$quiet">
              Questions?
            </SizableText>
            <Ask onAsk={onAsk} />
          </XStack>
        </>
      ) : null}
    </YStack>
  )
}

/* ---------------------------------------------------------------- plans */

function PlanCard({ id, cta, onPick, interval, setInterval, toggle }: { id: PlanId; cta: string; onPick: () => void; interval: Interval; setInterval: (i: Interval) => void; toggle?: boolean }) {
  const o = OFFERS[id]
  return (
    <Card aria-label={o.name} bg="$panel" flex={1} flexBasis={300} maxW={380} gap="$0" py={0}>
      <YStack p="$5" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <XStack minH={36} justify="flex-end">
          {toggle ? <IntervalToggle interval={interval} onChange={setInterval} name={o.name} /> : null}
        </XStack>
        <Heading render="h2" size="$7" fontWeight="600" color="$ink" m={0}>
          {o.name}
        </Heading>
        <Paragraph size="$3" color="$quiet" m={0}>
          {o.blurb}
        </Paragraph>
        <XStack items="center" gap="$2" my="$2">
          <SizableText size="$10" fontWeight="600" color="$ink">
            {money(unit(id, interval))}
          </SizableText>
          <SizableText size="$1" color="$quiet">
            {`USD / month\nbilled ${interval === 'annual' ? 'yearly' : 'monthly'}`}
          </SizableText>
        </XStack>
        <Primary onClick={onPick}>
          {cta}
        </Primary>
        {o.monthly > 0 ? (
          <Paragraph size="$1" color="$quiet" text="center" m={0}>
            No commitment · Cancel anytime
          </Paragraph>
        ) : null}
      </YStack>
      <YStack render="ul" p="$5" gap="$2.5" m={0}>
        {o.features.map((f) => (
          <XStack key={f} render="li" items="flex-start" gap="$2.5">
            <Check size={16} />
            <SizableText size="$2" color="$quiet" flex={1}>
              {f}
            </SizableText>
          </XStack>
        ))}
      </YStack>
    </Card>
  )
}

export function Plans({ interval, setInterval, onFree, onPick }: { interval: Interval; setInterval: (i: Interval) => void; onFree: () => void; onPick: (p: PlanId) => void }) {
  return (
    <YStack items="center" gap="$4" width="100%">
      <XStack flexWrap="wrap" justify="center" gap="$5" width="100%">
        <PlanCard id="free" cta="Use Hanzo for free" onPick={onFree} interval={interval} setInterval={setInterval} />
        <PlanCard id="dev" cta="Get Dev plan" onPick={() => onPick('dev')} interval={interval} setInterval={setInterval} toggle />
        <PlanCard id="max" cta="Get Max plan" onPick={() => onPick('max')} interval={interval} setInterval={setInterval} />
      </XStack>
      <Paragraph size="$1" color="$quiet" text="center" m={0}>
        Prices are in US dollars. Usage limits apply, and plans are subject to change.
      </Paragraph>
    </YStack>
  )
}

/* ----------------------------------------------------------------- team */

export function TeamName({ api, onCreated }: { api: string; onCreated: (org: string) => void | Promise<void> }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const handle = useMemo(() => slug(name), [name])
  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!handle || busy) return
    setBusy(true)
    setWrong(null)
    try {
      // The account's own route makes the organization the caller owns, named by
      // IAM; the reserved admin org and the brand orgs are never a team's home.
      const made = await call<{ org?: string }>(api, '/v1/account/orgs', { method: 'POST', body: JSON.stringify({ name: name.trim() }) })
      if (!made?.org) throw new ApiError('The team was made but its name did not come back. Reload to find it.', 200)
      await onCreated(made.org)
    } catch (err) {
      setWrong(err instanceof ApiError ? err.message : 'Could not create the team. Try again.')
      setBusy(false)
    }
  }
  return (
    <YStack render={<form onSubmit={submit} noValidate />} gap="$4" items="stretch">
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-team">Team name</FieldLabel>
        <Input id="hanzo-team" name="team" autoComplete="organization" value={name} onChangeText={setName} maxLength={60} height={48} autoFocus />
      </Field>
      {wrong ? <FieldError>{wrong}</FieldError> : null}
      <Primary type="submit" disabled={!handle || busy} self="flex-start" px="$6">
        {busy ? 'One moment…' : 'Continue'}
      </Primary>
    </YStack>
  )
}

/* ---------------------------------------------------------------- seats */

export function IntervalChoice({ interval, setInterval, price }: { interval: Interval; setInterval: (i: Interval) => void; price: (i: Interval) => string }) {
  return (
    <ChoiceGroup label="Billing interval" flexWrap="wrap">
      {(['monthly', 'annual'] as const).map((i) => (
        <ChoiceCard key={i} selected={interval === i} onSelect={() => setInterval(i)} flex={1} flexBasis={200}>
          {i === 'annual' ? (
            <SizableText size="$1" color="$ink" self="flex-end" bg="$edge" px="$2" rounded="$1">
              {`Save ${saving}%`}
            </SizableText>
          ) : null}
          <SizableText size="$3" fontWeight="600" color="$ink">
            {i === 'annual' ? 'Annually' : 'Monthly'}
          </SizableText>
          <SizableText size="$2" color="$ink">
            {price(i)}
          </SizableText>
        </ChoiceCard>
      ))}
    </ChoiceGroup>
  )
}

export function Seats({
  interval,
  setInterval,
  value,
  setValue,
  onContinue,
  onEnterprise,
  onAsk,
}: {
  interval: Interval
  setInterval: (i: Interval) => void
  value: { plan: PlanId; seats: number }
  setValue: (v: { plan: PlanId; seats: number }) => void
  onContinue: () => void
  onEnterprise: () => void
  onAsk?: () => void
}) {
  const [adjust, setAdjust] = useState(false)
  const std = value.plan === 'team_standard'
  const l = lines(value.plan, interval, value.seats)
  const set = (plan: PlanId, seats: number) => setValue({ plan, seats: Math.max(MIN_SEATS, Math.min(MAX_SEATS, seats)) })
  return (
    <>
      <IntervalChoice interval={interval} setInterval={setInterval} price={(i) => `${usd(lines(value.plan, i, value.seats).subtotal)}/${i === 'annual' ? 'year' : 'month'} + tax`} />
      <Panel label="Order details">
        <Heading render="h2" size="$5" fontWeight="600" color="$ink" m={0}>
          Order details
        </Heading>
        <Line
          label={`${value.seats} ${std ? 'Standard' : 'Premium'} seats`}
          note={`× ${usd(unit(value.plan, interval))} per seat /month${interval === 'annual' ? ', billed yearly' : ''}`}
          value={usd(l.subtotal)}
          strong
        />
        <Button type="button" variant="secondary" size="lg" aria-expanded={adjust} onClick={() => setAdjust((a) => !a)}>
          Adjust seats
          <ChevronDown size={16} />
        </Button>
        {adjust ? (
          <YStack gap="$3">
            <XStack justify="space-between" items="center" gap="$3">
              <Line label="Standard seat" note={`Dev + ${usd(SEAT_ADDON)} · ${usd(unit('team_standard', interval))}/seat/month`} value="" />
              <Stepper label="Standard seats" value={std ? value.seats : 0} min={0} max={MAX_SEATS} onChange={(n) => (n === 0 ? set('team_premium', value.seats) : set('team_standard', n))} />
            </XStack>
            <XStack justify="space-between" items="center" gap="$3">
              <Line label="Premium seat" note={`Max + ${usd(SEAT_ADDON)} · ${usd(unit('team_premium', interval))}/seat/month`} value="" />
              <Stepper label="Premium seats" value={std ? 0 : value.seats} min={0} max={MAX_SEATS} onChange={(n) => (n === 0 ? set('team_standard', value.seats) : set('team_premium', n))} />
            </XStack>
            {value.seats >= ENTERPRISE_FROM ? (
              <XStack items="center" gap="$1">
                <SizableText size="$1" color="$quiet">
                  {ENTERPRISE_FROM} or more?
                </SizableText>
                {onAsk ? (
                  <Ask onAsk={onAsk} />
                ) : (
                  <Button type="button" variant="link" size="sm" px={0} minH={0} onClick={onEnterprise}>
                    Talk to sales
                  </Button>
                )}
              </XStack>
            ) : null}
          </YStack>
        ) : null}
        <Line label="Subtotal" value={usd(l.subtotal)} strong />
        <Line label="Tax (if applicable)" value="Calculated at payment" muted />
        <Line label="Total due today" value={`${usd(l.subtotal)} + tax`} strong />
      </Panel>
      <Primary onClick={onContinue}>
        Continue to payment
      </Primary>
    </>
  )
}

/* ----------------------------------------------------------- enterprise */

export function Enterprise({ api, onSent }: { api: string; onSent: () => void }) {
  const [f, setF] = useState({ name: '', email: '', company: '', size: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (v: string) => setF((cur) => ({ ...cur, [k]: v }))
  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!f.name.trim() || !f.email.includes('@') || !f.company.trim()) {
      setWrong('Fill in your name, work email and company.')
      return
    }
    setBusy(true)
    setWrong(null)
    try {
      await call(api, '/v1/marketing/leads', { method: 'POST', body: JSON.stringify({ ...f, source: `${window.location.hostname}/onboarding` }) })
      onSent()
    } catch {
      setWrong('That did not go through. Try again, or email sales@hanzo.ai.')
      setBusy(false)
    }
  }
  return (
    <YStack render={<form onSubmit={submit} noValidate />} gap="$4" items="stretch">
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-name">Your name</FieldLabel>
        <Input id="hanzo-sales-name" value={f.name} onChangeText={set('name')} autoComplete="name" />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-email">Work email</FieldLabel>
        <Input id="hanzo-sales-email" type="email" value={f.email} onChangeText={set('email')} autoComplete="email" />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-company">Company</FieldLabel>
        <Input id="hanzo-sales-company" value={f.company} onChangeText={set('company')} autoComplete="organization" />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-size">How many people?</FieldLabel>
        <Input id="hanzo-sales-size" inputMode="numeric" value={f.size} onChangeText={set('size')} />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-message">What are you looking to do?</FieldLabel>
        <Textarea id="hanzo-sales-message" rows={3} value={f.message} onChangeText={set('message')} />
      </Field>
      {wrong ? <FieldError>{wrong}</FieldError> : null}
      <Primary type="submit" disabled={busy}>
        {busy ? 'One moment…' : 'Contact sales'}
      </Primary>
    </YStack>
  )
}
