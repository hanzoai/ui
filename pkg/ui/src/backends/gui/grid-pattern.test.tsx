// @vitest-environment jsdom

/**
 * GridPattern's contract: which mark each variant tiles, that fade wires a
 * mask to the tile rect, that a gradient paints a second tinted rect, that
 * animation and offset become the transforms the pattern promises, that
 * maxArea caps the rect it draws, and that the presets are ready to spread.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { GridPattern, GridPatternPresets } from './grid-pattern'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slotName: string) =>
  markup.match(new RegExp(`<[a-z]+[^>]*data-slot="${slotName}"[^>]*/?>`))?.[0] ?? ''

describe('GridPattern', () => {
  it('renders an absolutely-positioned, non-interactive svg tile', () => {
    const markup = html(<GridPattern />)
    expect(tag(markup, 'grid-pattern')).not.toBe('')
    expect(tag(markup, 'grid-pattern-svg')).not.toBe('')
    expect(tag(markup, 'grid-pattern-tiles')).not.toBe('')
  })

  it('draws a circle for dots, sized to half the tile', () => {
    const markup = html(<GridPattern variant="dots" size={10} />)
    expect(markup).toMatch(/<circle[^>]*r="5"/)
  })

  it('draws two lines spanning the full gap, so adjoining tiles meet into one grid', () => {
    const markup = html(<GridPattern variant="lines" gap={30} size={4} strokeWidth={2} />)
    const lines = [...markup.matchAll(/<line[^>]*>/g)].map((m) => m[0])
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/x1="0"[^>]*y1="0"[^>]*x2="0"[^>]*y2="30"/)
    expect(lines[1]).toMatch(/x1="0"[^>]*y1="0"[^>]*x2="30"[^>]*y2="0"/)
    for (const line of lines) expect(line).toContain('stroke-width="2"')
  })

  it('draws two lines through the tile center for crosses', () => {
    const markup = html(<GridPattern variant="crosses" size={20} />)
    expect(markup).toMatch(/<line[^>]*x1="10"[^>]*y1="0"[^>]*x2="10"[^>]*y2="20"/)
    expect(markup).toMatch(/<line[^>]*x1="0"[^>]*y1="10"[^>]*x2="20"[^>]*y2="10"/)
  })

  it('draws one path for plus, through the tile center both ways', () => {
    const markup = html(<GridPattern variant="plus" size={20} />)
    expect(markup).toMatch(/<path[^>]*d="M 10 0 L 10 20 M 0 10 L 20 10"/)
  })

  it('draws an unfilled rect outline for squares', () => {
    const markup = html(<GridPattern variant="squares" size={12} />)
    expect(markup).toMatch(/<rect[^>]*width="12"[^>]*height="12"[^>]*fill="none"/)
  })

  it('normalizes a numeric size and gap to both axes', () => {
    const markup = html(<GridPattern size={6} gap={15} />)
    expect(markup).toMatch(/<pattern[^>]*width="15"[^>]*height="15"/)
    expect(markup).toMatch(/<circle[^>]*r="3"/)
  })

  it('keeps independent x/y size and gap when given as objects', () => {
    const markup = html(<GridPattern variant="squares" size={{ width: 8, height: 4 }} gap={{ x: 40, y: 20 }} />)
    expect(markup).toMatch(/<pattern[^>]*width="40"[^>]*height="20"/)
    expect(markup).toMatch(/<rect[^>]*width="8"[^>]*height="4"/)
  })

  it('has no mask until fade is set, and wires one to the tile rect once it is', () => {
    const plain = html(<GridPattern />)
    expect(tag(plain, 'grid-pattern-tiles')).not.toContain('mask=')

    const faded = html(<GridPattern fade="edges" />)
    const rect = tag(faded, 'grid-pattern-tiles')
    const maskId = rect.match(/mask="url\(#([^)]+)\)"/)?.[1]
    expect(maskId).toBeTruthy()
    expect(faded).toContain(`<linearGradient id="${maskId}"`)
  })

  it('fades edges through a linearGradient, and center/radial through a radialGradient', () => {
    expect(html(<GridPattern fade="edges" />)).toMatch(/<linearGradient/)
    expect(html(<GridPattern fade={true} />)).toMatch(/<linearGradient/)
    expect(html(<GridPattern fade="radial" />)).toMatch(/<radialGradient/)
    expect(html(<GridPattern fade="center" />)).toMatch(/<radialGradient/)
  })

  it('shapes the edge fade transparent-opaque-opaque-transparent', () => {
    const markup = html(<GridPattern fade="edges" />)
    const stops = [...markup.matchAll(/<stop[^>]*offset="([^"]+)"[^>]*stop-opacity="([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ])
    expect(stops).toEqual([
      ['0%', '0'],
      ['10%', '1'],
      ['90%', '1'],
      ['100%', '0'],
    ])
  })

  it('paints a second, tinted rect only when a gradient is given', () => {
    expect(html(<GridPattern />)).not.toContain('grid-pattern-tint')

    const markup = html(<GridPattern gradient={{ from: '#ff0080', via: '#7928ca', to: '#0070f3', opacity: 0.3 }} />)
    const tint = tag(markup, 'grid-pattern-tint')
    expect(tint).toContain('opacity="0.3"')
    expect(markup).toMatch(/<stop[^>]*offset="0%"[^>]*stop-color="#ff0080"/)
    expect(markup).toMatch(/<stop[^>]*offset="50%"[^>]*stop-color="#7928ca"/)
    expect(markup).toMatch(/<stop[^>]*offset="100%"[^>]*stop-color="#0070f3"/)
  })

  it('caps the drawn area to maxArea instead of filling 100%', () => {
    const markup = html(<GridPattern maxArea={{ width: 300, height: 150 }} />)
    expect(tag(markup, 'grid-pattern-tiles')).toContain('width="300"')
    expect(tag(markup, 'grid-pattern-tiles')).toContain('height="150"')
  })

  it('shifts the svg by the given offset', () => {
    const markup = html(<GridPattern offset={{ x: 5, y: -10 }} />)
    expect(tag(markup, 'grid-pattern-svg')).toMatch(/translate\(5px, -10px\)/)
  })

  it('sets no animation by default, and one named grid-pattern-move once animation is given', () => {
    const still = tag(html(<GridPattern />), 'grid-pattern')
    expect(still).not.toContain('animation')

    const moving = tag(html(<GridPattern gap={25} animation={{ duration: 12, timing: 'ease-in-out', direction: 'alternate' }} />), 'grid-pattern')
    expect(moving).toContain('animation-name:grid-pattern-move')
    expect(moving).toContain('animation-duration:12s')
    expect(moving).toContain('animation-timing-function:ease-in-out')
    expect(moving).toContain('animation-direction:alternate')
    expect(moving).toContain('--grid-pattern-x:25px')
    expect(moving).toContain('--grid-pattern-y:25px')
  })

  it('hoists the keyframe once, guarded for reduced motion', () => {
    const markup = html(
      <>
        <GridPattern animation={{}} />
        <GridPattern animation={{}} />
      </>,
    )
    const sheets = [...markup.matchAll(/<style[^>]*>[^<]*<\/style>/g)].filter((m) => m[0].includes('grid-pattern-move'))
    expect(sheets).toHaveLength(1)
    expect(sheets[0][0]).toMatch(/@keyframes grid-pattern-move\b/)
    expect(sheets[0][0]).toMatch(/prefers-reduced-motion: reduce/)
  })

  it('gives every instance its own pattern id, so two grids never collide', () => {
    const markup = html(
      <>
        <GridPattern />
        <GridPattern />
      </>,
    )
    const ids = [...markup.matchAll(/<pattern id="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(ids).size).toBe(2)
  })

  it('ships presets that spread straight into the component', () => {
    expect(GridPatternPresets.dotMatrix).toMatchObject({ variant: 'dots', size: 3, gap: 30 })
    expect(GridPatternPresets.blueprint).toMatchObject({ variant: 'lines', color: '#3b82f6' })
    expect(GridPatternPresets.graph).toMatchObject({ fade: 'edges' })

    const markup = html(<GridPattern {...GridPatternPresets.hexagon} />)
    expect(markup).toMatch(/<pattern[^>]*width="30"[^>]*height="26"/)
  })
})
