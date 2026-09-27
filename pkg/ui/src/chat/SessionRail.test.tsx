// @vitest-environment jsdom

/**
 * SessionRail against a live DOM: the head names the surface and finds a
 * session, the rows are real controls, the account row opens the account menu
 * anchored to itself, the collapse is an explicit toggle that only reports (the
 * host persists it), the drawer carries the same contents and closes on any
 * choice, the phone bar opens it, and axe finds nothing in any of the shapes.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { EmptyPrompt } from './EmptyPrompt'
import { RailBar, RailNotice, SessionRail, type RailAccount, type RailSession, type SessionRailProps } from './SessionRail'

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

const RECENTS: RailSession[] = [
  { id: 's1', title: 'Rolling update and bootstrap CD straight from the pinned tag', status: 'running' },
  { id: 's2', title: 'Reset to 2025 version', status: 'done' },
  { id: 's3', title: 'Enterprise/OSS feature audit', status: 'error' },
]

const Icon = () => <span aria-hidden>·</span>

const ACCOUNT: RailAccount = {
  name: 'Dave',
  sub: 'acme',
  email: 'dave@acme.test',
  groups: [
    {
      label: 'Organizations',
      items: [
        { id: 'acme', label: 'acme', active: true, onPress: () => {} },
        { id: 'zoo', label: 'zoo', active: false, onPress: () => {} },
      ],
    },
    [{ id: 'settings', label: 'Settings', onPress: () => {} }],
  ],
  onSignOut: () => {},
  signOutLabel: 'Log out',
}

const rail = (over: Partial<SessionRailProps> = {}) => (
  <SessionRail
    brand="Hanzo Build"
    onSearch={() => {}}
    searchLabel="Search runs"
    onNew={() => {}}
    fresh
    links={[
      { id: 'artifacts', label: 'Artifacts', icon: <Icon /> },
      { id: 'customize', label: 'Customize', icon: <Icon /> },
    ]}
    more={[{ id: 'projects', label: 'Projects', icon: <Icon /> }]}
    recents={RECENTS}
    active="s2"
    onOpen={() => {}}
    onSort={() => {}}
    account={ACCOUNT}
    onCollapse={() => {}}
    {...over}
  />
)

const q = (sel: string) => host.querySelector<HTMLElement>(sel)
const all = (sel: string, from: ParentNode = host) => [...from.querySelectorAll<HTMLElement>(sel)]
const press = (el: HTMLElement, k = 'Enter', init: KeyboardEventInit = {}) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  })

/** Let the focus scope's deferred work (idle focus, unmount refocus) run, inside act. */
const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

/** What has focus, by the thing a person would name it by. */
const focused = () => {
  const el = document.activeElement as HTMLElement | null
  return el?.getAttribute('aria-label') ?? el?.textContent ?? el?.tagName ?? ''
}

describe('the expanded rail', () => {
  it('is a named navigation landmark with New first, the links, More and the recents', () => {
    mount(rail())
    const nav = q('[data-slot="session-rail"]')!
    expect(nav.getAttribute('role')).toBe('navigation')
    expect(nav.getAttribute('aria-label')).toBe('Sessions')
    expect(nav.textContent).toContain('New')
    expect(nav.textContent).toContain('Artifacts')
    expect(nav.textContent).toContain('Customize')
    expect(nav.textContent).toContain('More')
    expect(nav.textContent).toContain('Recents')
    expect(all('[data-slot="rail-session"]').map((r) => r.textContent)).toEqual(RECENTS.map((r) => r.title))
  })

  it('marks the fresh pane on New and the open session with aria-current', () => {
    mount(rail())
    expect(q('[data-slot="rail-new"]')!.getAttribute('aria-current')).toBe('page')
    const current = all('[data-slot="rail-session"]').filter((r) => r.getAttribute('aria-current') === 'page')
    expect(current.map((r) => r.textContent)).toEqual(['Reset to 2025 version'])
  })

  it('draws each session status as its own dot', () => {
    mount(rail())
    const dots = all('[data-slot="status-dot"]').map((d) => d.getAttribute('data-status'))
    expect(dots).toEqual(['running', 'done', 'error'])
    expect(all('[data-slot="status-dot"]')[0].className).toContain('hz-pulse')
    expect(all('[data-slot="status-dot"]')[1].className).not.toContain('hz-pulse')
  })

  it('opens a session by pointer and by keyboard', () => {
    const onOpen = vi.fn()
    mount(rail({ onOpen }))
    const rows = all('[data-slot="rail-session"]')
    act(() => rows[0].click())
    press(rows[2])
    press(rows[1], ' ')
    expect(onOpen.mock.calls.map((c) => c[0])).toEqual(['s1', 's3', 's2'])
  })

  it('starts a new session from New', () => {
    const onNew = vi.fn()
    mount(rail({ onNew }))
    press(q('[data-slot="rail-new"]')!)
    expect(onNew).toHaveBeenCalledOnce()
  })

  it('reveals More on a press and says it is expanded', () => {
    mount(rail())
    const more = q('[data-slot="rail-more"]')!
    expect(more.getAttribute('aria-expanded')).toBe('false')
    expect(host.textContent).not.toContain('Projects')
    act(() => more.click())
    expect(more.getAttribute('aria-expanded')).toBe('true')
    expect(host.textContent).toContain('Projects')
    expect(document.getElementById(more.getAttribute('aria-controls')!)).toBeTruthy()
  })

  it('names its icon-only controls, and has no second search or settings at the foot', () => {
    const onSort = vi.fn()
    mount(rail({ onSort }))
    const named = (label: string) => q(`[aria-label="${label}"]`)
    act(() => named('Sort and filter')!.click())
    expect(onSort).toHaveBeenCalledOnce()
    expect(named('Account: Dave · acme')!.getAttribute('aria-haspopup')).toBe('menu')
    // The initial is the name's first letter again; it is not read.
    expect(q('[data-slot="rail-account"] [aria-hidden="true"]')!.textContent).toBe('D')
    const foot = q('[data-slot="rail-foot"]')!
    expect(foot.querySelector('[aria-label="Settings"]')).toBeNull()
    expect(foot.querySelector('[aria-label="Search"]')).toBeNull()
    expect(foot.querySelector('[aria-label="Search runs"]')).toBeNull()
  })

  it('shows the empty line when there are no recents', () => {
    mount(rail({ recents: [], empty: 'No sessions yet.' }))
    expect(all('[data-slot="rail-session"]')).toHaveLength(0)
    expect(host.textContent).toContain('No sessions yet.')
  })
})

describe('the head', () => {
  it('draws the brand over the search, above New, in flow', () => {
    mount(rail())
    const head = q('[data-slot="rail-head"]')!
    const nav = q('[data-slot="rail-nav"]')!
    expect(head.textContent).toBe('Hanzo BuildSearch runs')
    // Before the rows in document order: the head is in flow, not laid over them.
    expect(head.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('starts a new session from the brand, by pointer and by keyboard', () => {
    const onNew = vi.fn()
    mount(rail({ onNew }))
    const brand = q('[data-slot="rail-brand"]')!
    expect(brand.getAttribute('role')).toBe('button')
    act(() => brand.click())
    press(brand)
    expect(onNew).toHaveBeenCalledTimes(2)
  })

  it('runs a given brand handler instead of New', () => {
    const onNew = vi.fn()
    const onBrand = vi.fn()
    mount(rail({ onNew, onBrand }))
    act(() => q('[data-slot="rail-brand"]')!.click())
    expect(onBrand).toHaveBeenCalledOnce()
    expect(onNew).not.toHaveBeenCalled()
  })

  it('opens search from a named box, by pointer and by keyboard', () => {
    const onSearch = vi.fn()
    mount(rail({ onSearch }))
    const box = q('[data-slot="rail-search"]')!
    // What it says and what it is called are the same words (label in name).
    expect(box.getAttribute('aria-label')).toBe('Search runs')
    expect(box.textContent).toBe('Search runs')
    act(() => box.click())
    press(box, ' ')
    expect(onSearch).toHaveBeenCalledTimes(2)
  })

  it('draws no head when there is neither brand nor search', () => {
    mount(rail({ brand: undefined, onSearch: undefined }))
    expect(q('[data-slot="rail-head"]')).toBeNull()
  })
})

describe('the account', () => {
  const open = () => act(() => q('[data-slot="rail-account"]')!.click())
  const menu = () => document.querySelector<HTMLElement>('[data-slot="rail-menu"]')

  it('draws the name over its second line', () => {
    mount(rail())
    const row = q('[data-slot="rail-account"]')!
    expect(row.textContent).toBe('DDaveacme')
    expect(q('[data-slot="rail-account-sub"]')!.textContent).toBe('acme')
  })

  it('opens the account menu on a press: who, the groups, a named choice, then sign-out', () => {
    mount(rail())
    expect(menu()).toBeNull()
    open()
    expect(q('[data-slot="rail-account"]')!.getAttribute('aria-expanded')).toBe('true')
    const m = menu()!
    expect(m.getAttribute('role')).toBe('menu')
    expect(m.textContent).toContain('Dave')
    expect(m.textContent).toContain('dave@acme.test')
    // Inside a menu a choice is a named group of menuitemradio — a radiogroup
    // is not a child a menu may own.
    expect(m.querySelector('[role="radiogroup"], [role="radio"]')).toBeNull()
    const choice = m.querySelector('[role="group"]')!
    expect(choice.getAttribute('aria-label')).toBe('Organizations')
    const radios = [...choice.querySelectorAll('[role="menuitemradio"]')].map((r) => [r.textContent, r.getAttribute('aria-checked')])
    expect(radios).toEqual([
      ['acme', 'true'],
      ['zoo', 'false'],
    ])
    const actions = [...m.querySelectorAll('[role="menuitem"]')].map((r) => r.textContent)
    expect(actions).toEqual(['Settings', 'Log out'])
    // The rail's menu is the account's: no theme row.
    expect(m.textContent).not.toContain('Theme')
  })

  it('opens on Enter from the keyboard', () => {
    mount(rail())
    press(q('[data-slot="rail-account"]')!)
    expect(menu()).toBeTruthy()
  })

  it('runs a row and closes', async () => {
    const onPress = vi.fn()
    const onSignOut = vi.fn()
    mount(rail({ account: { ...ACCOUNT, groups: [[{ id: 'usage', label: 'Usage', onPress }]], onSignOut } }))
    open()
    act(() => [...menu()!.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((r) => r.textContent === 'Usage')!.click())
    expect(onPress).toHaveBeenCalledOnce()
    expect(q('[data-slot="rail-account"]')!.getAttribute('aria-expanded')).toBe('false')
    open()
    act(() => [...menu()!.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((r) => r.textContent === 'Log out')!.click())
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('is one action with no menu — a signed-out Sign in, still named as the account', () => {
    const onPress = vi.fn()
    mount(rail({ account: { name: 'Sign in', onPress } }))
    const row = q('[data-slot="rail-account"]')!
    expect(row.getAttribute('aria-haspopup')).toBeNull()
    expect(row.getAttribute('role')).toBe('button')
    expect(row.getAttribute('aria-label')).toBe('Account: Sign in')
    press(row)
    expect(onPress).toHaveBeenCalledOnce()
    expect(menu()).toBeNull()
  })

  it('names a one-action row the same way on the collapsed rail', () => {
    mount(rail({ collapsed: true, account: { name: 'Sign in', onPress: () => {} } }))
    expect(q('[data-slot="rail-account"]')!.getAttribute('aria-label')).toBe('Account: Sign in')
  })

  it('opens beside the collapsed rail too', () => {
    mount(rail({ collapsed: true }))
    const row = q('[data-slot="rail-account"]')!
    expect(row.getAttribute('aria-label')).toBe('Account: Dave · acme')
    act(() => row.click())
    expect(menu()).toBeTruthy()
  })
})

describe('the account menu from the keyboard', () => {
  const rows = () => [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="rail-menu"] [role="menuitem"], [data-slot="rail-menu"] [role="menuitemradio"]',
    ),
  ]
  const labels = () => rows().map((r) => r.textContent)

  it('opens on Enter with the first row focused, and every row is a tab stop with a ring', async () => {
    mount(rail())
    const trigger = q('[data-slot="rail-account"]')!
    trigger.focus()
    press(trigger)
    await settle()
    expect(labels()).toEqual(['acme', 'zoo', 'Settings', 'Log out'])
    expect(rows().map((r) => r.getAttribute('tabindex'))).toEqual(['0', '0', '0', '0'])
    expect(document.activeElement).toBe(rows()[0])
  })

  it('moves with the arrows, wrapping, and jumps with Home and End', async () => {
    mount(rail())
    press(q('[data-slot="rail-account"]')!)
    await settle()
    const walk: string[] = []
    const step = (k: string) => {
      press(document.activeElement as HTMLElement, k)
      walk.push(focused())
    }
    step('ArrowDown')
    step('ArrowDown')
    step('ArrowDown')
    step('ArrowDown') // past the end: back to the first
    step('ArrowUp') // before the first: the last
    step('Home')
    step('End')
    expect(walk).toEqual(['zoo', 'Settings', 'Log out', 'acme', 'Log out', 'acme', 'Log out'])
  })

  it('keeps Tab inside the open menu, looping at both ends', async () => {
    mount(rail())
    press(q('[data-slot="rail-account"]')!)
    await settle()
    const [first, , , last] = rows()
    last.focus()
    press(last, 'Tab')
    expect(document.activeElement).toBe(first)
    press(first, 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('runs a row on Enter and on Space', async () => {
    const onPress = vi.fn()
    const onSignOut = vi.fn()
    mount(rail({ account: { ...ACCOUNT, groups: [[{ id: 'usage', label: 'Usage', onPress }]], onSignOut } }))
    press(q('[data-slot="rail-account"]')!)
    await settle()
    press(document.activeElement as HTMLElement)
    expect(onPress).toHaveBeenCalledOnce()
    await settle()
    press(q('[data-slot="rail-account"]')!)
    await settle()
    press(rows().at(-1)!, ' ')
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('closes on Escape and hands focus back to the account row', async () => {
    mount(rail())
    const trigger = q('[data-slot="rail-account"]')!
    trigger.focus()
    press(trigger)
    await settle()
    expect(rows().length).toBeGreaterThan(0)
    press(document.activeElement as HTMLElement, 'Escape')
    await settle()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})

describe('the drawer from the keyboard', () => {
  /** A phone: the bar opens the drawer, and the host keeps it open or shut and counts the closes it hears. */
  let closes = 0
  function Phone({ over = {} }: { over?: Partial<SessionRailProps> }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <RailBar onMenu={() => setOpen(true)} menuLabel="Open runs" brand="Hanzo Build" onSearch={() => {}} />
        {rail({
          open,
          onOpenChange: (next) => {
            if (!next) closes++
            setOpen(next)
          },
          ...over,
        })}
      </>
    )
  }
  const menu = () => q('[aria-label="Open runs"]')!
  const drawer = () => document.querySelector<HTMLElement>('[data-slot="session-rail-drawer"]')
  const openDrawer = async () => {
    closes = 0
    menu().focus()
    act(() => menu().click())
    await settle()
    expect(drawer()).toBeTruthy()
  }

  it('opens the account menu inside the drawer and keeps focus in it, then Escape returns to the row', async () => {
    mount(<Phone />)
    await openDrawer()
    const row = drawer()!.querySelector<HTMLElement>('[data-slot="rail-account"]')!
    row.focus()
    press(row)
    await settle()
    const items = [...document.querySelectorAll<HTMLElement>('[data-slot="rail-menu"] [role="menuitem"], [data-slot="rail-menu"] [role="menuitemradio"]')]
    expect(document.activeElement).toBe(items[0])
    press(items.at(-1)!, 'Tab')
    expect(document.activeElement).toBe(items[0])
    press(document.activeElement as HTMLElement, 'Escape')
    await settle()
    expect(document.activeElement).toBe(row)
    expect(drawer()).toBeTruthy()
  })

  it('hands focus back to the bar\'s menu button when Escape closes the drawer', async () => {
    mount(<Phone />)
    await openDrawer()
    expect(drawer()!.contains(document.activeElement)).toBe(true)
    press(document.activeElement as HTMLElement, 'Escape')
    await settle()
    expect(drawer()).toBeNull()
    expect(document.activeElement).toBe(menu())
    expect(closes).toBe(1)
  })

  it('hands focus back to the bar\'s menu button when a recent is chosen', async () => {
    mount(<Phone />)
    await openDrawer()
    press(drawer()!.querySelectorAll<HTMLElement>('[data-slot="rail-session"]')[0]!)
    await settle()
    expect(drawer()).toBeNull()
    expect(document.activeElement).toBe(menu())
    expect(closes).toBe(1)
  })

  it('hands focus back to the bar\'s menu button when an account row is chosen', async () => {
    mount(<Phone over={{ account: { ...ACCOUNT, groups: [[{ id: 'usage', label: 'Usage', onPress: () => {} }]] } }} />)
    await openDrawer()
    const row = drawer()!.querySelector<HTMLElement>('[data-slot="rail-account"]')!
    press(row)
    await settle()
    press(document.activeElement as HTMLElement)
    await settle()
    expect(drawer()).toBeNull()
    expect(document.activeElement).toBe(menu())
    expect(closes).toBe(1)
  })
})

describe('RailNotice', () => {
  it('offers its action, described by its title, and dismisses', () => {
    const onAction = vi.fn()
    const onDismiss = vi.fn()
    mount(rail({ notice: <RailNotice title="Try Hanzo in Slack" action="Set up" onAction={onAction} onDismiss={onDismiss} /> }))
    const action = q('[data-slot="rail-notice-action"]')!
    expect(action.textContent).toBe('Set up')
    expect(document.getElementById(action.getAttribute('aria-describedby')!)!.textContent).toBe('Try Hanzo in Slack')
    press(action)
    act(() => q('[aria-label="Dismiss"]')!.click())
    expect(onAction).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
    // Above the account row, inside the rail.
    const notice = q('[data-slot="rail-notice"]')!
    expect(notice.compareDocumentPosition(q('[data-slot="rail-foot"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is not drawn on the collapsed rail', () => {
    mount(rail({ collapsed: true, notice: <RailNotice title="Try Hanzo in Slack" /> }))
    expect(q('[data-slot="rail-notice"]')).toBeNull()
  })
})

describe('RailBar', () => {
  it('opens the drawer, names the surface and offers search', () => {
    const onMenu = vi.fn()
    const onSearch = vi.fn()
    const onBrand = vi.fn()
    mount(<RailBar onMenu={onMenu} menuLabel="Open runs" brand="Hanzo Build" onBrand={onBrand} onSearch={onSearch} searchLabel="Search runs" />)
    const bar = q('[data-slot="rail-bar"]')!
    expect(bar.textContent).toBe('Hanzo Build')
    act(() => q('[aria-label="Open runs"]')!.click())
    act(() => q('[aria-label="Search runs"]')!.click())
    press(q('[data-slot="rail-brand"]')!)
    expect([onMenu, onSearch, onBrand].map((f) => f.mock.calls.length)).toEqual([1, 1, 1])
  })

  it('draws no search when there is none', () => {
    mount(<RailBar onMenu={() => {}} brand="Hanzo Build" />)
    expect(q('[aria-label="Search"]')).toBeNull()
  })
})

describe('collapse is an explicit toggle', () => {
  it('reports collapse from the toggle and never changes itself', () => {
    const onCollapse = vi.fn()
    mount(rail({ onCollapse }))
    act(() => q('[aria-label="Collapse sidebar"]')!.click())
    expect(onCollapse).toHaveBeenCalledWith(true)
    // Nothing moved: the host owns the state.
    expect(q('[data-slot="session-rail"]')!.getAttribute('data-collapsed')).toBe('false')
  })

  it('collapsed, draws the icon rail: no head, no labels, no recents, named icons, and the expand control', () => {
    const onCollapse = vi.fn()
    const onSearch = vi.fn()
    mount(rail({ collapsed: true, onCollapse, onSearch }))
    const nav = q('[data-slot="session-rail"]')!
    expect(nav.getAttribute('data-collapsed')).toBe('true')
    expect(q('[data-slot="rail-head"]')).toBeNull()
    expect(q('[data-slot="rail-recents"]')).toBeNull()
    expect(nav.textContent).not.toContain('Artifacts')
    expect(nav.textContent).not.toContain('Hanzo Build')
    expect(q('[data-slot="rail-new"]')!.getAttribute('aria-label')).toBe('New')
    expect(q('[aria-label="Artifacts"]')!.getAttribute('title')).toBe('Artifacts')
    // Search stays one press away on the rail, as an icon.
    press(q('[data-slot="rail-search"]')!)
    expect(onSearch).toHaveBeenCalledOnce()
    expect(q('[data-slot="rail-search"]')!.getAttribute('aria-label')).toBe('Search runs')
    act(() => q('[aria-label="Expand sidebar"]')!.click())
    expect(onCollapse).toHaveBeenCalledWith(false)
  })
})

describe('the drawer', () => {
  it('opens the same contents as a dialog, and closes when a session is chosen', () => {
    const onOpenChange = vi.fn()
    const onOpen = vi.fn()
    mount(rail({ open: true, onOpenChange, onOpen }))
    const drawer = document.querySelector<HTMLElement>('[data-slot="session-rail-drawer"]')!
    expect(drawer.getAttribute('role')).toBe('navigation')
    const rows = all('[data-slot="rail-session"]', drawer)
    expect(rows).toHaveLength(RECENTS.length)
    // No collapse toggle in a drawer: a phone has no rail.
    expect(drawer.querySelector('[aria-label="Collapse sidebar"]')).toBeNull()
    act(() => rows[0].click())
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onOpen).toHaveBeenCalledWith('s1')
  })

  it('closes when a link, a More link, the brand, search, New or an account row is chosen — once per choice', async () => {
    const onOpenChange = vi.fn()
    const link = vi.fn()
    const deeper = vi.fn()
    const row = vi.fn()
    const onSearch = vi.fn()
    const onNew = vi.fn()
    // The host keeps it open, so every choice is asked of the same drawer.
    mount(
      rail({
        open: true,
        onOpenChange,
        onSearch,
        onNew,
        links: [{ id: 'artifacts', label: 'Artifacts', icon: <Icon />, onPress: link }],
        more: [{ id: 'projects', label: 'Projects', icon: <Icon />, onPress: deeper }],
        account: { ...ACCOUNT, groups: [[{ id: 'usage', label: 'Usage', onPress: row }]] },
      }),
    )
    const drawer = () => document.querySelector<HTMLElement>('[data-slot="session-rail-drawer"]')!
    // A row's text is its icon's then its label's.
    const inDrawer = (label: string) =>
      [...drawer().querySelectorAll<HTMLElement>('[data-slot="rail-row"]')].find((r) => r.textContent?.endsWith(label))!
    // Each choice is its own gesture, in its own turn.
    const choose = async (el: () => HTMLElement) => {
      act(() => el().click())
      await settle(0)
    }

    await choose(() => inDrawer('Artifacts'))
    await choose(() => drawer().querySelector<HTMLElement>('[data-slot="rail-more"]')!)
    // Unfolding More is not a choice: it does not close the drawer.
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    await choose(() => inDrawer('Projects'))
    await choose(() => drawer().querySelector<HTMLElement>('[data-slot="rail-brand"]')!)
    await choose(() => drawer().querySelector<HTMLElement>('[data-slot="rail-search"]')!)
    await choose(() => drawer().querySelector<HTMLElement>('[data-slot="rail-account"]')!)
    await choose(() => [...document.querySelectorAll<HTMLElement>('[data-slot="rail-menu"] [role="menuitem"]')].find((r) => r.textContent === 'Usage')!)

    expect([link, deeper, onSearch, row].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1])
    // The brand starts a new session.
    expect(onNew).toHaveBeenCalledOnce()
    expect(onOpenChange.mock.calls).toEqual([[false], [false], [false], [false], [false]])
  })

  it('tells the host once when a choice and the dialog both report the same close', async () => {
    const onOpenChange = vi.fn()
    mount(rail({ open: true, onOpenChange }))
    const drawer = document.querySelector<HTMLElement>('[data-slot="session-rail-drawer"]')!
    // One turn: a recent is chosen, and the dialog hears Escape as it goes.
    act(() => {
      drawer.querySelector<HTMLElement>('[data-slot="rail-session"]')!.click()
      drawer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    await settle(0)
    expect(onOpenChange.mock.calls).toEqual([[false]])
  })

  it('renders nothing extra while closed', () => {
    mount(rail())
    expect(document.querySelector('[data-slot="session-rail-drawer"]')).toBeNull()
  })
})

describe('EmptyPrompt', () => {
  it('is a heading at the level asked, with the mark beside it', () => {
    mount(<EmptyPrompt mark={<span data-testid="mark">*</span>} level={2} />)
    const title = q('[data-slot="empty-prompt-title"]')!
    expect(title.getAttribute('role')).toBe('heading')
    expect(title.getAttribute('aria-level')).toBe('2')
    expect(title.textContent).toBe('What’s up next?')
    expect(q('[data-slot="empty-prompt-mark"]')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('takes its own question and draws no mark when given none', () => {
    mount(<EmptyPrompt title="Build something" />)
    expect(q('[data-slot="empty-prompt-title"]')!.textContent).toBe('Build something')
    expect(q('[data-slot="empty-prompt-mark"]')).toBeNull()
  })
})

describe('accessibility', () => {
  it('has no axe violations expanded, with More open', async () => {
    mount(rail())
    act(() => q('[data-slot="rail-more"]')!.click())
    expect(await audit(host)).toEqual([])
  })

  it('has no axe violations collapsed', async () => {
    mount(rail({ collapsed: true }))
    expect(await audit(host)).toEqual([])
  })

  it('has no axe violations as a drawer', async () => {
    mount(rail({ open: true }))
    expect(await audit(document.body)).toEqual([])
  })

  it('has no axe violations with the account menu open and a notice', async () => {
    mount(rail({ notice: <RailNotice icon={<Icon />} title="Try Hanzo in Slack" action="Set up" onAction={() => {}} onDismiss={() => {}} /> }))
    act(() => q('[data-slot="rail-account"]')!.click())
    expect(await audit(document.body)).toEqual([])
  })

  it('has no axe violations on the phone bar', async () => {
    mount(<RailBar onMenu={() => {}} menuLabel="Open runs" brand="Hanzo Build" onBrand={() => {}} onSearch={() => {}} />)
    expect(await audit(host)).toEqual([])
  })

  it('has no axe violations on the empty prompt', async () => {
    mount(<EmptyPrompt mark={<span>*</span>} />)
    expect(await audit(host)).toEqual([])
  })
})
