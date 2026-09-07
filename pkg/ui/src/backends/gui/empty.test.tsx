// @vitest-environment jsdom

/**
 * Empty's structure, asserted on the compiled markup: every slot renders,
 * `EmptyMedia` carries its variant as `data-variant`, and free-form text
 * children land inside their host rather than being dropped.
 *
 * Imports `./empty` directly rather than the backend barrel, the same reason
 * `accordion.test.tsx` does.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Empty', () => {
  it('renders header, media, title, description and content', () => {
    const markup = html(
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">*</EmptyMedia>
          <EmptyTitle>No data</EmptyTitle>
          <EmptyDescription>No data found</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>Add data</EmptyContent>
      </Empty>,
    )

    expect(tag(markup, 'empty')).not.toBe('')
    expect(tag(markup, 'empty-header')).not.toBe('')
    expect(tag(markup, 'empty-icon')).not.toBe('')
    expect(tag(markup, 'empty-title')).not.toBe('')
    expect(tag(markup, 'empty-description')).not.toBe('')
    expect(tag(markup, 'empty-content')).not.toBe('')
    expect(markup).toContain('No data</')
    expect(markup).toContain('No data found</')
    expect(markup).toContain('Add data</')
  })

  it('defaults EmptyMedia to the "default" variant and carries it as data-variant', () => {
    const markup = html(<EmptyMedia>*</EmptyMedia>)
    const media = tag(markup, 'empty-icon')

    expect(media).toContain('data-variant="default"')
  })

  it('marks EmptyMedia variant="icon" with data-variant="icon"', () => {
    const markup = html(<EmptyMedia variant="icon">*</EmptyMedia>)
    const media = tag(markup, 'empty-icon')

    expect(media).toContain('data-variant="icon"')
  })

  it('forwards extra props to the Empty frame', () => {
    const markup = html(<Empty id="empty-state" />)

    expect(tag(markup, 'empty')).toContain('id="empty-state"')
  })
})
