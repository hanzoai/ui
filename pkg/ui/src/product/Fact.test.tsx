// @vitest-environment jsdom

/**
 * Fact's two shapes: the property row, unchanged, and the record kit's metric
 * row — no rule, a 24px floor, the label quiet beside its icon, and a ring the
 * value labels when there is progress to show.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Fact } from './Fact'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('Fact', () => {
  it('the row keeps its rule', () => {
    expect(html(<Fact label="Region" value="us-east" />)).toMatch(/_borderBottomWidth-1px/)
  })

  it('metric: no rule, 24 tall, a quiet label and the value at the end', () => {
    const markup = html(<Fact variant="metric" label="Usage" value="$4.20" startIcon={<i data-icon />} />)
    const row = markup.match(/<div[^>]*data-variant="metric"[^>]*>/)?.[0] ?? ''
    expect(row).toMatch(/_minH-24px/)
    expect(row).not.toMatch(/_borderBottomWidth-1px/)
    expect(markup.indexOf('data-icon')).toBeLessThan(markup.indexOf('Usage'))
    expect(markup.indexOf('Usage')).toBeLessThan(markup.indexOf('$4.20'))
    expect(markup).not.toContain('progress-ring')
  })

  it('metric with progress draws the small ring, labelled by the value and named for the reader', () => {
    const markup = html(<Fact variant="metric" label="Context window" value="12k / 200k" progress={6} progressValueText="6%" />)
    expect(markup).toContain('data-slot="progress-ring"')
    expect(markup).toMatch(/<svg width="14"/)
    expect(markup).toContain('aria-label="Context window: 6%"')
  })
})
