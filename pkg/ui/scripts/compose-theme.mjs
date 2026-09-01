// dist/theme.css = @hanzo/design's token layer + this package's own remainder.
//
// @hanzo/design is THE token source. It is composed here, at build time, from
// the installed package — never copy-pasted into src/theme.css, because a copy
// is how one fact ends up with two homes and the two drift. @hanzo/ui used to
// declare its own `--background`/`--primary`/`--border` palette, which is
// exactly that fork: 19 declarations restating values design already publishes.
// They are gone; what remains in src/theme.css is only what design does NOT
// ship (the chart ramp, the sidebar set, the Zen bindings) plus this package's
// own rules.
//
// Order matters and is deliberate: design first, ours second, so a remaining
// declaration here can still override a token when it genuinely has to.
//
// Flattened rather than `@import '@hanzo/font/css'` for the reason
// design's own entry point gives: a bare specifier is not resolvable by a
// browser, and a nested @import must precede all other rules or it is dropped
// silently. Inlining is the only form that survives every consumer's bundler.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const UI = dirname(dirname(fileURLToPath(import.meta.url)))

const designRaw = readFileSync(require.resolve('@hanzo/font/css'), 'utf8')
const ours = readFileSync(join(UI, 'src/theme.css'), 'utf8')

// The chrome material — its own entry point AND part of this sheet. A host that
// already has the token layer (or wants only the material) imports
// `@hanzo/ui/glass.css`; a host that wants everything imports theme.css and
// gets it inlined. Two entry points, ONE source file, so they cannot say
// different things about what glass is.
const glass = readFileSync(join(UI, 'src/glass.css'), 'utf8')

/**
 * Drop design's @font-face blocks. FONT DELIVERY HAS ONE OWNER AND IT IS NOT US.
 *
 * design self-hosts Zen and its sheet says "the url()s are relative to THIS
 * file, so they resolve wherever the package is" — true of design's file, false
 * the instant it is inlined into ours. Composed here, `url(./assets/fonts/…)`
 * resolves against @hanzo/ui/dist, which has no assets, and webpack's css-loader
 * hard-fails the build:
 *
 *
 * That shipped in 8.0.46. Vite tolerates the missing asset, webpack does not,
 * and the consumer test was Vite-only — so the whole class was invisible. There
 * is now a Next/webpack consumer beside it.
 *
 * Copying the .woff2 files into this package would fix the build and create the
 * real problem: two packages shipping the same font, which is one fact in two
 * homes and the exact thing retiring @hanzo/tokens was about. So the rule is
 * dropped instead. This package NAMES the families — it always has; gui-config
 * says "the host self-hosts both faces (its own fonts.css) — this only names
 * them" — and a consumer that wants them self-hosted imports
 * `@hanzo/font/css`, whose url()s resolve against design, where the
 * files actually are.
 */
const designNoFonts = designRaw.replace(/@font-face\s*\{[^}]*\}/g, '')

/**
 * Teach design's light block gui's spelling of "light".
 *
 * The two systems name the same idea differently: design is `:root` (dark) with
 * `.light` to opt out; gui's provider emits `t_dark` / `t_light`. They never had
 * to agree while gui was declaring its own --background — it simply won. Now
 * that design owns those names, an app in light mode carrying only gui's
 * `t_light` would get design's DARK palette, because nothing matches `.light`.
 *
 * So design's light selector also answers to `:root.t_light`. The VALUES are
 * still declared exactly once, by design, in design's own block — this adds a
 * selector, never a second copy, which is the whole difference between an alias
 * and a fork. `:root.t_light` is (0,2,0) and beats design's `:root` dark, which
 * is the intent.
 *
 * And to a bare `.t_light`, which is the same bug one scope down. gui emits
 * `t_light` on a SPAN for a nested `<Theme name="light">` — PrimaryButton's
 * white pill inside a dark app is exactly that — and `:root.t_light` cannot
 * match a span. Design's tokens therefore stayed dark inside a light island,
 * which is invisible until something in that island reads one: a `--foreground`
 * label on a white pill came out white on white. A directly-matching
 * declaration beats an inherited one whatever the specificity, so the bare
 * class settles the subtree; the `:root` form stays for the whole-page case,
 * where it beats design's dark `:root` on specificity rather than on order.
 *
 * Pure CSS, so it works under SSR. Doing it in <Hanzo> with an effect would
 * leave the first paint dark in a light app.
 */
const design = designNoFonts.replace(
  /(^|})([^{}]*?)\.light(\s*)\{/g,
  (m, brace, before, ws) => `${brace}${before}.light, :root.t_light, .t_light${ws}{`,
)

// The trap from store's decision doc, checked rather than remembered: design
// publishes FINISHED colors (`#000000`, `rgb(255 255 255 / .10)`). Wrapping one
// in `hsl(...)` — the shadcn-era idiom, where tokens were bare `H S% L%` triples
// — is invalid at computed-value time, and the browser drops the WHOLE
// declaration without a word. One grep is cheaper than finding it on a page.
const composed = `${design}\n${ours}\n${glass}`
const bad = [...composed.matchAll(/\b(hsl|rgb|oklch)a?\(\s*var\(/g)].map((m) => m[0])
if (bad.length) {
  throw new Error(
    `theme.css wraps a design token in a colour function: ${[...new Set(bad)].join(', ')}\n` +
      `  @hanzo/design publishes finished colours, so hsl(var(--x)) is invalid and the\n` +
      `  browser drops the declaration silently. Use var(--x) directly.`,
  )
}

// No url() may survive, at all. This package ships `dist` and nothing else, so
// ANY relative asset reference in this sheet points at a file that is not there
// — and the bundler that says so is webpack, not Vite, which is how 8.0.46 went
// out green. A grep costs nothing and does not depend on remembering.
const urls = [...composed.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
  .map((m) => m[1].trim())
  .filter((u) => u && !u.startsWith('data:') && !u.startsWith('#'))
if (urls.length) {
  throw new Error(
    `theme.css references ${urls.length} external asset(s): ${[...new Set(urls)].join(', ')}\n` +
      `  This package ships only "dist", so a relative url() here resolves to nothing and\n` +
      `  webpack's css-loader fails the consumer's build. Font delivery belongs to\n` +
      `  @hanzo/design, which self-hosts the files; this sheet only names the families.`,
  )
}

mkdirSync(join(UI, 'dist'), { recursive: true })
writeFileSync(join(UI, 'dist/theme.css'), composed)
writeFileSync(join(UI, 'dist/glass.css'), glass)

// font's exports map does not expose ./package.json, and its stylesheet
// resolves inside `dist/`, so the version is read from the nearest
// package.json above the resolved sheet.
const version = JSON.parse(readFileSync(nearestPackage(dirname(require.resolve('@hanzo/font/css'))), 'utf8')).version
console.log(
  `dist/theme.css — ${composed.length.toLocaleString()} bytes (@hanzo/design ${version} + this package)`,
)

/** The package.json that owns `dir`: the first one found walking up. */
function nearestPackage(dir) {
  for (let d = dir; ; d = dirname(d)) {
    const p = join(d, 'package.json')
    if (existsSync(p)) return p
    if (dirname(d) === d) throw new Error(`no package.json above ${dir}`)
  }
}
