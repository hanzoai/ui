import { subscriptionPlans } from '@hanzo/plans'

/**
 * What Hanzo sells, priced from @hanzo/plans and nothing else.
 *
 *   free            chat only; offered on the personal path alone
 *   dev, max        the personal plans, at the catalog's monthly price
 *   team_standard   a Dev seat + the team add-on
 *   team_premium    a Max seat + the team add-on, two seats at least
 *
 * A year is the month times 0.82, paid at once.
 */

export type PlanId = 'free' | 'dev' | 'max' | 'team_standard' | 'team_premium'
export type Interval = 'monthly' | 'annual'
export type Category = 'individual' | 'team'

/** Annual price is the monthly price times this. */
export const ANNUAL = 0.82
/** What a team seat adds to the personal plan it is built on, per month. */
export const SEAT_ADDON = 5
export const MIN_SEATS = 2
export const MAX_SEATS = 150
/** From 20 people the team plan becomes a conversation. */
export const ENTERPRISE_FROM = 20

const monthlyOf = (slug: string): number => {
  const p = subscriptionPlans.find((x) => x.id === slug)
  if (!p || p.priceMonthly == null) throw new Error(`@hanzo/plans has no monthly price for ${slug}`)
  return p.priceMonthly
}

const cents = (n: number): number => Math.round(n * 100) / 100

export interface Offer {
  id: PlanId
  name: string
  category: Category
  /** GA4 item_id / item_category / item_name come from here. */
  monthly: number
  blurb: string
  features: string[]
}

export const OFFERS: Record<PlanId, Offer> = {
  free: {
    id: 'free',
    name: 'Free',
    category: 'individual',
    monthly: 0,
    blurb: 'Meet Hanzo',
    features: ['Chat on web, iOS, Android and desktop', 'The free Zen models, with a daily allowance', 'Built-in web search', 'Add credit at any time for the paid models'],
  },
  dev: {
    id: 'dev',
    name: 'Dev',
    category: 'individual',
    monthly: monthlyOf('dev'),
    blurb: 'Research, code, and organize',
    features: ['Everything in Free and:', 'Hanzo Dev in your own repository', 'Every room in the Hanzo app', 'Higher usage limits', 'MCP, the SDK and the CLI included'],
  },
  max: {
    id: 'max',
    name: 'Max',
    category: 'individual',
    monthly: monthlyOf('max'),
    blurb: 'Higher limits, priority access',
    features: ['Everything in Dev, plus:', 'Enso orchestration across models', 'Unlimited managed agents', 'Higher output limits for all tasks', 'Priority access at high traffic times'],
  },
  team_standard: {
    id: 'team_standard',
    name: 'Standard seat',
    category: 'team',
    monthly: monthlyOf('dev') + SEAT_ADDON,
    blurb: 'A Dev seat for each teammate',
    features: ['Everything in Dev, per person', 'Org workspaces with shared history and projects', 'SSO through Hanzo IAM', 'One bill for everyone'],
  },
  team_premium: {
    id: 'team_premium',
    name: 'Premium seat',
    category: 'team',
    monthly: monthlyOf('max') + SEAT_ADDON,
    blurb: 'A Max seat for heavy users',
    features: ['Everything in Max, per person', 'Org workspaces with shared history and projects', 'SSO through Hanzo IAM', 'One bill for everyone'],
  },
}

/** One unit's price per month at this interval (a year, spread over its twelve months). */
export const unit = (id: PlanId, interval: Interval): number => cents(interval === 'annual' ? OFFERS[id].monthly * ANNUAL : OFFERS[id].monthly)

/** What one unit costs per billing period: the month, or the year at once. */
export const period = (id: PlanId, interval: Interval): number => (interval === 'annual' ? cents(unit(id, 'annual') * 12) : unit(id, 'monthly'))

/** What a year saves over twelve months, as a whole percent. */
export const saving = Math.round((1 - ANNUAL) * 100)

export interface Lines {
  seats: number
  /** What is charged today (before tax): the period's price times the seats. */
  subtotal: number
  /** What that comes to per month. */
  perMonth: number
}

export function lines(id: PlanId, interval: Interval, seats = 1): Lines {
  const n = OFFERS[id].category === 'team' ? Math.max(MIN_SEATS, Math.min(MAX_SEATS, Math.floor(seats))) : 1
  return { seats: n, subtotal: cents(period(id, interval) * n), perMonth: cents(unit(id, interval) * n) }
}

/** GA4-shaped item for a commerce event: price is per unit, quantity is seats. */
export function item(id: PlanId, interval: Interval, seats = 1) {
  const o = OFFERS[id]
  return { item_id: id, item_name: o.name, item_category: o.category, item_variant: interval, price: period(id, interval), quantity: lines(id, interval, seats).seats }
}

export const usd = (n: number): string => `$${n.toFixed(2)}`
/** `$19` when whole, `$15.58` when not. */
export const money = (n: number): string => (Number.isInteger(n) ? `$${n}` : usd(n))

/** The commerce catalog's slug for a plan, and the quantity it is bought at. */
export const SLUG: Record<PlanId, string> = { free: 'free', dev: 'dev', max: 'max', team_standard: 'team-standard', team_premium: 'team-premium' }
