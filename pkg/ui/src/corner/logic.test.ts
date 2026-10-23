import { describe, expect, it } from 'vitest'

import { LONG, WORDS, arabic, find, fold, shown, type Option } from './logic'

const LANGS: Option[] = [
  { code: 'de', label: 'Deutsch', hint: 'German' },
  { code: 'fr', label: 'Français', hint: 'French' },
  { code: 'tr', label: 'Türkçe', hint: 'Turkish' },
  { code: 'ar', label: 'العربية', hint: 'Arabic', dir: 'rtl' },
  { code: 'ja', label: '日本語', hint: 'Japanese' },
]

describe('fold', () => {
  it('drops case and accents, and leaves scripts without them alone', () => {
    expect(fold('Français')).toBe('francais')
    expect(fold('TÜRKÇE')).toBe('turkce')
    expect(fold('日本語')).toBe('日本語')
    expect(fold('العربية')).toBe('العربية')
  })
})

describe('find', () => {
  it('keeps every option, in the host order, for an empty search', () => {
    expect(find(LANGS, '   ').map((o) => o.code)).toEqual(['de', 'fr', 'tr', 'ar', 'ja'])
  })
  it('matches the native name without its accents', () => {
    expect(find(LANGS, 'francais').map((o) => o.code)).toEqual(['fr'])
    expect(find(LANGS, 'turk').map((o) => o.code)).toEqual(['tr'])
  })
  it('matches the hint and the code, so a reader who knows neither script still finds it', () => {
    expect(find(LANGS, 'german').map((o) => o.code)).toEqual(['de'])
    expect(find(LANGS, 'JA').map((o) => o.code)).toEqual(['ja'])
  })
  it('matches a name in its own script', () => {
    expect(find(LANGS, 'عرب').map((o) => o.code)).toEqual(['ar'])
  })
  it('is a literal substring, never a pattern', () => {
    expect(find(LANGS, '.*')).toEqual([])
    expect(find(LANGS, '(')).toEqual([])
  })
})

describe('shown', () => {
  it('shows the chosen option by its label', () => {
    expect(shown({ value: 'fr', options: LANGS, onChange: () => {} })).toBe('Français')
  })
  it('falls back to the code when the host did not list its own value', () => {
    expect(shown({ value: 'xx', options: LANGS, onChange: () => {} })).toBe('xx')
  })
})

describe('the words and the threshold', () => {
  it('has a word for everything the panel says', () => {
    for (const [k, v] of Object.entries(WORDS)) expect(v, k).toMatch(/\S/)
  })
  it('searches a list once it is longer than a screen of rows', () => {
    expect(LONG).toBe(8)
  })
})

describe('arabic', () => {
  it('knows a language by the script it is written in, not by its direction', () => {
    for (const tag of ['ar', 'ar-EG', 'fa', 'fa-AF', 'ur', 'ps', 'sd', 'ckb', 'ug', 'pa-PK']) expect(arabic(tag), tag).toBe(true)
    for (const tag of ['en', 'he', 'pa', 'tr', 'ku', '']) expect(arabic(tag), tag || 'empty').toBe(false)
  })
  it('refuses a malformed tag rather than throwing', () => {
    expect(arabic('not a tag')).toBe(false)
    expect(arabic(undefined)).toBe(false)
  })
})
