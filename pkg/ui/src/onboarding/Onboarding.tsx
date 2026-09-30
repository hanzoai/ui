'use client'

import { useEffect, useRef, useState } from 'react'
import { API } from './api'
import { Checkout } from './Checkout'
import { Page } from './frame'
import { Enterprise, Plans, Seats, TeamName, UseCards } from './screens'
import { useSession, type Track } from './hooks'
import { ENTERPRISE_FROM, MIN_SEATS, OFFERS, item, type Interval, type PlanId } from './plans'
import { step as nextStep, type Use } from './state'

/**
 * Sign-in is done; this is what comes next, and nothing else:
 *
 *   use          personal | with my team (Team, Enterprise)
 *   plans        personal: Free, Dev, Max
 *   team name    an IAM org the person owns
 *   seats        Standard and Premium seats, then the one checkout
 *   enterprise   the contact form
 *
 * Each finished step is saved on the IAM user, so a returning person lands on
 * the first one they have not done, and `onDone` fires when there is none.
 */

export interface OnboardingProps {
  /** The product's name. */
  site?: string
  /** Where IAM and billing answer. */
  api?: string
  track?: Track
  /** Onboarding is finished: go to the app (chat onboarding is next, on its own). */
  onDone: (result: { use?: Use; plan?: PlanId; org?: string }) => void
  /** Opens Hanzo's sales agent; without it the link goes to /contact-sales. */
  onAsk?: () => void
  termsPath?: string
  /** Start on this plan's checkout, as the in-app Upgrade entries do. */
  upgrade?: { plan: PlanId; interval?: Interval; seats?: number } | null
  /** `from` for upgrade_clicked when opened as an upgrade. */
  from?: string
}

type View = 'use' | 'plans' | 'team' | 'seats' | 'enterprise' | 'checkout'

export function Onboarding({ site = 'Hanzo', api = API, track, onDone, onAsk, termsPath = '/terms', upgrade = null }: OnboardingProps) {
  const session = useSession(api)
  const [view, setView] = useState<View | null>(null)
  const [interval, setInterval] = useState<Interval>(upgrade?.interval ?? 'monthly')
  const [buy, setBuy] = useState<{ plan: PlanId; seats: number } | null>(upgrade ? { plan: upgrade.plan, seats: upgrade.seats ?? 1 } : null)
  const [team, setTeam] = useState<string | undefined>()
  const decided = useRef(false)

  // The first screen is the first step not yet finished. An upgrade opens the checkout.
  useEffect(() => {
    if (session.loading || decided.current) return
    decided.current = true
    if (upgrade) {
      setView('checkout')
      return
    }
    const s = nextStep(session.progress)
    if (s === 'done') onDone({ use: session.progress.use, plan: session.progress.plan, org: session.progress.team })
    else setView(s)
    // Once, when the answer arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loading])

  useEffect(() => {
    if (view === 'plans' || view === 'seats') track?.('pricing_viewed', { from: 'onboarding', items: Object.values(OFFERS).filter((o) => (view === 'plans' ? o.category === 'individual' : o.category === 'team')).map((o) => item(o.id, interval)) })
    // A screen is viewed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  if (!view) return <Page site={site} title="" busy />

  const org = team ?? session.progress.team

  if (view === 'use') {
    return (
      <Page site={site} title={`How are you planning to use ${site}?`} center width={720}>
        <UseCards
          onPick={(use) => {
            track?.('usage_selected', { use })
            void session.save({ use })
            if (use === 'personal') setView('plans')
            else if (use === 'enterprise') setView('enterprise')
            else setView('team')
          }}
          onAsk={onAsk}
        />
      </Page>
    )
  }

  if (view === 'plans') {
    return (
      <Page site={site} title="Plans that grow with you" width={1140}>
        <Plans
          interval={interval}
          setInterval={(i) => {
            track?.('plan_changed', { from: interval, to: i, field: 'interval' })
            setInterval(i)
          }}
          onFree={() => {
            track?.('plan_skipped', { plan: 'free' })
            void session.save({ plan: 'free' })
            onDone({ use: 'personal', plan: 'free' })
          }}
          onPick={(plan) => {
            track?.('plan_clicked', { plan, interval, from: 'onboarding', items: [item(plan, interval)] })
            setBuy({ plan, seats: 1 })
            setView('checkout')
          }}
        />
      </Page>
    )
  }

  if (view === 'team') {
    return (
      <Page site={site} title="Let’s create your team" start back={() => setView('use')} lede="Team plans are best for groups up to 150 people. Choose a team name that invited members will easily recognize.">
        <TeamName
          api={api}
          onCreated={(handle) => {
            track?.('team_created', {})
            setTeam(handle)
            void session.save({ team: handle })
            setBuy({ plan: 'team_standard', seats: MIN_SEATS })
            setView('seats')
          }}
        />
      </Page>
    )
  }

  if (view === 'seats') {
    return (
      <Page site={site} title="Choose your seats and plan" lede={`Team plans have a minimum of ${MIN_SEATS} seats. Pick your seat types below`} start back={() => setView('team')}>
        <Seats
          interval={interval}
          setInterval={(i) => {
            track?.('plan_changed', { from: interval, to: i, field: 'interval' })
            setInterval(i)
          }}
          value={buy ?? { plan: 'team_standard', seats: MIN_SEATS }}
          setValue={(v) => {
            if (buy && (buy.plan !== v.plan || buy.seats !== v.seats)) track?.('plan_changed', { from: buy.plan, to: v.plan, field: buy.plan !== v.plan ? 'plan' : 'seats', seats: v.seats })
            setBuy(v)
          }}
          onContinue={() => {
            const b = buy ?? { plan: 'team_standard' as const, seats: MIN_SEATS }
            track?.('plan_clicked', { plan: b.plan, interval, from: 'onboarding', items: [item(b.plan, interval, b.seats)] })
            setView('checkout')
          }}
          onEnterprise={() => setView('enterprise')}
          onAsk={onAsk}
        />
      </Page>
    )
  }

  if (view === 'enterprise') {
    return (
      <Page site={site} title="Talk to our sales team" lede={`For ${ENTERPRISE_FROM} or more people. Pooled usage, advanced admin and security controls.`} start back={() => setView('use')}>
        <Enterprise
          api={api}
          onSent={() => {
            track?.('sales_contacted', { from: 'onboarding' })
            void session.save({ sales: true })
            onDone({ use: 'enterprise' })
          }}
        />
      </Page>
    )
  }

  const b = buy ?? { plan: 'dev' as const, seats: 1 }
  return (
    <Checkout
      site={site}
      api={api}
      org={OFFERS[b.plan].category === 'team' ? org : undefined}
      plan={b.plan}
      seats={b.seats}
      interval={interval}
      setInterval={setInterval}
      track={track}
      termsPath={termsPath}
      back={() => setView(OFFERS[b.plan].category === 'team' ? 'seats' : 'plans')}
      onPaid={() => {
        void session.save({ plan: b.plan })
        onDone({ use: OFFERS[b.plan].category === 'team' ? 'team' : 'personal', plan: b.plan, org })
      }}
    />
  )
}

