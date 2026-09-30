// A plan as every ecommerce event names it: GA4's item shape, which the tag
// manager hands Meta, TikTok and X, and which cloud's forwarder lifts from the
// events the server states. One function, so a plan carries the same line from
// the pricing page to the checkout to the order.
//
// `item_id` is the plan's id as the catalog spells it (free, dev, max, and the
// team plans), `item_category` says who it is for, `item_variant` the term,
// `price` the unit price for that term in US dollars and `quantity` the seats
// (1 for an individual plan).

export interface CommerceItem {
  item_id: string
  item_name?: string
  item_category: 'individual' | 'team'
  item_variant: 'monthly' | 'annual'
  price: number
  quantity: number
}

export interface PlanLine {
  id: string
  name?: string
  /** A team plan is sold per seat. */
  team?: boolean
  /** The term, as commerce (`month`, `year`) or the funnel (`monthly`, `annual`) says it. */
  interval: string
  price: number | null
  quantity?: number
}

export function commerceItem(p: PlanLine): CommerceItem {
  const annual = /^(year|yearly|annual)$/i.test(p.interval)
  return {
    item_id: p.id,
    ...(p.name ? { item_name: p.name } : {}),
    item_category: p.team ? 'team' : 'individual',
    item_variant: annual ? 'annual' : 'monthly',
    price: p.price ?? 0,
    quantity: p.quantity ?? 1,
  }
}

/** What the whole order is worth: the unit price times the seats. */
export const worth = (i: CommerceItem): number => i.price * i.quantity
