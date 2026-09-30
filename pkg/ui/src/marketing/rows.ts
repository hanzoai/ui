/**
 * What a plan row says, as sentences a card can print. Pure: no fetch, no
 * storage. The rows are @hanzo/plans' and commerce's; nothing here types a price.
 */

/** A plan as a card renders it: dollars, and `features` always present. */
export interface PlanRow {
  id: string
  name: string
  description?: string
  priceMonthly: number | null
  /** A year shown per month. */
  priceAnnual?: number | null
  /** What a year charges, once, where the catalog sells one. */
  annualTotal?: number | null
  category: string
  popular?: boolean
  contactSales?: boolean
  pricePerUser?: boolean
  features: string[]
  limits?: Record<string, number | null>
  checkoutUrl?: string
  checkoutId?: string
}

export type Interval = 'month' | 'year'
export type Audience = 'individual' | 'team'

/** Whole dollars bare, anything else to the cent: $20, $16.67. */
export const money = (n: number): string =>
  Number.isInteger(n)
    ? `$${n.toLocaleString('en-US')}`
    : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** What one term charges, in dollars, or null where none is sold. */
export function charge(plan: PlanRow, interval: Interval): number | null {
  const n =
    interval === 'month'
      ? plan.priceMonthly
      : (plan.annualTotal ?? (plan.priceAnnual ? Math.round(plan.priceAnnual * 1200) / 100 : null))
  return n && n > 0 ? n : null
}

/** What a year saves against twelve months, as a whole percent. Null where it saves nothing. */
export function saving(plan: PlanRow): number | null {
  const month = charge(plan, 'month')
  const year = charge(plan, 'year')
  if (!month || !year || year >= 12 * month) return null
  return Math.round((1 - year / (12 * month)) * 100)
}

/** Who a plan is for: a quoted plan is Enterprise, a per-seat plan is Team, the rest are for one person. */
export const audience = (p: PlanRow): Audience => (p.contactSales || p.pricePerUser ? 'team' : 'individual')

/** How a plan is taken: by card, for nothing, or by a conversation. */
export type Way = 'card' | 'free' | 'sales'

export function way(p: PlanRow): Way {
  if (p.contactSales) return 'sales'
  return (p.priceMonthly ?? 0) > 0 ? 'card' : 'free'
}

/** The seats a per-seat plan is sold from. */
export function seats(p: PlanRow): number {
  const n = Number(p.limits?.minSeats ?? 1)
  return Number.isFinite(n) && n > 1 ? Math.floor(n) : 1
}

/** The term a card quotes: a year where one is sold and asked for, else a month. */
export const termOf = (p: PlanRow, yearly: boolean): Interval => (yearly && charge(p, 'year') !== null ? 'year' : 'month')
