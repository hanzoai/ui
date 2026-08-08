import { describe, expect, it } from 'vitest'
import * as ui from '../index'

/**
 * A consumer's-eye check: the twenty primitives added to the root barrel must
 * actually RESOLVE, not merely appear in the source. `barrel.test.ts` compares
 * two lists of names as text — necessary, and not sufficient: a name can be
 * listed and still export `undefined` if the backend re-export is wrong.
 *
 * This imports the barrel the way an app does and asks for the values.
 */
const PRIMITIVES = [
  'XStack', 'YStack', 'ZStack', 'View', 'Text', 'SizableText', 'Paragraph',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Heading', 'Spacer', 'Span', 'Strong',
  'Em', 'Image', 'ScrollView', 'Grid', 'Glass', 'Section', 'CardMedia',
] as const

describe('the root barrel resolves what it exports', () => {
  it.each(PRIMITIVES)('%s is defined', (name) => {
    expect((ui as Record<string, unknown>)[name], `${name} is undefined at the import site`).toBeDefined()
  })

  // The controls too, since they are the ladder.
  it('the controls resolve', () => {
    for (const n of ['Button', 'Input', 'Select', 'SelectTrigger', 'Switch', 'Checkbox', 'Textarea']) {
      expect((ui as Record<string, unknown>)[n], `${n} is undefined`).toBeDefined()
    }
  })
})
