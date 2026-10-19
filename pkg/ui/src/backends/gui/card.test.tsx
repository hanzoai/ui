// @vitest-environment jsdom

/**
 * Card density: the compact card is a frame of bands with no inset of its own;
 * a compact Density gives it to a card that names none; the regular card is
 * untouched.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Card, CardContent, CardFooter, CardHeader } from './card'
import { Density } from './density'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
const tag = (markup: string, slot: string) => markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const card = (props: Record<string, unknown> = {}) => (
  <Card {...props}>
    <CardHeader>Email</CardHeader>
    <CardContent divider>ada@acme.com</CardContent>
    <CardFooter>Synced</CardFooter>
  </Card>
)

describe('Card density', () => {
  it('compact: an 8px corner and no inset; bands at 8×16, the content well at 16 on the panel', () => {
    const markup = html(card({ density: 'compact' }))
    const root = tag(markup, 'card')
    expect(root).toContain('data-density="compact"')
    expect(root).toMatch(/_btlr-c-radius-3/)
    expect(root).toMatch(/_pt-0px/)
    const header = tag(markup, 'card-header')
    expect(header).toMatch(/_pl-16px/)
    expect(header).toMatch(/_pt-8px/)
    expect(header).toMatch(/_borderBottomWidth-1px/)
    const content = tag(markup, 'card-content')
    expect(content).toMatch(/_bg-panel/)
    expect(content).toMatch(/_borderBottomWidth-1px/)
    expect(tag(markup, 'card-footer')).toMatch(/_btw-1px/)
  })

  it('a compact Density gives it to a card that names none', () => {
    expect(tag(html(<Density value="compact">{card()}</Density>), 'card')).toContain('data-density="compact"')
  })

  it('the regular card keeps its 24px inset and 12px corner', () => {
    const root = tag(html(card()), 'card')
    expect(root).not.toContain('data-density')
    expect(root).toMatch(/_btlr-c-radius-6/)
  })
})
