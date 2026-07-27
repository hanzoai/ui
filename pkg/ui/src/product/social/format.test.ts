import { describe, it, expect } from 'vitest'

import { formatPostTime, postDayBucket, postPreview, parsePostTime } from './format'

/** A local-time epoch — built from components so the suite is timezone-independent. */
const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  Math.floor(new Date(y, m, d, h, min, 0, 0).getTime() / 1000)

describe('formatPostTime', () => {
  it('renders the unset (0) schedule as an em dash, never "Jan 1 1970"', () => {
    expect(formatPostTime(0)).toBe('—')
  })

  it('renders a real timestamp', () => {
    expect(formatPostTime(at(2026, 6, 15, 9, 30))).not.toBe('—')
  })
})

describe('postDayBucket', () => {
  it('buckets two times on the same local day under one key', () => {
    expect(postDayBucket(at(2026, 6, 15, 1)).key).toBe(postDayBucket(at(2026, 6, 15, 23)).key)
  })

  it('separates adjacent days', () => {
    expect(postDayBucket(at(2026, 6, 15)).key).not.toBe(postDayBucket(at(2026, 6, 16)).key)
  })

  it('does not collide across months or years (the key carries all three parts)', () => {
    expect(postDayBucket(at(2026, 6, 1)).key).not.toBe(postDayBucket(at(2026, 7, 1)).key)
    expect(postDayBucket(at(2026, 6, 1)).key).not.toBe(postDayBucket(at(2027, 6, 1)).key)
  })
})

describe('postPreview', () => {
  it('shows an em dash for empty / whitespace-only content', () => {
    expect(postPreview('')).toBe('—')
    expect(postPreview('   ')).toBe('—')
  })

  it('passes short content through, trimmed', () => {
    expect(postPreview('  ship it  ')).toBe('ship it')
  })

  it('truncates past 72 chars with an ellipsis', () => {
    const out = postPreview('a'.repeat(100))
    expect(out).toBe(`${'a'.repeat(72)}…`)
  })

  it('leaves content exactly at the 72 boundary intact', () => {
    expect(postPreview('a'.repeat(72))).toBe('a'.repeat(72))
  })
})

describe('parsePostTime', () => {
  it('parses an ISO instant to unix seconds', () => {
    expect(parsePostTime('2026-07-15T09:00:00Z')).toBe(Date.UTC(2026, 6, 15, 9) / 1000)
  })

  it('tolerates surrounding whitespace', () => {
    expect(parsePostTime('  2026-07-15T09:00:00Z  ')).toBe(Date.UTC(2026, 6, 15, 9) / 1000)
  })

  it('returns 0 for unparseable or empty input rather than NaN', () => {
    expect(parsePostTime('')).toBe(0)
    expect(parsePostTime('not a date')).toBe(0)
  })
})
