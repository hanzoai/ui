'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import type {
  Subscription,
  SubscriptionPlan,
  PaymentMethod,
  UsageSummary,
  CreditGrant,
  Invoice,
  SpendAlert,
  DiscountCode,
  BusinessProfile,
  Balance,
} from '../types'

export interface OverviewDashboardProps {
  subscription: Subscription
  plans: SubscriptionPlan[]
  paymentMethods: PaymentMethod[]
  usage: UsageSummary | null
  usageLoading: boolean
  balance: Balance | null
  creditGrants: CreditGrant[]
  creditBalance: number
  starterCredit: CreditGrant | null
  onAddFunds: (amount: number) => Promise<void>
  onClaimStarterCredit?: () => Promise<void>
  isAdmin: boolean
  onGrantCredit?: (email: string, amount: number) => Promise<void>
  userEmail: string
  invoices: Invoice[]
  spendAlerts: SpendAlert[]
  onNavigate: (target: string) => void
  onUpgrade?: (planId: string) => Promise<void>
  onDowngrade?: (planId: string) => Promise<void>
  onCancel?: (reason: string, feedback?: string) => Promise<void>
  onApplyDiscount?: (code: string) => Promise<DiscountCode | null>
  businessProfile: BusinessProfile
  onSaveBusinessProfile?: (profile: BusinessProfile) => Promise<void>
  onAddPaymentMethod?: (method: PaymentMethod) => Promise<void>
  onRemovePaymentMethod?: (id: string) => Promise<void>
  onSetDefaultPaymentMethod?: (id: string) => Promise<void>
}

function fmt(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function daysUntil(d: Date | string) {
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/* -- Fade-in animation wrapper -- */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    const timer = setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])
  return <div ref={ref} className={className}>{children}</div>
}

/* -- Animated number counter -- */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = React.useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const end = value
    if (start === end) return
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = end
    }
    requestAnimationFrame(tick)
  }, [value, duration])
  return <>{fmtTokens(display)}</>
}

/* -- Plan tier badge -- */
const PLAN_TIERS: Record<string, { label: string; color: string; glow: string }> = {
  'developer': { label: 'Pay As You Go', color: 'text-white/50', glow: '' },
  'pro': { label: 'Pro', color: 'text-sky-400', glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]' },
  'team': { label: 'Team', color: 'text-violet-400', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.15)]' },
  'enterprise': { label: 'Enterprise', color: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' },
  'custom': { label: 'Custom', color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]' },
}

/* -- Main component -- */
export function OverviewDashboard(props: OverviewDashboardProps) {
  const currentPlan = props.plans.find(p => p.id === props.subscription.planId)
  const recommendedPlan = props.plans.find(p => p.id === 'pro') ?? props.plans[1]
  const mtdSpend = props.usage?.totalCost ?? 0
  const currency = props.usage?.currency ?? 'usd'
  const periodEnd = props.subscription.currentPeriodEnd
  const daysLeft = daysUntil(periodEnd)
  const totalCreditsRemaining = (props.balance?.available ?? 0) / 100
  const defaultPm = props.paymentMethods.find(m => m.is_default || m.isDefault) ?? props.paymentMethods[0]
  const hasActivePlan = !!props.subscription.id && props.subscription.status === 'active'

  // Trial status
  const isTrialing = props.subscription.status === 'trialing'
  const trialDaysLeft = isTrialing ? daysUntil(props.subscription.currentPeriodEnd) : 0

  // Token stats from usage
  const aiRecord = props.usage?.records.find(r => r.meterId === 'ai' || r.unit?.toLowerCase().includes('token'))
  const tokensThisPeriod = aiRecord?.current ?? 0
  const apiCallsRecord = props.usage?.records.find(r => r.meterId === 'api_calls')
  const apiCallsThisPeriod = apiCallsRecord?.current ?? 0

  const tier = currentPlan ? (PLAN_TIERS[currentPlan.id] ?? PLAN_TIERS['developer']) : PLAN_TIERS['developer']

  // Spend bar heights (deterministic)
  const barHeights = React.useMemo(() =>
    Array.from({ length: 28 }, (_, i) =>
      mtdSpend > 0 ? Math.max((i * 137 + 17) % 100, 4) : (i % 3 === 0 ? 2 : 1)
    ),
  [mtdSpend])

  return (
    <div className="space-y-5">

      {/* -- Trial banner -- */}
      {isTrialing && (
        <FadeIn delay={0}>
          <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.05] p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-400">Free trial active {'\u00B7'} {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</p>
              <p className="text-[13px] text-white/50 mt-1">Add a payment method to continue after your trial ends.</p>
            </div>
            <button
              type="button"
              onClick={() => props.onNavigate('payment')}
              className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.97] flex-shrink-0"
            >
              Add payment
            </button>
          </div>
        </FadeIn>
      )}

      {/* -- Upgrade CTA (top priority when not subscribed) -- */}
      {!hasActivePlan && !isTrialing && recommendedPlan && (
        <FadeIn delay={0}>
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#141419] p-6">
            <div className="pointer-events-none absolute -top-12 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
                <span className="text-sm font-semibold text-sky-400">Unlock the full Hanzo AI suite</span>
              </div>
              <p className="text-[22px] font-bold text-white mb-1">
                All AI models. One plan. <span className="text-sky-400">$20/mo.</span>
              </p>
              <p className="text-[13px] text-white/50 mb-5">
                14+ Zen AI models {'\u00B7'} 1M+ token context {'\u00B7'} Unlimited chat {'\u00B7'} MCP tools {'\u00B7'} Priority inference
                {recommendedPlan.trialDays ? ` \u00B7 ${recommendedPlan.trialDays}-day free trial` : ''}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => props.onUpgrade?.(recommendedPlan.id)}
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/90 active:scale-[0.97]"
                >
                  {recommendedPlan.trialDays ? `Start ${recommendedPlan.trialDays}-day free trial` : 'Upgrade to Unified AI'}
                </button>
                <button
                  type="button"
                  onClick={() => props.onNavigate('pricing')}
                  className="text-sm text-white/40 transition hover:text-white/70"
                >
                  View all plans {'\u2192'}
                </button>
              </div>
              {(recommendedPlan.annualPrice ?? 0) > 0 && (
                <p className="mt-3 text-[12px] text-emerald-400">
                  Or go annual for ${recommendedPlan.annualPrice}/yr {'\u2014'} save ${(recommendedPlan.price * 12) - recommendedPlan.annualPrice!}
                </p>
              )}
            </div>
          </div>
        </FadeIn>
      )}

      {/* -- Hero: AI Power stats -- */}
      <FadeIn delay={0}>
        <div className={`rounded-2xl border border-white/[0.08] bg-[#141419] overflow-hidden transition-all ${tier.glow}`}>
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className={`text-[11px] font-semibold uppercase tracking-widest ${tier.color}`}>
                    {tier.label} Plan
                  </span>
                  {hasActivePlan && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Active</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {tokensThisPeriod > 0
                    ? <><AnimatedNumber value={tokensThisPeriod} /> tokens</>
                    : props.usageLoading ? 'Loading\u2026' : <span className="text-white/40">No usage yet</span>
                  }
                </h2>
                <p className="text-[13px] text-white/40 mt-1">
                  {tokensThisPeriod > 0 ? 'processed this billing period' : 'Start using Hanzo AI to see stats'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/30 mb-1">{mtdSpend > 0 ? 'API spend' : 'Credits available'}</p>
                <p className="text-xl font-semibold text-white tabular-nums">
                  {mtdSpend > 0 ? fmt(mtdSpend, currency) : totalCreditsRemaining > 0 ? fmt(totalCreditsRemaining, currency) : fmt(0, currency)}
                </p>
                <p className="text-[12px] text-white/30 mt-1">{daysLeft}d until renewal</p>
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="h-10 flex items-end gap-[2px]">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-700 ${
                    mtdSpend > 0 ? 'bg-white/[0.12]' : 'bg-white/[0.04]'
                  }`}
                  style={{ height: `${h}%`, transitionDelay: `${i * 20}ms` }}
                />
              ))}
            </div>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[11px] text-white/30 mb-1">Tokens / period</p>
                <p className="text-base font-semibold text-white tabular-nums">
                  {tokensThisPeriod > 0 ? fmtTokens(tokensThisPeriod) : '\u2014'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[11px] text-white/30 mb-1">API calls</p>
                <p className="text-base font-semibold text-white tabular-nums">
                  {apiCallsThisPeriod > 0 ? fmtTokens(apiCallsThisPeriod) : '\u2014'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[11px] text-white/30 mb-1">Credits left</p>
                <p className="text-base font-semibold text-white tabular-nums">{fmt(totalCreditsRemaining)}</p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* -- Stats row -- */}
      <FadeIn delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Credit Balance */}
          <button
            type="button"
            onClick={() => props.onNavigate('credits')}
            className="rounded-2xl border border-white/[0.08] bg-[#141419] p-5 text-left transition-all hover:border-white/[0.14] hover:bg-[#16161c] group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest text-white/30">Credit Balance</p>
              <div className="text-white/20 group-hover:text-white/40 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{fmt(totalCreditsRemaining)}</p>
            <p className="text-[13px] text-white/35 mt-1.5 group-hover:text-white/50 transition-colors">
              {props.creditGrants.filter(g => g.active && !g.voided).length} active grant{props.creditGrants.filter(g => g.active && !g.voided).length !== 1 ? 's' : ''}
            </p>
          </button>

          {/* Current Plan */}
          <button
            type="button"
            onClick={() => props.onNavigate('pricing')}
            className="rounded-2xl border border-white/[0.08] bg-[#141419] p-5 text-left transition-all hover:border-white/[0.14] hover:bg-[#16161c] group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest text-white/30">AI Plan</p>
              <div className="text-white/20 group-hover:text-white/40 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${tier.color || 'text-white'}`}>{currentPlan?.name ?? 'Pay As You Go'}</p>
            <p className="text-[13px] text-white/35 mt-1.5 group-hover:text-white/50 transition-colors">
              {isTrialing ? `Trial \u00B7 ${trialDaysLeft}d left` : hasActivePlan ? 'Active' : 'Upgrade to unlock all \u2192'}
            </p>
          </button>

          {/* Payment Method */}
          <button
            type="button"
            onClick={() => props.onNavigate('payment')}
            className="rounded-2xl border border-white/[0.08] bg-[#141419] p-5 text-left transition-all hover:border-white/[0.14] hover:bg-[#16161c] group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest text-white/30">Payment</p>
              <div className="text-white/20 group-hover:text-white/40 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {defaultPm?.card ? `\u2022\u2022\u2022\u2022 ${defaultPm.card.last4}` : defaultPm ? defaultPm.type : '\u2014'}
            </p>
            <p className="text-[13px] text-white/35 mt-1.5 group-hover:text-white/50 transition-colors">
              {defaultPm?.card ? defaultPm.card.brand : defaultPm ? 'Active' : 'Add a payment method'}
            </p>
          </button>
        </div>
      </FadeIn>

      {/* -- Quick actions -- */}
      <FadeIn delay={120}>
        <div className="rounded-2xl border border-white/[0.08] bg-[#141419] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-[14px] font-semibold text-white">Quick access</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-white/[0.05]">
            {[
              { label: 'Usage', icon: <path d="M3 3v18h18" />, section: 'usage' },
              { label: 'Invoices', icon: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M8 7h8" /><path d="M8 11h8" /></>, section: 'invoices' },
              { label: 'Plans', icon: <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />, section: 'pricing' },
              { label: 'Credits', icon: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /></>, section: 'credits' },
              { label: 'Alerts', icon: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>, section: 'alerts' },
              { label: 'Team', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>, section: 'team' },
            ].map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => props.onNavigate(item.section)}
                className="flex flex-col items-center gap-2 px-4 py-5 text-left transition-colors hover:bg-white/[0.03] group"
              >
                <div className="text-white/25 group-hover:text-white/50 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
                <p className="text-[12px] font-medium text-white/35 group-hover:text-white/60 transition-colors">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* -- Recent invoices preview -- */}
      {props.invoices.length > 0 && (
        <FadeIn delay={160}>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141419] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Recent invoices</h3>
              <button
                type="button"
                onClick={() => props.onNavigate('invoices')}
                className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
              >
                View all {'\u2192'}
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {props.invoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-[13px] text-white/70">#{inv.invoiceNumber || inv.number || inv.id.slice(0, 10)}</p>
                    <p className="text-[12px] text-white/30">{new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-white tabular-nums">{fmt(inv.total, inv.currency)}</p>
                    <span className={`text-[11px] font-medium ${
                      inv.status === 'paid' ? 'text-emerald-400' :
                      inv.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
