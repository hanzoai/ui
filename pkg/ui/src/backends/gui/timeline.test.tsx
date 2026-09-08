// @vitest-environment jsdom

/**
 * Timeline's structural contract, asserted on compiled markup: every row
 * carries `data-timeline-id`, every marker reports the status it renders for,
 * and each variant/orientation produces the row shape it claims to.
 *
 * Imports `./timeline` directly rather than the backend barrel, for the same
 * reason `accordion.test.tsx` does: a test for one component should not fail
 * because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Timeline, type TimelineItem } from './timeline'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const items: TimelineItem[] = [
  { id: 'a', title: 'Started', description: 'Kickoff', date: 'Jan 1', status: 'completed' },
  { id: 'b', title: 'Building', date: 'Feb 1', time: '9am', status: 'active' },
  { id: 'c', title: 'Ship', status: 'pending' },
]

const rows = (markup: string) => [...markup.matchAll(/data-timeline-id="([^"]+)"/g)].map((m) => m[1])

const markersFor = (markup: string) =>
  [...markup.matchAll(/data-slot="timeline-marker"[^>]*data-status="([^"]+)"/g)].map((m) => m[1])

describe('Timeline', () => {
  it('gives every item a row and reports animated off unless it opts in', () => {
    const markup = html(<Timeline items={items} animated={false} />)

    expect(rows(markup)).toEqual(['a', 'b', 'c'])
    expect(markup).toContain('data-slot="timeline"')
    expect(markup).toContain('data-animated="false"')
  })

  it('animates by default and marks the orientation and variant it rendered', () => {
    const markup = html(<Timeline items={items} />)

    expect(markup).toContain('data-animated="true"')
    expect(markup).toContain('data-orientation="vertical"')
    expect(markup).toContain('data-variant="default"')
  })

  it('marks each marker with the status it renders, in item order', () => {
    const markup = html(<Timeline items={items} animated={false} />)

    expect(markersFor(markup)).toEqual(['completed', 'active', 'pending'])
  })

  it('falls back to an unmarked marker when an item has no status', () => {
    const markup = html(<Timeline items={[{ id: 'x', title: 'No status' }]} animated={false} />)

    expect(markersFor(markup)).toEqual(['default'])
  })

  it('renders a custom icon over the status glyph', () => {
    const markup = html(
      <Timeline
        items={[{ id: 'x', title: 'Custom', status: 'completed', icon: <span data-slot="custom-icon" /> }]}
        animated={false}
      />,
    )

    expect(markup).toContain('data-slot="custom-icon"')
  })

  it('renders a caption for each documented event field', () => {
    const markup = html(<Timeline items={items} animated={false} />)

    expect(markup).toContain('Started')
    expect(markup).toContain('Kickoff')
    expect(markup).toContain('Jan 1')
    expect(markup).toContain('9am')
  })

  it('renders custom content beneath an item', () => {
    const markup = html(
      <Timeline
        items={[{ id: 'x', title: 'With content', content: <span data-slot="custom-content">extra</span> }]}
        animated={false}
      />,
    )

    expect(markup).toContain('data-slot="custom-content"')
  })

  it('renders every documented variant, one row per item', () => {
    for (const variant of ['default', 'alternate', 'compact', 'simple'] as const) {
      const markup = html(<Timeline items={items} variant={variant} animated={false} />)
      expect(rows(markup), variant).toEqual(['a', 'b', 'c'])
      expect(markup, variant).toContain(`data-variant="${variant}"`)
    }
  })

  it('renders horizontally when asked, regardless of variant', () => {
    const markup = html(<Timeline items={items} orientation="horizontal" variant="alternate" animated={false} />)

    expect(rows(markup)).toEqual(['a', 'b', 'c'])
    expect(markup).toContain('data-orientation="horizontal"')
  })

  it('starts every row invisible when animated, on the server where nothing can intersect', () => {
    const markup = html(<Timeline items={items} />)
    const opacities = [...markup.matchAll(/data-timeline-id="[^"]+"[^>]*style="([^"]*)"/g)].map((m) => m[1])

    expect(opacities.length).toBeGreaterThan(0)
    for (const style of opacities) expect(style).toContain('opacity:0')
  })
})
