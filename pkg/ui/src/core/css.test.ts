import { describe, expect, it } from 'vitest'

import { substitute } from './css'

/**
 * The case this exists for is the first one: jsdom hands a test the `var()` text
 * verbatim, and the theme rungs are written as `var(--token, literal)` so a
 * browser follows the live cascade and a host with no design sheet still gets
 * the value the WCAG audit measured. With no vars declared — which IS the jsdom
 * situation — the fallback is what a browser computes too, so this is the real
 * answer rather than a stand-in for it.
 */
describe('substitute', () => {
  it('resolves the rung a jsdom test actually reads', () => {
    expect(substitute('var(--border, rgb(255 255 255 / .10))')).toBe('rgb(255 255 255 / .10)')
    expect(substitute('var(--foreground, #fafafa)')).toBe('#fafafa')
    expect(substitute('var(--ring, rgb(0 0 0 / .5))')).toBe('rgb(0 0 0 / .5)')
  })

  it('prefers a declared value over the fallback, as the cascade does', () => {
    expect(substitute('var(--border, #fff)', { '--border': '#123456' })).toBe('#123456')
  })

  it('leaves a value with no var() alone', () => {
    expect(substitute('#fafafa')).toBe('#fafafa')
    expect(substitute('')).toBe('')
  })

  it('resolves through a chain of references', () => {
    expect(substitute('var(--a)', { '--a': 'var(--b)', '--b': 'red' })).toBe('red')
    expect(substitute('var(--a, var(--b, blue))')).toBe('blue')
    expect(substitute('var(--a, var(--b, blue))', { '--b': 'green' })).toBe('green')
  })

  it('keeps the text around and between references', () => {
    expect(substitute('1px solid var(--border, #333)')).toBe('1px solid #333')
    expect(substitute('var(--a, 1px) solid var(--b, #333)')).toBe('1px solid #333')
  })

  it('does not mistake a comma inside the fallback for the separator', () => {
    // `rgb(0 0 0 / .5), 0 4px 6px` is ONE fallback. Splitting on the last comma,
    // or on all of them, truncates a shadow to its first layer.
    expect(substitute('var(--shadow, 0 1px 2px rgb(0 0 0 / .5), 0 4px 6px rgb(0 0 0 / .3))')).toBe(
      '0 1px 2px rgb(0 0 0 / .5), 0 4px 6px rgb(0 0 0 / .3)',
    )
  })

  it('drops the WHOLE declaration when a reference cannot resolve', () => {
    // Invalid at computed-value time. A browser does not keep the literal half
    // of `1px solid var(--nope)` — it discards the declaration — so neither does
    // this, or a test would assert a border that never painted.
    expect(substitute('var(--nope)')).toBe('')
    expect(substitute('1px solid var(--nope)')).toBe('')
  })

  it('treats a cycle as unresolvable rather than recursing forever', () => {
    expect(substitute('var(--a)', { '--a': 'var(--b)', '--b': 'var(--a)' })).toBe('')
    expect(substitute('var(--a)', { '--a': 'var(--a)' })).toBe('')
  })

  it('leaves an unbalanced value untouched instead of guessing', () => {
    expect(substitute('var(--a')).toBe('var(--a')
  })
})
