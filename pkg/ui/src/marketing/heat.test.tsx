// @vitest-environment jsdom

/**
 * The heatmap and the sparkline, asserted on compiled markup and on the pure
 * parts that decide it: the window's days, the quartile cuts, the shades, the
 * columns. A grid with nothing in it draws nothing.
 */
import { GuiProvider } from '@hanzo/gui'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import config from '../gui-config'
import {
  cuts,
  Heatmap,
  monthLabels,
  shade,
  span,
  Sparkline,
  weeks,
} from './heat'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>
  )

describe('the window', () => {
  it('lists each day once, the ends included, and nothing for a window turned round', () => {
    expect(span('2026-10-24', '2026-10-26')).toEqual([
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ])
    expect(span('2025-10-27', '2026-10-26')).toHaveLength(365)
    expect(span('2026-10-26', '2026-10-24')).toEqual([])
  })

  it('cuts the shades at the quartiles of the days that had a count', () => {
    const days = Object.fromEntries([
      ...Array.from({ length: 8 }, (_, i) => [`d${i}`, i + 1]),
      ['quiet', 0],
    ])
    const cut = cuts(days)
    expect(cut).toEqual([3, 5, 7])
    expect([0, 1, 3, 4, 5, 6, 7, 8].map((n) => shade(n, cut))).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4,
    ])
    expect(cuts({})).toEqual([0, 0, 0])
  })

  it('stands the weeks Sunday first, each seven days, the days outside the window unseen', () => {
    // 2026-10-26 is a Monday: the first column starts on the Sunday before it.
    const w = weeks({ '2026-10-26': 4 }, '2026-10-26', '2026-10-31')
    expect(w).toHaveLength(1)
    expect(w[0].map((c) => c.day)[0]).toBe('2026-10-25')
    expect(w[0].map((c) => c.shown)).toEqual([
      false,
      true,
      true,
      true,
      true,
      true,
      true,
    ])
    expect(w[0][1]).toMatchObject({ day: '2026-10-26', count: 4, level: 1 })
  })
})

describe('the month labels', () => {
  it('name a month over the first week with its first seven days, and run no two together', () => {
    // The window opens on Oct 27: its first column is Oct 25, and Nov 1 is the next, so Oct is not named.
    const grid = weeks({ '2026-10-27': 1 }, '2026-10-27', '2026-11-21')
    expect(monthLabels(grid, '2026-10-27', 'en-US')).toEqual(['', 'Nov', '', ''])
  })

  it('name the first column when its month has room before the next', () => {
    const grid = weeks({ '2026-10-04': 1 }, '2026-10-04', '2026-11-21')
    const labels = monthLabels(grid, '2026-10-04', 'en-US')
    expect(labels[0]).toBe('Oct')
    expect(labels.filter(Boolean)).toEqual(['Oct', 'Nov'])
  })
})

describe('Heatmap', () => {
  const days = { '2026-10-26': 4, '2026-10-27': 9 }

  it('is one image named for a reader who cannot see it, with a cell for each day shown', () => {
    const out = html(
      <Heatmap
        days={days}
        from="2026-10-26"
        to="2026-10-30"
        label="Commits a day"
        rest="from the 26th"
      />
    )
    expect(out).toContain('data-slot="heatmap"')
    expect(out).toMatch(
      /role="img"[^>]*aria-label="Commits a day"|aria-label="Commits a day"[^>]*role="img"/
    )
    expect(out.match(/data-day="/g)).toHaveLength(5)
    expect(out).toContain('from the 26th')
  })

  it('draws a legend only when it is given the two ends', () => {
    expect(
      html(<Heatmap days={days} from="2026-10-26" to="2026-10-30" label="x" />)
    ).not.toContain('Less')
    expect(
      html(
        <Heatmap
          days={days}
          from="2026-10-26"
          to="2026-10-30"
          label="x"
          legend={{ less: 'Less', more: 'More' }}
        />
      )
    ).toContain('More')
  })

  it('draws nothing when no day had a count', () => {
    expect(
      html(<Heatmap days={{}} from="2026-10-26" to="2026-10-30" label="x" />)
    ).not.toContain('data-slot="heatmap"')
    expect(
      html(
        <Heatmap
          days={{ '2026-10-26': 0 }}
          from="2026-10-26"
          to="2026-10-30"
          label="x"
        />
      )
    ).not.toContain('data-slot="heatmap"')
  })

  it('names months over the first week to hold the first seven days of one', () => {
    const out = html(
      <Heatmap
        days={{ '2026-10-26': 1 }}
        from="2026-10-04"
        to="2026-11-15"
        label="x"
        locale="en-US"
      />
    )
    expect(out).toContain('Oct')
    expect(out).toContain('Nov')
  })
})

describe('Sparkline', () => {
  it('draws one bar a value, the tallest full height', () => {
    const out = html(
      <Sparkline values={[1, 2, 4]} label="A week" height={40} />
    )
    expect(out).toContain('data-slot="sparkline"')
    expect(out).toContain('aria-label="A week"')
    expect(out).toMatch(/height:100%|_height-100/)
  })

  it('draws nothing for no values or a run of zeros', () => {
    expect(html(<Sparkline values={[]} label="x" />)).not.toContain(
      'data-slot="sparkline"'
    )
    expect(html(<Sparkline values={[0, 0]} label="x" />)).not.toContain(
      'data-slot="sparkline"'
    )
  })
})
