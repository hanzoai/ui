import { test, expect, describe } from 'bun:test'
import { tagTone, TAG_TONES, tokens } from './theme'
import type { TagColor } from './field/types'

// The theme resolves tag colors + surface tokens once, so every tag/badge reads
// the same. Pure — proves the palette is complete + the fallback is safe.

const COLORS: TagColor[] = [
  'gray', 'blue', 'green', 'amber', 'red', 'purple', 'pink', 'teal', 'orange',
]

const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s)

describe('theme', () => {
  test('every tag color has a legible bg/fg/border (hex)', () => {
    for (const c of COLORS) {
      const t = TAG_TONES[c]
      expect(t, c).toBeDefined()
      expect(isHex(t.bg), `${c}.bg`).toBe(true)
      expect(isHex(t.fg), `${c}.fg`).toBe(true)
      expect(isHex(t.border), `${c}.border`).toBe(true)
    }
    expect(Object.keys(TAG_TONES).length).toBe(COLORS.length)
  })

  test('tagTone resolves a known color and falls back to gray', () => {
    expect(tagTone('green')).toBe(TAG_TONES.green)
    expect(tagTone('purple')).toBe(TAG_TONES.purple)
    // undefined / unknown → neutral gray, never a crash or blank.
    expect(tagTone(undefined)).toBe(TAG_TONES.gray)
  })

  test('core surface tokens are present hex values', () => {
    for (const k of ['text', 'textMuted', 'textFaint', 'surface', 'surfaceRaised', 'border', 'hover', 'accent', 'danger'] as const) {
      expect(isHex(tokens[k]), k).toBe(true)
    }
  })

  test('the base surface is the Hanzo zinc-on-black identity (#0a0a0a family)', () => {
    expect(tokens.surface).toBe('#09090b')
    expect(tokens.surfaceRaised).toBe('#0a0a0a')
    expect(tokens.border).toBe('#27272a')
  })
})
