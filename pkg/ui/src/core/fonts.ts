/**
 * Typography identity — Geist (UI/body/display) + Geist Mono (code/data).
 *
 * The families are referenced through CSS variables so a host that loads Geist
 * however it likes (next/font, @fontsource, a CDN link) just has to bind these
 * two variables; the components and `theme.css` read the variables, never a
 * hard-coded font name. These constants are the single source of truth for the
 * variable names so a host and the stylesheet can never drift.
 */

/** CSS custom-property that must resolve to the Geist Sans family. */
export const FONT_SANS_VAR = '--font-geist-sans' as const
/** CSS custom-property that must resolve to the Geist Mono family. */
export const FONT_MONO_VAR = '--font-geist-mono' as const

/**
 * UI / body / display / heading stack — Geist Sans, then the CSS generic only.
 * No Inter, no named system fonts: the host always binds `--font-geist-sans`
 * (next/font, @fontsource, CDN), so the generic is a last-resort generic, never
 * a system-UI look.
 */
export const fontSans = `var(${FONT_SANS_VAR}), sans-serif` as const

/** Code / data / tabular stack — Geist Mono, then the CSS generic only. */
export const fontMono = `var(${FONT_MONO_VAR}), monospace` as const

export const fonts = { sans: fontSans, mono: fontMono } as const
