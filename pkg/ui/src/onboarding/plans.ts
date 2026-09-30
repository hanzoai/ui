/**
 * What Hanzo sells, priced from commerce's live catalog (GET /v1/billing/plans)
 * and nothing else: no price is typed in this package. `adopt` takes the rows,
 * after which every function here answers from them.
 *
 *   free            chat only; offered on the personal path alone
 *   dev             Pro, the personal plan
 *   max_5x, max_20x one Max card; the tier is picked at checkout
 *   team_standard   the catalog's per-seat Team plan, two seats at least
 *   team_premium    a heavier seat, offered only while the catalog lists one
 */

export type PlanId = 'free' | 'dev' | 'max_5x' | 'max_20x' | 'team_standard' | 'team_premium'
export type Interval = 'monthly' | 'annual'
export type Category = 'individual' | 'team'

export const MIN_SEATS = 2
export const MAX_SEATS = 150
/** From 20 people the team plan becomes a conversation. */
export const ENTERPRISE_FROM = 20

/** The commerce catalog's slug for each plan. */
export const SLUG: Record<PlanId, string> = { free: 'free', dev: 'dev', max_5x: 'max-5x', max_20x: 'max-20x', team_standard: 'team', team_premium: 'team-premium' }

/** A row of the catalog, as commerce sends it (prices in cents). */
export interface Row {
  slug: string
  name: string
  description?: string
  price: number
  annualTotal?: number
  features?: string[]
  limits?: Record<string, number>
}

export interface Offer {
  id: PlanId
  slug: string
  name: string
  category: Category
  /** Dollars per month (per seat for a team plan). */
  monthly: number
  /** Dollars for a year paid at once, where the catalog sells one. */
  yearly: number | null
  blurb: string
  features: string[]
}

const cents = (n: number): number => Math.round(n * 100) / 100

const offers: Partial<Record<PlanId, Offer>> = {}

/** The offers as loaded: a plan the catalog does not list is absent. */
export const OFFERS = offers

/** Take the catalog's rows as what is sold. */
export function adopt(rows: Row[]): void {
  for (const k of Object.keys(offers)) delete offers[k as PlanId]
  for (const id of Object.keys(SLUG) as PlanId[]) {
    const r = rows.find((x) => x.slug === SLUG[id])
    if (!r) continue
    const team = id.startsWith('team')
    offers[id] = {
      id,
      slug: r.slug,
      name: team ? (id === 'team_standard' ? 'Standard seat' : 'Premium seat') : r.name,
      category: team ? 'team' : 'individual',
      monthly: cents(r.price / 100),
      yearly: r.annualTotal ? cents(r.annualTotal / 100) : null,
      blurb: r.description ?? '',
      features: r.features ?? [],
    }
  }
}

/** The offer for a plan; throws while the catalog has not loaded or does not list it. */
export function offer(id: PlanId): Offer {
  const o = offers[id]
  if (!o) throw new Error(`the catalog lists no ${id} plan`)
  return o
}

/** Whether the catalog lists this plan. */
export const has = (id: PlanId): boolean => offers[id] !== undefined

/** Whether this plan is sold by the year. */
export const yearly = (id: PlanId): boolean => offer(id).yearly !== null

/** One unit's price per month at this interval (a year spread over its twelve months). */
export function unit(id: PlanId, interval: Interval): number {
  const o = offer(id)
  return interval === 'annual' && o.yearly !== null ? cents(o.yearly / 12) : o.monthly
}

/** What one unit costs per billing period: the month, or the year at once. */
export function period(id: PlanId, interval: Interval): number {
  const o = offer(id)
  return interval === 'annual' && o.yearly !== null ? o.yearly : o.monthly
}

/** What a year saves over twelve months, as a whole percent. */
export function saving(id: PlanId): number {
  const o = offer(id)
  return o.yearly !== null && o.monthly > 0 ? Math.round((1 - o.yearly / (12 * o.monthly)) * 100) : 0
}

export interface Lines {
  seats: number
  /** What is charged today (before tax): the period's price times the seats. */
  subtotal: number
  /** What that comes to per month. */
  perMonth: number
}

export function lines(id: PlanId, interval: Interval, seats = 1): Lines {
  const n = offer(id).category === 'team' ? Math.max(MIN_SEATS, Math.min(MAX_SEATS, Math.floor(seats))) : 1
  return { seats: n, subtotal: cents(period(id, interval) * n), perMonth: cents(unit(id, interval) * n) }
}

/** GA4-shaped item for a commerce event: price is per unit, quantity is seats. Both Max tiers are item `max`. */
export function item(id: PlanId, interval: Interval, seats = 1) {
  const o = offer(id)
  return { item_id: id.startsWith('max') ? 'max' : id, item_name: o.name, item_category: o.category, item_variant: interval, price: period(id, interval), quantity: lines(id, interval, seats).seats }
}

export const usd = (n: number): string => `$${n.toFixed(2)}`
/** `$20` when whole, `$16.67` when not. */
export const money = (n: number): string => (Number.isInteger(n) ? `$${n}` : usd(n))
