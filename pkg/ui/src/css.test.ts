import { describe, expect, it } from 'vitest'

import { css } from './css'

describe('css', () => {
  it('reads size notation as numbers, the way an svg wants them', () => {
    expect(css('h-4 w-4 ml-2')).toEqual({ height: 16, width: 16, marginLeft: 8 })
  })

  it('reads colour through the token, not a hardcoded value', () => {
    expect(css('text-muted-foreground')).toEqual({ color: 'var(--muted-foreground)' })
  })

  it('composes the same way sx and Box do', () => {
    expect(css('gap-2', ['items-center'], { 'inline-flex': true })).toEqual({
      gap: 8,
      alignItems: 'center',
      display: 'inline-flex',
      flexDirection: 'row',
    })
  })

  it('DROPS a breakpoint rather than applying it at every width', () => {
    // The whole point: an inline style has no media query, and flattening
    // `md:` would put the large-screen rule on a phone.
    const out = css('grid grid-cols-1 md:grid-cols-3')
    expect(out).toEqual({ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' })
    expect(Object.keys(out).some((k) => k.startsWith('$'))).toBe(false)
  })

  it('DROPS a pseudo-class the same way — it is a group, not a declaration', () => {
    // tw hands these back as `hoverStyle` / `groupHoverStyle`, which Box and sx
    // understand and a style attribute does not. Left in, React would either
    // warn or paint the hover state at rest.
    expect(css('bg-white hover:bg-black')).toEqual({ backgroundColor: '#fff' })
    expect(css('opacity-40 group-hover:opacity-100')).toEqual({ opacity: 0.4 })
    expect(css('hover:bg-black')).toEqual({})
  })

  it('is empty for notation it does not read, never partial garbage', () => {
    expect(css('hz-prose some-app-class')).toEqual({})
  })

  it('takes nothing', () => {
    expect(css()).toEqual({})
    expect(css(undefined, null, false)).toEqual({})
  })
})
