// @vitest-environment jsdom

/**
 * The command menu against a live DOM: one grid (the headings' text on the
 * rows' text edge, icons bare), the field as a combobox naming the active
 * option, the query filtering with an empty line when nothing survives, the
 * arrows and Enter, Escape and `esc` closing, Backspace on an empty query going
 * back a page, keycaps for a row's shortcut, and axe.
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { CommandMenu, type CommandMenuGroup } from './CommandMenu'
import { DetailPane, useDetailPane, type DetailPaneApi } from './DetailPane'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

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

const mount = (ui: ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const groups = (spy: (id: string) => void): CommandMenuGroup[] => [
  {
    id: 'record',
    label: 'Record',
    items: [
      { id: 'create', label: 'Create company', contextual: 'Companies', onSelect: () => spy('create') },
      { id: 'export', label: 'Export view', disabled: true, onSelect: () => spy('export') },
    ],
  },
  {
    id: 'go',
    label: 'Go to',
    items: [
      { id: 'people', label: 'Go to People', shortcut: [['G'], ['P']], onSelect: () => spy('people') },
      { id: 'settings', label: 'Settings', keywords: ['preferences'], submenu: true, onSelect: () => spy('settings') },
    ],
  },
]

const field = () => host.querySelector('[data-slot="command-menu-input"]') as HTMLInputElement
const options = () => [...host.querySelectorAll('[role="option"]')] as HTMLElement[]
const active = () => host.querySelector(`#${CSS.escape(field().getAttribute('aria-activedescendant') ?? '')}`)?.textContent
const key = (k: string) =>
  act(() => {
    field().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })
const type = (text: string) =>
  act(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    set.call(field(), text)
    field().dispatchEvent(new Event('input', { bubbles: true }))
  })

describe('CommandMenu', () => {
  it('draws one grid: headings on the rows\' text edge, 36px rows, a field with no edge of its own', () => {
    const markup = renderToStaticMarkup(
      <GuiProvider config={config} defaultTheme="dark">
        <CommandMenu groups={groups(() => {})} autoFocus={false} />
      </GuiProvider>,
    )
    const head = markup.match(/<[a-z]+[^>]*data-slot="command-menu-heading"[^>]*>/)?.[0] ?? ''
    expect(head).toMatch(/_height-28px/)
    expect(head).toMatch(/_paddingInlineStart-36px/)
    expect(head).not.toMatch(/_borderBottomWidth/)
    const row = markup.match(/<[a-z]+[^>]*data-slot="command-menu-item"[^>]*>/)?.[0] ?? ''
    expect(row).toMatch(/_minH-36px/)
    expect(row).toMatch(/_pl-8px/)
    const input = markup.match(/<input[^>]*data-slot="command-menu-input"[^>]*>/)?.[0] ?? ''
    expect(input).toMatch(/_outlineWidth-0px/)
    expect(input).toMatch(/_btw-0px/)
    expect(input).toMatch(/_outlineWidth-0focus-visible-0px/)
    expect(markup).toContain('placeholder="Search or jump to…"')
  })

  it('is a combobox over grouped listboxes, naming the active option', () => {
    mount(<CommandMenu groups={groups(() => {})} autoFocus={false} />)
    expect(field().getAttribute('role')).toBe('combobox')
    expect(host.querySelectorAll('[role="listbox"]').length).toBe(2)
    expect(active()).toContain('Create company')
  })

  it('moves with the arrows past a disabled row, wraps, and runs the row on Enter', () => {
    const ran = vi.fn()
    mount(<CommandMenu groups={groups(ran)} autoFocus={false} />)
    key('ArrowDown')
    expect(active()).toContain('Go to People')
    key('ArrowDown')
    key('ArrowDown')
    expect(active()).toContain('Create company')
    key('ArrowUp')
    expect(active()).toContain('Settings')
    key('Enter')
    expect(ran).toHaveBeenCalledWith('settings')
  })

  it('filters by label and keywords, and says so when nothing survives', () => {
    mount(<CommandMenu groups={groups(() => {})} autoFocus={false} />)
    type('pref')
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining('Settings')])
    expect(host.querySelectorAll('[data-slot="command-menu-heading"]').length).toBe(1)
    type('zzzz')
    expect(options()).toHaveLength(0)
    expect(host.querySelector('[data-slot="command-menu-empty"]')?.textContent).toBe('No results found')
  })

  it('Escape closes, query or none, and so does a press on esc', () => {
    const onClose = vi.fn()
    mount(<CommandMenu groups={groups(() => {})} autoFocus={false} onClose={onClose} />)
    type('go')
    key('Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
    act(() => (host.querySelector('[aria-label="Close"]') as HTMLElement).click())
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('draws a row’s shortcut as keycaps, spoken once', () => {
    mount(<CommandMenu groups={groups(() => {})} autoFocus={false} />)
    const keys = host.querySelector('[data-slot="shortcut"]')
    expect(keys?.getAttribute('aria-label')).toBe('G then P')
  })

  it('in a pane, Backspace on an empty query goes back a page', () => {
    let api!: DetailPaneApi
    const Capture = () => {
      api = useDetailPane()
      return null
    }
    mount(
      <DetailPane mode="docked">
        <Capture />
      </DetailPane>,
    )
    act(() => api.open({ title: 'Acme', content: <span>record</span> }))
    act(() => api.push({ title: 'Commands', bare: true, content: <CommandMenu groups={groups(() => {})} autoFocus={false} /> }))
    expect(api.depth).toBe(2)
    key('Backspace')
    expect(api.depth).toBe(1)
  })

  it('passes axe', async () => {
    mount(<CommandMenu groups={groups(() => {})} autoFocus={false} />)
    expect(await audit(host)).toEqual([])
  })
})
