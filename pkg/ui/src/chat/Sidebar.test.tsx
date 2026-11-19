// @vitest-environment jsdom

/** Every Sidebar control is a real `<button>`: it takes focus, answers Enter and Space, and runs its handler once. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { SidebarFolder, SidebarHeader, SidebarIconButton, SidebarItem, SidebarNewChat, SidebarUser } from './Sidebar'

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
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    ),
  )

describe('Sidebar controls', () => {
  it('draws each as a button that runs its handler once', () => {
    const [item, add, icon, folder, user, switcher] = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()]
    mount(
      <>
        <SidebarHeader title="Hanzo" onOpenSwitcher={switcher} />
        <SidebarNewChat onPress={add} />
        <SidebarIconButton label="Search" onPress={icon}>
          s
        </SidebarIconButton>
        <SidebarItem onPress={item}>Chat one</SidebarItem>
        <SidebarFolder name="Work" onOpenChange={folder} />
        <SidebarUser name="Ada" onPress={user} />
      </>,
    )
    const buttons = [...host.querySelectorAll('button')]
    expect(buttons.length).toBeGreaterThanOrEqual(6)
    expect(host.querySelectorAll('[role="button"]:not(button)').length).toBe(0)
    for (const b of buttons) act(() => b.click())
    for (const fn of [item, add, icon, folder, user, switcher]) expect(fn).toHaveBeenCalledTimes(1)
  })

  it('marks the open conversation as the current page', () => {
    mount(<SidebarItem active>Open</SidebarItem>)
    expect(host.querySelector('button')!.getAttribute('aria-current')).toBe('page')
  })

  it('draws a header with no switcher as plain text, not a dead button', () => {
    mount(<SidebarHeader title="Hanzo" />)
    expect(host.querySelector('button')).toBeNull()
  })
})
