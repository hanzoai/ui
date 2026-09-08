// @vitest-environment jsdom

/**
 * List renders a real `<ul>` of real `<li>`s, asserted on compiled markup:
 * @hanzo/gui drops an unrecognised prop with no throw, so what matters is the
 * element name and the `data-slot` markers actually reaching the DOM.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { List, ListItem } from './list'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('List', () => {
  it('renders a ul containing li rows', () => {
    const markup = html(
      <List>
        <ListItem>First item in the list</ListItem>
        <ListItem>Second item in the list</ListItem>
      </List>,
    )

    const list = tag(markup, 'list')
    expect(list.startsWith('<ul')).toBe(true)

    const items = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="list-item"[^>]*>/g)].map((m) => m[0])
    expect(items).toHaveLength(2)
    for (const item of items) expect(item.startsWith('<li')).toBe(true)

    expect(markup).toContain('First item in the list')
    expect(markup).toContain('Second item in the list')
  })

  it('forwards extra props onto the list and each row', () => {
    const markup = html(
      <List aria-label="results">
        <ListItem data-testid="row-1">One</ListItem>
      </List>,
    )

    expect(tag(markup, 'list')).toContain('aria-label="results"')
    expect(tag(markup, 'list-item')).toContain('data-testid="row-1"')
  })

  it('keeps document order across many rows', () => {
    const values = ['a', 'b', 'c', 'd']
    const markup = html(
      <List>
        {values.map((v) => (
          <ListItem key={v}>{v}</ListItem>
        ))}
      </List>,
    )

    const order = [...markup.matchAll(/>([a-d])</g)].map((m) => m[1])
    expect(order).toEqual(values)
  })
})
