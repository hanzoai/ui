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

  it('reads scroll snap, which is how a carousel is built without a library', () => {
    expect(props('snap-x')).toEqual({ scrollSnapType: 'x mandatory' })
    expect(props('snap-y')).toEqual({ scrollSnapType: 'y mandatory' })
    expect(props('snap-both')).toEqual({ scrollSnapType: 'both mandatory' })
    expect(props('snap-none')).toEqual({ scrollSnapType: 'none' })
    expect(props('snap-center')).toEqual({ scrollSnapAlign: 'center' })
    expect(props('snap-start')).toEqual({ scrollSnapAlign: 'start' })
    expect(props('snap-always')).toEqual({ scrollSnapStop: 'always' })
  })

  it('absorbs the strictness class it already implies, and keeps the one it does not', () => {
    // `snap-x snap-mandatory` is the Tailwind idiom and says one thing twice.
    expect(tw('snap-x snap-mandatory')).toEqual({
      props: { scrollSnapType: 'x mandatory' },
      rest: '',
    })
    // `snap-proximity` means something this does NOT emit, so it stays visible
    // as an unread class rather than silently reading as mandatory.
    expect(tw('snap-x snap-proximity').rest).toBe('snap-proximity')
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
      lineHeight: 'var(--text-xs--line-height, normal)',
    })
    // A size utility carries its own leading. Emitting the size alone left
    // every converted heading 8px shorter than the one beside it.
    expect(props('text-2xl').lineHeight).toBe('var(--text-2xl--line-height, normal)')
  })

  it('distinguishes a size, an alignment and a colour under one head', () => {
    expect(props('text-sm')).toEqual({
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--text-sm--line-height, normal)',
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
    expect(props('leading-6')).toEqual({ lineHeight: '24px' })
  })

  it('reads space-y as the row gap', () => {
    // This used to be declined, on the reasoning that `gap` reproduces it on a
    // flex container and loses it on a block one — sound while a Tailwind rule
    // existed to lose. None does: the class reached the document and did
    // nothing, 76 times across the estate. A gap is right wherever the
    // container lays anything out and no worse than nothing where it does not.
    expect(tw('space-y-6')).toEqual({ props: { rowGap: 24 }, rest: '' })
    expect(tw('space-x-6')).toEqual({ props: { columnGap: 24 }, rest: '' })
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
    // `group` is the marker; `container` is read now, so the unknown left over
    // is the marker alone.
    expect(tw('flex group container')).toEqual({
      props: {
        display: 'flex', flexDirection: 'row', width: '100%',
        $sm: { maxWidth: 640 }, $md: { maxWidth: 768 },
        $lg: { maxWidth: 1024 }, $xl: { maxWidth: 1280 },
      },
      rest: 'group',
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
    // A size sets BOTH, as the named steps do. Without the line height the box
    // keeps whatever gui last resolved and does not grow with the glyph — a
    // 96px numeral sat in a 20px box and the paragraph after it printed through
    // the digits.
    expect(tw('text-[96px]')).toEqual({ props: { fontSize: '96px', lineHeight: 'normal' }, rest: '' })
    expect(tw('text-[1.05rem]')).toEqual({ props: { fontSize: '1.05rem', lineHeight: 'normal' }, rest: '' })
    expect(tw('text-[50%]')).toEqual({ props: { fontSize: '50%', lineHeight: 'normal' }, rest: '' })
  })

  it('a colour is still a colour', () => {
    expect(tw('text-[#fff]')).toEqual({ props: { color: '#fff' }, rest: '' })
    expect(tw('text-[var(--ink)]')).toEqual({ props: { color: 'var(--ink)' }, rest: '' })
  })

  it('the named scale is untouched', () => {
    expect(tw('text-4xl').props.fontSize).toBe('var(--text-4xl)')
  })
})

describe('tracking and underline offset', () => {
  it('an arbitrary tracking value is a letter spacing', () => {
    // Wide display type is set in em so it tracks the size —
    // `tracking-[0.2em]` on a small uppercase label is the idiom.
    expect(tw('tracking-[0.2em]')).toEqual({ props: { letterSpacing: '0.2em' }, rest: '' })
    expect(tw('tracking-widest').props.letterSpacing).toBe(1.6)
  })

  it('underline offset reads, and does not shadow underline', () => {
    expect(tw('underline-offset-2')).toEqual({ props: { textUnderlineOffset: '2px' }, rest: '' })
    expect(tw('underline')).toEqual({ props: { textDecorationLine: 'underline' }, rest: '' })
    expect(tw('underline underline-offset-4')).toEqual({
      props: { textDecorationLine: 'underline', textUnderlineOffset: '4px' },
      rest: '',
    })
  })
})

describe('grid is a first-class notation, not a partial one', () => {
  // Seven of these read before; eighteen did not, which meant a layout could be
  // STARTED in grid and not finished — `grid grid-cols-3` worked while
  // `grid-flow-col auto-cols-max` beside it stayed a string on the element.
  // A notation you cannot finish a layout in is not one you can author in.

  it('both displays', () => {
    expect(tw('grid').props).toEqual({ display: 'grid' })
    expect(tw('inline-grid').props).toEqual({ display: 'inline-grid' })
  })

  it('a track list, three ways', () => {
    expect(tw('grid-cols-3').props).toEqual({
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    })
    expect(tw('grid-cols-none').props).toEqual({ gridTemplateColumns: 'none' })
    // A class name cannot hold a space, so Tailwind writes the list with
    // underscores. `1fr auto` is the commonest real template there is.
    expect(tw('grid-cols-[1fr_auto]').props).toEqual({ gridTemplateColumns: '1fr auto' })
    expect(tw('grid-rows-[auto_1fr]').props).toEqual({ gridTemplateRows: 'auto 1fr' })
  })

  it('an escaped underscore stays an underscore', () => {
    // It has to, or a custom property name inside a template loses its shape.
    expect(tw('grid-cols-[var(--a\\_b)]').props).toEqual({
      gridTemplateColumns: 'var(--a_b)',
    })
  })

  it('implicit tracks — the property that makes a grid row behave like a flex row', () => {
    // `grid-flow-col` alone gives every child an equal 1fr share, so a row of
    // buttons comes out stretched. `auto-cols-max` sizes each track to its own
    // content, which is what a flex row does and what the caller meant.
    expect(tw('grid-flow-col').props).toEqual({ gridAutoFlow: 'column' })
    expect(tw('grid-flow-row-dense').props).toEqual({ gridAutoFlow: 'row dense' })
    expect(tw('auto-cols-max').props).toEqual({ gridAutoColumns: 'max-content' })
    expect(tw('auto-cols-fr').props).toEqual({ gridAutoColumns: 'minmax(0, 1fr)' })
    expect(tw('auto-rows-min').props).toEqual({ gridAutoRows: 'min-content' })
  })

  it('placement by line, including from the end', () => {
    expect(tw('col-start-2').props).toEqual({ gridColumnStart: 2 })
    expect(tw('col-end-3').props).toEqual({ gridColumnEnd: 3 })
    // -1 is the last line, which is how a cell reaches the end of a row whose
    // track count is not known where the class is written.
    expect(tw('col-end--1').props).toEqual({ gridColumnEnd: -1 })
    expect(tw('row-start-auto').props).toEqual({ gridRowStart: 'auto' })
  })

  it('place-* sets both axes, which is the grid way to centre', () => {
    expect(tw('place-items-center').props).toEqual({
      alignItems: 'center', justifyItems: 'center',
    })
    expect(tw('place-content-between').props).toEqual({
      alignContent: 'space-between', justifyContent: 'space-between',
    })
    expect(tw('justify-items-start').props).toEqual({ justifyItems: 'flex-start' })
  })

  it('a vertical stack is the same layout in either notation', () => {
    // This is the swap that covers most of an app: a flex column with a gap and
    // a grid with a gap put the same children in the same places.
    const flex = tw('flex flex-col gap-4').props
    const grid = tw('grid gap-4').props
    expect(flex.gap).toBe(grid.gap)
    expect(flex.display).toBe('flex')
    expect(grid.display).toBe('grid')
  })
})

describe('bg- is a colour or a background sub-property', () => {
  // Only the value says which, and the colour branch was taking everything.
  // `bg-clip-text` returned `backgroundColor: var(--clip-text)` — a variable
  // nothing declares — so background-clip was never set.
  it('clip, with the prefix Safari still wants', () => {
    expect(tw('bg-clip-text').props).toEqual({
      backgroundClip: 'text', WebkitBackgroundClip: 'text',
    })
    expect(tw('bg-clip-border').props).toEqual({
      backgroundClip: 'border-box', WebkitBackgroundClip: 'border-box',
    })
  })

  it('origin', () => {
    expect(tw('bg-origin-content').props).toEqual({ backgroundOrigin: 'content-box' })
  })

  it('a colour is still a colour', () => {
    expect(tw('bg-background').props).toEqual({ backgroundColor: 'var(--background)' })
    expect(tw('bg-white').props).toEqual({ backgroundColor: '#fff' })
  })

  it('gradient TEXT — the whole reason clip matters', () => {
    // Without the clip the gradient paints the box instead of the glyphs, which
    // is a solid bar where a heading should be.
    const t = tw('bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent')
    expect(t.props.backgroundImage).toContain('linear-gradient(to right')
    expect(t.props.backgroundClip).toBe('text')
    expect(t.props.color).toBe('transparent')
    expect(t.rest).toBe('')
  })
})

describe('a named size carries a line height that resolves', () => {
  it('falls back to normal, because nothing declares the pair', () => {
    // Measured: dist/theme.css declares ZERO `--text-*--line-height` variables.
    // Without the fallback every named size resolved to an undefined custom
    // property, the declaration was dropped, and the element kept the fixed
    // leading gui had already put on it — a 48px heading in a 20px box, at
    // every size, everywhere.
    for (const s of ['sm', 'base', 'lg', '4xl', '7xl']) {
      expect(tw(`text-${s}`).props.lineHeight).toBe(`var(--text-${s}--line-height, normal)`)
    }
  })
})

describe('a numbered leading is a length, and says so', () => {
  it('carries px, because a bare number is a ratio', () => {
    // Emitted bare, `leading-8` was read as a 32x MULTIPLIER: a 15px paragraph
    // got a 480px line box and two lines stood 960px tall. Measured on
    // lux/mint, where it opened a 700px hole that read as a layout problem
    // rather than a unit one.
    expect(tw('leading-8').props).toEqual({ lineHeight: '32px' })
    expect(tw('leading-6').props).toEqual({ lineHeight: '24px' })
  })

  it('a NAMED step is genuinely a ratio and stays unitless', () => {
    expect(tw('leading-tight').props).toEqual({ lineHeight: '1.25' })
    expect(tw('leading-none').props).toEqual({ lineHeight: '1' })
  })

  it('an arbitrary value is passed through as written', () => {
    expect(tw('leading-[1.7]').props).toEqual({ lineHeight: '1.7' })
    expect(tw('leading-[28px]').props).toEqual({ lineHeight: '28px' })
  })
})
