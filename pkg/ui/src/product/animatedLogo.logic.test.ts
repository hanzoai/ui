import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GAP,
  HOUSE_EASE,
  isExpanded,
  wordmarkStyle,
  wordmarkText,
} from './animatedLogo.logic'
import { BRANDS, HANZO, resolveBrand, ZOO } from './brand'

describe('wordmarkText', () => {
  it('joins brand + surface', () => {
    expect(wordmarkText('Hanzo', 'Cloud')).toBe('Hanzo Cloud')
    expect(wordmarkText('Lux', 'Studio')).toBe('Lux Studio')
  })
  it('is just the brand when there is no surface', () => {
    expect(wordmarkText('Hanzo')).toBe('Hanzo')
    expect(wordmarkText('Hanzo', '')).toBe('Hanzo')
    expect(wordmarkText('Hanzo', '   ')).toBe('Hanzo')
  })
})

describe('isExpanded', () => {
  const base = { hovered: false, focused: false, introShowing: false }
  it('is collapsed at rest', () => {
    expect(isExpanded(base)).toBe(false)
  })
  it('expands on hover, focus, or during the mount intro', () => {
    expect(isExpanded({ ...base, hovered: true })).toBe(true)
    expect(isExpanded({ ...base, focused: true })).toBe(true)
    expect(isExpanded({ ...base, introShowing: true })).toBe(true)
  })
})

describe('wordmarkStyle', () => {
  const opts = { gap: DEFAULT_GAP, durationMs: 360, easing: HOUSE_EASE, reduce: false }

  it('collapses fully to the mark (width/opacity/margin all zero)', () => {
    const s = wordmarkStyle({ ...opts, expanded: false, naturalWidth: 90 })
    expect(s.width).toBe(0)
    expect(s.opacity).toBe(0)
    expect(s.marginLeft).toBe(0)
  })

  it('expands to the measured natural width with the gap restored', () => {
    const s = wordmarkStyle({ ...opts, expanded: true, naturalWidth: 90 })
    expect(s.width).toBe(90)
    expect(s.opacity).toBe(1)
    expect(s.marginLeft).toBe(DEFAULT_GAP)
  })

  it('falls back to auto width before the wordmark is measured', () => {
    const s = wordmarkStyle({ ...opts, expanded: true, naturalWidth: undefined })
    expect(s.width).toBe('auto')
  })

  it('animates width, opacity and margin on the house curve', () => {
    const s = wordmarkStyle({ ...opts, expanded: true, naturalWidth: 90 })
    expect(s.transition).toContain(`width 360ms ${HOUSE_EASE}`)
    expect(s.transition).toContain('opacity 360ms')
    expect(s.transition).toContain('margin-left 360ms')
  })

  it('drops the transition entirely under prefers-reduced-motion', () => {
    const s = wordmarkStyle({ ...opts, reduce: true, expanded: false, naturalWidth: 90 })
    expect(s.transition).toBe('none')
    // state still resolves — it is just not animated
    expect(s.width).toBe(0)
  })
})

describe('brand registry', () => {
  it('defaults to Hanzo and resolves white-label ids', () => {
    expect(resolveBrand()).toBe(HANZO)
    expect(resolveBrand('lux').name).toBe('Lux')
    expect(resolveBrand('zoo').name).toBe('Zoo')
    expect(resolveBrand('nope')).toBe(HANZO)
  })
  it('every brand carries a viewBox and mark content', () => {
    for (const b of Object.values(BRANDS)) {
      expect(b.viewBox).toMatch(/-?\d/)
      expect(b.content.length).toBeGreaterThan(0)
      expect(b.content).toContain('<')
    }
  })
  it('marks are currentColor-themeable except Zoo (intentional full-color)', () => {
    expect(HANZO.fullColor).toBeFalsy()
    expect(ZOO.fullColor).toBe(true)
  })
})
