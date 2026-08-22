import { describe, expect, it } from 'vitest'

import { TONE, tone } from './tone'

describe('tone', () => {
  it('reads the lifecycle a resource reports', () => {
    expect(tone('running')).toBe('settled')
    expect(tone('provisioning')).toBe('moving')
    expect(tone('failed')).toBe('stopped')
  })

  it('reads the lifecycle an invoice reports', () => {
    // The gap four billing surfaces each closed by hand, four different ways.
    expect(tone('paid')).toBe('settled')
    expect(tone('open')).toBe('moving')
    expect(tone('past_due')).toBe('stopped')
    expect(tone('uncollectible')).toBe('stopped')
    expect(tone('draft')).toBe('quiet')
    expect(tone('void')).toBe('quiet')
    expect(tone('refunded')).toBe('quiet')
  })

  it('folds the shapes a dozen backends spell one status in', () => {
    for (const s of ['past_due', 'past-due', 'Past Due', 'PAST_DUE', '  past due  '])
      expect([s, tone(s)]).toEqual([s, 'stopped'])
  })

  it('takes the platform’s own traffic-light verdicts as input', () => {
    // The apps inventory reports green/yellow/red directly. They are STATUSES
    // here, not colours — nothing downstream paints one.
    expect(tone('green')).toBe('settled')
    expect(tone('yellow')).toBe('moving')
    expect(tone('red')).toBe('stopped')
  })

  it('calls an unknown status unknown, not an alarm', () => {
    expect(tone('')).toBe('quiet')
    expect(tone('flurbled')).toBe('quiet')
  })
})

describe('the tone treatments', () => {
  it('spend no hue — every fill is a rung of the grey ladder', () => {
    // The pills are monochrome by construction. A red `$red9` here would read as
    // an alarm on a dark canvas and as a warning on a light one, and neither is
    // a decision this component gets to make for a whole fleet.
    // The ladder is named now, not numbered. Both spellings pass: the ramp is
    // still legal (Switch needs it) and every other component reads a name.
    const ladder = /^\$(?:sunken|panel|hover|edge|raised|rim|bound|dim|faint|soft|quiet|ink)$|^\$color\d+$|^transparent$/
    for (const [name, t] of Object.entries(TONE))
      for (const [prop, value] of Object.entries(t))
        expect([name, prop, ladder.test(value)]).toEqual([name, prop, true])
  })

  it('sets `stopped` apart by an edge, since it cannot be set apart by a hue', () => {
    // Before this, `failed` and `pending` painted the same two tokens: the
    // vocabulary had four names and three visuals, so a red row and a yellow one
    // were indistinguishable in a table.
    expect(TONE.stopped.borderColor).not.toBe('transparent')
    expect(TONE.stopped).not.toEqual(TONE.moving)
  })

  it('gives every tone a border, so turning one on shifts no layout', () => {
    // A border that appears only on `stopped` moves every neighbour by 2px the
    // moment an invoice goes past due.
    for (const t of Object.values(TONE)) expect(t).toHaveProperty('borderColor')
  })
})
