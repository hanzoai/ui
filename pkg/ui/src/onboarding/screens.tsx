'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Check, ChevronDown, User, Users } from '@hanzogui/lucide-icons-2'
import { Badge } from '../backends/gui/badge'
import { Button } from '../backends/gui/button'
import { Card, CardContent } from '../backends/gui/card'
import { ChoiceCard, ChoiceGroup, RadioCircle } from '../backends/gui/choice'
import { Field, FieldError, FieldLabel } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, SizableText, XStack, YStack } from '../backends/gui/layout'
import { Stepper } from '../backends/gui/stepper'
import { Textarea } from '../backends/gui/textarea'
import { ApiError, call } from './api'
import { IntervalToggle, Line, Panel } from './frame'
import { ENTERPRISE_FROM, MAX_SEATS, MIN_SEATS, has, lines, money, offer, saving, unit, usd, yearly, type Interval, type PlanId } from './plans'
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
  const { t } = useI18n()
  return onAsk ? (
    <Button type="button" variant="link" size="sm" px={0} minH={0} onClick={onAsk}>
      {t('Ask our buying specialist')}
    </Button>
  ) : (
    <Anchor href="/contact-sales" color="$ink" textDecorationLine="underline">
      {t('Ask our buying specialist')}
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
  const { t } = useI18n()
  const [team, setTeam] = useState(false)
  return (
    <YStack items="center" gap="$5" width="100%">
      <XStack role="group" aria-label={t('How you will use Hanzo')} flexWrap="wrap" justify="center" gap="$6" width="100%">
        <UseCard icon={<User size={64} />} name={t('For personal use')} note={t('For individuals who want to build and experiment with their own projects')} dim={team} onPress={() => onPick('personal')} />
        <UseCard icon={<Users size={64} />} name={t('With my team')} note={t('For organizations who want to collaborate and build at scale')} on={team} onPress={() => setTeam(true)} />
      </XStack>
      {team ? (
        <>
          <XStack role="group" aria-label={t('Team size')} flexWrap="wrap" justify="center" gap="$6" width="100%">
            <UseCard size="small" name={t('Team')} note={`${t('For {min}–{max} people.', { min: MIN_SEATS, max: MAX_SEATS })} ${t('Predictable per-seat pricing, set up in minutes.')}`} onPress={() => onPick('team')} />
            <UseCard size="small" name={t('Enterprise')} note={`${t('For {n} or more people.', { n: ENTERPRISE_FROM })} ${t('Pooled usage, advanced admin and security controls.')}`} onPress={() => onPick('enterprise')} />
          </XStack>
          <XStack items="center" gap="$1">
            <SizableText size="$2" color="$quiet">
              {t('Questions?')}
            </SizableText>
            <Ask onAsk={onAsk} />
          </XStack>
        </>
      ) : null}
    </YStack>
  )
}

/* ---------------------------------------------------------------- plans */

/** A plan's features: a line ending in a colon is a heading for the ones under it, the rest are ticked. */
function Features({ items }: { items: string[] }) {
  return (
    <YStack render="ul" p="$5" gap="$2.5" m={0}>
      {items.map((f) =>
        f.endsWith(':') ? (
          <XStack key={f} render="li">
            <SizableText size="$2" color="$ink" fontWeight="500">
              {f}
            </SizableText>
          </XStack>
        ) : (
          <XStack key={f} render="li" items="flex-start" gap="$2.5">
            <Check size={16} />
            <SizableText size="$2" color="$quiet" flex={1}>
              {f}
            </SizableText>
          </XStack>
        ),
      )}
    </YStack>
  )
}

function PlanCard({ id, cta, onPick, interval, setInterval, toggle, from }: { id: PlanId; cta: string; onPick: () => void; interval: Interval; setInterval: (i: Interval) => void; toggle?: boolean; from?: boolean }) {
  const { t } = useI18n()
  const o = offer(id)
  return (
    <Card aria-label={from ? 'Max' : o.name} bg="$panel" flex={1} flexBasis={300} maxW={380} gap="$0" py={0}>
      <YStack p="$5" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <XStack minH={36} justify="flex-end">
          {toggle && yearly(id) ? <IntervalToggle interval={interval} onChange={setInterval} name={o.name} save={saving(id)} /> : null}
        </XStack>
        <Heading render="h2" size="$7" fontWeight="600" color="$ink" m={0}>
          {from ? 'Max' : o.name}
        </Heading>
        <Paragraph size="$3" color="$quiet" m={0}>
          {o.blurb}
        </Paragraph>
        <XStack items="center" gap="$2" my="$2">
          <SizableText size="$10" fontWeight="600" color="$ink">
            {from ? t('From {price}', { price: money(unit(id, interval)) }) : money(unit(id, interval))}
          </SizableText>
          <SizableText size="$1" color="$quiet">
            {interval === 'annual' && yearly(id) ? t('USD / month\nbilled yearly') : t('USD / month\nbilled monthly')}
          </SizableText>
        </XStack>
        <Primary onClick={onPick}>
          {cta}
        </Primary>
        {o.monthly > 0 ? (
          <Paragraph size="$1" color="$quiet" text="center" m={0}>
            {t('No commitment · Cancel anytime')}
          </Paragraph>
        ) : null}
      </YStack>
      <Features items={o.features} />
    </Card>
  )
}

export function Plans({ interval, setInterval, onFree, onPick, onTeam }: { interval: Interval; setInterval: (i: Interval) => void; onFree: () => void; onPick: (p: PlanId) => void; onTeam?: () => void }) {
  const { t } = useI18n()
  return (
    <YStack items="center" gap="$4" width="100%">
      <XStack flexWrap="wrap" justify="center" gap="$5" width="100%">
        <PlanCard id="free" cta={t('Use Hanzo for free')} onPick={onFree} interval={interval} setInterval={setInterval} />
        <PlanCard id="dev" cta={t('Get {plan} plan', { plan: offer('dev').name })} onPick={() => onPick('dev')} interval={interval} setInterval={setInterval} toggle />
        <PlanCard id="max_5x" cta={t('Get {plan} plan', { plan: 'Max' })} onPick={() => onPick('max_5x')} interval={interval} setInterval={setInterval} from />
      </XStack>
      <Paragraph size="$1" color="$quiet" text="center" m={0}>
        {`${t('Prices are in US dollars.')} ${t('Usage limits apply.')} ${t('Prices and plans are subject to change at Hanzo’s discretion.')}`}
      </Paragraph>
      {onTeam ? (
        <Button type="button" variant="link" size="sm" onClick={onTeam}>
          {t('Using Hanzo with a team?')}
        </Button>
      ) : null}
    </YStack>
  )
}

/** "Do more with Hanzo Pro": the one plan worth recommending, with the way to stay free and the way to see the rest. */
export function Pro({ interval, setInterval, onPro, onFree, onAll }: { interval: Interval; setInterval: (i: Interval) => void; onPro: () => void; onFree: () => void; onAll: () => void }) {
  const { t } = useI18n()
  const o = offer('dev')
  return (
    <YStack items="center" gap="$4" width="100%">
      <IntervalToggle interval={interval} onChange={setInterval} name={o.name} save={saving('dev')} />
      <Card aria-label={o.name} bg="$panel" width="100%" gap="$0" py={0}>
        <YStack p="$5" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack justify="flex-end" minH={24}>
            <Badge variant="secondary">{t('Recommended')}</Badge>
          </XStack>
          <Heading render="h2" size="$7" fontWeight="600" color="$ink" m={0}>
            {o.name}
          </Heading>
          <Paragraph size="$3" color="$quiet" m={0}>
            {o.blurb}
          </Paragraph>
          <XStack items="center" gap="$2" my="$2">
            <SizableText size="$10" fontWeight="600" color="$ink">
              {money(unit('dev', interval))}
            </SizableText>
            <SizableText size="$1" color="$quiet">
              {interval === 'annual' && yearly('dev') ? t('USD / month\nbilled yearly') : t('USD / month\nbilled monthly')}
            </SizableText>
          </XStack>
          <Primary onClick={onPro}>{t('Get {plan} plan', { plan: o.name })}</Primary>
          <Button type="button" variant="secondary" size="lg" rounded="$10" onClick={onFree}>
            {t('Use Hanzo for free')}
          </Button>
          <Paragraph size="$1" color="$quiet" text="center" m={0}>
            {t('No commitment · Cancel anytime')}
          </Paragraph>
        </YStack>
        <Features items={o.features} />
      </Card>
      <Button type="button" variant="secondary" size="lg" width="100%" onClick={onAll}>
        {t('View all plans')}
      </Button>
      <Paragraph size="$1" color="$quiet" text="center" m={0}>
        {`${t('Prices are in US dollars.')} ${t('Prices and plans are subject to change at Hanzo’s discretion.')}`}
      </Paragraph>
    </YStack>
  )
}

/* ----------------------------------------------------------------- team */

export function TeamName({ api, onCreated }: { api: string; onCreated: (org: string) => void | Promise<void> }) {
  const { t } = useI18n()
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
      if (!made?.org) throw new ApiError(`${t('The team was made but its name did not come back.')} ${t('Reload to find it.')}`, 200)
      await onCreated(made.org)
    } catch (err) {
      setWrong(err instanceof ApiError ? err.message : `${t('Could not create the team.')} ${t('Try again.')}`)
      setBusy(false)
    }
  }
  return (
    <YStack render={<form onSubmit={submit} noValidate />} gap="$4" items="stretch">
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-team">{t('Team name')}</FieldLabel>
        <Input id="hanzo-team" name="team" autoComplete="organization" value={name} onChangeText={setName} maxLength={60} height={48} autoFocus />
      </Field>
      {wrong ? <FieldError>{t(wrong)}</FieldError> : null}
      <Primary type="submit" disabled={!handle || busy} self="flex-start" px="$6">
        {busy ? t('One moment…') : t('Continue')}
      </Primary>
    </YStack>
  )
}

/* ---------------------------------------------------------------- seats */

export function IntervalChoice({ interval, setInterval, price, save }: { interval: Interval; setInterval: (i: Interval) => void; price: (i: Interval) => string; save: number }) {
  const { t } = useI18n()
  return (
    <ChoiceGroup label={t('Billing interval')} flexWrap="wrap">
      {(['monthly', 'annual'] as const).filter((i) => i === 'monthly' || save > 0).map((i) => (
        <ChoiceCard key={i} selected={interval === i} onSelect={() => setInterval(i)} flex={1} flexBasis={200}>
          <XStack justify="space-between" items="center" width="100%">
            <SizableText size="$3" fontWeight="600" color="$ink">
              {i === 'annual' ? t('Annually') : t('Monthly')}
            </SizableText>
            <RadioCircle selected={interval === i} />
          </XStack>
          <XStack justify="space-between" items="center" width="100%">
            <SizableText size="$2" color="$ink">
              {price(i)}
            </SizableText>
            {i === 'annual' ? (
              <SizableText size="$1" color="$ink" bg="$edge" px="$2" rounded="$1">
                {t('Save {n}%', { n: save })}
              </SizableText>
            ) : null}
          </XStack>
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
  const { t } = useI18n()
  const [adjust, setAdjust] = useState(false)
  const std = value.plan === 'team_standard'
  const premium = has('team_premium')
  const l = lines(value.plan, interval, value.seats)
  const set = (plan: PlanId, seats: number) => setValue({ plan, seats: Math.max(MIN_SEATS, Math.min(MAX_SEATS, seats)) })
  return (
    <>
      <IntervalChoice
        interval={interval}
        setInterval={setInterval}
        save={saving(value.plan)}
        price={(i) => {
          const price = usd(lines(value.plan, i, value.seats).subtotal)
          return i === 'annual' ? t('{price}/year + tax', { price }) : t('{price}/month + tax', { price })
        }}
      />
      <Panel label={t('Order details')}>
        <Heading render="h2" size="$5" fontWeight="600" color="$ink" m={0}>
          {t('Order details')}
        </Heading>
        <Line
          label={std ? t('{n} Standard seats', { n: value.seats }) : t('{n} Premium seats', { n: value.seats })}
          note={
            interval === 'annual'
              ? t('× {price} per seat /month, billed yearly', { price: usd(unit(value.plan, interval)) })
              : t('× {price} per seat /month', { price: usd(unit(value.plan, interval)) })
          }
          value={usd(l.subtotal)}
          strong
        />
        <Button type="button" variant="secondary" size="lg" aria-expanded={adjust} onClick={() => setAdjust((a) => !a)}>
          {t('Adjust seats')}
          <ChevronDown size={16} />
        </Button>
        {adjust ? (
          <YStack gap="$3">
            <XStack justify="space-between" items="center" gap="$3">
              <Line label={t('Standard seat')} note={t('{price}/seat/month', { price: usd(unit('team_standard', interval)) })} value="" />
              <Stepper label={t('Standard seats')} value={std ? value.seats : 0} min={0} max={MAX_SEATS} onChange={(n) => (n === 0 && premium ? set('team_premium', value.seats) : set('team_standard', Math.max(n, MIN_SEATS)))} />
            </XStack>
            {premium ? (
              <XStack justify="space-between" items="center" gap="$3">
                <Line label={t('Premium seat')} note={t('{price}/seat/month', { price: usd(unit('team_premium', interval)) })} value="" />
                <Stepper label={t('Premium seats')} value={std ? 0 : value.seats} min={0} max={MAX_SEATS} onChange={(n) => (n === 0 ? set('team_standard', value.seats) : set('team_premium', n))} />
              </XStack>
            ) : null}
            {value.seats >= ENTERPRISE_FROM ? (
              <XStack items="center" gap="$1">
                <SizableText size="$1" color="$quiet">
                  {t('{n} or more?', { n: ENTERPRISE_FROM })}
                </SizableText>
                {onAsk ? (
                  <Ask onAsk={onAsk} />
                ) : (
                  <Button type="button" variant="link" size="sm" px={0} minH={0} onClick={onEnterprise}>
                    {t('Talk to sales')}
                  </Button>
                )}
              </XStack>
            ) : null}
          </YStack>
        ) : null}
        <Line label={t('Subtotal')} value={usd(l.subtotal)} strong />
        <Line label={t('Tax (if applicable)')} value={t('Calculated at payment')} muted />
        <Line label={t('Total due today')} value={t('{price} + tax', { price: usd(l.subtotal) })} strong />
      </Panel>
      <Primary onClick={onContinue}>
        {t('Continue to payment')}
      </Primary>
    </>
  )
}

/* ----------------------------------------------------------- enterprise */

export function Enterprise({ api, onSent }: { api: string; onSent: () => void }) {
  const { t } = useI18n()
  const [f, setF] = useState({ name: '', email: '', company: '', size: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (v: string) => setF((cur) => ({ ...cur, [k]: v }))
  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!f.name.trim() || !f.email.includes('@') || !f.company.trim()) {
      setWrong(t('Fill in your name, work email and company.'))
      return
    }
    setBusy(true)
    setWrong(null)
    try {
      await call(api, '/v1/marketing/leads', { method: 'POST', body: JSON.stringify({ ...f, source: `${window.location.hostname}/onboarding` }) })
      onSent()
    } catch {
      setWrong(`${t('That did not go through.')} ${t('Try again, or email {email}.', { email: 'sales@hanzo.ai' })}`)
      setBusy(false)
    }
  }
  return (
    <YStack render={<form onSubmit={submit} noValidate />} gap="$4" items="stretch">
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-name">{t('Your name')}</FieldLabel>
        <Input id="hanzo-sales-name" value={f.name} onChangeText={set('name')} autoComplete="name" />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-email">{t('Work email')}</FieldLabel>
        <Input id="hanzo-sales-email" type="email" value={f.email} onChangeText={set('email')} autoComplete="email" />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-company">{t('Company')}</FieldLabel>
        <Input id="hanzo-sales-company" value={f.company} onChangeText={set('company')} autoComplete="organization" />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-size">{t('How many people?')}</FieldLabel>
        <Input id="hanzo-sales-size" inputMode="numeric" value={f.size} onChangeText={set('size')} />
      </Field>
      <Field gap="$2">
        <FieldLabel htmlFor="hanzo-sales-message">{t('What are you looking to do?')}</FieldLabel>
        <Textarea id="hanzo-sales-message" rows={3} value={f.message} onChangeText={set('message')} />
      </Field>
      {wrong ? <FieldError>{wrong}</FieldError> : null}
      <Primary type="submit" disabled={busy}>
        {busy ? t('One moment…') : t('Contact sales')}
      </Primary>
    </YStack>
  )
}
