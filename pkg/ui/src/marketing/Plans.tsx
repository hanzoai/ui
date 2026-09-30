'use client'

/**
 * Plans — one card per plan on the chosen tab, each with its own way in.
 *
 * Individual and Team & Enterprise are two tabs (a tab exists only while a plan
 * is on it); monthly and annual is one switch (present only while some plan here
 * sells a year). Every row, price, seat floor and feature is the catalog's,
 * passed as `plans`: this draws them and states no number of its own.
 *
 *   every card  "Try Hanzo", to sign-in first (`signIn`); payment is second
 *   Free        `signIn` alone
 *   paid        `signIn?next=<the on-site checkout for that plan and term>`
 *   quoted      Enterprise: contact sales
 *
 * The host supplies the three addresses and hears the two events, so the same
 * cards serve every site: `onView` when a tab's plans are shown, `onChoose` when
 * a card's button is pressed.
 */
import { XStack, YStack } from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { Switch } from '../backends/gui/switch'
import { ToggleGroup, ToggleGroupItem } from '../backends/gui/toggle-group'
import { Grid } from '../grid'
import { Cta } from './Cta'
import { audience, charge, merged, money, saving, seats, termOf, way, type Audience, type Interval, type PlanRow } from './rows'
import { Line } from './type'

const TIGHT = { letterSpacing: '-0.012em', textWrap: 'balance' } as const

const TABS: readonly [Audience, string][] = [
  ['individual', 'Individual'],
  ['team', 'Team & Enterprise'],
]

/** The plan families the ladder sells. */
const FAMILIES = new Set(['personal', 'team', 'enterprise'])

export type PlanChoice = { plan: PlanRow; interval: Interval; tab: Audience; cta: string; way: 'card' | 'free' | 'sales' }

export type PlansProps = {
  plans: readonly PlanRow[]
  /** The level the title is drawn at: `h1` alone on a page, `h2` inside one. */
  heading?: 'h1' | 'h2'
  title?: string
  /** The address a paid plan's button opens, for the term on the card. */
  checkout: (plan: PlanRow, interval: Interval) => string
  /** Where every card starts: sign-in first, payment second. A paid card opens it with `?next=<checkout>`. */
  signIn?: string
  /** What every way in says. */
  cta?: string
  contactHref?: string
  onView?: (tab: Audience, shown: readonly { plan: PlanRow; interval: Interval }[]) => void
  onChoose?: (choice: PlanChoice) => void
  /** The fine print under the cards. */
  footnote?: ReactNode
}

const Plans = ({
  plans,
  heading = 'h1',
  title = 'Plans that grow with you',
  checkout,
  signIn = '/login',
  cta = 'Try Hanzo',
  contactHref = '/contact-sales',
  onView,
  onChoose,
  footnote,
}: PlansProps) => {
  const all = useMemo(() => plans.filter((p) => FAMILIES.has(p.category)), [plans])
  const tabs = TABS.filter(([a]) => all.some((p) => audience(p) === a))
  const [picked, setPicked] = useState<Audience>('individual')
  const [yearly, setYearly] = useState(false)
  const tab = tabs.some(([a]) => a === picked) ? picked : (tabs[0]?.[0] ?? picked)
  const { plans: here, from } = useMemo(() => merged(all.filter((p) => audience(p) === tab)), [all, tab])

  const savings = here.map(saving).filter((n): n is number => n !== null)
  const most = savings.length ? Math.max(...savings) : 0
  const label = savings.every((n) => n === most) ? `Save ${most}% with annual` : `Save up to ${most}% with annual`

  // One view per tab a reader looks at; a repaint of the same rows is not a new view.
  const shown = here.map((p) => p.id).join()
  useEffect(() => {
    if (!here.length) return
    onView?.(tab, here.map((plan) => ({ plan, interval: termOf(plan, yearly) })))
    // `shown` stands for the rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, tab])

  const card = (p: PlanRow) => (
    <Card
      key={p.id}
      plan={p}
      every={termOf(p, yearly)}
      from={from.has(p.id)}
      team={tab === 'team'}
      href={
        way(p) === 'card'
          ? `${signIn}?next=${encodeURIComponent(checkout(p, termOf(p, yearly)).replace(/^https:\/\/hanzo\.ai(?=\/)/, ''))}`
          : way(p) === 'free'
            ? signIn
            : contactHref
      }
      cta={cta}
      onPress={(cta) => onChoose?.({ plan: p, interval: termOf(p, yearly), tab, cta, way: way(p) })}
    />
  )

  return (
    <YStack {...slot('plans')} render="section" width="100%" maxW={1280} mx="auto" gap="$8" items="center" px="$6">
      <YStack items="center" gap="$3" maxW={768}>
        <Line
          render={heading}
          m={0}
          align="center"
          fontFamily="$heading"
          fontSize="$9"
          lineHeight="$9"
          fontWeight={500}
          $md={{ fontSize: '$11', lineHeight: '$11' }}
          style={TIGHT}
        >
          {title}
        </Line>
        <Line render="p" m={0} size="lg" tone="muted" align="center">
          You are charged exactly the price shown. Past a plan’s included usage, agents are metered at the rates below.
        </Line>
      </YStack>

      <XStack flexWrap="wrap" items="center" justify="center" gap="$4">
        {tabs.length > 1 ? (
          <ToggleGroup
            type="single"
            value={tab}
            onValueChange={(v: string) => {
              if (v) setPicked(v as Audience)
            }}
            disableDeactivation
            aria-label="Who this is for"
            style={{ padding: 4, borderRadius: 9999, background: 'var(--surface-2)' }}
          >
            {tabs.map(([a, name]) => (
              <ToggleGroupItem key={a} value={a} variant="outline" rounded="$10" borderColor="transparent" px="$4">
                {name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
        {most > 0 ? (
          <XStack
            render="label"
            items="center"
            gap="$3"
            pl="$5"
            pr="$3"
            py="$2"
            rounded={9999}
            borderWidth={1}
            borderColor="$edge"
            bg="$panel"
            cursor="pointer"
          >
            <Line size="sm" tone="muted">
              {label}
            </Line>
            <Switch checked={yearly} onCheckedChange={setYearly} aria-label="Bill yearly" />
          </XStack>
        ) : null}
      </XStack>

      {here.length > 1 ? (
        <YStack width="100%">
          <Grid columns={{ min: 250, max: 4 }} gap={24}>
            {here.map(card)}
          </Grid>
        </YStack>
      ) : here[0] ? (
        <YStack width="100%" maxW={440}>
          {card(here[0])}
        </YStack>
      ) : null}

      {footnote ? (
        <Line render="p" m={0} size="xs" tone="muted" align="center" maxW={620}>
          {footnote}
        </Line>
      ) : null}
    </YStack>
  )
}

/** One plan: its name, its price for the term, the way in, and what it includes. */
function Card({
  plan,
  every,
  href,
  cta: label,
  from,
  team,
  onPress,
}: {
  plan: PlanRow
  every: Interval
  href: string
  cta: string
  from: boolean
  team: boolean
  onPress: (cta: string) => void
}) {
  const how = way(plan)
  const year = charge(plan, 'year')
  // A year is headlined as the month it works out to, with the whole year under it.
  const headline = every === 'year' && year ? Math.round((year / 12) * 100) / 100 : (plan.priceMonthly ?? 0)
  const floor = seats(plan)
  // Team and Enterprise name the plan; everyone else is one button.
  const cta = team ? `Get ${plan.name} plan` : label

  return (
    <YStack
      {...slot('plan')}
      render="section"
      aria-label={plan.name}
      height="100%"
      gap="$5"
      p="$5"
      $sm={{ p: '$6' }}
      rounded="var(--radius-xl)"
      borderWidth={1}
      borderColor={plan.popular ? '$bound' : '$edge'}
      bg={plan.popular ? '$hover' : '$panel'}
    >
      <YStack gap="$2">
        <XStack items="center" justify="space-between" gap="$3">
          <Line render="h3" m={0} size="xl" weight="600">
            {plan.name}
          </Line>
          {plan.popular ? (
            <XStack
              {...slot('plan-badge')}
              display="inline-flex"
              self="flex-start"
              items="center"
              px="$2"
              py={2}
              rounded={9999}
              borderWidth={1}
              borderColor="$edge"
              bg="$raised"
            >
              <Line fontSize={10} px={10} tone="soft" weight="700" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Most popular
              </Line>
            </XStack>
          ) : null}
        </XStack>
        {plan.description ? (
          <Line render="p" m={0} size="sm" tone="muted">
            {plan.description}
          </Line>
        ) : null}
      </YStack>

      <YStack gap="$1">
        {how === 'card' ? (
          <>
            <YStack display="block">
              {from ? (
                <Line size="sm" tone="muted">
                  From{' '}
                </Line>
              ) : null}
              <Line size="x4" weight="600">
                {money(headline)}
              </Line>{' '}
              <Line size="sm" tone="muted">
                {plan.pricePerUser ? 'USD/seat/month' : 'USD/month'}
              </Line>
            </YStack>
            <Line render="p" m={0} size="sm" tone="muted">
              {every === 'year' && year ? `Billed ${money(year)}${plan.pricePerUser ? ' per seat' : ''} yearly` : 'Billed monthly'}
              {floor > 1 ? ` · from ${floor} seats` : ''}
            </Line>
          </>
        ) : (
          <>
            <Line size="x4" weight="600">
              {how === 'free' ? 'Free' : 'Custom'}
            </Line>
            <Line render="p" m={0} size="sm" tone="muted">
              {how === 'free' ? 'No card needed' : 'Priced with our team'}
            </Line>
          </>
        )}
      </YStack>

      {/* `data-ga`: the host's click-out listener leaves it to `onChoose`, which
          states the plan and its price itself. */}
      <Cta href={href} data-ga onPress={() => onPress(cta)}>
        {cta}
      </Cta>
      {how === 'card' ? (
        <Line render="p" m={0} size="xs" tone="muted" align="center" mt={-12}>
          No commitment · Cancel anytime
        </Line>
      ) : null}

      {plan.features.length ? (
        <YStack render="ul" gap="$3" m={0} p={0} style={{ listStyle: 'none' }}>
          {plan.features.map((f) => (
            <XStack render="li" key={f} items="flex-start" gap="$3">
              <YStack shrink={0} mt={3} aria-hidden>
                <Check size={16} color="var(--primary)" />
              </YStack>
              <Line size="sm" tone="muted">
                {f}
              </Line>
            </XStack>
          ))}
        </YStack>
      ) : null}
    </YStack>
  )
}

export { Plans }
