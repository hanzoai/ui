import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * A menu row's hover surface must not be the accent itself.
 *
 * @hanzo/design writes an org's chosen hue to BOTH `--primary` and `--accent`
 * (preference.ts: "One hue, stated once, landing on both"). `--primary` is the
 * label, so reading `--accent` raw paints the row a solid slab of the same hue
 * the label is drawn in — #fafafa on #ff5c00 is 2.97:1, under the 4.5 AA floor.
 */
const src = readFileSync(new URL('./items.tsx', import.meta.url), 'utf8')

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = (c: number[]) => {
  const s = c.map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
/** What `color-mix(in oklab, <accent> <p>%, transparent)` composites to over a ground. */
const mix = (a: string, ground: string, p: number) =>
  '#' +
  hex(a)
    .map((v, i) => Math.round(v * p + hex(ground)[i] * (1 - p)).toString(16).padStart(2, '0'))
    .join('')

describe('menu hover surface', () => {
  it('composites the accent rather than using it raw', () => {
    const soft = src.match(/const ACCENT_SOFT = '([^']+)'/)?.[1] ?? ''
    expect(soft).toContain('color-mix')
    expect(soft).toContain('--accent')
    // the raw form — the regression this exists to catch
    expect(soft).not.toBe('var(--accent, #262626)')
  })

  it('holds AA against a saturated org accent', () => {
    const pct = Number(src.match(/var\(--accent[^)]*\)\s+(\d+)%/)?.[1] ?? 100) / 100
    const LABEL = '#fafafa'
    const GROUND = '#0a0a0a'
    for (const accent of ['#ff5c00', '#8b5cf6', '#22c55e', '#ef4444']) {
      const surface = mix(accent, GROUND, pct)
      expect(ratio(LABEL, surface), `${accent} -> ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
