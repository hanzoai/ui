// @vitest-environment jsdom

/**
 * The catalogue page against a live DOM: the kinds are a tablist with one tab
 * stop that arrows move, Yours/Discover is the package's segmented control, the
 * search and the Add report out, and the cards are a named list whose press and
 * action are two controls, never one inside the other. How many columns the
 * cards take is a width question; the consumer suite measures it at 390 and
 * 1280.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { BookOpen, Plug, Puzzle } from '@hanzogui/lucide-icons-2'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { Add, Featured, Shelf, Tile, Tiles, type ShelfProps } from './index'

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

const q = (sel: string) => host.querySelector<HTMLElement>(sel)
const all = (sel: string, from: ParentNode = host) => [...from.querySelectorAll<HTMLElement>(sel)]
const key = (el: HTMLElement, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })

const KINDS = [
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'connectors', label: 'Connectors', icon: Plug },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
]

const shelf = (over: Partial<ShelfProps> = {}) => (
  <Shelf
    title="Customize"
    detail="What the agent brings to a run."
    tabs={KINDS}
    tab="connectors"
    onTab={() => {}}
    view="yours"
    onView={() => {}}
    search="Search connectors"
    query=""
    onQuery={() => {}}
    add="Add connector"
    onAdd={() => {}}
    {...over}
  >
    <Featured title="Slack" detail="Talk to the agent from a channel." mark={<span aria-hidden>S</span>} onOpen={() => {}} />
    <Tiles label="Connectors to add">
      <Tile title="GitHub" detail="Repositories and issues." meta="Official" onOpen={() => {}} action={<Add name="GitHub" added={false} onPress={() => {}} />} />
      <Tile title="Linear" action={<Add name="Linear" added onPress={() => {}} />} />
    </Tiles>
  </Shelf>
)

describe('Shelf', () => {
  it('heads the page and names every control', () => {
    mount(shelf())
    const title = q('[role="heading"]')!
    expect([title.textContent, title.getAttribute('aria-level')]).toEqual(['Customize', '1'])
    expect(q('[role="tablist"][aria-label="Customize"]')).toBeTruthy()
    expect(q('[role="tablist"][aria-label="Show"]')).toBeTruthy()
    expect(q('input[aria-label="Search connectors"]')!.getAttribute('placeholder')).toBe('Search connectors…')
    expect(host.textContent).toContain('Add connector')
  })

  it('marks the open kind, and is one tab stop', () => {
    mount(shelf())
    const tabs = all('[data-slot="shelf-tab"]')
    expect(tabs.map((t) => [t.textContent, t.getAttribute('aria-selected'), t.getAttribute('tabindex')])).toEqual([
      ['Skills', 'false', '-1'],
      ['Connectors', 'true', '0'],
      ['Plugins', 'false', '-1'],
    ])
  })

  it('chooses a kind by press, Enter, arrows, Home and End', () => {
    const onTab = vi.fn()
    mount(shelf({ onTab }))
    const tabs = all('[data-slot="shelf-tab"]')
    act(() => tabs[0].click())
    key(tabs[2], 'Enter')
    key(tabs[1], 'ArrowRight')
    key(tabs[0], 'ArrowLeft')
    key(tabs[1], 'Home')
    key(tabs[1], 'End')
    expect(onTab.mock.calls.map((c) => c[0])).toEqual(['skills', 'plugins', 'plugins', 'plugins', 'skills', 'plugins'])
  })

  it('switches Yours and Discover, searches and adds', () => {
    const onView = vi.fn()
    const onQuery = vi.fn()
    const onAdd = vi.fn()
    mount(shelf({ onView, onQuery, onAdd }))
    const halves = all('[role="tablist"][aria-label="Show"] [role="tab"]')
    expect(halves.map((h) => [h.textContent, h.getAttribute('aria-selected')])).toEqual([
      ['Yours', 'true'],
      ['Discover', 'false'],
    ])
    act(() => halves[1].click())
    expect(onView).toHaveBeenCalledWith('discover')

    const field = q('input[aria-label="Search connectors"]') as HTMLInputElement
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, 'git')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(onQuery).toHaveBeenLastCalledWith('git')

    act(() => [...host.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent?.includes('Add connector'))!.click())
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('controls one tabpanel from the open tab, labelled by it, holding the search and the cards', () => {
    mount(shelf())
    const panel = q('[role="tabpanel"]')!
    const open = all('[data-slot="shelf-tab"]').find((t) => t.getAttribute('aria-selected') === 'true')!
    expect(open.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(open.id)
    expect(panel.contains(q('input[aria-label="Search connectors"]'))).toBe(true)
    expect(panel.contains(q('[role="list"][aria-label="Connectors to add"]'))).toBe(true)
    // Only the open tab claims the panel.
    expect(all('[data-slot="shelf-tab"][aria-controls]')).toHaveLength(1)
  })

  it('keeps the strip reachable when the open kind is none of the tabs', () => {
    mount(shelf({ tab: 'gone' }))
    expect(all('[data-slot="shelf-tab"]').map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
    expect(q('[role="tabpanel"]')!.getAttribute('aria-label')).toBe('Customize')
  })

  it('draws no Add when there is none to offer', () => {
    mount(shelf({ add: undefined, onAdd: undefined }))
    expect(host.textContent).not.toContain('Add connector')
  })

  it('has no axe violations', async () => {
    mount(shelf())
    expect(await audit(host)).toEqual([])
  })
})

describe('the cards', () => {
  it('are a named list of items', () => {
    mount(shelf())
    const list = q('[role="list"][aria-label="Connectors to add"]')!
    expect(all('[role="listitem"]', list).map((t) => t.getAttribute('data-slot'))).toEqual(['tile', 'tile'])
    expect(list.getAttribute('data-slot')).toBe('grid')
  })

  it('open by press and keyboard, with the action beside the press, never inside it', () => {
    const onOpen = vi.fn()
    const onPress = vi.fn()
    mount(
      <Tiles label="Skills">
        <Tile title="git_repos" detail="List repositories." onOpen={onOpen} action={<Add name="git_repos" added={false} onPress={onPress} />} />
      </Tiles>,
    )
    const open = q('[data-slot="tile-open"]')!
    // Named by its title and described by the lines under it — an aria-label
    // of the title alone hid what it does from a reader.
    expect(open.getAttribute('aria-label')).toBeNull()
    expect(document.getElementById(open.getAttribute('aria-labelledby')!)!.textContent).toBe('git_repos')
    expect(open.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent)).toEqual(['List repositories.'])
    act(() => open.click())
    key(open, 'Enter')
    expect(onOpen).toHaveBeenCalledTimes(2)
    const add = q('[aria-label="Add git_repos"]')!
    expect(open.contains(add)).toBe(false)
    act(() => add.click())
    expect(onPress).toHaveBeenCalledOnce()
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('are words only when they do not open', () => {
    mount(
      <Tiles label="Skills">
        <Tile title="kms_secrets" />
      </Tiles>,
    )
    expect(q('[data-slot="tile-open"]')).toBeNull()
    expect(q('[role="button"]')).toBeNull()
  })

  it('say added with a check, and wait while busy — inert, still focusable, still named', () => {
    const onPress = vi.fn()
    mount(
      <>
        <Add name="a" added onPress={onPress} />
        <Add name="b" added={false} busy onPress={onPress} />
      </>,
    )
    const a = q('[aria-label="a is added"]')!
    const b = q('[aria-label="Add b"]')!
    for (const el of [a, b]) {
      expect(el.tagName).toBe('BUTTON')
      expect(el.hasAttribute('disabled')).toBe(false)
      expect(el.getAttribute('aria-disabled')).toBe('true')
      act(() => el.click())
    }
    expect(b.getAttribute('aria-busy')).toBe('true')
    expect(onPress).not.toHaveBeenCalled()
  })

  it('keep focus on the one button when the add lands', () => {
    function Card({ added }: { added: boolean }) {
      return <Add name="git_repos" added={added} onPress={() => {}} />
    }
    mount(<Card added={false} />)
    const before = q('[aria-label="Add git_repos"]')!
    before.focus()
    mount(<Card added />)
    const after = q('[aria-label="git_repos is added"]')!
    expect(after).toBe(before)
    expect(document.activeElement).toBe(after)
  })

  it('feature one card first, under its tag', () => {
    const onOpen = vi.fn()
    mount(<Featured title="Triage" detail="How we triage." mark={<span aria-hidden>T</span>} onOpen={onOpen} tag="New" />)
    const open = q('[data-slot="featured-open"]')!
    expect(open.textContent).toBe('TNewTriageHow we triage.')
    expect(document.getElementById(open.getAttribute('aria-labelledby')!)!.textContent).toBe('Triage')
    expect(open.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent)).toEqual(['New', 'How we triage.'])
    key(open, ' ')
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
