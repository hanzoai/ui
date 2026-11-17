import { describe, it, expect } from 'vitest'

import { delayText, sendAt, tally, walkState } from './logic'

describe('walkState — one person\'s walk as the cloud reports it', () => {
  const now = 1_800_000_000
  it('says a completed walk was taken, never delivered', () => {
    expect(walkState({ status: 'completed', nextRunAt: 0 }, now)).toBe('taken')
  })
  it('says canceled', () => {
    expect(walkState({ status: 'canceled', nextRunAt: now + 60 }, now)).toBe('canceled')
  })
  it('names when an active step comes due', () => {
    expect(walkState({ status: 'active', nextRunAt: now + 3600 }, now)).toMatch(/^due /)
  })
  it('calls a due step being taken sending', () => {
    expect(walkState({ status: 'active', nextRunAt: now - 5 }, now)).toBe('sending')
  })
})

describe('tally — a sequence\'s counts, all from its enrollments', () => {
  it('counts each state', () => {
    expect(tally([{ status: 'active' }, { status: 'completed' }, { status: 'completed' }, { status: 'canceled' }])).toEqual({ enrolled: 4, due: 1, taken: 2, canceled: 1 })
  })
  it('is zero for nobody', () => {
    expect(tally([])).toEqual({ enrolled: 0, due: 0, taken: 0, canceled: 0 })
  })
})

describe('delayText', () => {
  it('counts the first step from enrollment and the rest from the step before', () => {
    expect(delayText({ idx: 0, delaySeconds: 0 })).toBe('at enrollment')
    expect(delayText({ idx: 1, delaySeconds: 2 * 86400 })).toBe('2 d after the previous step')
    expect(delayText({ idx: 0, delaySeconds: 7200 })).toBe('2 h after enrollment')
    expect(delayText({ idx: 2, delaySeconds: 90 })).toBe('90 s after the previous step')
  })
})

describe('sendAt — the send time a form names', () => {
  const now = Date.parse('2026-10-25T12:00:00Z') / 1000
  it('reads empty as now', () => {
    expect(sendAt('', now)).toEqual({ at: null })
  })
  it('reads a future time in unix seconds', () => {
    expect(sendAt('2026-10-25T13:00:00Z', now)).toEqual({ at: now + 3600 })
  })
  it('refuses a past time and a non-date', () => {
    expect(sendAt('2026-10-25T11:00:00Z', now)).toEqual({ error: 'The send time has to be in the future.' })
    expect(sendAt('soon', now)).toEqual({ error: 'That send time is not a date.' })
  })
})
