/**
 * The code theme: monochrome. A token differs from its neighbours by brightness,
 * weight and slant, never by hue.
 *
 * `ramp` is the code surface per scheme: a `ground`, a `line` for a marked or
 * selected line, and three inks: `dim` (comments, punctuation, line numbers),
 * `ink` (names, plain text) and `bright` (strings, numbers, keywords, a command).
 * `syntax` gives each kind of token its ink and `face` its slant or weight:
 * comments dim and italic, keywords and the JSON literals bright and bold.
 *
 * Every value is a step of @hanzo/design's neutral ladder, fixed per scheme. The
 * dim ink is the value of design's `--muted-foreground` and the dark ground the
 * value of its `--surface-2`, but those two names change with the scheme, and gui
 * resolves a theme value once, on `:root`: a scheme-following name would give a
 * nested `<Theme name="light">` the page's dark ground. A ladder step names the
 * same colour wherever it resolves, so a code surface pinned to either scheme
 * reads on its own ground. Measured (WCAG 2, `gui-config.test.ts`), dark / light:
 * on the ground dim 7.1 / 7.2, ink 12.1 / 9.5, bright 17.2 / 18.2; on the band dim
 * 6.0 / 6.2; and every ink clears 4.5:1 on every page surface design publishes.
 *
 * `gui-config` publishes each rung and each token as a theme key (`$codeGround`,
 * `$codeComment`, `var(--codeComment)` …), so the components follow the nearest
 * theme. `codeTheme` is the same theme in shiki's format, one per scheme, for a
 * block highlighted on a server: `codeToHtml(src, { lang, themes: codeTheme })`.
 * Its colours read those theme keys first, so a host that sets `--codeString`
 * re-inks its shiki blocks and its editors together, and fall back to the ladder
 * step where no gui sheet is mounted.
 */
export type Scheme = 'dark' | 'light'

/** A rung of the code surface. */
export type CodeRung = 'ground' | 'line' | 'dim' | 'ink' | 'bright'

/** A kind of token the editors and the JSON tree tell apart. */
export type CodeToken = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'comment' | 'keyword'

export const ramp = {
  dark: {
    ground: 'var(--neutral-900)',
    line: 'var(--neutral-800)',
    dim: 'var(--neutral-400)',
    ink: 'var(--neutral-300)',
    bright: 'var(--neutral-50)',
  },
  light: {
    ground: 'var(--neutral-100)',
    line: 'var(--neutral-200)',
    dim: 'var(--neutral-600)',
    ink: 'var(--neutral-700)',
    bright: 'var(--neutral-950)',
  },
} as const satisfies Record<Scheme, Record<CodeRung, string>>

/** Which ink each kind of token takes. */
const INK = {
  key: 'ink',
  string: 'bright',
  number: 'bright',
  boolean: 'bright',
  null: 'bright',
  punctuation: 'dim',
  comment: 'dim',
  keyword: 'bright',
} as const satisfies Record<CodeToken, Exclude<CodeRung, 'ground' | 'line'>>

const inks = <S extends Scheme>(s: S) =>
  Object.fromEntries(Object.entries(INK).map(([token, rung]) => [token, ramp[s][rung]])) as {
    [T in CodeToken]: (typeof ramp)[S][(typeof INK)[T]]
  }

/** Each kind of token's colour, per scheme. */
export const syntax = { dark: inks('dark'), light: inks('light') }

/** The slant and weight a kind of token carries; the rest are upright at the text's weight. */
export const face: Partial<Record<CodeToken, { fontStyle?: 'italic'; fontWeight?: '700' }>> = {
  comment: { fontStyle: 'italic' },
  keyword: { fontWeight: '700' },
  boolean: { fontWeight: '700' },
  null: { fontWeight: '700' },
}

/** A TextMate theme, the shape shiki reads. */
export interface CodeTheme {
  name: string
  type: Scheme
  fg: string
  bg: string
  colors: Record<string, string>
  tokenColors: { scope?: string | string[]; settings: { foreground?: string; fontStyle?: string } }[]
}

const key = (name: string) => `code${name[0].toUpperCase()}${name.slice(1)}`

function theme(s: Scheme): CodeTheme {
  const at = (rung: CodeRung) => `var(--${key(rung)}, ${ramp[s][rung]})`
  const as = (token: CodeToken) => {
    const f = face[token]
    const style = f?.fontStyle ?? (f?.fontWeight ? 'bold' : undefined)
    return { foreground: `var(--${key(token)}, ${syntax[s][token]})`, ...(style ? { fontStyle: style } : null) }
  }
  return {
    name: `mono-${s}`,
    type: s,
    // The ground and the ink are `bg` and `fg` and not also `editor.background` /
    // `editor.foreground`: shiki rewrites those two `colors` entries in place to
    // placeholders, which would change this exported object under every caller.
    fg: at('ink'),
    bg: at('ground'),
    colors: {
      'editor.selectionBackground': at('line'),
      'editor.lineHighlightBackground': at('line'),
    },
    tokenColors: [
      { settings: { foreground: at('ink') } },
      { scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'], settings: as('comment') },
      { scope: ['punctuation', 'meta.brace', 'constant.character.escape.line-continuation'], settings: as('punctuation') },
      { scope: ['string', 'markup.inline.raw'], settings: as('string') },
      { scope: 'constant.numeric', settings: as('number') },
      { scope: ['constant.language', 'constant.language.boolean'], settings: as('boolean') },
      { scope: ['constant.language.null', 'constant.language.undefined'], settings: as('null') },
      {
        scope: ['constant', 'support.constant', 'entity.name.function', 'entity.name.command', 'support.function', 'entity.name.tag'],
        settings: { foreground: at('bright') },
      },
      { scope: ['string.unquoted', 'support.type.property-name', 'meta.object-literal.key'], settings: as('key') },
      { scope: ['keyword', 'storage'], settings: as('keyword') },
      { scope: ['keyword.operator', 'punctuation.accessor'], settings: { foreground: at('ink'), fontStyle: '' } },
      { scope: ['markup.heading', 'markup.bold'], settings: { foreground: at('bright'), fontStyle: 'bold' } },
      { scope: 'markup.italic', settings: { fontStyle: 'italic' } },
      { scope: 'markup.underline.link', settings: { fontStyle: 'underline' } },
      { scope: 'markup.inserted', settings: { foreground: at('bright') } },
      { scope: 'markup.deleted', settings: { foreground: at('dim') } },
    ],
  }
}

/** The code theme in shiki's format, one per scheme: pass it as `themes`. */
export const codeTheme = { dark: theme('dark'), light: theme('light') } as const
