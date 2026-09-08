// @vitest-environment jsdom

/**
 * Item's slot markers and variant/size attributes, asserted on compiled
 * markup — @hanzo/gui drops an unrecognised prop with no throw, so the only
 * proof a variant took is the `data-variant`/`data-size` it stamps.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from './item'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Item', () => {
  it('renders every part with its slot marker', () => {
    const markup = html(
      <Item>
        <ItemMedia />
        <ItemContent>
          <ItemTitle>Title</ItemTitle>
          <ItemDescription>Description</ItemDescription>
        </ItemContent>
        <ItemActions />
      </Item>,
    )

    for (const slot of ['item', 'item-media', 'item-content', 'item-title', 'item-description', 'item-actions']) {
      expect(tag(markup, slot)).not.toBe('')
    }
  })

  it('defaults to the default variant and size', () => {
    const item = tag(html(<Item />), 'item')

    expect(item).toContain('data-variant="default"')
    expect(item).toContain('data-size="default"')
  })

  it('stamps the variant and size it is given', () => {
    const item = tag(html(<Item variant="outline" size="sm" />), 'item')

    expect(item).toContain('data-variant="outline"')
    expect(item).toContain('data-size="sm"')
  })

  it('marks its media variant', () => {
    const media = tag(html(<ItemMedia variant="icon" />), 'item-media')

    expect(media).toContain('data-variant="icon"')
  })

  it('renders as the child element when asChild is set', () => {
    const markup = html(
      <Item asChild>
        <a href="/dashboard">
          <ItemContent>
            <ItemTitle>Dashboard</ItemTitle>
          </ItemContent>
        </a>
      </Item>,
    )
    const item = tag(markup, 'item')

    expect(item.startsWith('<a')).toBe(true)
    expect(item).toContain('href="/dashboard"')
  })

  it('renders as a plain div otherwise', () => {
    const item = tag(html(<Item />), 'item')

    expect(item.startsWith('<div')).toBe(true)
  })

  it('groups items under role list, with a separator between them', () => {
    const markup = html(
      <ItemGroup>
        <Item />
        <ItemSeparator />
        <Item />
      </ItemGroup>,
    )
    const group = tag(markup, 'item-group')

    expect(group).toContain('role="list"')
    expect(tag(markup, 'item-separator')).not.toBe('')
  })

  it('renders the header and footer, each spanning the full row', () => {
    const markup = html(
      <Item>
        <ItemHeader>Header</ItemHeader>
        <ItemFooter>Footer</ItemFooter>
      </Item>,
    )

    expect(markup).toContain('Header')
    expect(markup).toContain('Footer')
    expect(tag(markup, 'item-header')).not.toBe('')
    expect(tag(markup, 'item-footer')).not.toBe('')
  })
})
