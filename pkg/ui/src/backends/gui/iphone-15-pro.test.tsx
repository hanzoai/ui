// @vitest-environment jsdom

/**
 * IPhone15Pro is a static frame: no interaction to assert, so the coverage is
 * that every variant and color reaches the markup as its own `data-` value,
 * that the three sizes are three different widths/heights, and that children
 * land inside the screen rather than beside the bezel.
 *
 * Imports `./iphone-15-pro` directly rather than the backend barrel: the
 * barrel pulls the whole surface in, and a test for one component should not
 * fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { IPhone15Pro, type IPhone15ProColor, type IPhone15ProVariant } from './iphone-15-pro'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

const SIZE: Record<IPhone15ProVariant, { width: number; height: number }> = {
  default: { width: 393, height: 852 },
  'pro-max': { width: 430, height: 932 },
  mini: { width: 360, height: 780 },
}

describe('IPhone15Pro', () => {
  it('renders the frame, the island, the screen and every side button with defaults', () => {
    const markup = html(<IPhone15Pro />)

    expect(tag(markup, 'iphone-15-pro')).not.toBe('')
    expect(markup).toContain('data-variant="default"')
    expect(markup).toContain('data-color="black"')
    expect(tag(markup, 'iphone-15-pro-island')).not.toBe('')
    expect(tag(markup, 'iphone-15-pro-screen')).not.toBe('')
    expect(tag(markup, 'iphone-15-pro-mute')).not.toBe('')
    expect(tag(markup, 'iphone-15-pro-volume-up')).not.toBe('')
    expect(tag(markup, 'iphone-15-pro-volume-down')).not.toBe('')
    expect(tag(markup, 'iphone-15-pro-power')).not.toBe('')
  })

  it('sizes the frame on the default/pro-max/mini ladder', () => {
    for (const variant of Object.keys(SIZE) as IPhone15ProVariant[]) {
      const markup = html(<IPhone15Pro variant={variant} />)
      const frame = tag(markup, 'iphone-15-pro')

      expect(frame, variant).toContain(`data-variant="${variant}"`)
      expect(cls(frame, 'width'), variant).toBe(`_width-${SIZE[variant].width}px`)
      expect(cls(frame, 'height'), variant).toBe(`_height-${SIZE[variant].height}px`)
    }
  })

  it('defaults a null variant to default', () => {
    const frame = tag(html(<IPhone15Pro variant={null} />), 'iphone-15-pro')

    expect(frame).toContain('data-variant="default"')
    expect(cls(frame, 'width')).toBe('_width-393px')
  })

  it('carries every documented finish as its own data-color', () => {
    for (const color of ['black', 'white', 'blue', 'natural'] as IPhone15ProColor[]) {
      const markup = html(<IPhone15Pro color={color} />)
      expect(markup, color).toContain(`data-color="${color}"`)
    }
  })

  it('defaults a null color to black', () => {
    expect(tag(html(<IPhone15Pro color={null} />), 'iphone-15-pro')).toContain(
      'data-color="black"',
    )
  })

  it('renders children inside the screen, not beside the bezel', () => {
    const markup = html(
      <IPhone15Pro>
        <div data-testid="app">Hello</div>
      </IPhone15Pro>,
    )
    const screen = tag(markup, 'iphone-15-pro-screen')
    const screenStart = markup.indexOf(screen)
    const childIndex = markup.indexOf('Hello')

    expect(screen).not.toBe('')
    expect(childIndex).toBeGreaterThan(screenStart)
  })

  it('clips the screen to a rounded rect', () => {
    const screen = tag(html(<IPhone15Pro />), 'iphone-15-pro-screen')

    expect(cls(screen, 'ox')).toBe('_ox-hidden')
    expect(cls(screen, 'oy')).toBe('_oy-hidden')
  })
})
