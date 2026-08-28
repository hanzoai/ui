/**
 * What `base.css` takes away, `.hz-prose` must give back.
 *
 * The two files disagree on purpose. `base.css` strips the browser's opinions
 * from every element in the document, because a nav, a card grid and a toolbar
 * are all `<ul>` and none of them wants a bullet. Authored content is the one
 * place those opinions were right — and it arrives from an .mdx file or a CMS
 * carrying no classes at all, so `.hz-prose` styling it BY TAG is the only
 * handle there is.
 *
 * That makes the pairing load-bearing and invisible: a reset with no matching
 * restore is not an error anywhere. It shipped that way — `.hz-prose` set
 * `padding-inline-start` on its lists but never `list-style`, so every bulleted
 * list in the lux blog rendered indented with nothing at the start of the line,
 * reading as loose paragraphs. Nothing failed; it just looked wrong.
 *
 * So the reset half is read from one file and the restore half from the other,
 * and they are compared. Adding a reset to `base.css` without a restore fails
 * here rather than in a screenshot nobody takes.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = dirname(fileURLToPath(import.meta.url))
/** Comments carry braces and prose, and a selector is captured as "everything
 *  since the last `}`" — so leaving them in makes every rule's selector start
 *  with the paragraph above it. */
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const base = read('styles/base.css')
const theme = read('theme.css')

/** Every declaration under selectors matching `want`, as property -> value. */
const declared = (css: string, want: (sel: string) => boolean) => {
  const out = new Map<string, string>()
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!sel.split(',').some((s) => want(s.trim()))) continue
    for (const [, p, v] of body.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) out.set(p.trim(), v.trim())
  }
  return out
}

/**
 * A rule that styles `tag` ITSELF — the last compound of the selector, which is
 * the element the declarations land on.
 *
 * Substring-matching the tag instead catches every rule that merely mentions it:
 * asking for `pre` collected `.hz-prose > pre code` and `.hz-prose :not(pre) >
 * code`, both of which style a `code`, and the later ones overwrote the panel
 * with the flattening that exists to undo it.
 */
const subject = (sel: string) => sel.replace(/:not\([^)]*\)/g, '').trim().split(/[\s>+~]+/).pop() ?? ''
const inProse = (tag: string) => (s: string) => s.startsWith('.hz-prose') && subject(s) === tag

describe('the reset and the restore are one decision', () => {
  // The pairs, stated as what an author writing markdown would notice missing.
  it.each([
    ['ul', 'list-style'],
    ['ol', 'list-style'],
  ])('base.css strips %s { %s } and .hz-prose puts it back', (tag, prop) => {
    // The reset really is there — if it stops being, this pairing is moot and
    // the test should be deleted rather than quietly passing on nothing.
    expect(declared(base, (s) => s.split(/\s+/).includes(tag)).get(prop)).toBe('none')
    expect(declared(theme, inProse(tag)).get(prop)).toBeTruthy()
  })
})

describe('a code block is a surface', () => {
  const pre = declared(theme, inProse('pre'))

  // Monospace alone is not enough: on the page ground it reads as body text that
  // happens to be typeset differently, which is the thing a reader scanning for
  // a command must not have to work out.
  it.each(['padding', 'background', 'border', 'border-radius'])('pre has %s', (p) => {
    expect(pre.get(p)).toBeTruthy()
  })

  it('draws one surface, not two', () => {
    // The panel IS the ground inside a block, so the inline treatment must not
    // paint a second one around every line.
    expect(declared(theme, (s) => /\.hz-prose > pre code/.test(s)).get('background')).toBe('none')
  })

  it('gives inline code its own', () => {
    expect(declared(theme, (s) => /\.hz-prose :not\(pre\) > code/.test(s)).get('background')).toBeTruthy()
  })
})

describe('prose resolves through tokens', () => {
  it('names no literal colour', () => {
    // A literal is a value that cannot follow the theme, so it is right in one
    // of the two and wrong in the other with nothing to say so.
    const rules = [...theme.matchAll(/([^{}]*\.hz-prose[^{}]*)\{([^{}]*)\}/g)]
    const literals = rules.flatMap(([, sel, body]) =>
      [...body.matchAll(/(?:color|background|border[\w-]*)\s*:\s*([^;]+)/g)]
        .map(([, v]) => v.trim())
        .filter((v) => /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(v))
        .map((v) => `${sel.trim()} -> ${v}`),
    )
    expect(literals).toEqual([])
  })
})

describe('every class the components name, the sheets declare', () => {
  it('has no name without a rule', () => {
    // The cheapest bug in this package to write and the hardest to see. A class
    // name is a string, so a name nothing declares compiles, renders, and styles
    // nothing — `navigationMenuTriggerStyle()` returned `hz-nav-menu-trigger`
    // and no sheet had ever declared it, so every nav item in the estate was
    // bare text and the lux.network header read as one run-together string.
    //
    // Only the `hz-` namespace, because that is the one this package owns. A
    // consumer's own class is not ours to account for, and gui's atomics are
    // generated rather than written.
    const named = new Set<string>()
    const withRule = new Set<string>()
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name)
        if (e.isDirectory()) { walk(p); continue }
        if (/\.test\./.test(e.name)) continue
        const t = readFileSync(p, 'utf8')
        if (e.name.endsWith('.css')) {
          for (const [ , c ] of t.matchAll(/\.(hz-[a-z0-9-]+)/g)) withRule.add(c)
        } else if (/\.tsx?$/.test(e.name)) {
          for (const [ , c ] of t.matchAll(/['"`](hz-[a-z0-9-]+)['"`]/g)) named.add(c)
        }
      }
    }
    walk(SRC)
    expect([ ...named ].filter((c) => !withRule.has(c)).sort()).toEqual([])
  })
})
