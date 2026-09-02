import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { accent, fold, glass, panel, row, rows, screen, scrim, selected, sheet } from './glass'

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
    // A COMPONENT. `tw.ts` is not one: it is the table that turns a utility
    // class a CONSUMER wrote into the style property it always meant, and
    // `backdrop-blur-*` is one of some forty families it translates. Naming a
    // property there is the table doing its job, and it is the single place
    // that mapping lives — the same "stated once" this rule is protecting,
    // one layer out. What the rule is actually against is a component picking
    // its own radius instead of wearing the material, and the table cannot do
    // that: it renders nothing and reaches the page only through markup
    // somebody else wrote.
    const components = walk(SRC).filter((f) => !/[\\/]tw\.tsx?$/.test(f))
    const offenders = components.filter((f) => /backdropFilter/.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => f.replace(SRC, ''))).toEqual([])
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
      expect(body).toContain(`var(--glass-shadow-${rung})`)
    }
  })

  it('no sheet reads the t-shirt ramp — the ladder owns its drops', () => {
    // THE regression. A rung's drop used to be `var(--shadow-sm | --shadow-lg)`
    // — generic sizes @hanzo/brand ALSO declares at :root, tuned for a white
    // canvas (.05/.1 where design says .40/.55). Same name, same specificity,
    // so it came down to which sheet the bundler put last, and brand won; and a
    // declared variable beats a var() fallback, so the mirror below could not
    // rescue it either. On #080808 the drops resolved to nothing visible and
    // rungs 1-2 flattened — silently, because the lit edge still drew.
    //
    // Role names are safe and stay: only design coins --edge-highlight,
    // --surface-scrim, --shadow-inset-hairline. It is the SIZE ramp that is
    // common property, so the ladder may never read it again by any spelling.
    const ramp = /var\(\s*--shadow(?:-(?:sm|md|lg|xl|2xl))?(?![-\w])/g
    for (const [name, sheet] of Object.entries(sheets))
      expect([name, [...rules(sheet).matchAll(ramp)].map((m) => m[0])]).toEqual([name, []])
    expect(source.flatMap((s) => [...s.matchAll(ramp)].map((m) => m[0]))).toEqual([])
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
  const design = rules(readFileSync(require.resolve('@hanzo/font/css'), 'utf8'))

  /**
   * Every declaration of a token, paired with the selector that scopes it.
   *
   * Design states the ladder TWICE — dark at `:root`, light in `.light` — so
   * reading only the first match compares one theme against both. The selector
   * is the text back to the previous rule, which is exact for a flat sheet and
   * is why comments are stripped first: a comment before a selector would
   * otherwise BE part of it.
   */
  const declared = (sheet: string, name: string) =>
    [...sheet.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))].map((m) => {
      const open = sheet.lastIndexOf('{', m.index)
      return {
        scope: sheet.slice(Math.max(sheet.lastIndexOf('}', open), 0), open).replace(/[{}]/g, '').trim(),
        value: m[1].replace(/\s+/g, ' ').trim(),
      }
    })

  const token = (name: string, theme: 'dark' | 'light') => {
    const hit = declared(design, name).filter((d) =>
      theme === 'light' ? d.scope.includes('.light') : d.scope === ':root'
    )
    if (!hit.length) throw new Error(`@hanzo/design publishes no ${theme} --${name}`)
    return hit[hit.length - 1].value
  }

  /**
   * The ladder's own drops are design's values under names this package owns,
   * because the names design publishes them under are a generic ramp anyone may
   * declare — and @hanzo/brand does. Owning the name is what makes the rung
   * reachable; it also makes this a COPY, with one fact in two homes. So the
   * copy is checked rather than trusted, in both themes: bump @hanzo/design and
   * whichever column moved fails here by rung and by name.
   */
  it.each([
    ['1', 'shadow-sm'],
    ['2', 'shadow-lg'],
    ['3', 'shadow-floating'],
  ])('rung %s still carries design’s --%s, in both themes', (rung, name) => {
    const ours = declared(rules(css), `glass-shadow-${rung}`)
    expect(ours.map((d) => d.scope)).toEqual([':root', '.light, :root.t_light, .t_light'])
    expect(ours.map((d) => d.value)).toEqual([token(name, 'dark'), token(name, 'light')])
  })

  /**
   * The role-named tokens are still READ from design, so their fallbacks stay
   * mirrors: present so a host that imports the sheet without design's token
   * layer gets a ladder instead of a silently-dropped declaration.
   */
  it.each(['edge-highlight', 'surface-scrim'])(
    'the --%s fallback still equals what design publishes',
    (name) => {
      const found = fallbacks(`${css}\n${motion}\n${recipes}`, name)
      expect(found.length).toBeGreaterThan(0)
      expect([...new Set(found)]).toEqual([token(name, 'dark')])
    }
  )

  it('paper’s standalone fallback is the rung it names', () => {
    // motion.css ships on its own, so it cannot assume the ladder is present —
    // but a fallback that disagrees with the rung is a second opinion about how
    // deep rung 2 is, visible only to hosts that skipped glass.css.
    expect(fallbacks(motion, 'glass-shadow-2')).toEqual([token('shadow-lg', 'dark')])
  })

  /**
   * Paper and glass are ONE ladder under two names, and this is the seam.
   *
   * Design publishes the rungs as `--shadow-sheet-*` — a name it owns outright,
   * which is what lets anything outside this package (a raw stylesheet, the
   * extension, a site that never loads gui) stand on the same steps. This
   * package composes the identical thing from `--edge-highlight` + its own
   * drop, because it needs a name @hanzo/brand cannot outrank.
   *
   * Two homes for one fact, so the fact is checked. If design retunes a rung
   * and this sheet does not follow, a menu and a transcript on the same screen
   * quietly stand at different heights — and nothing renders an error.
   */
  // Layer separators are compared as separators, not as text: the two files
  // disagree about the space after a comma and always will.
  const layers = (v: string) => v.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim()

  it.each([['1'], ['2']])('rung %s is the step design publishes as --shadow-sheet-N', (rung) => {
    const ours = declared(rules(css), `glass-shadow-${rung}`)
    for (const [i, mode] of (['dark', 'light'] as const).entries())
      expect(layers(token(`shadow-sheet-${rung}`, mode))).toBe(
        layers(`var(--edge-highlight),${ours[i].value}`)
      )
  })

  /** design states a tint as a chain of role names; a fallback has to be what
   *  the chain ARRIVES at, since a host without the sheet resolves none of it. */
  const resolve = (name: string, mode: 'dark' | 'light'): string => {
    const value = token(name, mode)
    const hop = value.match(/^var\(\s*--([A-Za-z0-9-]+)\s*\)$/)
    return hop ? resolve(hop[1], mode) : value
  }

  it('a sheet is filled from design’s paper tints, at every rung', () => {
    // The fill is half the lift, and on a dark canvas it is the half that
    // reads — so a rung whose tint stopped following design stopped rising.
    for (const level of [0, 1, 2] as const)
      expect(fallbacks(String(sheet(level).backgroundColor), `sheet-${level}`)).toEqual([
        resolve(`sheet-${level}`, 'dark'),
      ])
  })

  it('the fold names design’s face', () => {
    expect(fallbacks(css, 'fold-face').length).toBe(1)
    expect(fold.className).toBe('fold')
  })

  it('the recipes name tokens, never literals', () => {
    // A hex or an rgb() in a recipe is a value that stopped following the theme
    // — it looks right in dark and is wrong the moment anything renders light.
    const values = [glass(2), glass(3), scrim, panel, rows, row, accent, screen, selected(true), selected(false),
                    sheet(0), sheet(1), sheet(2), fold]
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

  it('both declarations carry the weight, because a compiled class is what they beat', () => {
    // THE regression this rule exists to fix, shipped for a whole release with
    // the rule present and losing. gui compiles the overlay's own opacity and
    // ground into atomic classes (`_o-0--5`, `_bg-rgba0000--538295333`) that
    // land in an inline <style> the bundler orders AFTER this sheet — equal
    // specificity, later source, so they won and every hanzo.app modal dimmed
    // to a quarter black while this file said 80%. Its neighbours (the
    // material, all three rungs) already carry !important for exactly that
    // reason; the scrim was written without it. Both declarations need it:
    // `opacity: 1` alone still leaves a .5 ground, and the ground alone is
    // still halved by the compiled opacity.
    const rule = rules(css).slice(rules(css).indexOf('[data-slot="dialog-overlay"]'))
    const body = rule.slice(rule.indexOf('{') + 1, rule.indexOf('}'))
    const decls = body.split(';').map((d) => d.trim()).filter(Boolean)
    expect(decls.map((d) => d.slice(0, d.indexOf(':')).trim())).toEqual(['opacity', 'background-color'])
    expect(decls.filter((d) => !d.endsWith('!important'))).toEqual([])
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

describe('The composer prism is a RIM, and it is declared once', () => {
  /**
   * This section exists because the class was declared TWICE — in hanzo.chat's
   * client/src/style.css and hanzo.app's assets/globals.css, each calling itself
   * "the ONE prism on any Hanzo surface" — and the two drifted until one was
   * simply wrong. hanzo.app's copy drew a filled DISC and leaned on the panel
   * above it being opaque to hide the middle, which is invisible until a glass
   * panel sits in it: then the whole spectrum washes up through the composer's
   * interior. These assertions are the shape of that bug.
   */
  const before = css.slice(css.indexOf('.hz-composer::before'), css.indexOf('.hz-composer::after'))
  const after = css.slice(css.indexOf('.hz-composer::after'), css.indexOf('.hz-composer > *'))

  it('ships the prism at all', () => {
    expect(css).toContain('.hz-composer {')
    expect(before.length).toBeGreaterThan(100)
    expect(after.length).toBeGreaterThan(100)
  })

  it('masks BOTH pseudo-elements, so neither paints behind the panel', () => {
    // Without this the ring is a disc and the panel's opacity becomes
    // load-bearing for something that was never about the panel.
    for (const [name, block] of [['ring', before], ['halo', after]] as const) {
      expect(block, `${name} must be masked`).toContain('mask-composite: exclude')
      expect(block, `${name} needs the content-box hole`).toContain('content-box')
    }
  })

  it('states -webkit-mask-composite AFTER the standard shorthand', () => {
    // WebKit aliases `mask` onto `-webkit-mask`, so the shorthand RESETS the
    // composite to `source-over` — the filled disc again — on exactly the
    // browsers too old to have `mask-composite`. Order is the whole fix.
    for (const block of [before, after]) {
      expect(block.indexOf('-webkit-mask-composite')).toBeGreaterThan(block.indexOf('mask-composite: exclude'))
    }
  })

  it('declares the spectrum ONCE and closes the loop', () => {
    const stops = css.match(/--hz-spectrum:/g) ?? []
    expect(stops).toHaveLength(1)
    // A conic gradient whose first and last stop differ shows a hard seam.
    const decl = css.slice(css.indexOf('--hz-spectrum:')).split(';')[0]
    const rgba = decl.match(/rgba\([^)]*\)/g) ?? []
    expect(rgba.length).toBeGreaterThanOrEqual(3)
    expect(rgba[0]).toBe(rgba[rgba.length - 1])
  })

  it('keeps the halo quiet — no opacity pulse', () => {
    // The loud version (0.5 resting, pulsing to 0.85) read as a purple wash
    // over an animated backdrop and was killed on purpose.
    expect(after).not.toContain('hzComposerGlow')
    const op = Number((after.match(/opacity:\s*([\d.]+)/) ?? [])[1])
    expect(op).toBeLessThanOrEqual(0.3)
  })
})
