// @vitest-environment jsdom

/**
 * The account sheets from the keyboard: `UserMenu` and `OrgSwitcher` open with
 * the first row focused, the arrows move (wrapping) and Home/End jump, Tab stays
 * inside, Enter and Space run a row, and Escape closes and hands focus back to
 * the trigger. A choice in a sheet is a named group of `menuitemradio`, and
 * nothing here has an axe violation open.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { OrgSwitcher } from './OrgSwitcher'
import type { OrgScope } from './scope'
import { UserMenu } from './UserMenu'

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

const key = (el: HTMLElement, k = 'Enter', init: KeyboardEventInit = {}) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  })

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

const rows = () => [
  ...document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"], [role="menu"] [role="menuitemradio"]'),
]
const now = () => (document.activeElement as HTMLElement | null)?.textContent ?? ''

describe('UserMenu', () => {
  const menu = (onPress = () => {}, onSignOut = () => {}) => (
    <UserMenu
      name="Ada"
      email="ada@hanzo.ai"
      theme={null}
      groups={[
        { label: 'Language', items: [{ id: 'en', label: 'English', active: true, onPress }, { id: 'fr', label: 'Français', active: false, onPress }] },
        [{ id: 'settings', label: 'Settings', onPress }],
      ]}
      onSignOut={onSignOut}
    />
  )
  const trigger = () => host.querySelector<HTMLElement>('[aria-haspopup="menu"]')!

  it('opens on Enter with the first row focused; the arrows wrap, Home and End jump', async () => {
    mount(menu())
    trigger().focus()
    key(trigger())
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(rows().map((r) => r.textContent)).toEqual(['English', 'Français', 'Settings', 'Sign out'])
    expect(now()).toBe('English')
    const walk: string[] = []
    for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'End', 'Home']) {
      key(document.activeElement as HTMLElement, k)
      walk.push(now())
    }
    expect(walk).toEqual(['Français', 'Settings', 'Sign out', 'English', 'Sign out', 'Sign out', 'English'])
  })

  it('keeps Tab inside, looping', async () => {
    mount(menu())
    key(trigger())
    await settle()
    const all = rows()
    all.at(-1)!.focus()
    key(all.at(-1)!, 'Tab')
    expect(document.activeElement).toBe(all[0])
  })

  it('runs a row on Enter and Space, and Escape hands focus back to the trigger', async () => {
    const onPress = vi.fn()
    const onSignOut = vi.fn()
    mount(menu(onPress, onSignOut))
    key(trigger())
    await settle()
    key(document.activeElement as HTMLElement)
    expect(onPress).toHaveBeenCalledOnce()
    await settle()
    key(trigger(), ' ')
    await settle()
    key(rows().at(-1)!, ' ')
    expect(onSignOut).toHaveBeenCalledOnce()
    await settle()
    trigger().focus()
    key(trigger())
    await settle()
    key(document.activeElement as HTMLElement, 'Escape')
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger())
  })

  it('names a choice as a group of menuitemradio, and has no axe violations open', async () => {
    mount(menu())
    key(trigger())
    await settle()
    const group = document.querySelector('[role="menu"] [role="group"]')!
    expect(group.getAttribute('aria-label')).toBe('Language')
    expect([...group.querySelectorAll('[role="menuitemradio"]')].map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false'])
    expect(await audit(document.body)).toEqual([])
  })
})

describe('OrgSwitcher', () => {
  const scope = (switchOrg = vi.fn()): OrgScope => ({
    currentOrg: () => 'acme',
    setCurrentOrg: () => {},
    isScopedAway: () => false,
    hasSelectedOrg: () => true,
    enterOrg: () => {},
    leaveOrg: () => {},
    switchOrg,
  })
  const orgs = async () => [
    { name: 'acme', displayName: 'Acme' },
    { name: 'zoo', displayName: 'Zoo' },
  ]
  const trigger = () => host.querySelector<HTMLElement>('button')!
  // The trigger is a native <button>: a browser turns Enter into its click.
  // jsdom does not, so the click stands in for it here.
  const open = async () => {
    trigger().focus()
    act(() => trigger().click())
    await settle(120)
  }

  it('opens with the first row focused; the arrows wrap across the orgs and the picker row', async () => {
    mount(<OrgSwitcher scope={scope()} orgs={orgs} search={false} picker />)
    await open()
    expect(rows().map((r) => r.textContent)).toEqual(['AAcme', 'ZZoo', 'All organizations'])
    expect(document.activeElement).toBe(rows()[0])
    key(document.activeElement as HTMLElement, 'ArrowUp')
    expect(now()).toBe('All organizations')
    key(document.activeElement as HTMLElement, 'ArrowDown')
    expect(now()).toBe('AAcme')
    key(document.activeElement as HTMLElement, 'End')
    expect(now()).toBe('All organizations')
  })

  it('switches on Enter, and Escape hands focus back to the trigger', async () => {
    const switchOrg = vi.fn()
    mount(<OrgSwitcher scope={scope(switchOrg)} orgs={orgs} search={false} />)
    await open()
    key(rows()[1])
    expect(switchOrg).toHaveBeenCalledWith('zoo')
    await settle()
    await open()
    key(document.activeElement as HTMLElement, 'Escape')
    await settle()
    expect(document.activeElement).toBe(trigger())
  })

  it('leaves Home and End to the search field', async () => {
    mount(<OrgSwitcher scope={scope()} orgs={orgs} />)
    await open()
    const field = document.querySelector<HTMLInputElement>('[role="menu"] input')!
    field.focus()
    key(field, 'End')
    expect(document.activeElement).toBe(field)
  })
})
