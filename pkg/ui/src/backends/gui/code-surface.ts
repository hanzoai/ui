/**
 * The colours a code surface draws with — CodeBlock, Snippet and Terminal share
 * them — from the code theme (`code-theme.ts`).
 *
 * With no scheme the surface reads the code theme's gui theme keys (`$codeGround`
 * …), so it follows the page and any theme around it. Pinned to `dark` or `light`
 * it reads that scheme's neutral ladder steps directly, which are the same colour
 * wherever they resolve. A nested `<Theme>` is not a pin: measured in Chromium
 * (`scripts/code.mjs`), a CodeBlock wrapped in `<Theme name="dark">` on a light
 * page kept the light ground, because gui adds a theme class only where its own
 * theme state changes scheme.
 */
import { SizableText, styled } from '@hanzo/gui'
import { ramp, syntax, type CodeToken, type Scheme } from '../../code-theme'

/** A code surface: its ground, its edge, a marked line's band, three inks, and each kind of token's ink. */
export interface Surface {
  bg: string
  border: string
  line: string
  /** The text. */
  fg: string
  /** The gutter, a prompt, a control at rest. */
  muted: string
  /** What must stand out: a command, an added line, a confirmation. */
  strong: string
  tokens: Record<CodeToken, string>
}

/** A named editor palette's own four colours. */
export type Palette = Pick<Surface, 'bg' | 'border' | 'fg' | 'muted'>

const key = (name: string) => `$code${name[0].toUpperCase()}${name.slice(1)}`

/** The code theme by its theme keys. */
const KEYS: Surface = {
  bg: '$codeGround',
  border: '$borderColor',
  line: '$codeLine',
  fg: '$codeInk',
  muted: '$codeDim',
  strong: '$codeBright',
  tokens: Object.fromEntries(Object.keys(syntax.dark).map((t) => [t, key(t)])) as Record<CodeToken, string>,
}

/** The code theme on one scheme's ladder steps; its edge is the band's step. */
const pin = (s: Scheme): Surface => ({
  bg: ramp[s].ground,
  border: ramp[s].line,
  line: ramp[s].line,
  fg: ramp[s].ink,
  muted: ramp[s].dim,
  strong: ramp[s].bright,
  tokens: syntax[s],
})

const PINNED = { dark: pin('dark'), light: pin('light') }

/** The code theme: following the page with no scheme, pinned to one with `dark` or `light`. */
export const mono = (scheme?: Scheme | null): Surface => (scheme ? PINNED[scheme] : KEYS)

/** A named palette as a surface: its band is its edge colour, and everything that stands out is its text colour. */
export const named = (p: Palette): Surface => ({
  ...p,
  line: p.border,
  strong: p.fg,
  tokens: Object.fromEntries(Object.keys(syntax.dark).map((t) => [t, p.fg])) as Record<CodeToken, string>,
})

/**
 * The language a block is written in, as a tag in the surface's own colours (the
 * gutter's ink on the band). A page-themed Badge read 1.1:1 on a surface pinned
 * to the other scheme.
 */
export const Language = /* @__PURE__ */ styled(SizableText, {
  name: 'CodeLanguage',
  size: '$1',
  fontFamily: '$mono',
  px: '$2',
  rounded: '$2',
})

/** A surface colour as CSS: a theme key `$name` is the custom property gui emits for it. */
export const css = (colour: string) => (colour.startsWith('$') ? `var(--${colour.slice(1)})` : colour)
