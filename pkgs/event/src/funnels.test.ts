import { describe, it, expect } from 'vitest'
import { EVENTS, PAGEVIEW } from './events'
import { FUNNELS, PRODUCTS, eventsOf, type FunnelId } from './funnels'
import { GOALS } from './goals'

const NAMES = new Set<string>([...Object.values(EVENTS), PAGEVIEW])
const ids = Object.keys(FUNNELS) as FunnelId[]

describe('event vocabulary', () => {
  it('is snake_case with no product prefix or interpolation', () => {
    for (const name of Object.values(EVENTS)) {
      expect(name, name).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/)
    }
  })

  it('has no duplicate values (two constants must never share a name)', () => {
    const values = Object.values(EVENTS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('reserves the $ prefix for the client (only $pageview)', () => {
    expect(Object.values(EVENTS).some((n) => n.startsWith('$'))).toBe(false)
    expect(PAGEVIEW).toBe('$pageview')
  })
})

describe('funnels', () => {
  it('only reference events that exist — the anti-drift guard', () => {
    for (const id of ids) {
      for (const step of FUNNELS[id].steps) {
        expect(NAMES.has(step.event), `${id}: unknown event "${step.event}"`).toBe(true)
      }
    }
  })

  it('name only known products', () => {
    for (const id of ids) {
      for (const p of FUNNELS[id].products) {
        expect(PRODUCTS, `${id}: unknown product "${p}"`).toContain(p)
      }
    }
  })

  it('are ordered lists of at least two steps', () => {
    for (const id of ids) expect(FUNNELS[id].steps.length, id).toBeGreaterThanOrEqual(2)
  })

  it('mark a cross-origin funnel as aggregate (no shared anonymousId)', () => {
    // Two surfaces + a logged-out visitor = two anonymousIds. Anything spanning
    // origins must say so, or the read lens silently reports a false conversion.
    for (const id of ids) {
      if (FUNNELS[id].products.length > 1 && FUNNELS[id].join === 'person') {
        // person-joined multi-product funnels are only legitimate post-login
        // (site+cloud share the OIDC subject) — flag anything anonymous.
        expect(FUNNELS[id].steps[0].event, id).not.toBe(PAGEVIEW)
      }
    }
    expect(FUNNELS.siteToChat.join).toBe('aggregate')
  })

  it('the three product journeys are covered', () => {
    expect(FUNNELS.signup.products).toContain('site')
    expect(FUNNELS.appShip.products).toContain('app')
    expect(FUNNELS.chatEngage.products).toContain('chat')
  })

  it('appShip ends at a live URL, not at a click', () => {
    const last = FUNNELS.appShip.steps[FUNNELS.appShip.steps.length - 1]
    expect(last.event).toBe(EVENTS.DEPLOY_SUCCEEDED)
  })
})

describe('goals', () => {
  it('derive their funnel from the registry — one definition, never restated', () => {
    for (const goal of Object.values(GOALS)) {
      if (!goal.funnelId) continue
      expect(goal.funnel).toEqual(eventsOf(goal.funnelId))
    }
  })

  it('convert on an event the funnel actually contains (or its head)', () => {
    expect(GOALS.signup.funnel).toContain(EVENTS.SIGNUP_COMPLETED)
    expect(GOALS.sale.funnel).toContain(EVENTS.ORDER_COMPLETED)
    expect(GOALS.activation.funnel).toContain(EVENTS.FIRST_ACTION)
  })

  it('no longer gates signup on an event nothing emits', () => {
    // signup_verified is IAM-internal: no surface emits it, so its presence in
    // the signup funnel pinned the conversion rate at 0.
    expect(GOALS.signup.funnel).not.toContain(EVENTS.SIGNUP_VERIFIED)
  })
})
