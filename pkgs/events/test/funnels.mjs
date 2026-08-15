/**
 * A funnel names events that exist, surfaces that exist, and says honestly
 * whether its steps can be joined to one person.
 *
 * The failure these prevent is silent: a funnel naming an event nothing emits,
 * or claiming a per-person conversion across two registrable domains that mint
 * two anonymous ids, reads as a real number and is not one.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EVENTS, PAGEVIEW, FUNNELS, PRODUCTS, eventsOf } from '../dist/index.js'

const NAMES = new Set([...Object.values(EVENTS), PAGEVIEW])
const ids = Object.keys(FUNNELS)

test('every step names an event in the vocabulary', () => {
  for (const id of ids) {
    for (const step of FUNNELS[id].steps) {
      assert.ok(NAMES.has(step.event), `${id}: unknown event "${step.event}"`)
    }
  }
})

test('every step and funnel names a known product', () => {
  for (const id of ids) {
    for (const p of FUNNELS[id].products) {
      assert.ok(PRODUCTS.includes(p), `${id}: unknown product "${p}"`)
    }
    for (const step of FUNNELS[id].steps) {
      if (!step.product) continue
      assert.ok(PRODUCTS.includes(step.product), `${id}: unknown step product "${step.product}"`)
      assert.ok(
        FUNNELS[id].products.includes(step.product),
        `${id}: step product "${step.product}" is not one the funnel declares`,
      )
    }
  }
})

test('a funnel is an ordered list of at least two steps', () => {
  for (const id of ids) {
    assert.ok(FUNNELS[id].steps.length >= 2, `${id} has fewer than two steps`)
  }
})

test('a repeated event name is separated by product, or it is one step twice', () => {
  // The same name may appear twice ONLY when each occurrence names the surface
  // it came from — checkout_started on billing and on pay are two moments. Two
  // unqualified occurrences would collapse into one step and hide the gap.
  for (const id of ids) {
    const seen = new Map()
    for (const step of FUNNELS[id].steps) {
      const prior = seen.get(step.event)
      if (prior !== undefined) {
        assert.ok(
          step.product && prior.product && step.product !== prior.product,
          `${id}: "${step.event}" appears twice without naming two different products`,
        )
      }
      seen.set(step.event, step)
    }
  }
})

test('a funnel crossing registrable domains is aggregate, never per-person', () => {
  // The anonymous id is a cookie on the REGISTRABLE DOMAIN. Surfaces under
  // hanzo.ai share it; hanzo.id is a domain of its own and does not. A funnel
  // that spans both and claims `join: 'person'` reports a conversion that
  // cannot happen.
  const OWN_DOMAIN = new Set(['id'])
  for (const id of ids) {
    if (FUNNELS[id].join !== 'person') continue
    const crosses = FUNNELS[id].products.some((p) => OWN_DOMAIN.has(p))
    assert.ok(!crosses, `${id} joins per person across a separate registrable domain`)
  }
})

test('the money funnel ends at the settled sale', () => {
  const steps = FUNNELS.upgrade.steps
  assert.equal(steps[steps.length - 1].event, EVENTS.ORDER_COMPLETED)
})

test('the signup funnel covers the form on the identity surface', () => {
  // The dark stretch: between being sent to sign up and coming back, the form
  // itself is on another surface. A funnel that skips it cannot say where the
  // people went.
  const onId = FUNNELS.signup.steps.filter((s) => s.product === 'id')
  assert.ok(onId.length >= 2, 'signup does not measure the form on hanzo.id')
})

test('eventsOf returns the steps in order', () => {
  assert.deepEqual(eventsOf('chatEngage'), [
    PAGEVIEW,
    EVENTS.CHAT_STARTED,
    EVENTS.CHAT_MESSAGE_SENT,
    EVENTS.GENERATION_COMPLETED,
  ])
})
