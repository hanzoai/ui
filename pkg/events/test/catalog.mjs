/**
 * The vocabulary and the schema describe the same set, or this fails.
 *
 * Two files can each be individually correct and still disagree, and the way
 * you find out is a chart with a gap in it months later. So the agreement is
 * the test: a name added to one without the other is a red build, not a
 * discovery.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EVENTS, SCHEMA, NAMES, RESERVED, isKnown, specFor } from '../dist/index.js'

test('every name in the vocabulary has a spec', () => {
  const missing = Object.values(EVENTS).filter((n) => !(n in SCHEMA))
  assert.deepEqual(missing, [], `names with no spec: ${missing.join(', ')}`)
})

test('every spec describes a name in the vocabulary', () => {
  const names = new Set(Object.values(EVENTS))
  const orphans = Object.keys(SCHEMA).filter((n) => !names.has(n))
  assert.deepEqual(orphans, [], `specs for names that do not exist: ${orphans.join(', ')}`)
})

test('every spec says what the event means', () => {
  for (const [name, spec] of Object.entries(SCHEMA)) {
    assert.ok(spec.summary && spec.summary.length > 12, `${name} has no usable summary`)
  }
})

test('a property spec is typed and documented', () => {
  for (const [name, spec] of Object.entries(SCHEMA)) {
    for (const [prop, p] of Object.entries(spec.props)) {
      assert.ok(['string', 'number', 'boolean'].includes(p.type), `${name}.${prop} bad type`)
      assert.ok(p.doc && p.doc.length > 8, `${name}.${prop} is undocumented`)
    }
  }
})

test('names follow the convention: snake_case, no dimension in the name', () => {
  for (const n of NAMES) {
    assert.match(n, /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/, `${n} is not snake_case`)
  }
})

test('reserved names are known but are not catalog entries', () => {
  for (const r of RESERVED) {
    assert.ok(isKnown(r), `${r} should be known`)
    assert.equal(specFor(r), undefined, `${r} should not be a catalog entry`)
  }
})

test('an unknown name is not known — and that is a flag, not a refusal', () => {
  assert.equal(isKnown('totally_made_up'), false)
  assert.equal(specFor('totally_made_up'), undefined)
})

import { PLATFORMS, namesOn } from '../dist/index.js'

test('every platform row names an event in the vocabulary', () => {
  const known = new Set(NAMES)
  const orphans = Object.keys(PLATFORMS).filter((n) => !known.has(n))
  assert.deepEqual(orphans, [], `platform rows for events that do not exist: ${orphans.join(', ')}`)
})

test('every commerce step reaches Google and Meta', () => {
  for (const n of ['pricing_viewed', 'plan_clicked', 'plan_selected', 'plan_changed', 'checkout_started',
    'payment_info_added', 'order_completed', 'order_refunded', 'signup_completed', 'sales_contacted']) {
    assert.ok(namesOn(n, 'ga4').length, `${n} has no GA4 name`)
    assert.ok(namesOn(n, 'meta').length, `${n} has no Meta name`)
  }
})

test('sign_up, begin_checkout, purchase and lead reach every ad platform', () => {
  for (const [n, kinds] of [['signup_completed', 'sign_up'], ['checkout_started', 'begin_checkout'],
    ['order_completed', 'purchase'], ['sales_contacted', 'lead']]) {
    for (const p of ['linkedin', 'x']) assert.deepEqual(namesOn(n, p), [kinds], `${n} on ${p}`)
    assert.ok(namesOn(n, 'tiktok').length, `${n} on tiktok`)
  }
})

test('the catalog ships the platform table', async () => {
  const { readFileSync } = await import('node:fs')
  const c = JSON.parse(readFileSync(new URL('../dist/catalog.json', import.meta.url), 'utf8'))
  assert.equal(c.version, 3)
  assert.deepEqual(c.platforms, JSON.parse(JSON.stringify(PLATFORMS)))
})
