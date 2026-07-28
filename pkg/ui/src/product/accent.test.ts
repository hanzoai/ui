import { describe, it, expect } from 'vitest'

import { isHexColor, resolveAccent, contrastText, accentFor } from './accent'

/**
 * The apply half of the org-theme fix: resolve the REAL persisted color to an accent
 * (or null when the theme is off / invalid — honest, no fabricated accent), and pick a
 * readable text color for content on that accent. Pure; the live `useAccent` store +
 * the recolored surfaces are exercised in the browser.
 */

describe('accentFor — the Accent value a theme block should apply', () => {
  it('resolves an enabled valid color to {accent, contrast}', () => {
    expect(accentFor({ colorPrimary: '#5E6AD2', isEnabled: true })).toEqual({ accent: '#5E6AD2', contrast: '#ffffff' })
    expect(accentFor({ colorPrimary: '#f5d90a', isEnabled: true })).toEqual({ accent: '#f5d90a', contrast: '#000000' })
  })
  it('is the honest default (no accent) when disabled / invalid / missing', () => {
    expect(accentFor({ colorPrimary: '#5E6AD2', isEnabled: false })).toEqual({ accent: null, contrast: '#ffffff' })
    expect(accentFor({ colorPrimary: 'nope', isEnabled: true })).toEqual({ accent: null, contrast: '#ffffff' })
    expect(accentFor(null)).toEqual({ accent: null, contrast: '#ffffff' })
  })
})

describe('isHexColor', () => {
  it('accepts 3- and 6-digit hex (case-insensitive, trims)', () => {
    expect(isHexColor('#abc')).toBe(true)
    expect(isHexColor('#5E6AD2')).toBe(true)
    expect(isHexColor('  #00ff88  ')).toBe(true)
  })
  it('rejects non-hex / empty / undefined', () => {
    expect(isHexColor('5E6AD2')).toBe(false) // no #
    expect(isHexColor('#12')).toBe(false)
    expect(isHexColor('rgb(1,2,3)')).toBe(false)
    expect(isHexColor('')).toBe(false)
    expect(isHexColor(undefined)).toBe(false)
    expect(isHexColor(null)).toBe(false)
  })
})

describe('resolveAccent — the color to apply, or null (honest)', () => {
  it('returns the hex only when the theme is enabled AND valid', () => {
    expect(resolveAccent({ colorPrimary: '#5E6AD2', isEnabled: true })).toBe('#5E6AD2')
    expect(resolveAccent({ colorPrimary: '  #0f0 ', isEnabled: true })).toBe('#0f0')
  })
  it('returns null when disabled, missing, or invalid — no accent forced', () => {
    expect(resolveAccent({ colorPrimary: '#5E6AD2', isEnabled: false })).toBeNull()
    expect(resolveAccent({ colorPrimary: 'not-a-color', isEnabled: true })).toBeNull()
    expect(resolveAccent({ isEnabled: true })).toBeNull()
    expect(resolveAccent(null)).toBeNull()
    expect(resolveAccent(undefined)).toBeNull()
  })
})

describe('contrastText — readable text on the accent', () => {
  it('black on a light accent, white on a dark accent', () => {
    expect(contrastText('#ffffff')).toBe('#000000')
    expect(contrastText('#f5d90a')).toBe('#000000') // bright yellow → black text
    expect(contrastText('#000000')).toBe('#ffffff')
    expect(contrastText('#5E6AD2')).toBe('#ffffff') // indigo → white text
  })
  it('handles 3-digit hex and never throws on bad input', () => {
    expect(contrastText('#fff')).toBe('#000000')
    expect(contrastText('#000')).toBe('#ffffff')
    expect(contrastText('garbage')).toBe('#ffffff') // safe fallback
  })
})
