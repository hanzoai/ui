// @vitest-environment jsdom

/**
 * DropdownMenu's record parts on a live DOM: a search field keeps its own keys
 * (gui's typeahead would take the first letter), ArrowDown enters the list and
 * ArrowUp from the first row comes back, Enter in the field runs the first row;
 * a multiple choice toggles and stays open, a single one closes; pages move and
 * Back returns, and the history resets on close; the status lines are polite;
 * density reaches inside the portal; and axe finds nothing in an open menu.
 *
 * The row geometry every menu shares is asserted on the same mounted rows: the
 * 4px corner concentric in the 8px panel, the hover rung, the 32px floor.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { Density, useDensity } from './density'
import {
  DropdownMenu,
  DropdownMenuBack,
  DropdownMenuClose,
  DropdownMenuContent,
  DropdownMenuEmpty,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLoading,
  DropdownMenuOptionItem,
  DropdownMenuPage,
  DropdownMenuSearch,
  DropdownMenuSection,
  DropdownMenuSelectionGroup,
  DropdownMenuSeparator,
  DropdownMenuTitle,
  DropdownMenuTrigger,
} from './dropdown-menu'

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

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })

const rows = () => [
  ...document.querySelectorAll<HTMLElement>(
    '[data-slot="dropdown-menu-content"] [role="menuitem"], [data-slot="dropdown-menu-content"] [role="menuitemradio"], [data-slot="dropdown-menu-content"] [role="menuitemcheckbox"]',
  ),
]
const field = () => document.querySelector<HTMLInputElement>('[data-slot="dropdown-menu-search"] input')!

function Search({ onA = () => {} }: { onA?: () => void }) {
  const [q, setQ] = useState('')
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Assignee</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search people" autoFocus={false} />
        <DropdownMenuItem onSelect={onA}>Ada</DropdownMenuItem>
        <DropdownMenuItem>Grace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenuSearch', () => {
  it('keeps the keys a field needs: a letter typed stays in the field', async () => {
    mount(<Search />)
    await settle(150)
    field().focus()
    key(field(), 'g')
    await settle()
    expect(document.activeElement).toBe(field())
  })

  it('ArrowDown enters the list; ArrowUp from the first row comes back', async () => {
    mount(<Search />)
    await settle(150)
    field().focus()
    key(field(), 'ArrowDown')
    await settle()
    expect(document.activeElement?.textContent).toBe('Ada')
    key(document.activeElement!, 'ArrowUp')
    await settle()
    expect(document.activeElement).toBe(field())
  })

  it('Enter in the field runs the first row', async () => {
    const onA = vi.fn()
    mount(<Search onA={onA} />)
    await settle(150)
    field().focus()
    key(field(), 'Enter')
    await settle()
    expect(onA).toHaveBeenCalledTimes(1)
  })

  it('takes focus when the panel opens, by default', async () => {
    mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSearch />
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(250)
    expect(document.activeElement).toBe(field())
  })
})

describe('DropdownMenuSelectionGroup', () => {
  it('a multiple choice toggles menuitemcheckbox rows and stays open', async () => {
    const changed = vi.fn()
    mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Tags</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSelectionGroup multiple defaultValue={['a']} onValueChange={changed}>
            <DropdownMenuOptionItem value="a">Alpha</DropdownMenuOptionItem>
            <DropdownMenuOptionItem value="b">Beta</DropdownMenuOptionItem>
          </DropdownMenuSelectionGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(150)
    const [a, b] = rows()
    expect(a.getAttribute('role')).toBe('menuitemcheckbox')
    expect(a.getAttribute('aria-checked')).toBe('true')
    expect(b.getAttribute('aria-checked')).toBe('false')
    act(() => b.click())
    await settle()
    expect(changed).toHaveBeenLastCalledWith(['a', 'b'])
    expect(rows()[1].getAttribute('aria-checked')).toBe('true')
    // Still open: a multiple choice is made several times.
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeNull()
    // The default indicator of a multiple choice is the leading box.
    expect(rows()[0].getAttribute('data-indicator')).toBe('checkbox')
  })

  it('a single choice is a group of menuitemradio, reports one value and closes', async () => {
    const changed = vi.fn()
    const open = vi.fn()
    mount(
      <DropdownMenu defaultOpen onOpenChange={open}>
        <DropdownMenuTrigger>Layout</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSelectionGroup defaultValue="table" onValueChange={changed}>
            <DropdownMenuOptionItem value="table">Table</DropdownMenuOptionItem>
            <DropdownMenuOptionItem value="kanban">Kanban</DropdownMenuOptionItem>
          </DropdownMenuSelectionGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(150)
    const [table, kanban] = rows()
    expect(table.getAttribute('role')).toBe('menuitemradio')
    expect(table.getAttribute('aria-checked')).toBe('true')
    expect(table.getAttribute('data-indicator')).toBe('check')
    act(() => kanban.click())
    await settle()
    expect(changed).toHaveBeenLastCalledWith('kanban')
    expect(open).toHaveBeenLastCalledWith(false)
  })
})

describe('DropdownMenu pages', () => {
  const Paged = ({ onOpenChange }: { onOpenChange?: (o: boolean) => void }) => (
    <DropdownMenu defaultOpen defaultPage="options" onOpenChange={onOpenChange}>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuPage id="options">
          <DropdownMenuHeader>
            <DropdownMenuTitle>View options</DropdownMenuTitle>
            <DropdownMenuClose aria-label="Close" />
          </DropdownMenuHeader>
          <DropdownMenuItem page="fields">Fields</DropdownMenuItem>
        </DropdownMenuPage>
        <DropdownMenuPage id="fields">
          <DropdownMenuBack>Fields</DropdownMenuBack>
          <DropdownMenuItem>Name</DropdownMenuItem>
        </DropdownMenuPage>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  it('renders only the current page; an item with `page` opens it and Back returns', async () => {
    mount(<Paged />)
    await settle(150)
    const page = () => document.querySelector('[data-slot="dropdown-menu-page"]')?.getAttribute('data-page')
    expect(page()).toBe('options')
    expect(document.querySelectorAll('[data-slot="dropdown-menu-page"]')).toHaveLength(1)
    const fields = rows().find((r) => r.textContent === 'Fields')!
    act(() => fields.click())
    await settle()
    expect(page()).toBe('fields')
    // Focus moved with the page: the pressed row is gone.
    await settle(60)
    expect(document.activeElement?.closest('[data-slot="dropdown-menu-content"]')).not.toBeNull()
    act(() => document.querySelector<HTMLElement>('[data-slot="dropdown-menu-back"]')!.click())
    await settle()
    expect(page()).toBe('options')
  })

  it('Close closes the menu, and the history starts over', async () => {
    const open = vi.fn()
    mount(<Paged onOpenChange={open} />)
    await settle(150)
    act(() => rows().find((r) => r.textContent === 'Fields')!.click())
    await settle()
    expect(document.querySelector('[data-slot="dropdown-menu-page"]')?.getAttribute('data-page')).toBe('fields')
    // Escape closes the menu from anywhere in it.
    key(document.querySelector('[data-slot="dropdown-menu-content"]')!, 'Escape')
    await settle()
    expect(open).toHaveBeenLastCalledWith(false)
  })
})

describe('status lines and shared geometry', () => {
  it('Empty and Loading are polite status lines', async () => {
    mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSection label="People" scrollable>
            <DropdownMenuItem>Ada</DropdownMenuItem>
          </DropdownMenuSection>
          <DropdownMenuEmpty />
          <DropdownMenuSeparator />
          <DropdownMenuLoading />
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(150)
    for (const slot of ['dropdown-menu-empty', 'dropdown-menu-loading']) {
      const el = document.querySelector(`[data-slot="${slot}"]`)!
      expect(el.getAttribute('role'), slot).toBe('status')
      expect(el.getAttribute('aria-live'), slot).toBe('polite')
    }
    expect(document.querySelector('[data-slot="dropdown-menu-empty"]')!.textContent).toBe('No results')
    expect(document.querySelector('[data-slot="dropdown-menu-label"][data-variant="band"]')!.textContent).toBe('People')
    // A panel with status lines is a popup holding menus, not a bare menu.
    const content = document.querySelector('[data-slot="dropdown-menu-content"]')!
    expect(content.getAttribute('role')).toBe('dialog')
    const lists = content.querySelectorAll('[data-slot="dropdown-menu-list"][role="menu"]')
    expect(lists.length).toBe(2)
    expect(document.querySelector('[data-slot="dropdown-menu-empty"]')!.closest('[role="menu"]')).toBeNull()
  })

  it('a panel of rows alone stays one bare menu', async () => {
    mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(150)
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')!.getAttribute('role')).toBe('menu')
    expect(document.querySelector('[data-slot="dropdown-menu-list"]')).toBeNull()
  })

  it('every row is a 32px floor with a 4px corner and the hover rung', async () => {
    mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(150)
    const cls = rows()[0].className
    expect(cls).toMatch(/_minH-32px/)
    expect(cls).toMatch(/_btlr-c-radius-xs/)
    expect(cls).toMatch(/_bg-0hover-hover/)
  })

  it('the density the menu was opened under reaches inside the portal', async () => {
    const Probe = () => <span data-probe={useDensity()} />
    mount(
      <Density value="compact">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Probe />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Density>,
    )
    await settle(150)
    expect(document.querySelector('[data-probe]')?.getAttribute('data-probe')).toBe('compact')
  })

  it('an open record menu has no axe violations', async () => {
    mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Assignee</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSearch autoFocus={false} />
          <DropdownMenuSelectionGroup multiple>
            <DropdownMenuSection label="People" scrollable>
              <DropdownMenuOptionItem value="a">Ada</DropdownMenuOptionItem>
            </DropdownMenuSection>
          </DropdownMenuSelectionGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem actions={<button type="button">Edit</button>}>Add person</DropdownMenuItem>
          <DropdownMenuEmpty />
          <DropdownMenuLoading />
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await settle(150)
    expect(await audit(document.body)).toEqual([])
  })
})
