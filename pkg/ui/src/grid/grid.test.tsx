// @vitest-environment jsdom
/**
 * Unit tests for `@hanzo/ui/grid` native CSS `display: grid` layout primitives:
 * `Grid`, `AutoGrid`, `BentoGrid`, `SplitGrid`, `GridItem`, `Cell`, and pure
 * CSS token / track helpers.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AutoGrid,
  autoGridTracks,
  BentoGrid,
  Cell,
  formatAreas,
  formatSpan,
  Grid,
  GridItem,
  resolveDensity,
  resolveSpace,
  SplitGrid,
  splitTracks,
  tracks,
} from './index'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  act(() => {
    root = createRoot(host)
  })
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (el: React.ReactElement): HTMLElement => {
  act(() => {
    root.render(el)
  })
  return host.firstElementChild as HTMLElement
}

describe('CSS token & track helpers', () => {
  it('resolves @hanzo/design --space-* tokens with live --hz-density / --density fallback', () => {
    expect(resolveSpace('$4')).toBe('var(--space-4, calc(1rem * var(--hz-density, var(--density, 1))))')
    expect(resolveSpace('$6')).toBe('var(--space-6, calc(1.5rem * var(--hz-density, var(--density, 1))))')
    expect(resolveSpace('$0')).toBe('0px')
    expect(resolveSpace('none')).toBe('0px')
    expect(resolveSpace('md')).toBe('var(--space-4, calc(1rem * var(--hz-density, var(--density, 1))))')
    expect(resolveSpace('tight')).toContain('--grid-gap-tight')
    expect(resolveSpace('default')).toContain('--grid-gap')
    expect(resolveSpace('loose')).toContain('--grid-gap-loose')
    expect(resolveSpace(16)).toBe('16px')
    expect(resolveSpace(0)).toBe('0px')
    expect(resolveSpace('1.25rem')).toBe('1.25rem')
  })

  it('resolves density presets and numeric multipliers', () => {
    expect(resolveDensity('compact')).toBe('0.85')
    expect(resolveDensity('comfortable')).toBe('1')
    expect(resolveDensity('spacious')).toBe('1.15')
    expect(resolveDensity(0.75)).toBe('0.75')
  })

  it('compiles AutoGrid tracks using repeat(auto-fit, minmax(min(100%, <minWidth>), 1fr))', () => {
    expect(autoGridTracks(260)).toBe('repeat(auto-fit, minmax(min(100%, 260px), 1fr))')
    expect(autoGridTracks('18rem')).toBe('repeat(auto-fit, minmax(min(100%, 18rem), 1fr))')
    expect(autoGridTracks(220, { maxCols: 4, gap: '16px' })).toBe(
      'repeat(auto-fit, minmax(max(min(100%, 220px), calc((100% - 3 * 16px) / 4)), 1fr))',
    )
    expect(autoGridTracks(240, { mode: 'auto-fill' })).toBe(
      'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
    )
  })

  it('compiles SplitGrid tracks using native minmax() for sidebar/main and ratios', () => {
    expect(splitTracks()).toBe('minmax(min(100%, 220px), 280px) minmax(0, 1fr)')
    expect(splitTracks({ sidebar: 280 })).toBe('minmax(min(100%, 280px), 280px) minmax(0, 1fr)')
    expect(splitTracks({ sidebar: [220, 340], minMain: 400 })).toBe(
      'minmax(min(100%, 220px), 340px) minmax(min(100%, 400px), 1fr)',
    )
    expect(splitTracks({ sidebar: 300, side: 'right' })).toBe(
      'minmax(0, 1fr) minmax(min(100%, 300px), 300px)',
    )
    expect(splitTracks({ ratio: 'golden' })).toBe('minmax(0, 38.2%) minmax(0, 61.8%)')
    expect(splitTracks({ ratio: '1:2' })).toBe('minmax(0, 1fr) minmax(0, 2fr)')
  })

  it('formats grid-template-areas and spans cleanly', () => {
    expect(formatAreas(['header header', 'sidebar main'])).toBe('"header header" "sidebar main"')
    expect(formatAreas('"a b" "c d"')).toBe('"a b" "c d"')
    expect(formatSpan(2)).toBe('span 2')
    expect(formatSpan('full')).toBe('1 / -1')
    expect(formatSpan('2 / 4')).toBe('2 / 4')
    expect(formatSpan(undefined)).toBeUndefined()
  })

  it('preserves tracks() backwards compatibility', () => {
    expect(tracks(3)).toBe('repeat(3, minmax(0, 1fr))')
    expect(tracks({ min: 240 })).toBe('repeat(auto-fill, minmax(min(240px, 100%), 1fr))')
  })
})

describe('Grid', () => {
  it('renders native display: grid with explicit columns, rows, gaps, areas, align, and justify', () => {
    const el = mount(
      <Grid
        as="section"
        cols={3}
        rows={2}
        rowGap="$2"
        colGap="$6"
        areas={['header header header', 'sidebar main main']}
        align="center"
        justify="stretch"
        density="compact"
      >
        <div>A</div>
        <div>B</div>
      </Grid>,
    )

    expect(el.tagName).toBe('SECTION')
    expect(el.getAttribute('data-slot')).toBe('grid')
    expect(el.style.display).toBe('grid')
    expect(el.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(el.style.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))')
    expect(el.style.gap).toBe('')
    expect(el.style.rowGap).toContain('--space-2')
    expect(el.style.columnGap).toContain('--space-6')
    expect(el.style.gridTemplateAreas).toContain('"header header header"')
    expect(el.style.alignItems).toBe('center')
    expect(el.style.justifyItems).toBe('stretch')
    expect(el.style.getPropertyValue('--hz-density')).toBe('0.85')
    expect(el.style.getPropertyValue('--density')).toBe('0.85')
    // Floors direct element children at min-width: 0 to prevent ragged overflow
    expect((el.children[0] as HTMLElement).style.minWidth).toBe('0px')
  })

  it('supports responsive cols via zero-JS CSS custom properties and data attributes', () => {
    const el = mount(
      <Grid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="$4">
        <div>1</div>
      </Grid>,
    )

    expect(el.hasAttribute('data-hz-grid-responsive')).toBe(true)
    expect(el.hasAttribute('data-hz-grid-sm')).toBe(true)
    expect(el.hasAttribute('data-hz-grid-md')).toBe(true)
    expect(el.hasAttribute('data-hz-grid-lg')).toBe(true)
    expect(el.hasAttribute('data-hz-grid-xl')).toBe(false)
    expect(el.style.gridTemplateColumns).toBe('var(--hz-grid-cols, repeat(1, minmax(0, 1fr)))')
    expect(el.style.getPropertyValue('--hz-grid-cols-base')).toBe('repeat(1, minmax(0, 1fr))')
    expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('repeat(2, minmax(0, 1fr))')
    expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('repeat(3, minmax(0, 1fr))')
    expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('repeat(4, minmax(0, 1fr))')
  })

  it('supports inline-grid and CSS subgrid', () => {
    const el = mount(<Grid inline subgrid="columns"><div>x</div></Grid>)
    expect(el.style.display).toBe('inline-grid')
    expect(el.style.gridTemplateColumns).toBe('subgrid')
  })
})

describe('AutoGrid', () => {
  it('renders native repeat(auto-fit, minmax(min(100%, <minWidth>), 1fr)) with ZERO ResizeObserver', () => {
    const roSpy = vi.fn()
    const prevRO = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = roSpy
    try {
      const el = mount(
        <AutoGrid minWidth={280} gap="$4">
          <div>KPI 1</div>
          <div>KPI 2</div>
          <div>KPI 3</div>
        </AutoGrid>,
      )

      expect(el.getAttribute('data-slot')).toBe('auto-grid')
      expect(el.style.display).toBe('grid')
      expect(el.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(100%, 280px), 1fr))')
      expect(el.style.gap).toContain('--space-4')
      expect(el.style.gap).toContain('--hz-density')
      expect(roSpy).not.toHaveBeenCalled()
    } finally {
      ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = prevRO
    }
  })

  it('defaults minWidth to @hanzo/design --grid-card-min and supports maxCols cap', () => {
    const el = mount(<AutoGrid maxCols={4} gap={16}><div>A</div></AutoGrid>)
    expect(el.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(max(min(100%, var(--grid-card-min, 18rem)), calc((100% - 3 * 16px) / 4)), 1fr))',
    )
  })
})

describe('BentoGrid & GridItem', () => {
  it('defaults to 12-column dashboard grid with rowHeight and GridItem colSpan/rowSpan/area', () => {
    const el = mount(
      <BentoGrid rowHeight={140} gap="$4">
        <GridItem colSpan={8} rowSpan={2} data-testid="hero">Hero Metric</GridItem>
        <GridItem colSpan={4} data-testid="side">Side KPI</GridItem>
        <GridItem colSpan="full" area="footer" data-testid="foot">Footer</GridItem>
      </BentoGrid>,
    )

    expect(el.getAttribute('data-slot')).toBe('bento-grid')
    expect(el.style.display).toBe('grid')
    expect(el.style.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))')
    expect(el.style.gridAutoRows).toBe('minmax(140px, auto)')
    expect(el.style.gridAutoFlow).toBe('')

    const hero = el.querySelector('[data-testid="hero"]') as HTMLElement
    const side = el.querySelector('[data-testid="side"]') as HTMLElement
    const foot = el.querySelector('[data-testid="foot"]') as HTMLElement

    expect(hero.getAttribute('data-slot')).toBe('grid-item')
    expect(hero.style.gridColumn).toBe('span 8')
    expect(hero.style.gridRow).toBe('span 2')
    expect(hero.style.minWidth).toBe('0px')
    expect(side.style.gridColumn).toBe('span 4')
    expect(foot.style.gridArea).toBe('footer')
    expect(foot.style.gridColumn).toBe('1 / -1')
  })

  it('opts into row dense packing only when dense={true}', () => {
    const el = mount(<BentoGrid cols={6} dense><GridItem colSpan={2}>A</GridItem></BentoGrid>)
    expect(el.style.gridTemplateColumns).toBe('repeat(6, minmax(0, 1fr))')
    expect(el.style.gridAutoFlow).toBe('row dense')
  })

  it('supports Cell backwards-compatible alias and nested subgrid on GridItem', () => {
    const el = mount(
      <Grid columns={3} rows={2}>
        <Cell col={2} row="1 / 3" data-testid="cell">Legacy Cell</Cell>
        <GridItem subgrid="rows" rowSpan={2} data-testid="sub">Subgrid Card</GridItem>
      </Grid>,
    )

    const cell = el.querySelector('[data-testid="cell"]') as HTMLElement
    expect(cell.getAttribute('data-slot')).toBe('grid-cell')
    expect(cell.style.gridColumn).toBe('span 2')
    expect(cell.style.gridRow).toBe('1 / 3')

    const sub = el.querySelector('[data-testid="sub"]') as HTMLElement
    expect(sub.style.display).toBe('grid')
    expect(sub.style.gridTemplateRows).toBe('subgrid')
  })
})

describe('SplitGrid', () => {
  it('renders native minmax() sidebar/main tracks and right-side placement', () => {
    const left = mount(
      <SplitGrid sidebar={[240, 320]} minMain={420} gap="$6">
        <aside>Nav</aside>
        <main>Detail</main>
      </SplitGrid>,
    )
    expect(left.getAttribute('data-slot')).toBe('split-grid')
    expect(left.style.display).toBe('grid')
    expect(left.style.gridTemplateColumns).toBe(
      'minmax(min(100%, 240px), 320px) minmax(min(100%, 420px), 1fr)',
    )
    expect(left.style.gap).toContain('--space-6')

    const right = mount(
      <SplitGrid sidebar={300} side="right" collapseAt="md">
        <main>Main</main>
        <aside>Inspector</aside>
      </SplitGrid>,
    )
    expect(right.getAttribute('data-hz-split-collapse')).toBe('md')
    expect(right.style.getPropertyValue('--hz-split-cols')).toBe(
      'minmax(0, 1fr) minmax(min(100%, 300px), 300px)',
    )
    expect(right.style.gridTemplateColumns).toBe(
      'var(--hz-split-cols, minmax(0, 1fr) minmax(min(100%, 300px), 300px))',
    )
  })
})
