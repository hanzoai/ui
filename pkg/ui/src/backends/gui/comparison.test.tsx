// @vitest-environment jsdom

/**
 * Comparison renders one column per plan, a check/cross for boolean rows and
 * text for string rows, and marks the highlighted column.
 *
 * Imports `./comparison` directly rather than the backend barrel, same reason
 * as the other component tests here: one component's test should not fail
 * because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Comparison, type ComparisonColumn } from './comparison'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const columns: ComparisonColumn[] = [
  {
    title: 'Free',
    items: [
      { label: 'Users', value: '5' },
      { label: 'Support', value: false },
    ],
  },
  {
    title: 'Pro',
    highlighted: true,
    items: [
      { label: 'Users', value: '25' },
      { label: 'Support', value: true },
    ],
  },
]

const tags = (markup: string, slot: string) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])

describe('Comparison', () => {
  it('renders one column per plan', () => {
    const markup = html(<Comparison columns={columns} />)

    expect(tags(markup, 'comparison')).toHaveLength(1)
    expect(tags(markup, 'comparison-column')).toHaveLength(2)
    expect(markup).toContain('Free')
    expect(markup).toContain('Pro')
  })

  it('renders a string value as text and marks the highlighted column', () => {
    const markup = html(<Comparison columns={columns} />)

    expect(markup).toContain('5')
    expect(markup).toContain('25')

    const cols = tags(markup, 'comparison-column')
    expect(cols[0]).not.toContain('data-highlighted')
    expect(cols[1]).toContain('data-highlighted=""')
  })

  it('renders a boolean value as a check or a cross, never both', () => {
    const markup = html(<Comparison columns={columns} />)

    expect(tags(markup, 'comparison-item-cross')).toHaveLength(1)
    expect(tags(markup, 'comparison-item-check')).toHaveLength(1)
  })

  it('lists every row inside its column, in order', () => {
    const markup = html(<Comparison columns={columns} />)
    const items = tags(markup, 'comparison-item')

    expect(items).toHaveLength(4)
  })
})
