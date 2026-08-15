/**
 * A goal points AT a funnel and never restates its steps.
 *
 * The steps are defined once, in @hanzo/events. A goal that spelled its own copy
 * would be right on the day it was written and wrong the day a step moved — and
 * the way that surfaces is a conversion rate quietly measuring the wrong thing.
 */

import { describe, expect, it } from 'vitest'
import { EVENTS } from './events'
import { eventsOf } from './funnels'
import { GOALS } from './goals'

describe('goals', () => {
  it('derive their funnel from the registry — one definition, never restated', () => {
    for (const goal of Object.values(GOALS)) {
      if (!goal.funnelId) continue
      expect(goal.funnel).toEqual(eventsOf(goal.funnelId))
    }
  })

  it('convert on an event the funnel actually contains', () => {
    expect(GOALS.signup.funnel).toContain(EVENTS.SIGNUP_COMPLETED)
    expect(GOALS.sale.funnel).toContain(EVENTS.ORDER_COMPLETED)
    expect(GOALS.activation.funnel).toContain(EVENTS.FIRST_ACTION)
  })

  it('does not gate signup on an event nothing emits', () => {
    // signup_verified is IAM-internal: no surface emits it, so its presence in
    // the signup funnel would pin the conversion rate at 0.
    expect(GOALS.signup.funnel).not.toContain(EVENTS.SIGNUP_VERIFIED)
  })
})
