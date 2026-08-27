import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The shipped sheet has to state the ELEMENT ground, not only gui's.
 *
 * Every rule gui generates hangs off a class it put there, so an element the
 * app wrote itself gets none of it. With this missing, removing a utility
 * engine hands `<ul>`, `<button>` and `<a>` back to browser defaults — measured
 * as a bullet in the lux nav — and each consumer re-states the same dozen rules
 * in its own globals.css, or forgets to.
 */
const css = readFileSync(join(__dirname, '../dist/styles.css'), 'utf8')

describe('the shipped sheet resets elements', () => {
  it.each([
    ['a list marker', /\bol,\s*ul,\s*menu\s*\{[^}]*list-style:\s*none/],
    ['button chrome', /\bbutton\s*\{[^}]*background:\s*transparent/],
    ['link blue', /\ba\s*\{[^}]*color:\s*inherit/],
    ['heading margins', /h1,\s*h2[^{]*\{[^}]*margin:\s*0/],
    ['border-box', /\*,\s*\n?\*::before[\s\S]{0,60}box-sizing:\s*border-box/],
  ])('states %s', (_, re) => {
    expect(css).toMatch(re)
  })

  it('keeps a replaced element from widening the page', () => {
    expect(css).toMatch(/img,\s*svg,\s*video[^{]*\{[^}]*max-width:\s*100%/)
  })

  it('lets a preformatted block scroll inside itself', () => {
    expect(css).toMatch(/\bpre\s*\{[^}]*overflow-x:\s*auto/)
  })

  it('puts the ground BEFORE gui, so a component still wins', () => {
    expect(css.indexOf('ol, ul, menu')).toBeLessThan(css.lastIndexOf('.is_View'))
  })
})

describe('the measure', () => {
  it('bounds running text but not headings', () => {
    // A heading is short and the width is what gives it presence; a paragraph
    // past ~68 characters loses the reader on the line return.
    expect(css).toMatch(/\.hz-prose > p,[\s\S]{0,80}max-width:\s*var\(--measure\)/)
    expect(css).not.toMatch(/\.hz-prose > h1\s*\{[^}]*max-width/)
  })

  it('declares a gutter that grows with the viewport', () => {
    const m = /--gutter:\s*clamp\(([^)]*)\)/.exec(css)
    if (!m) throw new Error('no --gutter clamp in the shipped sheet')
    const [min, , max] = m[1].split(',').map((s) => s.trim())
    expect(parseFloat(max)).toBeGreaterThan(parseFloat(min))
  })

  it('sets the measure in ch, so it follows the type', () => {
    expect(css).toMatch(/--measure:\s*\d+ch/)
  })
})
