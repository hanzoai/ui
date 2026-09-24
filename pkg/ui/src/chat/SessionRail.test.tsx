// @vitest-environment jsdom

/**
 * SessionRail against a live DOM: the rows are real controls, the collapse is
 * an explicit toggle that only reports (the host persists it), the drawer
 * carries the same contents, and axe finds nothing in any of the three shapes.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { EmptyPrompt } from './EmptyPrompt'
import { SessionRail, type RailSession, type SessionRailProps } from './SessionRail'

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

const rail = (over: Partial<SessionRailProps> = {}) => (
  <SessionRail
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
    account={{ name: 'z@hanzo.ai', onPress: () => {} }}
    onSettings={() => {}}
    onSearch={() => {}}
    onCollapse={() => {}}
    {...over}
  />
)

const q = (sel: string) => host.querySelector<HTMLElement>(sel)
const all = (sel: string, from: ParentNode = host) => [...from.querySelectorAll<HTMLElement>(sel)]
const press = (el: HTMLElement, k = 'Enter') =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })

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

  it('names its icon-only controls', () => {
    const onSort = vi.fn()
    const onSettings = vi.fn()
    mount(rail({ onSort, onSettings }))
    const named = (label: string) => q(`[aria-label="${label}"]`)!
    act(() => named('Sort and filter').click())
    act(() => named('Settings').click())
    expect(onSort).toHaveBeenCalledOnce()
    expect(onSettings).toHaveBeenCalledOnce()
    expect(named('Search')).toBeTruthy()
    expect(named('Account: z@hanzo.ai').getAttribute('aria-haspopup')).toBe('menu')
  })

  it('shows the empty line when there are no recents', () => {
    mount(rail({ recents: [], empty: 'No sessions yet.' }))
    expect(all('[data-slot="rail-session"]')).toHaveLength(0)
    expect(host.textContent).toContain('No sessions yet.')
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

  it('collapsed, draws the icon rail: no labels, no recents, named icons, and the expand control', () => {
    const onCollapse = vi.fn()
    mount(rail({ collapsed: true, onCollapse }))
    const nav = q('[data-slot="session-rail"]')!
    expect(nav.getAttribute('data-collapsed')).toBe('true')
    expect(q('[data-slot="rail-recents"]')).toBeNull()
    expect(nav.textContent).not.toContain('Artifacts')
    expect(q('[data-slot="rail-new"]')!.getAttribute('aria-label')).toBe('New')
    expect(q('[aria-label="Artifacts"]')!.getAttribute('title')).toBe('Artifacts')
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

  it('has no axe violations on the empty prompt', async () => {
    mount(<EmptyPrompt mark={<span>*</span>} />)
    expect(await audit(host)).toEqual([])
  })
})
