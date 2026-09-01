import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The control ladder, asserted on the source that declares it.
 *
 * Two defects this pins, both shipped in 8.0.64 and inherited by every app:
 *
 *  1. A PINNED height clips. `height={36}` on a control means a child taller
 *     than 36px is cropped, silently, with a green build — a 119px thumbnail
 *     once rendered as a 30px sliver that way. Button was moved to
 *     `height: 'auto'` + a `minHeight` floor in 01ac46dce; Input and
 *     SelectTrigger kept theirs, so the trap stayed armed in the two controls
 *     that appear in every form.
 *  2. An Input and a Select are the SAME control — 36px, 8px radius, 1px edge —
 *     sitting side by side in every form. One rendered its text at 14px and the
 *     other at 13px.
 *
 * Source text, not a render: these are contracts about what the package
 * declares, and a render test would need the whole gui runtime to answer them.
 */
const dir = join(__dirname, '..', 'backends', 'gui')
const read = (f: string) => readFileSync(join(dir, f), 'utf8')

/**
 * The controls that carry ARBITRARY CONTENT in a single row — a caller's label,
 * value or children can be taller than the box, so each must state a FLOOR.
 *
 * Named, not scanned. A blanket "no pinned height" rule flags the 1px menu
 * separator, the 8px progress track and the 20px resize handle, none of which
 * hold anything a caller supplies — and a guard that cries wolf on correct code
 * gets deleted, taking the real check with it.
 */
const CONTENT_BEARING = ['button.tsx', 'select.tsx', 'textarea.tsx']

// `input.tsx` is deliberately absent. An <input> is single-line — it has no
// children and does not wrap — so a pinned height cannot clip anything, and
// gui's Input does not accept `minHeight` in the first place. Adding it here
// makes the guard demand something the platform refuses.

describe('control ladder', () => {
  it.each(CONTENT_BEARING)('%s states a height FLOOR, never a pin', (file) => {
    const src = read(file)

    // BOTH spellings: a JSX attribute (`height={36}`) and an object literal
    // inside a size variant (`height: 'auto'`). Button uses the second; matching
    // only the first reported it as having no floor at all, which is how a guard
    // ends up flagging the one control that already does this correctly.
    const pins: string[] = []
    for (const m of src.matchAll(/\bheight\s*[=:]\s*(?:\{([^}]+)\}|'([^']+)'|"([^"]+)"|(\d+))/g)) {
      const v = (m[1] ?? m[2] ?? m[3] ?? m[4]).trim().replace(/^['"]|['"]$/g, '')
      if (/^(?:auto|100%|undefined)$/.test(v)) continue
      pins.push(v)
    }

    expect(
      pins,
      `${file} pins height=${pins.join(', ')} — taller content is CLIPPED and the build stays green`,
    ).toEqual([])

    // And a floor has to actually be stated, or the control has no size at all.
    expect(/\bminHeight\s*[=:]|\bminH\s*[=:]/.test(src), `${file} states no minHeight floor`).toBe(true)
  })

  // The two field controls must read at the same size or every form looks broken.
  it('Input and SelectTrigger render their text at the same size', () => {
    const inputSize = read('input.tsx').match(/fontSize="(\$\d+)"/)?.[1]
    const selectSize = read('select.tsx').match(/ink\(children[^)]*size:\s*["'](\$\d+)["']/)?.[1]

    expect(inputSize, 'input.tsx declares no fontSize').toBeDefined()
    expect(selectSize, 'select.tsx declares no ink size').toBeDefined()
    expect(selectSize).toBe(inputSize)
  })
})

/**
 * The PRODUCT layer sits on the same ladder as the primitives.
 *
 * It is where the leverage is: console renders 240 FieldText, 78 FieldSelect and
 * 56 PrimaryButton, so three components here decide 374 call sites. They had
 * drifted — PrimaryButton wrapped gui's own Button (44px, gui's radius) instead
 * of ours, and FieldSelect's native <select> was 40px with a 9px radius, a
 * radius this system does not have at any step. A 40px picker beside a 36px
 * field is the form stepping every console page shows.
 */
describe('product layer', () => {
  const product = (f: string) =>
    readFileSync(join(__dirname, '..', 'product', f), 'utf8')

  // PrimaryButton still wraps gui's Button, deliberately and temporarily: the
  // swap needs `icon`/`iconAfter` on the canonical Button first. Recorded, not
  // asserted away — a test claiming this is already fixed would be a lie, and
  // the comment in that file carries the reason.
  it('PrimaryButton records why it is not on the ladder yet', () => {
    expect(product('PrimaryButton.tsx')).toMatch(/icon.*iconAfter|iconAfter/)
  })

  it('FieldSelect matches the field ladder — 36px, 8px radius', () => {
    const src = product('Field.tsx')
    expect(src).toMatch(/height:\s*36\b/)
    expect(src).toMatch(/borderRadius:\s*8\b/)
    // 9 is not a step on this scale (6 / 8 / 12 / pill).
    expect(src).not.toMatch(/borderRadius:\s*9\b/)
  })

  /**
   * ICONS STEP TOO, and 15 is not a step.
   *
   * The product layer had 15px icons in fifteen places — chevrons, checks, menu
   * glyphs, pagination arrows — while every consuming app draws 14 or 16.
   * Measured on the signed-in /dev rail: 16px appeared 22 times, 14px nine
   * times, and 15px exactly once, inside an @hanzo/ui control. One pixel is
   * invisible alone and unmistakable in a row: it is why a rail of identical
   * controls reads as "everything is a slightly different size".
   *
   * 16 is the step that pairs with this ladder's 14px text, and the one the
   * apps already use, so the library moves to the apps rather than the reverse.
   * Scanned rather than named: a new file with a 15 is exactly the drift this
   * exists to catch, and it would never be added to a named list.
   */
  it('draws no icon at 15px — a size this scale does not have', () => {
    const dir = join(__dirname, '..', 'product')
    const offenders: string[] = []
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, e.name)
        if (e.isDirectory()) walk(full)
        else if (e.name.endsWith('.tsx') && /size=\{15\}/.test(readFileSync(full, 'utf8'))) {
          offenders.push(e.name)
        }
      }
    }
    walk(dir)
    expect(offenders, `size={15} is off the icon scale (12 / 14 / 16 / 18 / 24)`).toEqual([])
  })
})
