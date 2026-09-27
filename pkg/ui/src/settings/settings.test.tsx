// @vitest-environment jsdom

/**
 * The settings page against a live DOM: the grouped nav and the phone's chip
 * row both mark the open section and both choose one by pointer and keyboard,
 * the section is the host's children in the content column, and every section
 * part says what it is to assistive tech. Which of the nav and the chips is
 * SHOWN is a width question jsdom cannot answer; the consumer suite measures it
 * at 390 and 1280.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { Card, Field, Group, Heading, Note, Once, Row, Settings, Soft, type Entry } from './index'

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
const press = (el: HTMLElement, k = 'Enter') =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })

const ENTRIES: Entry[] = [
  { id: 'general', label: 'General', group: 'Settings' },
  { id: 'account', label: 'Account', group: 'Settings' },
  { id: 'keys', label: 'API keys', group: 'Code' },
  { id: 'members', label: 'Members', group: 'Organization' },
]

const page = (onPick = (_: string) => {}, groups?: string[]) => (
  <Settings entries={ENTRIES} groups={groups} active="account" onPick={onPick}>
    <Heading title="Account" detail="Who you are here." />
  </Settings>
)

describe('Settings', () => {
  it('lists the sections under their groups, in order, as a named navigation', () => {
    mount(page())
    const nav = q('[data-slot="settings-nav"]')!
    expect(nav.getAttribute('role')).toBe('navigation')
    expect(nav.getAttribute('aria-label')).toBe('Settings')
    const lists = all('[role="list"]', nav)
    const named = lists.map((l) => [
      document.getElementById(l.getAttribute('aria-labelledby')!)!.textContent,
      all('[data-slot="settings-entry"]', l).map((e) => e.textContent),
    ])
    expect(named).toEqual([
      ['Settings', ['General', 'Account']],
      ['Code', ['API keys']],
      ['Organization', ['Members']],
    ])
  })

  it('orders the groups as told, and leaves out a group with no sections', () => {
    mount(page(undefined, ['Organization', 'Empty', 'Settings', 'Code']))
    const heads = all('[role="list"]', q('[data-slot="settings-nav"]')!).map(
      (l) => document.getElementById(l.getAttribute('aria-labelledby')!)!.textContent,
    )
    expect(heads).toEqual(['Organization', 'Settings', 'Code'])
  })

  it('marks the open section in the nav and in the chips', () => {
    mount(page())
    const current = (slot: string) => all(`[data-slot="${slot}"][aria-current="page"]`).map((e) => e.textContent)
    expect(current('settings-entry')).toEqual(['Account'])
    expect(current('settings-chip')).toEqual(['Account'])
    expect(all('[data-slot="settings-chip"]').map((c) => c.textContent)).toEqual(ENTRIES.map((e) => e.label))
  })

  it('chooses a section by pointer and by keyboard, from the nav and from the chips', () => {
    const onPick = vi.fn()
    mount(page(onPick))
    act(() => all('[data-slot="settings-entry"]')[0].click())
    press(all('[data-slot="settings-entry"]')[2])
    act(() => all('[data-slot="settings-chip"]')[3].click())
    press(all('[data-slot="settings-chip"]')[1], ' ')
    expect(onPick.mock.calls.map((c) => c[0])).toEqual(['general', 'keys', 'members', 'account'])
  })

  it('draws the section as its children, in the content column', () => {
    mount(page())
    const body = q('[data-slot="settings-body"]')!
    expect(body.querySelector('[role="heading"]')!.textContent).toBe('Account')
  })

  it('has no axe violations', async () => {
    mount(page())
    expect(await audit(host)).toEqual([])
  })
})

describe('the section parts', () => {
  const section = (
    <Settings entries={ENTRIES} active="keys" onPick={() => {}}>
      <Heading title="API keys" detail="Keys this organization holds." action={<button type="button">New key</button>} />
      <Group title="Held" detail="One per kind.">
        <Card>
          <Row first title="hk-live" detail="Made Sep 27" mono leading={<span aria-hidden>·</span>} trailing={<button type="button">Revoke</button>} />
          <Row title="hk-test" />
        </Card>
      </Group>
      <Field label="Name" hint="Shown in the list.">
        <input aria-label="Name" />
      </Field>
      <Soft action={<button type="button">Sign in</button>}>Sign in to see your keys.</Soft>
      <Note>Saved.</Note>
      <Note>{''}</Note>
      <Once value="hk-live-3f9a0c" label="API key" />
    </Settings>
  )

  it('heads the section and each group at their own levels', () => {
    mount(section)
    const heads = all('[data-slot="settings-body"] [role="heading"]').map((h) => [h.textContent, h.getAttribute('aria-level')])
    expect(heads).toEqual([
      ['API keys', '2'],
      ['Held', '3'],
    ])
  })

  it('rules every row of a card but the first', () => {
    mount(section)
    const rows = all('[data-slot="settings-row"]')
    expect(rows.map((r) => r.textContent)).toEqual(['·hk-liveMade Sep 27Revoke', 'hk-test'])
  })

  it('keeps each note\'s live region mounted, empty when there is nothing to say', () => {
    mount(section)
    expect(all('[data-slot="settings-note"]').map((n) => [n.getAttribute('role'), n.textContent])).toEqual([
      ['status', 'Saved.'],
      ['status', ''],
    ])
  })

  it('shows a credential once, named, with its copy control', () => {
    mount(section)
    const once = q('[data-slot="settings-once"]')!
    expect(once.querySelector('[aria-label="API key"]')!.textContent).toBe('hk-live-3f9a0c')
    expect(once.querySelector('[aria-label="Copy api key"]')).toBeTruthy()
    expect(once.textContent).toContain('Copy it now. It is not shown again.')
  })

  it('draws the quiet line with its one action', () => {
    mount(section)
    const soft = q('[data-slot="settings-soft"]')!
    expect(soft.textContent).toBe('Sign in to see your keys.Sign in')
  })

  it('has no axe violations', async () => {
    mount(section)
    expect(await audit(host)).toEqual([])
  })
})
