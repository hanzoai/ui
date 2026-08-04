/**
 * Classes referenced, rules present.
 *
 * "Classes without rules" has now shipped three times in this estate — hanzo.app's
 * ungenerated gui.css, @hanzogui/shell's 966 lines of Tailwind class names with no
 * Tailwind dependency, create-gui pointing at a GitHub org that does not exist —
 * and a green build caught none of them, because a class name is a string and a
 * string always compiles.
 *
 * So this compares the two directly: every atomic class the components put in
 * their markup, against every class the SHIPPED stylesheet defines a rule for.
 * The intersection is not asked to be "large"; it is asked to be TOTAL. A missing
 * rule is an element rendering unstyled, and there is no number of those that is
 * acceptable.
 *
 * The regression it catches is the one that hit hanzo.app: a component added
 * without re-running the generator ships classes nothing defines.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import { describe, expect, it } from 'vitest'

import { config } from './gui-config'
import { Gallery } from './gallery'

const SHEET = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist/styles.css')

const markup = (theme: 'dark' | 'light') =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme={theme}>
      <Gallery />
    </GuiProvider>,
  )

/** Class tokens gui compiled into the markup. Its atomic classes all start `_`. */
const referenced = (html: string) => {
  const out = new Set<string>()
  for (const m of html.matchAll(/class="([^"]*)"/g))
    for (const token of m[1].split(/\s+/)) if (token.startsWith('_')) out.add(token)
  return out
}

/** Class selectors the stylesheet defines a rule for.
 *
 *  Everything before a `{`, since the last `{` `}` or `;`, is a selector or an
 *  at-rule prelude; classes are read from those and nowhere else. Reading whole
 *  blocks instead would count dots in declaration VALUES (`0.5rem`) and let an
 *  emptied sheet look populated. Nesting has to survive too: every `hoverStyle`
 *  gui emits lands inside `@media (hover)`, and both a `}`-split and a
 *  strip-the-bodies pass lose the selector with the body — which is how the
 *  first two runs of this test reported eleven missing rules that were in the
 *  file the whole time. */
const defined = (css: string) => {
  const out = new Set<string>()
  let start = 0
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '{') {
      for (const m of css.slice(start, i).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1])
      start = i + 1
    } else if (c === '}' || c === ';') start = i + 1
  }
  return out
}

describe('the shipped stylesheet', () => {
  it('exists — the package ships its own styles, apps do not generate them', () => {
    expect(existsSync(SHEET), `${SHEET} is missing. Run: pnpm build`).toBe(true)
  })

  const css = existsSync(SHEET) ? readFileSync(SHEET, 'utf8') : ''
  const rules = defined(css)

  it('carries rules for a whole component library, not a handful', () => {
    // A sheet that lost only its atomic half still parses, and still passes any
    // check phrased as "not empty" — the theme half alone is 300 KB. 150 is well
    // under what the gallery produces and far above what tokens, touch targets
    // and elevation produce on their own.
    const atomic = [...rules].filter((c) => c.startsWith('_'))
    expect(atomic.length, `only ${atomic.length} atomic selectors in ${SHEET}`).toBeGreaterThan(150)
  })

  for (const theme of ['dark', 'light'] as const)
    it(`defines a rule for every class the ${theme} gallery renders`, () => {
      const used = referenced(markup(theme))
      expect(used.size, 'the gallery rendered no atomic classes at all').toBeGreaterThan(100)
      const missing = [...used].filter((c) => !rules.has(c)).sort()
      expect(
        missing,
        `${missing.length} of ${used.size} classes have no rule — dist/styles.css is stale. Run: pnpm build`,
      ).toEqual([])
    })
})
