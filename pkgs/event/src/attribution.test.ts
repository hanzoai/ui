import { describe, it, expect } from 'vitest'
import { parseAttribution, deriveChannel, hostOf, hasAttribution, isoWeek } from './attribution'

describe('parseAttribution', () => {
  it('parses utm params and refCode', () => {
    const a = parseAttribution('?utm_source=google&utm_medium=cpc&utm_campaign=launch&ref=REF123', '')
    expect(a.utm.source).toBe('google')
    expect(a.utm.medium).toBe('cpc')
    expect(a.utm.campaign).toBe('launch')
    expect(a.refCode).toBe('REF123')
    expect(a.channel).toBe('paid')
  })

  it('accepts refCode aliases', () => {
    expect(parseAttribution('?refCode=ABC', '').refCode).toBe('ABC')
    expect(parseAttribution('?ref_code=XYZ', '').refCode).toBe('XYZ')
  })
})

describe('deriveChannel', () => {
  it('classifies paid from cpc medium', () => {
    expect(deriveChannel({ utm: { medium: 'cpc' } })).toBe('paid')
  })
  it('classifies referral when a refCode is present', () => {
    expect(deriveChannel({ utm: {}, refCode: 'R1' })).toBe('referral')
  })
  it('classifies organic from a search referrer', () => {
    expect(deriveChannel({ utm: {}, referrer: 'https://www.google.com/search?q=hanzo' })).toBe('organic')
  })
  it('classifies social from a social referrer', () => {
    expect(deriveChannel({ utm: {}, referrer: 'https://news.ycombinator.com/item?id=1' })).toBe('social')
  })
  it('classifies direct with no referrer', () => {
    expect(deriveChannel({ utm: {} })).toBe('direct')
  })
})

describe('hostOf', () => {
  it('extracts bare host', () => {
    expect(hostOf('https://user@News.YCombinator.com:443/x?y')).toBe('news.ycombinator.com')
  })
  it('returns empty for junk', () => {
    expect(hostOf('')).toBe('')
    expect(hostOf(undefined)).toBe('')
  })
})

describe('hasAttribution', () => {
  it('is false for an empty attribution', () => {
    expect(hasAttribution({ utm: {} })).toBe(false)
  })
  it('is true when any signal is present', () => {
    expect(hasAttribution({ utm: { source: 'x' } })).toBe(true)
    expect(hasAttribution({ utm: {}, refCode: 'r' })).toBe(true)
    expect(hasAttribution({ utm: {}, referrer: 'https://example.com/' })).toBe(true)
  })
})

describe('isoWeek', () => {
  it('computes the ISO week label', () => {
    // 2026-07-13 is in ISO week 29.
    expect(isoWeek(new Date('2026-07-13T00:00:00Z'))).toBe('2026-W29')
    // 2026-01-01 (Thursday) is ISO week 01 of 2026.
    expect(isoWeek(new Date('2026-01-01T00:00:00Z'))).toBe('2026-W01')
  })
})
