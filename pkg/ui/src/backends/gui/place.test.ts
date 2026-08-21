/**
 * The side+align -> placement rule, on its own because two components need it.
 *
 * `popover` and `hover-card` both translate the compound API's `side`/`align`
 * into gui's single floating-ui placement string. Each had written the rule
 * itself, and the copies had already diverged — one could not re-align a side
 * that already carried a suffix. The rule is one function now, and this is where
 * it is held to its contract.
 *
 * It is worth testing directly rather than through either component: the panel
 * is portalled and positioned at run time, so the placement never reaches
 * server-rendered markup and no render assertion can see it.
 */
import { describe, expect, it } from 'vitest'

import { place } from './place'

describe('place', () => {
  it('names the side alone when the alignment is centre', () => {
    expect(place('bottom')).toBe('bottom')
    expect(place('bottom', 'center')).toBe('bottom')
    expect(place('top', 'center')).toBe('top')
  })

  it('suffixes the side with a non-centre alignment', () => {
    expect(place('bottom', 'start')).toBe('bottom-start')
    expect(place('bottom', 'end')).toBe('bottom-end')
    expect(place('right', 'start')).toBe('right-start')
    expect(place('left', 'end')).toBe('left-end')
  })

  it('KEEPS a carried alignment when no align is named', () => {
    // A whole placement given to the root arrives here as `side`, and Content
    // publishes its align as undefined unless it declares one. Reading that
    // silence as centre threw the alignment away with no type error to show
    // for it: `placement="bottom-start"` came out `bottom`.
    expect(place('bottom-start')).toBe('bottom-start')
    expect(place('left-end')).toBe('left-end')
    expect(place('bottom-start', undefined)).toBe('bottom-start')
  })

  it('RE-aligns a side that already carries a suffix rather than appending', () => {
    // The root may be given a full placement while Content still declares an
    // align; the later word wins, and the result stays a legal placement. This
    // is the case the hover-card copy of the rule could not express.
    expect(place('bottom-end', 'start')).toBe('bottom-start')
    expect(place('bottom-start', 'center')).toBe('bottom')
  })

  it('is idempotent', () => {
    expect(place(place('bottom', 'start'), 'start')).toBe('bottom-start')
    expect(place(place('top'), 'center')).toBe('top')
  })

  it('never emits a bare or doubled separator', () => {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      for (const align of ['start', 'center', 'end'] as const) {
        const p = place(side, align)
        expect(p.endsWith('-')).toBe(false)
        expect(p).not.toContain('--')
        expect(p.split('-').length).toBeLessThanOrEqual(2)
      }
    }
  })
})
