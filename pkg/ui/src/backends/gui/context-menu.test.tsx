// @vitest-environment jsdom

/**
 * The ContextMenu's props have to ARRIVE. gui drops what it does not recognise —
 * no throw, no type error, just an element that never got the style or the
 * handler — so a suite that only found its own text would prove nothing.
 *
 * Everything here is asserted on the live DOM after a real right-click, because
 * the panel is portalled and only exists while open: `renderToStaticMarkup` (what
 * the rest of this backend's suites use) renders no portal at all.
 *
 * Imports `./context-menu` directly rather than the backend barrel, like
 * `switch.test.tsx`: a test for one component should not fail because a
 * different one's dependency moved.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from './context-menu'

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

/** Right-click the trigger and let the portal flush. */
const open = (el: Element) => act(() => void fireEvent.contextMenu(el))

/** Roving focus moves on a macrotask (RovingFocusGroup defers its `focusFirst`). */
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))))

const menu = () => document.querySelector('[role="menu"]')
const rows = (role: string) => [...document.querySelectorAll(`[role="${role}"]`)]
const focused = () => document.activeElement

describe('ContextMenu', () => {
  it('opens on right-click, and not before', () => {
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )

    expect(menu()).toBeNull()
    open(getByTestId('t'))
    expect(menu()).not.toBeNull()
    // The trigger publishes its state — a consumer styles off this, Radix did too.
    expect(getByTestId('t').getAttribute('data-state')).toBe('open')
  })

  // The whole point of the primitive. A row that is a styled div with a click
  // handler looks identical and is invisible to assistive tech.
  it('gives every row its ARIA role and state', () => {
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Actions</ContextMenuLabel>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked>Word wrap</ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={false}>Minimap</ContextMenuCheckboxItem>
          <ContextMenuRadioGroup value="md">
            <ContextMenuRadioItem value="md">Markdown</ContextMenuRadioItem>
            <ContextMenuRadioItem value="txt">Plain</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))

    expect(menu()).not.toBeNull()
    expect(rows('menuitem')).toHaveLength(1)

    const checks = rows('menuitemcheckbox')
    expect(checks.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false'])

    const radios = rows('menuitemradio')
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false'])

    expect(document.querySelector('[role="separator"]')).not.toBeNull()
  })

  it('marks a disabled row disabled instead of merely dimming it', () => {
    const onSelect = vi.fn()
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled onSelect={onSelect}>
            Paste
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))

    const row = rows('menuitem')[0]
    expect(row.getAttribute('aria-disabled')).toBe('true')
    expect(row.hasAttribute('data-disabled')).toBe(true)
  })

  it('calls onSelect when a row is chosen', () => {
    const onSelect = vi.fn()
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onSelect}>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))

    act(() => void fireEvent.click(rows('menuitem')[0]))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))
    expect(menu()).not.toBeNull()

    act(() => void fireEvent.keyDown(document, { key: 'Escape' }))
    expect(menu()).toBeNull()
  })

  // The four props this file adds on top of the gui part. gui drops an unknown
  // prop silently, so each one is read back off the node it was supposed to reach.
  it('lands its own props on the DOM — slot, inset, variant, touch target', () => {
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem inset variant="destructive">
            Delete
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))

    expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="context-menu-shortcut"]')).not.toBeNull()

    const row = document.querySelector('[data-slot="context-menu-item"]')!
    expect(row.getAttribute('data-inset')).toBe('true')
    expect(row.getAttribute('data-variant')).toBe('destructive')
    // hitSlop is dropped on web, so this attribute is the only thing that can
    // lift a 32px row to the 44px floor — theme.css carries the rule.
    expect(row.getAttribute('data-touch-y')).toBe('6')
  })

  // A string child of a gui View renders nothing on native unless it is wrapped
  // in a Text host. `ink()` is the one place this backend does that.
  it('renders a bare string child through a text host', () => {
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))

    const row = rows('menuitem')[0]
    expect(row.textContent).toBe('Copy')
    expect(
      row.firstElementChild?.getAttribute('data-slot'),
      'the string is a raw text node, not a Text host',
    ).toBe('sizable-text')
  })

  // Keyboard reachability is the reason to use the primitive rather than a styled
  // div with an onClick. Focus enters the panel on open, then rows rove.
  it('traps focus in the panel and roves the rows with the arrow keys', async () => {
    const { getByTestId } = mount(
      <ContextMenu>
        <ContextMenuTrigger data-testid="t">target</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>One</ContextMenuItem>
          <ContextMenuItem>Two</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    open(getByTestId('t'))

    const panel = menu()!
    expect(panel.contains(focused()), 'focus never entered the panel').toBe(true)
    // Labelled by the element that opened it, so the panel is announced.
    expect(panel.getAttribute('aria-labelledby')).toBe(getByTestId('t').id)

    act(() => void fireEvent.keyDown(panel, { key: 'ArrowDown' }))
    await settle()
    expect(focused()?.textContent).toBe('One')

    act(() => void fireEvent.keyDown(focused()!, { key: 'ArrowDown' }))
    await settle()
    expect(focused()?.textContent).toBe('Two')

    act(() => void fireEvent.keyDown(focused()!, { key: 'ArrowUp' }))
    await settle()
    expect(focused()?.textContent).toBe('One')
  })
})
