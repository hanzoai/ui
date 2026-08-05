import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { accent, glass, panel, row, rows, screen, scrim, selected } from './glass'

/**
 * ONE glass.
 *
 * The material is not a look a call site opts into — it is a property of what a
 * thing IS. A popover is over the page or it is nothing, so it is glass; a card
 * in the flow has nothing behind it to soften, so it is not. That distinction
 * survives only if the material stays attached to the slot and the depth stays
 * on one ladder, and both had already drifted once in the console: of 135
 * floating surfaces exactly one had reached for the material, while a dozen
 * dialogs pinned an opaque fill by hand.
 *
 * These are the invariants that keep the drift from starting again. Each one
 * failed for real before it was written.
 */

const SRC = dirname(fileURLToPath(import.meta.url))
const read = (p: string) => readFileSync(join(SRC, p), 'utf8')

const css = read('glass.css')
const theme = read('theme.css')
const motion = read('styles/motion.css')
const recipes = read('glass.ts')

/** Every stylesheet this package ships, so a rule cannot hide in the other one. */
const sheets = { 'glass.css': css, 'theme.css': theme, 'styles/motion.css': motion }

/** What the browser sees. A retired name may still be NAMED in the prose that
 *  says why it was retired — that is documentation, not a reference. */
const rules = (sheet: string) => sheet.replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * The fallback inside `var(--name, …)`, read with balanced parens.
 *
 * A `[^)]*` scan stops at the first close paren, which truncates every value
 * that contains one — and design's shadows are exactly those: `--shadow-lg` is
 * two `rgb(…)` layers, so a naive read compares half a value against a whole
 * one and reports drift that is not there.
 */
const fallbacks = (text: string, name: string) => {
  const out: string[] = []
  const open = `var(--${name},`
  for (let i = text.indexOf(open); i >= 0; i = text.indexOf(open, i + 1)) {
    let depth = 1
    let j = i + open.length
    for (; j < text.length && depth > 0; j++) {
      if (text[j] === '(') depth++
      else if (text[j] === ')') depth--
    }
    out.push(text.slice(i + open.length, j - 1).replace(/\s+/g, ' ').trim())
  }
  return out
}

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full)
  }
  return out
}
const source = walk(SRC).map((f) => readFileSync(f, 'utf8'))

describe('The material attaches to the slot, not to who remembered', () => {
  // Every surface the sheet frosts is floating chrome BY CONSTRUCTION. If a
  // component renames a slot or drops one, this is where it gets noticed —
  // rather than in a screenshot six weeks later showing one opaque menu among
  // forty glass ones. Derived from the components rather than listed here, so
  // the check cannot go stale the way a hand-kept list does.
  it('every slot the sheet frosts is a slot a component actually emits', () => {
    const emitted = new Set(
      source.flatMap((s) => [
        ...[...s.matchAll(/slot\(['"]([a-z-]+)['"]\)/g)].map((m) => m[1]),
        ...[...s.matchAll(/data-slot="([a-z-]+)"/g)].map((m) => m[1]),
      ])
    )
    const styled = [...new Set([...css.matchAll(/\[data-slot="([a-z-]+)"\]/g)].map((m) => m[1]))]
    expect(styled.length).toBeGreaterThan(5)
    expect(styled.filter((s) => !emitted.has(s))).toEqual([])
  })

  it('the material rides on the recipe too, for the surfaces no slot names', () => {
    expect(css).toContain('.glass,')
    expect(glass(2).className).toContain('glass')
  })

  it('the blur is stated ONCE — no second radius in any sheet this package ships', () => {
    // Sticky bars drift to four different radii the moment each one picks its
    // own. A second `backdrop-filter` DECLARATION is how that starts.
    //
    // The `@supports (backdrop-filter: blur(8px))` condition is not one — it is
    // a capability probe, and its argument is deliberately a cheap radius no
    // browser would refuse. Matching it would fail on the very line that guards
    // the material.
    const radii = Object.values(sheets).flatMap((sheet) =>
      [
        ...sheet
          .split('\n')
          .filter((line: string) => !line.includes('@supports'))
          .join('\n')
          .matchAll(/backdrop-filter:\s*blur\((\d+)px\)/g),
      ].map((m) => m[1])
    )
    expect([...new Set(radii)]).toEqual(['20'])
  })

  it('no component hand-rolls a backdrop blur — the material owns it', () => {
    expect(source.filter((s) => /backdropFilter/.test(s))).toEqual([])
  })
})

describe('Depth is a ladder, and it has three rungs', () => {
  const rungs = [...css.matchAll(/\.elevation-(\d)\b/g)].map((m) => m[1])

  it('exactly three rungs exist', () => {
    expect([...new Set(rungs)]).toEqual(['1', '2', '3'])
  })

  it('nothing reaches for a fourth', () => {
    // A ladder treated as a palette grows rungs. The 4th was a hardcoded shadow
    // behind a variable nothing defined, worn by the one surface that already
    // belonged at 3.
    for (const [name, sheet] of Object.entries(sheets)) expect([name, /elevation-4/.test(sheet)]).toEqual([name, false])
    expect(source.filter((s) => /elevation-4/.test(s))).toEqual([])
  })

  it('every rung pairs the lit edge with a drop', () => {
    // The lit edge is the half that reads on a near-black canvas — black on
    // near-black moves no pixels, so a rung with only a shadow does nothing.
    for (const rung of ['1', '2', '3']) {
      const rule = css.slice(css.indexOf(`.elevation-${rung}`))
      const body = rule.slice(0, rule.indexOf('}'))
      expect(body).toContain('var(--edge-highlight')
      expect(body).toMatch(/var\(--shadow-(sm|lg|floating)/)
    }
  })

  it('the anchored slots share rung 2 and the modal shares rung 3 — no restatement', () => {
    // A menu is at 2 because it is pinned to the control that opened it; a
    // dialog is at 3 because it has no anchor and a scrim of its own. Sharing
    // the rung's own rule is what keeps the ladder from coming apart from the
    // surfaces standing on it.
    const rung2 = css.slice(css.indexOf('.elevation-2,'), css.indexOf('.elevation-3,'))
    for (const s of ['popover-content', 'select-content', 'dropdown-menu-content', 'tooltip-content'])
      expect(rung2).toContain(`[data-slot="${s}"]`)
    expect(css.slice(css.indexOf('.elevation-3,'))).toContain('[data-slot="dialog-content"]')
  })

  it('the retired names are gone, not merely unused', () => {
    // `--hz-elevation-*`, `--hz-ring` and `--hz-paper-highlight` were never
    // defined anywhere — not here, not in @hanzo/design, not in a consumer — so
    // every reference resolved to its hardcoded fallback while reading like a
    // theming hook. An indirection through a name that does not exist.
    for (const [name, sheet] of Object.entries(sheets))
      expect([name, /--hz-(elevation|ring|paper-highlight)/.test(rules(sheet))]).toEqual([name, false])
  })

  it('glass offers no rung 1 — a floating thing is never at rest', () => {
    expect(recipes).toMatch(/export type Lift = 2 \| 3/)
    expect(glass().className).toBe('glass elevation-2')
    expect(glass(3).className).toBe('glass elevation-3')
  })
})

describe('Every value is @hanzo/design’s, and the mirror cannot drift', () => {
  const require = createRequire(import.meta.url)
  const design = readFileSync(require.resolve('@hanzo/design/styles.css'), 'utf8')
  const token = (name: string) => {
    const m = design.match(new RegExp(`\\n\\s*--${name}:\\s*([^;]+);`))
    if (!m) throw new Error(`@hanzo/design publishes no --${name}`)
    return m[1].trim()
  }

  /**
   * The fallbacks in glass.css are design's OWN values, present so a host that
   * imports the sheet without design's token layer gets a ladder instead of a
   * silently-dropped declaration. A copy is how one fact ends up with two homes
   * and the two drift — so the copy is CHECKED rather than trusted. Bump
   * @hanzo/design, and whichever value moved fails here by name.
   */
  it.each(['edge-highlight', 'shadow-sm', 'shadow-lg', 'shadow-floating', 'surface-scrim'])(
    'the --%s fallback still equals what design publishes',
    (name) => {
      const found = fallbacks(`${css}\n${motion}\n${recipes}`, name)
      expect(found.length).toBeGreaterThan(0)
      expect([...new Set(found)]).toEqual([token(name).replace(/\s+/g, ' ')])
    }
  )

  it('the recipes name tokens, never literals', () => {
    // A hex or an rgb() in a recipe is a value that stopped following the theme
    // — it looks right in dark and is wrong the moment anything renders light.
    const values = [glass(2), glass(3), scrim, panel, rows, row, accent, screen, selected(true), selected(false)]
      .flatMap((r) => Object.values(r))
      .flatMap((v) => (v && typeof v === 'object' ? Object.values(v) : [v]))
      .filter((v): v is string => typeof v === 'string')
    expect(values.filter((v) => /#[0-9a-f]{3}|rgba?\(|hsla?\(|oklch\(/i.test(v) && !v.startsWith('var('))).toEqual([])
  })
})

describe('A scrim dims the page — it does not delete it', () => {
  it('the dim is one token, read from both languages', () => {
    expect(css).toContain('background-color: var(--surface-scrim')
    expect(scrim.backgroundColor).toContain('var(--surface-scrim')
  })

  it('no component paints its own full-bleed black', () => {
    // An opaque overlay does not dim what is behind it, it deletes it — and a
    // translucent panel over a solid wall has nothing left to be translucent
    // about, so the scrim cancels the very material it exists to make read.
    expect(source.filter((s) => /position="fixed"[^>]*backgroundColor="(black|#000)/.test(s))).toEqual([])
  })
})

describe('Glass is for chrome; the flow gets a panel', () => {
  /*
   * There is no "in-flow surfaces are never frosted" test here, and the reason
   * is worth writing down: it cannot be decided from the source. Whether a
   * thing floats is a fact about the RUNTIME — a dropdown's content floats
   * because gui portals it, with no `position` prop anywhere in the file. The
   * heuristic that looked for one flagged three surfaces that were all correct,
   * which would have taught the next reader to distrust the file. The law is
   * real; this is the wrong instrument for it, and a test that cries wolf is
   * worse than no test.
   */

  it('a panel rests on rung 1 and glass never does', () => {
    expect(panel.className).toBe('elevation-1')
    expect(glass(2).className).not.toContain('elevation-1')
  })

  it('a grouped card spreads the panel WHOLE, so the ladder cannot come apart', () => {
    // Restated, moving the panel up or down the ladder leaves its groups pinned
    // to a rung they no longer share.
    for (const [k, v] of Object.entries(panel)) expect([k, rows[k as keyof typeof rows]]).toEqual([k, v])
  })

  it('a grouped card clips its separators', () => {
    // Without the clip the topmost separator runs through the rounded corner.
    expect(rows.overflow).toBe('hidden')
    expect(css).toMatch(/\[data-slot="rows"\] > \* \+ \* \{\s*border-top: 1px solid var\(--borderColor/)
  })

  it('separators use the card’s OWN hairline first', () => {
    // `--borderColor` is what a gui theme scope re-bases and what the card's own
    // edge is drawn with; `--border` is a different grey. Reaching for the
    // second puts two hairlines a shade apart inside one card.
    expect(css).toContain('var(--borderColor, var(--border))')
  })

  it('the settings row rhythm is stated once', () => {
    expect(row.justifyContent).toBe('space-between')
    expect(row.paddingHorizontal).toBe('$4')
  })

  it('a state that owns the screen MEASURES the screen', () => {
    // `minHeight: '100%'` resolves against a parent that is `height: auto` all
    // the way to <body>, so the stack shrink-wraps and `center` then centres
    // inside THAT — invisibly, in a box the height of the content. `dvh`, not
    // `vh`: on a phone the URL bar collapses and 100vh overflows by its height.
    expect(screen.minHeight).toBe('100dvh')
  })

  it('selected survives a nested theme scope', () => {
    // Inside a nested scope `--color` is re-based to the same value as
    // `--color11`, so a selected row asking for `$color` gets exactly its
    // neighbours' colour. `$color12` is full strength in every scope.
    expect(selected(true).color).toBe('$color12')
    expect(accent.color).toBe('$color12')
  })
})
