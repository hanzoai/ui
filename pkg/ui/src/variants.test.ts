/**
 * A variant table is a lookup and a join.
 *
 * This shape arrived with shadcn, as `class-variance-authority`, and every
 * component in the estate is written against it. Keeping the shape and dropping
 * the dependency makes adoption a rename — and the implementation is fifteen
 * lines beside `cn`, which is where the work was happening anyway.
 */
import { describe, expect, it } from 'vitest'

import { cn, variants } from './core/cn'

const button = variants('btn', {
  variants: {
    tone: { solid: 'is-solid', ghost: 'is-ghost' },
    size: { sm: 'is-sm', lg: 'is-lg' },
  },
  defaultVariants: { tone: 'solid', size: 'sm' },
})

describe('a selection picks one class per axis', () => {
  it('takes the defaults when nothing is chosen', () => {
    expect(button()).toBe('btn is-solid is-sm')
  })

  it('overrides one axis and leaves the other', () => {
    expect(button({ tone: 'ghost' })).toBe('btn is-ghost is-sm')
  })

  it('reads an explicit undefined as "not chosen"', () => {
    // `<Button size={undefined}>` is what a caller writes when the prop is
    // optional and absent. It has to fall back, not blank the axis.
    expect(button({ size: undefined })).toBe('btn is-solid is-sm')
  })

  it('appends the caller class last, so the caller wins', () => {
    expect(button({ className: 'mine' })).toBe('btn is-solid is-sm mine')
    expect(button({ class: 'mine' })).toBe('btn is-solid is-sm mine')
  })

  it('is total: an axis with no default and no choice contributes nothing', () => {
    const f = variants('x', { variants: { z: { a: 'A' } } })
    expect(f()).toBe('x')
  })

  it('needs neither a base nor a table', () => {
    expect(variants()()).toBe('')
    expect(variants('only')()).toBe('only')
  })

  it('composes with cn the way a call site writes it', () => {
    expect(cn(button({ tone: 'ghost' }), 'extra')).toBe('btn is-ghost is-sm extra')
  })
})
