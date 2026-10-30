// @vitest-environment jsdom

/**
 * The Select's box and list, at both densities. The trigger is asserted on the
 * server render; the list is portalled, so it is asserted mounted and open, on
 * the rows as they reached the document.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Density } from './density'
import { Field } from './field'
import { Picker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const picker = (size?: 'sm' | 'xs') => (
  <Select>
    <SelectTrigger size={size}>
      <SelectValue placeholder="Stage" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">A</SelectItem>
    </SelectContent>
  </Select>
)

describe('SelectTrigger', () => {
  it('regular: the 36px box with the 14px value', () => {
    const markup = html(picker())
    expect(tag(markup, 'select-trigger')).toMatch(/_minH-36px/)
    expect(tag(markup, 'select-value')).toMatch(/_fs-f-size-3/)
  })

  it('sm and xs: 32 and 24, 8px gutter, and the VALUE on the 13px rung', () => {
    for (const [size, h] of [['sm', 32], ['xs', 24]] as const) {
      const markup = html(picker(size))
      const el = tag(markup, 'select-trigger')
      expect(el).toMatch(new RegExp(`_minH-${h}px`))
      expect(el).toMatch(/_pl-8px/)
      expect(tag(markup, 'select-value')).toMatch(/_fs-f-size-2/)
    }
  })

  it('compact: the sm box on the panel ground', () => {
    const el = tag(html(<Density value="compact">{picker()}</Density>), 'select-trigger')
    expect(el).toMatch(/_minH-32px/)
    expect(el).toMatch(/_bg-panel/)
  })

  it('takes the error edge from aria-invalid or from its Field', () => {
    expect(tag(html(<Field invalid>{picker()}</Field>), 'select-trigger')).toMatch(/_btc-red7/)
    const own = tag(
      html(
        <Select>
          <SelectTrigger aria-invalid>
            <SelectValue placeholder="x" />
          </SelectTrigger>
        </Select>,
      ),
      'select-trigger',
    )
    expect(own).toMatch(/_btc-red7/)
  })
})

describe('Picker', () => {
  it('follows the density, with the record line', () => {
    const el = tag(
      html(
        <Density value="compact">
          <Picker aria-label="x" defaultValue="a">
            <option value="a">A</option>
          </Picker>
        </Density>,
      ),
      'picker',
    )
    expect(el).toMatch(/_minH-32px/)
    expect(el).toMatch(/_lh-16px/)
    expect(el).toMatch(/_bg-panel/)
  })
})

describe('Picker placeholder', () => {
  const options = (markup: string) => markup.match(/<option[^>]*>[^<]*<\/option>/g) ?? []

  it('shows the hint dim while nothing is chosen, and every choice at full ink', () => {
    const markup = html(
      <Picker aria-label="Team size" placeholder="Choose" value="" onChange={() => {}}>
        <option value="1">Just me</option>
        <option value="10">2-10</option>
      </Picker>,
    )
    expect(tag(markup, 'picker')).toMatch(/_col-placeholder/)
    const [hint, ...rest] = options(markup)
    expect(hint).toMatch(/value=""/)
    expect(hint).toMatch(/disabled/)
    expect(hint).toMatch(/>Choose</)
    expect(rest).toHaveLength(2)
    for (const o of rest) expect(o).toMatch(/_col-color/)
    expect(rest[0]).toMatch(/value="1"/)
    expect(rest[0]).toMatch(/>Just me</)
  })

  it('takes the field ink once a choice is made', () => {
    const markup = html(
      <Picker aria-label="Team size" placeholder="Choose" value="10" onChange={() => {}}>
        <option value="10">2-10</option>
      </Picker>,
    )
    expect(tag(markup, 'picker')).toMatch(/_col-color/)
    expect(tag(markup, 'picker')).not.toMatch(/_col-placeholder/)
  })

  it('without one, the options are the caller\'s own', () => {
    const markup = html(
      <Picker aria-label="x" defaultValue="a">
        <option value="a">A</option>
      </Picker>,
    )
    expect(options(markup)).toEqual(['<option value="a" selected="">A</option>'])
  })
})

describe('the open list', () => {
  let host: HTMLDivElement
  let root: Root
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })
  const open = (density: 'regular' | 'compact') =>
    act(() => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Density value={density}>
            <Select open>
              <SelectTrigger>
                <SelectValue placeholder="x" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Lead</SelectItem>
              </SelectContent>
            </Select>
          </Density>
        </GuiProvider>,
      )
    })
  const row = () => document.querySelector('[data-slot="select-item"]')

  it('rows are concentric in the panel, 4px corners', () => {
    open('regular')
    expect(row()?.className).toMatch(/_bblr-c-radius-xs/)
  })

  it('the density crosses the portal: compact rows hover on the hover rung', () => {
    open('compact')
    expect(row()?.className).toMatch(/_bg-0hover-hover/)
    open('regular')
    expect(row()?.className).toMatch(/_bg-0hover-raised/)
  })
})
