// @vitest-environment jsdom

/**
 * SearchInput is one field box: the glyph in the row, the text beside it, and
 * any actions beside the box rather than inside it.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Density } from '../backends/gui/density'
import { SearchInput } from './Filters'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('SearchInput', () => {
  it('is an InputGroup with the magnifier in its start slot, on the sunken ground', () => {
    const markup = html(<SearchInput value="" onChange={() => {}} placeholder="Search" />)
    const group = tag(markup, 'input-group')
    expect(group).toMatch(/_height-36px/)
    expect(group).toMatch(/_bg-sunken/)
    expect(markup.indexOf('data-slot="input-group-start"')).toBeLessThan(markup.indexOf('data-slot="input"'))
    expect(tag(markup, 'input')).toContain('placeholder="Search"')
  })

  it('takes a size, and the compact density’s ground', () => {
    expect(tag(html(<SearchInput value="" onChange={() => {}} size="sm" />), 'input-group')).toMatch(/_height-32px/)
    const compact = tag(
      html(
        <Density value="compact">
          <SearchInput value="" onChange={() => {}} />
        </Density>,
      ),
      'input-group',
    )
    expect(compact).toMatch(/_bg-panel/)
    expect(compact).not.toMatch(/_bg-sunken/)
  })

  it('puts actions after the box, not inside it', () => {
    const markup = html(<SearchInput value="" onChange={() => {}} actions={<i data-action />} />)
    const close = markup.indexOf('data-action')
    expect(close).toBeGreaterThan(markup.indexOf('data-slot="input-group"'))
    // Not within the group: the group's own end slot is absent.
    expect(markup).not.toContain('data-slot="input-group-end"')
  })
})
