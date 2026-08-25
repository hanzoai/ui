/**
 * The flattener, and the two shapes the wire actually sends.
 *
 * Worth a test rather than a reading: the first version of `Turn` narrowed
 * content to `string`, which typechecked against every fixture anyone had
 * written by hand and refused the SDK's own turns at the one call the pair
 * exists to make work.
 */
import { describe, expect, it } from 'vitest'

import { words } from './words'

describe('words', () => {
  it('passes a plain string through', () => {
    expect(words('ship it')).toBe('ship it')
    expect(words('')).toBe('')
  })

  it('answers empty for a turn with nothing in it yet', () => {
    // The assistant bubble exists before its first token arrives.
    expect(words(undefined)).toBe('')
    expect(words([])).toBe('')
  })

  it('joins parts with no separator', () => {
    // The wire splits a sentence mid-word, so a space here lands inside one.
    expect(words([{ type: 'text', text: 'ship' }, { type: 'text', text: ' it' }])).toBe('ship it')
    expect(words([{ type: 'text', text: 'un' }, { type: 'text', text: 'even' }])).toBe('uneven')
  })

  it('drops a part that carries no text, keeping the prose whole', () => {
    // An image contributes nothing rather than a placeholder — a caller drawing
    // the attachment reads the parts itself.
    expect(
      words([
        { type: 'text', text: 'what is in ' },
        { type: 'image_url' },
        { type: 'text', text: 'this?' },
      ]),
    ).toBe('what is in this?')
  })

  it('takes a part type it has never heard of', () => {
    // The wire's set grows; an unknown part is one with no text, not an error.
    expect(words([{ type: 'audio', text: 'heard' }, { type: 'whatever-2027' }])).toBe('heard')
  })
})
