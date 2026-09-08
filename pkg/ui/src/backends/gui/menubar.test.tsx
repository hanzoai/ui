// @vitest-environment jsdom

/**
 * The Menubar's job beyond a lone `Menu` is coordination: one menu open at a
 * time, a click opens it, hovering a sibling trigger while one is open swaps
 * to it, and the arrow keys rove focus across the triggers. Every assertion
 * here is on the live DOM after a real interaction, because the panel is
 * portalled and only exists while open — `renderToStaticMarkup` (what the
 * static-markup suites in this backend use) renders no portal at all.
 *
 * Imports `./menubar` directly rather than the backend barrel, like
 * `context-menu.test.tsx`: a test for one component should not fail because a
 * different one's dependency moved.
 */
import * as React from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './menubar'

// floating-ui's autoUpdate observes the reference element; jsdom has neither
// observer. Local to this suite — vitest.setup.ts is shared and only owes the
// module-scope matchMedia read.
beforeAll(() => {
  const Noop = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  globalThis.ResizeObserver ??= Noop as never
  globalThis.IntersectionObserver ??= Noop as never
})

afterEach(cleanup)

const mount = (node: React.ReactNode) =>
  render(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const menus = () => [...document.querySelectorAll('[role="menu"]')]
const rows = (role: string) => [...document.querySelectorAll(`[role="${role}"]`)]
const triggers = () => [...document.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]')]

const fileEditMenus = () => (
  <Menubar>
    <MenubarMenu value="file">
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>New Tab</MenubarItem>
        <MenubarItem disabled>New Window</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu value="edit">
      <MenubarTrigger>Edit</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>Undo</MenubarItem>
        <MenubarItem>Redo</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
)

describe('Menubar', () => {
  it('opens its menu on a click, and not before', () => {
    mount(fileEditMenus())

    expect(menus()).toHaveLength(0)
    act(() => void fireEvent.click(triggers()[0]))
    expect(menus()).toHaveLength(1)
    expect(triggers()[0].getAttribute('data-state')).toBe('open')
    expect(triggers()[1].getAttribute('data-state')).toBe('closed')
  })

  it('publishes role="menubar" on the root and gives every row its ARIA role', () => {
    const { container } = mount(
      <Menubar>
        <MenubarMenu value="view">
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked>Word wrap</MenubarCheckboxItem>
            <MenubarCheckboxItem checked={false}>Minimap</MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarRadioGroup value="md">
              <MenubarRadioItem value="md">Markdown</MenubarRadioItem>
              <MenubarRadioItem value="txt">Plain</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    expect(container.querySelector('[role="menubar"]')).not.toBeNull()
    act(() => void fireEvent.click(triggers()[0]))

    const checks = rows('menuitemcheckbox')
    expect(checks.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false'])

    const radios = rows('menuitemradio')
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false'])

    expect(document.querySelector('[role="separator"]')).not.toBeNull()
  })

  it('only ever has one menu open — opening a sibling closes the first', () => {
    mount(fileEditMenus())

    act(() => void fireEvent.click(triggers()[0]))
    expect(menus()).toHaveLength(1)
    expect(triggers()[0].getAttribute('data-state')).toBe('open')

    act(() => void fireEvent.click(triggers()[1]))
    expect(menus()).toHaveLength(1)
    expect(triggers()[0].getAttribute('data-state')).toBe('closed')
    expect(triggers()[1].getAttribute('data-state')).toBe('open')
  })

  it('switches menus on hover once one is already open, with no second click', () => {
    mount(fileEditMenus())

    act(() => void fireEvent.click(triggers()[0]))
    expect(triggers()[0].getAttribute('data-state')).toBe('open')

    act(() => void fireEvent.mouseEnter(triggers()[1]))
    expect(triggers()[0].getAttribute('data-state')).toBe('closed')
    expect(triggers()[1].getAttribute('data-state')).toBe('open')
  })

  it('does not switch on hover while no menu is open', () => {
    mount(fileEditMenus())

    act(() => void fireEvent.mouseEnter(triggers()[1]))
    expect(menus()).toHaveLength(0)
    expect(triggers()[1].getAttribute('data-state')).toBe('closed')
  })

  it('roves trigger focus with the arrow keys and wraps at the ends', () => {
    mount(fileEditMenus())
    const [first, second] = triggers()

    act(() => first.focus())
    act(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(document.activeElement).toBe(second)

    act(() => {
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(document.activeElement).toBe(first)

    act(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    })
    expect(document.activeElement).toBe(second)
  })

  it('marks a disabled row disabled instead of merely dimming it', () => {
    mount(fileEditMenus())
    act(() => void fireEvent.click(triggers()[0]))

    const disabled = rows('menuitem').find((r) => r.textContent === 'New Window')!
    expect(disabled.getAttribute('aria-disabled')).toBe('true')
    expect(disabled.hasAttribute('data-disabled')).toBe(true)
  })

  it('calls onSelect when a row is chosen', () => {
    const onSelect = vi.fn()
    mount(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={onSelect}>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    act(() => void fireEvent.click(triggers()[0]))
    act(() => void fireEvent.click(rows('menuitem')[0]))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('renders a submenu row with its trigger and content', () => {
    mount(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email link</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    act(() => void fireEvent.click(triggers()[0]))

    const subTrigger = document.querySelector('[data-slot="menubar-sub-trigger"]')
    expect(subTrigger).not.toBeNull()
    expect(subTrigger?.getAttribute('aria-haspopup')).toBe('menu')
  })

  it('renders a shortcut hint', () => {
    mount(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab
              <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    act(() => void fireEvent.click(triggers()[0]))

    expect(document.querySelector('[data-slot="menubar-shortcut"]')?.textContent).toBe('⌘T')
  })

  it('is a controlled component when given value + onValueChange', () => {
    const onValueChange = vi.fn()
    function Controlled() {
      const [value, setValue] = React.useState<string | undefined>(undefined)
      return (
        <Menubar
          value={value}
          onValueChange={(v) => {
            setValue(v)
            onValueChange(v)
          }}
        >
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New Tab</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
    }
    mount(<Controlled />)

    act(() => void fireEvent.click(triggers()[0]))
    expect(onValueChange).toHaveBeenCalledWith('file')
    expect(menus()).toHaveLength(1)
  })
})
