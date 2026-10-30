/**
 * The code theme through shiki itself, called the three ways Hanzo surfaces call
 * it: hanzo.ai's `codeToTokens` with `light-dark()`, ui.hanzo.ai's `codeToHtml`
 * with `light-dark()`, and shiki's own default of a light colour and a dark
 * custom property. `gui-config.test.ts` holds the palette to the ladder and to
 * AA; this holds what a highlighted block actually carries to that palette.
 *
 * shiki is the docs site's dependency (apps/ui.hanzo.ai), not this package's:
 * the theme is data in shiki's format and ships no highlighter. The suite loads
 * the site's copy, the shiki a Hanzo page is highlighted with.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

import { codeFace, codeInk, codeInks, codeTheme, face, ramp, syntax, type CodeInk, type CodeToken } from './code-theme'

/** The slice of shiki's API these tests call. */
interface Token {
  content: string
  htmlStyle?: Record<string, string>
}
interface Highlighter {
  getTheme(theme: unknown): { bg: string; fg: string }
  codeToTokens(code: string, options: { lang: string; themes: unknown; defaultColor?: string }): { tokens: Token[][] }
  codeToHtml(code: string, options: { lang: string; themes: unknown; defaultColor?: string }): string
}

let shiki: Highlighter
/** The theme as this module exported it, before shiki saw it. */
const exported = JSON.stringify(codeTheme)

beforeAll(async () => {
  const site = createRequire(new URL('../../../apps/ui.hanzo.ai/package.json', import.meta.url))
  const { createHighlighter } = await import(pathToFileURL(site.resolve('shiki')).href)
  shiki = await createHighlighter({ themes: [codeTheme.dark, codeTheme.light], langs: ['ts', 'bash', 'json'] })
})

const TS = `// one client, every model
const client = new Client({ baseURL: "https://api.hanzo.ai/v1" })
if (!client) return null`

/** A theme key over its ladder step, as the theme writes every colour. */
const KEYED = /^var\(--code[A-Z]\w*, var\(--neutral-\d+\)\)$/

/** `light-dark(<light>, <dark>)` split into its halves. */
const halves = (colour: string | undefined) => colour?.match(/^light-dark\((var\(.+?\)\)), (var\(.+\)\))\)$/)?.slice(1)

const find = (tokens: Token[][], text: string) => tokens.flat().find((t) => t.content.trim() === text)

const key = (token: CodeToken) => `--code${token[0].toUpperCase()}${token.slice(1)}`

describe('the code theme in shiki', () => {
  it('names no colour of its own: every colour is a code key over a ladder step, and no value is a hex', () => {
    for (const theme of [codeTheme.dark, codeTheme.light]) {
      const colours = [
        theme.fg,
        theme.bg,
        ...Object.values(theme.colors),
        ...theme.tokenColors.map((r) => r.settings.foreground).filter((c): c is string => !!c),
      ]
      for (const c of colours) expect(c, `${theme.name}: ${c}`).toMatch(KEYED)
      expect(JSON.stringify(theme)).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i)
    }
  })

  it('falls back to the ramp of its own scheme, so a page with no gui sheet still reads', () => {
    for (const s of ['dark', 'light'] as const) {
      expect(codeTheme[s].bg).toBe(`var(--codeGround, ${ramp[s].ground})`)
      expect(codeTheme[s].fg).toBe(`var(--codeInk, ${ramp[s].ink})`)
      for (const token of Object.keys(syntax[s]) as CodeToken[]) {
        const rules = codeTheme[s].tokenColors.filter((r) => r.settings.foreground?.startsWith(`var(${key(token)},`))
        for (const r of rules) expect(r.settings.foreground).toBe(`var(${key(token)}, ${syntax[s][token]})`)
      }
    }
  })

  it('states each kind of token\'s slant and weight on every rule that paints it', () => {
    const word = (token: CodeToken) => face[token]?.fontStyle ?? (face[token]?.fontWeight ? 'bold' : undefined)
    for (const theme of [codeTheme.dark, codeTheme.light])
      for (const token of ['comment', 'keyword', 'boolean', 'null', 'string', 'key'] as const) {
        const rules = theme.tokenColors.filter((r) => r.settings.foreground?.startsWith(`var(${key(token)},`))
        expect(rules.length, `${theme.name} paints ${token}`).toBeGreaterThan(0)
        for (const r of rules) expect(r.settings.fontStyle, `${theme.name} ${token}`).toBe(word(token))
      }
  })

  it('hanzo.ai: the light ground and ink it reads are code keys, and every token colour is one key in both halves', () => {
    expect(shiki.getTheme(codeTheme.light).bg).toBe('var(--codeGround, var(--neutral-100))')
    expect(shiki.getTheme(codeTheme.dark).fg).toBe('var(--codeInk, var(--neutral-300))')
    const { tokens } = shiki.codeToTokens(TS, { lang: 'ts', themes: codeTheme, defaultColor: 'light-dark()' })
    for (const t of tokens.flat()) {
      const [light, dark] = halves(t.htmlStyle?.color) ?? []
      expect(light, JSON.stringify(t)).toMatch(KEYED)
      expect(dark, JSON.stringify(t)).toMatch(KEYED)
      expect(light.split(',')[0], 'one key in both halves').toBe(dark.split(',')[0])
    }
    const comment = tokens[0].find((t) => t.content.includes('one client, every model'))
    expect(comment?.htmlStyle?.color).toContain('var(--codeComment,')
    expect(comment?.htmlStyle?.['--shiki-dark-font-style']).toBe('italic')
    for (const word of ['const', 'if', 'return']) {
      expect(find(tokens, word)?.htmlStyle?.color).toContain('var(--codeKeyword,')
      expect(find(tokens, word)?.htmlStyle?.['--shiki-dark-font-weight']).toBe('bold')
    }
    expect(find(tokens, 'https://api.hanzo.ai/v1')?.htmlStyle?.color).toContain('var(--codeString,')
    expect(find(tokens, 'null')?.htmlStyle?.color).toContain('var(--codeNull,')
    // A name and an operator are the plain ink, upright, at the text's weight.
    const plain = find(tokens, 'client =') ?? tokens[1].find((t) => t.content.includes('client'))
    expect(plain?.htmlStyle?.color).toContain('var(--codeInk,')
    expect(Object.keys(plain?.htmlStyle ?? {}).some((k) => /font/.test(k))).toBe(false)
  })

  it('ui.hanzo.ai: a block carries no hex, and its ground is the code ground', () => {
    const html = shiki.codeToHtml('curl -fsSL https://hanzo.sh | sh # install', { lang: 'bash', themes: codeTheme, defaultColor: 'light-dark()' })
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(html).toContain('background-color:light-dark(var(--codeGround, var(--neutral-100)), var(--codeGround, var(--neutral-900)))')
    expect(html).toContain('var(--codeBright, var(--neutral-50))')
    expect(html).toContain('var(--codeComment, var(--neutral-400))')
  })

  it('JSON: a key is the ink, a string and a number bright, a boolean and null bright and bold', () => {
    const { tokens } = shiki.codeToTokens('{"model": "zen", "n": 1, "stream": true, "stop": null}', {
      lang: 'json',
      themes: codeTheme,
      defaultColor: 'light-dark()',
    })
    expect(find(tokens, 'model')?.htmlStyle?.color).toContain('var(--codeKey,')
    expect(find(tokens, 'zen')?.htmlStyle?.color).toContain('var(--codeString,')
    expect(find(tokens, '1')?.htmlStyle?.color).toContain('var(--codeNumber,')
    // JSON's grammar names true, false and null alike, so all three take the boolean key.
    for (const word of ['true', 'null']) {
      expect(find(tokens, word)?.htmlStyle?.color).toContain('var(--codeBoolean,')
      expect(find(tokens, word)?.htmlStyle?.['--shiki-dark-font-weight']).toBe('bold')
    }
  })

  it('shiki\'s default dual mode: the light colour inline, the dark one as its custom property', () => {
    const html = shiki.codeToHtml('const a = 1', { lang: 'ts', themes: codeTheme })
    expect(html).toContain('color:var(--codeKeyword, var(--neutral-950))')
    expect(html).toContain('--shiki-dark:var(--codeKeyword, var(--neutral-50))')
  })

  it('hanzo.ai: every token names its ink, and code.css inks each one with its theme key and ladder steps', () => {
    const sheet = readFileSync(new URL('./styles/code.css', import.meta.url), 'utf8')
    const rules = Object.fromEntries(
      [...sheet.matchAll(/\[data-code='(\w+)'\] \{ color: (.+?); \}/g)].map(([, ink, colour]) => [ink, colour]),
    )
    expect(Object.keys(rules).sort()).toEqual(Object.keys(codeInks).sort())
    for (const [ink, { key: name, light, dark }] of Object.entries(codeInks))
      expect(rules[ink], ink).toBe(`var(--${name}, light-dark(${light}, ${dark}))`)

    const seen = new Set<CodeInk>()
    for (const [lang, src] of [['ts', TS], ['json', '{"model": "zen", "n": 1, "stream": true}'], ['bash', 'curl -fsSL https://hanzo.sh | sh # install']] as const) {
      const { tokens } = shiki.codeToTokens(src, { lang, themes: codeTheme, defaultColor: 'light-dark()' })
      for (const t of tokens.flat()) {
        const ink = codeInk(t.htmlStyle?.color)
        expect(ink, `${lang} ${JSON.stringify(t.content)} ${t.htmlStyle?.color}`).toBeDefined()
        // The ink's rule resolves to what shiki wrote, in both schemes.
        const [l, d] = halves(t.htmlStyle?.color)!
        expect(l).toBe(`var(--${codeInks[ink!].key}, ${codeInks[ink!].light})`)
        expect(d).toBe(`var(--${codeInks[ink!].key}, ${codeInks[ink!].dark})`)
        seen.add(ink!)
      }
    }
    expect([...seen].sort()).toEqual(expect.arrayContaining(['comment', 'ink', 'keyword', 'string']))
    expect(codeInk('#ff0000')).toBeUndefined()
    // A token's face, single-theme: a keyword bold, a comment italic, a name upright.
    const { tokens: one } = (shiki as unknown as { codeToTokens(c: string, o: { lang: string; theme: unknown }): { tokens: (Token & { fontStyle?: number })[][] } }).codeToTokens(TS, { lang: 'ts', theme: codeTheme.dark })
    const at = (text: string) => one.flat().find((t) => t.content.trim() === text)
    expect(codeFace(at('const')?.fontStyle)).toBe('bold')
    expect(codeFace(at('// one client, every model')?.fontStyle ?? one[0][0].fontStyle)).toBe('italic')
    expect(codeFace(at('client')?.fontStyle)).toBeUndefined()
    expect(codeFace(3)).toBe('bold italic')
    const sheet2 = readFileSync(new URL('./styles/code.css', import.meta.url), 'utf8')
    expect(sheet2).toContain("[data-face~='bold'] { font-weight: 700; }")
    expect(sheet2).toContain("[data-face~='italic'] { font-style: italic; }")
    expect(codeInk('var(--codeGround, var(--neutral-900))')).toBeUndefined()
  })

  // Last, after every call above has loaded and read it.
  it('is left as it was by the highlighter that loaded and read it, so the next caller reads the same theme', () => {
    expect(JSON.stringify(codeTheme)).toBe(exported)
  })
})
