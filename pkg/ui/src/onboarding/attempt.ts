/**
 * The retry key of one purchase: the organization, the plan, the term and the
 * seats. It is kept in the browser until commerce settles the purchase, so a
 * retry after a lost answer, a remount, or a second tab asks for the same sale
 * and commerce replays it instead of charging again
 * (POST /v1/billing/subscribe/card, X-Idempotency-Key). A new key is taken once
 * commerce has answered that nothing was charged, and after a day: commerce keeps
 * a settled sale's answer, so a key kept longer would replay yesterday's sale.
 */

const PREFIX = 'hanzo.checkout:'

/** How long a key is kept: a retry comes within minutes, a new purchase days later. */
const DAY = 24 * 60 * 60 * 1000

const random = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const store = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** The name a purchase's key is kept under. */
export const purchase = (org: string | undefined, plan: string, interval: string, seats: number): string => `${PREFIX}${org ?? ''}:${plan}:${interval}:${seats}`

/** The key for this purchase: the one kept, or a new one, kept. */
export function keyFor(name: string, now = Date.now()): string {
  const s = store()
  try {
    const [key, at] = (s?.getItem(name) ?? '').split('@')
    if (key && now - Number(at) < DAY) return key
    const fresh = random()
    s?.setItem(name, `${fresh}@${now}`)
    return fresh
  } catch {
    return random()
  }
}

/** Forget the key: the sale settled, or commerce answered that nothing was charged. */
export function settle(name: string): void {
  try {
    store()?.removeItem(name)
  } catch {
    /* nothing kept */
  }
}

/**
 * Whether an answer ends this purchase's key: a refusal before the card, a
 * decline, or a 409 that the account already pays (a sale in progress keeps it).
 */
export const uncharged = (status: number | undefined, message = ''): boolean =>
  status === 400 || status === 402 || status === 404 || status === 422 || (status === 409 && /already pays/i.test(message))
