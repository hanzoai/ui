'use client'

import { useEffect, useRef, useState } from 'react'
import { useSignOut } from '../auth/signout'
import { API } from './api'
import { Checkout } from './Checkout'
import { Paragraph } from '../backends/gui/layout'
import { Page } from './frame'
import { CreateAccount } from './account'
import { Enterprise, Plans, Pro, Seats, TeamName, UseCards } from './screens'
import { useSession, type Track } from './hooks'
import { useCatalog } from './catalog'
import { ENTERPRISE_FROM, MIN_SEATS, OFFERS, lines, offer, item, type Interval, type PlanId } from './plans'
import { step as nextStep, type Policy, type Use } from './state'

/**
 * Sign-in is done; this is what comes next, and nothing else:
 *
 *   account      a new account reviews the terms ("Let's create your account")
 *   pro          "Do more with Hanzo Pro": one recommended plan, or stay free
 *   plans        "Plans that grow with you": Free, Pro, Max
 *   checkout     the one checkout
 *   use          from the plans: personal | with my team (Team, Enterprise)
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
  /** A team's organization now exists. The host renews the session so its token names it. */
  onTeam?: (org: string) => void | Promise<void>
  /** Start on this plan's checkout, as the in-app Upgrade entries do. */
  upgrade?: { plan: PlanId; interval?: Interval; seats?: number } | null
  /** Open on a screen whatever progress says: the personal plans (an Upgrade entry) or the team's name (New organization). */
  open?: 'plans' | 'team'
  /** Leave the flow without finishing it: the way back from the screen `open` names. */
  onClose?: () => void
  /** `from` for upgrade_clicked when opened as an upgrade. */
  from?: string
  /** The versions of the Terms and the Acceptable Use Policy the account page records. Without it that page is never drawn. */
  policy?: Policy
  aupPath?: string
  /**
   * Runs once, after the terms page (if owed) and before the first plan screen:
   * the host makes sure the person has somewhere to put a plan (their own
   * organization). It may answer the plan the person already holds, which ends
   * the plan steps.
   */
  prepare?: () => Promise<{ plan?: PlanId } | void>
  /**
   * Take the person to pay for a personal plan somewhere else (hanzo.ai/pay, which
   * returns here once paid). Without it, and for a team's seats, the checkout is drawn in this flow.
   */
  checkout?: (order: { plan: PlanId; interval: Interval; seats: number }) => void
}

type View = 'account' | 'pro' | 'use' | 'plans' | 'team' | 'seats' | 'enterprise' | 'checkout'

export function Onboarding({ site = 'Hanzo', api = API, track, onDone, onAsk, termsPath = '/terms', aupPath = '/aup', upgrade = null, open, from, onClose, onTeam, policy, prepare, checkout }: OnboardingProps) {
  const session = useSession(api)
  // A different email is a fresh sign-in: end this session and land on /login.
  const other = useSignOut({ to: '/login', track })
  const catalog = useCatalog(api)
  const [view, setView] = useState<View | null>(null)
  const [interval, setInterval] = useState<Interval>(upgrade?.interval ?? 'monthly')
  const [buy, setBuy] = useState<{ plan: PlanId; seats: number } | null>(upgrade ? { plan: upgrade.plan, seats: upgrade.seats ?? 1 } : null)
  const [team, setTeam] = useState<string | undefined>()
  const [wrong, setWrong] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Where the checkout was opened from, so Back returns there.
  const [at, setAt] = useState<'pro' | 'plans'>('pro')
  const decided = useRef(false)

  /** Open the checkout on a plan: the host's, or this flow's own. */
  function pay(plan: PlanId, seats: number, back: 'pro' | 'plans') {
    setBuy({ plan, seats })
    setAt(back)
    // A team is priced by its seats, which only this flow's own checkout takes.
    if (checkout && offer(plan).category !== 'team') {
      const l = lines(plan, interval, seats)
      track?.('plan_selected', { plan, interval, seats: l.seats, value: l.subtotal, currency: 'USD', items: [item(plan, interval, seats)] })
      checkout({ plan, interval, seats })
    } else setView('checkout')
  }

  /** Leave the account page: the host makes room for a plan, then the first screen that is owed. */
  async function begin() {
    const held = await prepare?.()
    if (held && held.plan && !session.progress.plan) {
      await session.save({ use: 'personal', plan: held.plan })
      if (!upgrade && !open) {
        onDone({ use: 'personal', plan: held.plan })
        return
      }
    }
    if (upgrade) {
      pay(upgrade.plan, upgrade.seats ?? 1, 'plans')
      return
    }
    if (open) {
      setView(open)
      return
    }
    const s = nextStep(held && held.plan ? { ...session.progress, plan: held.plan } : session.progress)
    if (s === 'done') onDone({ use: session.progress.use, plan: session.progress.plan, org: session.progress.team })
    else setView(s)
  }

  // The first screen is the first step not yet finished: the terms for a new account, else what `begin` finds.
  useEffect(() => {
    if (session.loading || catalog === null || decided.current) return
    decided.current = true
    if (upgrade || open === 'plans') track?.('upgrade_clicked', { from: from ?? 'app' })
    if (policy && session.owesTerms) {
      setView('account')
      return
    }
    void begin().catch((e: unknown) => {
      setWrong(e instanceof Error ? e.message : 'Could not get your account ready. Reload to try again.')
      setView('pro')
    })
    // Once, when the answer arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loading, catalog])

  useEffect(() => {
    if (view === 'pro' || view === 'plans' || view === 'seats') track?.('pricing_viewed', { from: 'onboarding', items: Object.values(OFFERS).filter((o): o is NonNullable<typeof o> => o !== undefined).filter((o) => o.category === (view === 'seats' ? 'team' : 'individual')).filter((o) => view !== 'pro' || o.id === 'dev').map((o) => item(o.id, interval)) })
    // A screen is viewed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  if (catalog === false) return <Page site={site} title="Plans could not be loaded just now" lede="That is ours to fix. Reload to try again." center />
  if (!view) return <Page site={site} title="" busy />

  const org = team ?? session.progress.team

  if (view === 'account' && policy) {
    return (
      <CreateAccount
        site={site}
        email={session.email}
        busy={busy}
        wrong={wrong}
        termsPath={termsPath}
        aupPath={aupPath}
        onOther={() => void other()}
        onCreate={async () => {
          setBusy(true)
          setWrong(null)
          try {
            await session.accept(policy)
            track?.('terms_accepted', { method: 'signed-in' })
            await begin()
          } catch (e) {
            setWrong(e instanceof Error ? e.message : 'Could not create the account. Try again.')
          }
          setBusy(false)
        }}
      />
    )
  }

  if (view === 'pro') {
    return (
      <Page site={site} title="Do more with Hanzo Pro" width={340}>
        {wrong ? <Paragraph size="$2" color="$quiet" text="center" m={0}>{wrong}</Paragraph> : null}
        <Pro
          interval={interval}
          setInterval={(i) => {
            track?.('plan_changed', { from: interval, to: i, field: 'interval' })
            setInterval(i)
          }}
          onFree={() => {
            track?.('plan_skipped', { plan: 'free' })
            void session.save({ use: 'personal', plan: 'free' })
            onDone({ use: 'personal', plan: 'free' })
          }}
          onPro={() => {
            track?.('plan_clicked', { plan: 'dev', interval, from: 'onboarding', items: [item('dev', interval)] })
            pay('dev', 1, 'pro')
          }}
          onAll={() => setView('plans')}
        />
      </Page>
    )
  }

  if (view === 'use') {
    return (
      <Page site={site} title={`How are you planning to use ${site}?`} center width={720}>
        <UseCards
          onPick={(use) => {
            track?.('usage_selected', { use })
            void session.save({ use })
            if (use === 'personal') setView('pro')
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
      <Page site={site} title="Plans that grow with you" width={1140} back={open === 'plans' ? onClose : () => setView('pro')}>
        <Plans
          interval={interval}
          setInterval={(i) => {
            track?.('plan_changed', { from: interval, to: i, field: 'interval' })
            setInterval(i)
          }}
          onFree={() => {
            track?.('plan_skipped', { plan: 'free' })
            void session.save({ use: 'personal', plan: 'free' })
            onDone({ use: 'personal', plan: 'free' })
          }}
          onPick={(plan) => {
            track?.('plan_clicked', { plan, interval, from: 'onboarding', items: [item(plan, interval)] })
            pay(plan, 1, 'plans')
          }}
          onTeam={() => setView('use')}
        />
      </Page>
    )
  }

  if (view === 'team') {
    return (
      <Page site={site} title="Let’s create your team" start back={open === 'team' && onClose ? onClose : () => setView('use')} lede="Team plans are best for groups up to 150 people. Choose a team name that invited members will easily recognize.">
        <TeamName
          api={api}
          onCreated={async (handle) => {
            await onTeam?.(handle)
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
            pay(b.plan, b.seats, 'plans')
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
      org={offer(b.plan).category === 'team' ? org : undefined}
      plan={b.plan}
      seats={b.seats}
      interval={interval}
      setInterval={setInterval}
      setPlan={(plan) => setBuy({ plan, seats: 1 })}
      track={track}
      termsPath={termsPath}
      back={() => setView(offer(b.plan).category === 'team' ? 'seats' : at)}
      onPaid={() => {
        void session.save({ plan: b.plan })
        onDone({ use: offer(b.plan).category === 'team' ? 'team' : 'personal', plan: b.plan, org })
      }}
    />
  )
}

