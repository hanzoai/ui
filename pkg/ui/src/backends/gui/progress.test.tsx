// @vitest-environment jsdom

/**
 * Progress in its two shapes, the dot loader and the ring, on compiled markup.
 *
 * `pill` is asserted UNCHANGED (the 8px rounded bar on the edge track with the
 * soft fill), because UsageMeter and every app call site render it today. The
 * record kit's `line` is square, trackless, inked and never a sliver; `null` is
 * the sweep on either. The ring is a progressbar with its value, its dash and
 * its label, and the indeterminate one turns.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Progress } from './progress'
import { ProgressRing } from './progress-ring'
import { Spinner } from './spinner'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
const tag = (markup: string, slot: string) => markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Progress', () => {
  it('pill, the default, is the bar it always was', () => {
    const markup = html(<Progress value={40} />)
    const track = tag(markup, 'progress')
    expect(track).toContain('data-variant="pill"')
    expect(track).toMatch(/_height-8px/)
    expect(track).toMatch(/_bg-edge/)
    expect(tag(markup, 'progress-indicator')).toMatch(/_bg-soft/)
  })

  it('line: square ends, no track, the ink as fill, its width the value', () => {
    const markup = html(<Progress value={40} variant="line" />)
    const track = tag(markup, 'progress')
    expect(track).toMatch(/_bg-transparent/)
    expect(track).toMatch(/_btlr-0px/)
    const bar = tag(markup, 'progress-indicator')
    expect(bar).toMatch(/_bg-ink/)
    expect(bar).toMatch(/style="width:40%/)
  })

  it('line: a value strictly between 0 and 100 never draws narrower than min(12px, 50%)', () => {
    expect(tag(html(<Progress value={1} variant="line" />), 'progress-indicator')).toMatch(/_minW-min12px/)
    expect(tag(html(<Progress value={0} variant="line" />), 'progress-indicator')).not.toMatch(/_minW-min12px/)
  })

  it('line: sm is 6px; round ends and a track on request', () => {
    const track = tag(html(<Progress value={50} variant="line" size="sm" ends="round" track />), 'progress')
    expect(track).toMatch(/_height-6px/)
    expect(track).toMatch(/_bg-edge/)
  })

  it('null sweeps a quarter-width bar on either shape, and the bar says it is indeterminate', () => {
    for (const variant of ['pill', 'line'] as const) {
      const markup = html(<Progress value={null} variant={variant} />)
      const bar = tag(markup, 'progress-indicator')
      expect(bar).toContain('data-motion="sweep"')
      expect(bar).toMatch(/_width-2537/)
      expect(tag(markup, 'progress')).not.toMatch(/aria-valuenow/)
    }
  })

  it('a caller’s height still wins, as UsageMeter’s 4px does', () => {
    expect(tag(html(<Progress value={10} height={4} />), 'progress')).toMatch(/_height-4px/)
  })
})

describe('ProgressRing', () => {
  it('is a progressbar with its value, 16px with a 2px stroke, dashed to the value', () => {
    const markup = html(<ProgressRing value={50} aria-label="Sync" />)
    const ring = tag(markup, 'progress-ring')
    expect(ring).toMatch(/role="progressbar"/)
    expect(ring).toMatch(/aria-valuenow="50"/)
    expect(ring).toMatch(/aria-label="Sync"/)
    expect(markup).toMatch(/<svg width="16" height="16"/)
    // r = (16 - 2) / 2 = 7, circumference 43.98…, half of it left.
    const offset = Number(markup.match(/stroke-dashoffset="([\d.]+)"/)?.[1])
    expect(offset).toBeCloseTo(Math.PI * 7, 3)
    expect(markup).toContain('stroke="var(--primary)"')
    expect(markup).toContain('stroke="var(--rim)"')
  })

  it('sm is 14px; 0% draws a square cap, so no dot sits at 12 o’clock', () => {
    const markup = html(<ProgressRing value={0} size="sm" aria-label="x" />)
    expect(markup).toMatch(/<svg width="14" height="14"/)
    expect(markup).toContain('stroke-linecap="butt"')
  })

  it('null shows a quarter and turns, with no value to announce', () => {
    const markup = html(<ProgressRing value={null} aria-label="Working" />)
    expect(markup).toContain('data-motion="orbit"')
    expect(tag(markup, 'progress-ring')).not.toMatch(/aria-valuenow/)
  })

  it('its children are a label left of the ring, and name it', () => {
    const markup = html(<ProgressRing value={40}>40%</ProgressRing>)
    const id = tag(markup, 'progress-ring').match(/aria-labelledby="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()
    expect(markup).toContain(`id="${id}"`)
    expect(markup.indexOf('40%')).toBeLessThan(markup.indexOf('<svg'))
  })
})

describe('Spinner dot', () => {
  it('is a 24×12 pill with a travelling 8px dot, hidden from assistive technology', () => {
    const markup = html(<Spinner variant="dot" />)
    const pill = tag(markup, 'spinner')
    expect(pill).toContain('data-variant="dot"')
    expect(pill).toContain('aria-hidden')
    expect(pill).toMatch(/_width-24px/)
    expect(pill).toMatch(/_height-12px/)
    expect(markup).toMatch(/data-motion="hop"/)
  })

  it('the arc stays the default', () => {
    expect(tag(html(<Spinner />), 'spinner')).not.toContain('data-variant="dot"')
  })
})
