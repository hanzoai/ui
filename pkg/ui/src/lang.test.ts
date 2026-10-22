/**
 * lang.css — the type half of shipping the interface in every script.
 *
 * Read as text: every rule here is keyed on `:lang()`, so what matters is which
 * languages each rule names, and a missing name is a script that renders in the
 * wrong face or loses its joins with no error anywhere.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const HERE = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(HERE, 'lang.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const compose = readFileSync(join(HERE, '../scripts/compose-theme.mjs'), 'utf8')

/** The declarations of every rule whose selector names `:lang(code)`. */
const rulesFor = (code: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, sel]) => new RegExp(`:lang\\(${code.replace('-', '\\-')}\\)`).test(sel))
    .map(([, , body]) => body)
    .join('\n')

// The right-to-left locales the interface ships in.
const ARABIC_SCRIPT = ['ar', 'fa', 'ps', 'ckb', 'sd', 'ug', 'ur', 'pa-Arab']

describe('lang.css', () => {
  it.each(ARABIC_SCRIPT)('%s gets an Arabic-script face, no tracking and no Latin tweaks', (code) => {
    const rules = rulesFor(code)
    expect(rules).toMatch(/--font-script:\s*'Noto (Sans Arabic|Naskh Arabic|Nastaliq Urdu)'/)
    expect(rules).toMatch(/letter-spacing:\s*0 !important/)
    expect(rules).toMatch(/font-feature-settings:\s*normal/)
    expect(rules).toMatch(/text-transform:\s*none/)
    expect(rules).toMatch(/--leading-lang:\s*1\.\d+/)
  })

  it('Urdu and Shahmukhi read in Nastaliq, with half again the line', () => {
    for (const code of ['ur', 'pa-Arab']) {
      expect(rulesFor(code)).toMatch(/--font-script:\s*'Noto Nastaliq Urdu'/)
      expect(rulesFor(code)).toMatch(/--leading-lang:\s*1\.5/)
    }
  })

  it('Hebrew gets its face and keeps the Latin line', () => {
    expect(rulesFor('he')).toMatch(/--font-script:\s*'Noto Sans Hebrew'/)
    expect(rulesFor('he')).not.toMatch(/--leading-lang/)
  })

  it.each([
    ['hi', 'Devanagari'], ['bn', 'Bengali'], ['ta', 'Tamil'], ['te', 'Telugu'],
    ['kn', 'Kannada'], ['ml', 'Malayalam'], ['gu', 'Gujarati'], ['pa', 'Gurmukhi'],
    ['si', 'Sinhala'], ['th', 'Thai'], ['lo', 'Lao'], ['km', 'Khmer'], ['my', 'Myanmar'],
    ['bo', 'Tibetan'], ['ka', 'Georgian'], ['hy', 'Armenian'], ['am', 'Ethiopic'],
    ['ja', 'JP'], ['ko', 'KR'], ['zh-Hans', 'SC'], ['zh-Hant', 'TC'],
  ])('%s is set in Noto %s', (code, face) => {
    expect(rulesFor(code)).toMatch(new RegExp(`--font-script:\\s*'Noto (Sans|Serif) ${face}'`))
  })

  it('opens the line for scripts with tall marks', () => {
    for (const code of ['th', 'lo', 'km', 'my', 'hi', 'ar']) {
      expect(rulesFor(code)).toMatch(/--leading-lang:\s*1\.[1-9]/)
    }
  })

  it('ships inside theme.css and on its own', () => {
    expect(compose).toMatch(/readFileSync\(join\(UI, 'src\/lang\.css'\)/)
    expect(compose).toMatch(/\$\{motion\}\\n\$\{lang\}`/)
    expect(compose).toMatch(/writeFileSync\(join\(UI, 'dist\/lang\.css'\), lang\)/)
  })
})
