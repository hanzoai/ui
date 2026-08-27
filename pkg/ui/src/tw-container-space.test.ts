import { describe, expect, it } from 'vitest'

import { tw } from './tw'

describe('tw: the content container', () => {
  it('is full width, bounded at each step up', () => {
    expect(tw('container').props).toEqual({
      width: '100%',
      $sm: { maxWidth: 640 }, $md: { maxWidth: 768 },
      $lg: { maxWidth: 1024 }, $xl: { maxWidth: 1280 },
    })
  })

  it('does not centre itself — that is what mx-auto is for', () => {
    expect(tw('container').props.marginLeft).toBeUndefined()
    expect(tw('container mx-auto').props.marginLeft).toBe('auto')
  })
})

describe('tw: space between children', () => {
  it('is a gap, by axis', () => {
    expect(tw('space-y-4').props).toEqual({ rowGap: 16 })
    expect(tw('space-x-2').props).toEqual({ columnGap: 8 })
  })

  it('composes with an explicit gap, the later one winning', () => {
    expect(tw('gap-2 space-y-8').props).toEqual({ gap: 8, rowGap: 32 })
  })

  it('reads a fractional step', () => {
    expect(tw('space-y-1.5').props).toEqual({ rowGap: 6 })
  })

  it('leaves nothing unread', () => {
    expect(tw('container space-y-4 space-x-2').rest).toBe('')
  })
})
