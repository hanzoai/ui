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
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import { describe, expect, it } from 'vitest'

import { config } from './gui-config'
import { Gallery } from './gallery'
import { tw } from './tw'

const SHEET = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist/styles.css')

const markup = (theme: 'dark' | 'light') =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme={theme}>
      <Gallery />
    </GuiProvider>,
  )

/**
 * Class tokens the render compiled into the markup, from BOTH style systems.
 *
 * gui's atomic classes start `_`. react-native-web's start `r-` (one declaration
 * each) or `css-` (a component's base rule), and they were not read here — so
 * "total" was total over one of the two systems. Twenty rnw classes, including
 * the `overflow-y: auto` that makes every ScrollView scroll, sat in the markup
 * with no rule in the shipped sheet and this test stayed green.
 */
const referenced = (html: string) => {
  const out = new Set<string>()
  for (const m of html.matchAll(/class="([^"]*)"/g))
    for (const token of m[1].split(/\s+/))
      if (/^(_|r-|css-)/.test(token)) out.add(token)
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

/**
 * The utility classes are a NAMESPACE, and it used to be everybody's.
 *
 * This sheet claimed `.row`, `.skeleton`, `.fade`, `.mono`, `.drag` and `.tnum`
 * at the document level, in a package an app imports once at its root. An app
 * with its own `.row` got no warning — it got whichever rule the cascade
 * preferred, from a stylesheet it never opened.
 */
const SRC = join(dirname(dirname(fileURLToPath(import.meta.url))), 'src')

/**
 * Every literal class name the components put in their own markup — and
 * separately, the ones handed to `<Box>`, which are a different thing.
 *
 * `Box` exists to READ utility classes: `tw` turns each one it knows into gui
 * style props, and only what it does NOT know stays a class on the element. So
 * a recognised class never reaches the document and cannot collide with
 * anything, while an unrecognised one lands there exactly like any other
 * literal. Those are opposite answers to this file's question, and the element
 * is what tells them apart — hence two buckets rather than one.
 */
const emitted = (dir: string, out = { any: new Set<string>(), box: new Set<string>() }) => {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) emitted(p, out)
    else if (/\.tsx?$/.test(name.name) && !name.name.includes('.test.')) {
      // COMMENTS FIRST. A docblock explaining the migration writes the very
      // thing this file is looking for — `box.tsx` says <div className="flex
      // items-center gap-4"> in prose to explain what Box replaces — and a
      // scanner that reads it as markup reports three classes nothing renders.
      // A prose example is not an element. `//` is only a comment when it does
      // not follow a colon, so a URL in a string keeps its second half.
      const src = readFileSync(p, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
      // A `<Box className="…">` opening tag. Box takes the classes as INPUT, so
      // its literal is checked against `tw` below instead of the namespace.
      const onBox = new Set<string>()
      for (const m of src.matchAll(/<Box\s[^>]*?className="([^"{}]*)"/g))
        for (const token of m[1].split(/\s+/).filter(Boolean)) onBox.add(token)
      for (const token of onBox) out.box.add(token)

      for (const m of src.matchAll(/className=(?:"([^"{}]*)"|\{[^}]*?'([a-z][\w -]*)')/g))
        for (const token of (m[1] ?? m[2] ?? '').split(/\s+/).filter(Boolean))
          if (!onBox.has(token)) out.any.add(token)
    }
  }
  return out
}

describe('the utility class namespace', () => {
  const scanned = emitted(SRC)
  const ours = [...scanned.any].sort()
  const onBox = [...scanned.box].sort()
  const motion = readFileSync(join(SRC, 'styles/motion.css'), 'utf8')

  it('found the classes to check — an empty scan proves nothing', () => {
    expect(ours.length).toBeGreaterThan(5)
  })

  it('is carried in every class this package emits', () => {
    // `glass` and `elevation-N` are the one family still unprefixed. They are an
    // API value (`glass(3).className`) rather than a hand-typed literal, so they
    // move on their own change, not this one.
    const unqualified = ours.filter((c) => !c.startsWith('hz-') && !/^(glass|elevation-\d)$/.test(c))
    expect(unqualified, `${unqualified.join(', ')} would collide with a consumer's own CSS`).toEqual([])
  })

  it('hands Box only classes tw actually reads', () => {
    // The same rule, asked of the element that changes the answer. `tw` is the
    // authority and is CALLED rather than guessed at: a class it reads becomes
    // style props and never reaches the document, so it cannot collide; one it
    // does not read stays on the element, where it is an unqualified class name
    // like any other and would.
    //
    // This is the stricter half of the pair, not an exemption. The gallery has
    // to carry a real utility string or `gen-css` writes none of the rules Box
    // compiles, and today the only way to say that was to say something this
    // file forbids.
    const unread = onBox.filter((c) => tw(c).rest !== '')
    expect(
      unread,
      `${unread.join(', ')} on <Box> — tw does not read these, so they stay on the element unqualified`,
    ).toEqual([])
  })

  it('found the Box classes to check — an empty scan proves nothing', () => {
    expect(onBox.length).toBeGreaterThan(5)
  })

  it('defines a rule for each of them', () => {
    const orphan = ours.filter((c) => c.startsWith('hz-') && !motion.includes(`.${c}`))
    expect(orphan, `${orphan.join(', ')} is emitted with no rule in motion.css`).toEqual([])
  })

  it('still answers to the old names, for one more minor version', () => {
    // The window: a consumer who typed `className="skeleton"` against the old
    // sheet keeps working. REMOVED IN 8.2.0 — nothing in this package emits them.
    for (const old of ['skeleton', 'row', 'tnum', 'mono', 'fade', 'drag', 'slide', 'fade-up'])
      expect([old, motion.includes(`\n.${old} `) || motion.includes(`\n.${old},`) || motion.includes(`.${old}[`)]).toEqual([old, true])
  })
})
