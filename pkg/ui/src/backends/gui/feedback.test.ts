/**
 * The one status map: every status has a colour, every colour a full paint,
 * and the colours the chrome draws in are the STATE tokens wherever a state
 * exists — error, warning and success are never a data hue in a strip or an
 * icon — with info on the accent.
 */
import { describe, expect, it } from 'vitest'
import { STATUS_COLOR, STATUS_PAINT, colorOf, paint } from './feedback'

describe('the feedback status map', () => {
  it('maps the five statuses onto the five colours, twenty-ui’s way', () => {
    expect(STATUS_COLOR).toEqual({ neutral: 'gray', info: 'blue', success: 'green', warning: 'orange', error: 'red' })
  })

  it('a named colour wins over the status’s', () => {
    expect(colorOf('error', 'blue')).toBe('blue')
    expect(colorOf('error')).toBe('red')
    expect(colorOf(undefined)).toBe('gray')
  })

  it('the chrome hues are the state tokens, and info is the accent', () => {
    expect(paint('error').ink).toBe('var(--state-error)')
    expect(paint('warning').ink).toBe('var(--state-warning)')
    expect(paint('warning').tint).toBe('var(--state-warning-bg)')
    expect(paint('success').ink).toBe('var(--state-success)')
    expect(paint('info').fill).toBe('var(--primary)')
    expect(paint('info').on).toBe('var(--primary-foreground)')
  })

  it('a red fill is design’s destructive fill, cut for its own foreground', () => {
    expect(paint('error').fill).toBe('var(--destructive)')
    expect(paint('error').on).toBe('var(--destructive-foreground)')
  })

  it('only the callout’s faint ground and edge read the data palette', () => {
    for (const [hue, p] of Object.entries(STATUS_PAINT)) {
      expect(p.ground).toBe(`var(--data-${hue}-1)`)
      expect(p.edge).toBe(`var(--data-${hue}-6)`)
      for (const role of ['ink', 'fill', 'on', 'tint'] as const) expect(p[role]).not.toMatch(/--data-/)
    }
  })
})
