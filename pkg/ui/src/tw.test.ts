import { describe, expect, it } from 'vitest'
import { tw, type ClassValue } from './tw'

const props = (s: ClassValue) => tw(s).props

describe('tw — one class', () => {
  it('reads the spacing ramp as pixels', () => {
    expect(props('p-4')).toEqual({ padding: 16 })
    expect(props('px-6')).toEqual({ paddingLeft: 24, paddingRight: 24 })
    expect(props('mt-2')).toEqual({ marginTop: 8 })
    expect(props('m-px')).toEqual({ margin: 1 })
    expect(props('gap-1.5')).toEqual({ gap: 6 })
  })

  it('splits a compound head at the right hyphen', () => {
    // A shortest-match split read `max-w-3xl` as `max` + `w-3xl` and every
    // compound head fell through silently.
    expect(props('max-w-3xl')).toEqual({ maxWidth: 768 })
    expect(props('min-h-screen')).toEqual({ minHeight: '100vh' })
    expect(props('grid-cols-2')).toEqual({ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' })
    expect(props('overflow-hidden')).toEqual({ overflow: 'hidden' })
    expect(props('gap-x-4')).toEqual({ columnGap: 16 })
  })

  it('keeps a colour as the custom property the sheet already resolves', () => {
    expect(props('text-foreground')).toEqual({ color: 'var(--foreground)' })
    expect(props('bg-muted')).toEqual({ backgroundColor: 'var(--muted)' })
    expect(props('text-transparent')).toEqual({ color: 'transparent' })
  })

  it('applies an alpha without knowing what the variable holds', () => {
    expect(props('bg-foreground/5')).toEqual({
      backgroundColor: 'color-mix(in srgb, var(--foreground) 5%, transparent)',
    })
  })

  it('reads an alpha written as a fraction, not as part of the name', () => {
    // `bg-white/[0.02]` asked for a variable called `--white/[0.02]`.
    expect(props('bg-white/[0.02]')).toEqual({
      backgroundColor: 'color-mix(in srgb, #fff 2%, transparent)',
    })
    expect(props('border-white/[0.07]')).toEqual({
      borderColor: 'color-mix(in srgb, #fff 7%, transparent)',
    })
  })

  it('takes a corner from the theme, one rung per name', () => {
    // Tailwind's stock numbers put every converted corner one rung small
    // against @hanzo/design's ramp.
    expect(props('rounded-lg')).toEqual({ borderRadius: 'var(--radius-lg, 0.75rem)' })
    expect(props('rounded-2xl')).toEqual({ borderRadius: 'var(--radius-2xl, 1.5rem)' })
    expect(props('rounded-full')).toEqual({ borderRadius: 9999 })
  })

  it('gives flex-1 a percentage basis', () => {
    // `0px` does not resolve as content against an indefinite parent; `0%` does.
    expect(props('flex-1')).toEqual({ flexGrow: 1, flexShrink: 1, flexBasis: '0%' })
  })

  it('takes a font size from the theme, not from a table', () => {
    // @hanzo/design's ramp is compact — base is 14px, not Tailwind's 16 — so a
    // hardcoded scale silently resized every converted element.
    expect(props('text-xs')).toEqual({
      fontSize: 'var(--text-xs)',
      lineHeight: 'var(--text-xs--line-height)',
    })
    // A size utility carries its own leading. Emitting the size alone left
    // every converted heading 8px shorter than the one beside it.
    expect(props('text-2xl').lineHeight).toBe('var(--text-2xl--line-height)')
  })

  it('distinguishes a size, an alignment and a colour under one head', () => {
    expect(props('text-sm')).toEqual({
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--text-sm--line-height)',
    })
    expect(props('text-center')).toEqual({ textAlign: 'center' })
    expect(props('text-muted-foreground')).toEqual({ color: 'var(--muted-foreground)' })
  })

  it('reads fractions and arbitrary values', () => {
    expect(props('w-1/2')).toEqual({ width: '50%' })
    expect(props('w-full')).toEqual({ width: '100%' })
    expect(props('leading-[1.1]')).toEqual({ lineHeight: '1.1' })
  })

  it('keeps a leading RATIO unitless, and a leading STEP a length', () => {
    // gui reads a bare number as pixels, so a ratio sent as a number lands as
    // `1.625px` — a line box smaller than the type inside it.
    expect(props('leading-relaxed')).toEqual({ lineHeight: '1.625' })
    expect(props('leading-6')).toEqual({ lineHeight: 24 })
  })

  it('declines space-y, whose spacing lives on the children', () => {
    // `gap` reproduces it on a flex container and silently loses it on a block
    // one, so the class stays and the rule that works keeps working.
    expect(tw('space-y-6')).toEqual({ props: {}, rest: 'space-y-6' })
  })

  it('gives flex its direction, since a row is not the browser default', () => {
    expect(props('flex')).toEqual({ display: 'flex', flexDirection: 'row' })
    expect(props('flex-col')).toEqual({ flexDirection: 'column' })
  })
})

describe('tw — variants', () => {
  it('sends a breakpoint to a media prop and a state to a pseudo-style', () => {
    expect(props('md:gap-8')).toEqual({ $md: { gap: 32 } })
    expect(props('hover:bg-muted')).toEqual({ hoverStyle: { backgroundColor: 'var(--muted)' } })
    expect(props('dark:text-foreground')).toEqual({ '$theme-dark': { color: 'var(--foreground)' } })
  })

  it('collects several classes under one variant', () => {
    expect(props('md:flex md:gap-4')).toEqual({
      $md: { display: 'flex', flexDirection: 'row', gap: 16 },
    })
  })

  it('keeps a class whose variant it does not know', () => {
    expect(tw('print:hidden').rest).toBe('print:hidden')
  })
})

describe('tw — gradient', () => {
  it('assembles the stops spread across classes into one value', () => {
    expect(props('bg-gradient-to-br from-foreground to-transparent')).toEqual({
      backgroundImage: 'linear-gradient(to bottom right, var(--foreground), transparent)',
    })
  })

  it('defaults the direction the way Tailwind does', () => {
    expect(props('from-background to-foreground')).toEqual({
      backgroundImage: 'linear-gradient(to right, var(--background), var(--foreground))',
    })
  })

  it('does not invent a gradient from a lone stop', () => {
    expect(props('from-foreground')).toEqual({})
  })
})

describe('tw — what it does not know', () => {
  it('returns an unknown class rather than dropping it', () => {
    // `group` is a marker another class selects on; losing it would break the
    // rule that reads it.
    expect(tw('flex group container')).toEqual({
      props: { display: 'flex', flexDirection: 'row' },
      rest: 'group container',
    })
  })

  it('accepts the shapes callers already write class names in', () => {
    expect(props(['flex', null, ['gap-4'], { 'p-2': true, 'p-8': false }])).toEqual({
      display: 'flex', flexDirection: 'row', gap: 16, padding: 8,
    })
  })

  it('is empty for empty input', () => {
    expect(tw('')).toEqual({ props: {}, rest: '' })
    expect(tw(undefined)).toEqual({ props: {}, rest: '' })
  })
})

describe('tw — the vocabulary it was built for', () => {
  // Measured across hanzo.ai and hanzo.app: 104,096 class uses, 1,597 distinct.
  // These are the heaviest, and a regression in any of them moves thousands of
  // elements at once.
  const TOP = [
    'text-foreground', 'flex', 'items-center', 'text-neutral-400', 'border',
    'text-sm', 'mx-auto', 'rounded-full', 'mb-4', 'font-medium', 'font-bold',
    'transition-colors', 'overflow-hidden', 'flex-col', 'grid-cols-1',
    'flex-wrap', 'inset-0', 'z-10', 'md:grid-cols-2', 'leading-relaxed',
    'max-w-3xl', 'max-w-7xl', 'font-mono', 'min-h-screen',
    'blur-3xl', 'flex-1', 'flex-shrink-0', 'uppercase', 'shadow-2xl',
  ]
  // `space-y-*` is heavy in the corpus and deliberately absent: its spacing
  // lives on the children, and no single container prop reproduces that on a
  // block container.

  it('converts every one of them', () => {
    const missed = TOP.filter((c) => tw(c).rest !== '')
    expect(missed).toEqual([])
  })
})

describe('the xs rung lands at the base', () => {
  // Content authored on the 5.x line writes the smallest rung out by name —
  // SPACE_DEFAULTS and GridDef.at both start at `xs` — and gui has no `$xs`
  // media prop to put it in. Unlisted, the prefix kept the whole class as an
  // unconverted string, so the FLOOR of every responsive ladder was the one
  // value that never arrived.
  it('applies with no media wrapper', () => {
    expect(tw('xs:h-2')).toEqual({ props: { height: 8 }, rest: '' })
  })

  it('is overridden by every larger rung, in order', () => {
    expect(tw('xs:h-2 sm:h-4 md:h-5')).toEqual({
      props: { height: 8, $sm: { height: 16 }, $md: { height: 20 } },
      rest: '',
    })
  })

  it('a genuinely unknown prefix is still kept whole', () => {
    expect(tw('nope:h-2')).toEqual({ props: {}, rest: 'nope:h-2' })
  })
})

describe('an arbitrary text- value is a size when it is a length', () => {
  // `text-` means size OR colour, and only the value can say which. Every
  // arbitrary one reached the colour branch, so `text-[96px]` returned
  // `{ color: '96px' }` — which the browser drops, leaving the element on its
  // inherited size with nothing reporting a problem. Found on lux/bitcoin's
  // 404, where a heading written at 96px rendered at 28.
  it('a length is a font size', () => {
    expect(tw('text-[96px]')).toEqual({ props: { fontSize: '96px' }, rest: '' })
    expect(tw('text-[1.05rem]')).toEqual({ props: { fontSize: '1.05rem' }, rest: '' })
    expect(tw('text-[50%]')).toEqual({ props: { fontSize: '50%' }, rest: '' })
  })

  it('a colour is still a colour', () => {
    expect(tw('text-[#fff]')).toEqual({ props: { color: '#fff' }, rest: '' })
    expect(tw('text-[var(--ink)]')).toEqual({ props: { color: 'var(--ink)' }, rest: '' })
  })

  it('the named scale is untouched', () => {
    expect(tw('text-4xl').props.fontSize).toBe('var(--text-4xl)')
  })
})
