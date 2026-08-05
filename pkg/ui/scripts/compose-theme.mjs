// dist/theme.css = @hanzo/design's token layer + this package's own remainder.
//
// @hanzo/design is THE token source. It is composed here, at build time, from
// the installed package — never copy-pasted into src/theme.css, because a copy
// is how one fact ends up with two homes and the two drift. @hanzo/ui used to
// declare its own `--background`/`--primary`/`--border` palette, which is
// exactly that fork: 19 declarations restating values design already publishes.
// They are gone; what remains in src/theme.css is only what design does NOT
// ship (the chart ramp, the sidebar set, the Geist bindings) plus this package's
// own rules.
//
// Order matters and is deliberate: design first, ours second, so a remaining
// declaration here can still override a token when it genuinely has to.
//
// Flattened rather than `@import '@hanzo/design/styles.css'` for the reason
// design's own entry point gives: a bare specifier is not resolvable by a
// browser, and a nested @import must precede all other rules or it is dropped
// silently. Inlining is the only form that survives every consumer's bundler.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const UI = dirname(dirname(fileURLToPath(import.meta.url)))

const design = readFileSync(require.resolve('@hanzo/design/styles.css'), 'utf8')
const ours = readFileSync(join(UI, 'src/theme.css'), 'utf8')

// The trap from store's decision doc, checked rather than remembered: design
// publishes FINISHED colors (`#000000`, `rgb(255 255 255 / .10)`). Wrapping one
// in `hsl(...)` — the shadcn-era idiom, where tokens were bare `H S% L%` triples
// — is invalid at computed-value time, and the browser drops the WHOLE
// declaration without a word. One grep is cheaper than finding it on a page.
const composed = `${design}\n${ours}`
const bad = [...composed.matchAll(/\b(hsl|rgb|oklch)a?\(\s*var\(/g)].map((m) => m[0])
if (bad.length) {
  throw new Error(
    `theme.css wraps a design token in a colour function: ${[...new Set(bad)].join(', ')}\n` +
      `  @hanzo/design publishes finished colours, so hsl(var(--x)) is invalid and the\n` +
      `  browser drops the declaration silently. Use var(--x) directly.`,
  )
}

mkdirSync(join(UI, 'dist'), { recursive: true })
writeFileSync(join(UI, 'dist/theme.css'), composed)

// design's exports map does not expose ./package.json, so the version is read
// off the resolved stylesheet's own directory rather than by specifier.
const version = JSON.parse(
  readFileSync(join(dirname(require.resolve('@hanzo/design/styles.css')), 'package.json'), 'utf8'),
).version
console.log(
  `dist/theme.css — ${composed.length.toLocaleString()} bytes (@hanzo/design ${version} + this package)`,
)
