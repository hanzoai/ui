/**
 * Typography identity — Zen (UI/body/display) + Zen Mono (code/data).
 *
 * The families are referenced through CSS variables, and the names say the ROLE
 * rather than the face. A host that wants its own binds the two variables; one
 * that binds nothing gets Zen, because `@hanzo/design` declares the @font-face
 * and ships the binaries. The components and `theme.css` read the variables,
 * never a hard-coded font name, and these constants are the one place the names
 * are spelled so a host and the stylesheet cannot drift.
 */

/** CSS custom-property that must resolve to the Zen sans family. */
export const FONT_SANS_VAR = '--font-sans' as const
/** CSS custom-property that must resolve to the Zen mono family. */
export const FONT_MONO_VAR = '--font-mono' as const

/**
 * UI / body / display / heading stack — Zen, then the CSS generic only.
 * No Inter, no named system fonts: the host always binds `--font-sans`
 * (next/font, @fontsource, CDN), so the generic is a last-resort generic, never
 * a system-UI look.
 */
export const fontSans = `var(${FONT_SANS_VAR}), sans-serif` as const

/** Code / data / tabular stack — Zen Mono, then the CSS generic only. */
export const fontMono = `var(${FONT_MONO_VAR}), monospace` as const

export const fonts = { sans: fontSans, mono: fontMono } as const
