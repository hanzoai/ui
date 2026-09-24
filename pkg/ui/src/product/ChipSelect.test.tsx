// @vitest-environment jsdom

/**
 * ChipSelect against a live DOM: the chip opens the panel, the loader is paged,
 * the keyboard moves a cursor the field owns, and the markup holds up to axe.
 *
 * The panel is portalled, so its rows are read off `document`, not the host.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { ChipSelect } from './ChipSelect'
import type { ChipItem, ChipLoad, ChipPage } from './chipSelect.logic'

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
  vi.useRealTimers()
})

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

/** Let queued promises and zero-delay timers run, inside act. */
const settle = async (ms = 0) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

const chip = () => host.querySelector<HTMLElement>('[data-slot="chip-select"]')!
const field = () => document.querySelector<HTMLInputElement>('[data-slot="chip-select-input"]')
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]
const labels = () => options().map((o) => o.textContent)

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  act(() => {
    el.dispatchEvent(ev)
  })
  return ev.defaultPrevented
}

const type = (text: string) => {
  const el = field()!
  act(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    set.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const item = (id: string): ChipItem => ({ id, label: id })

/** A loader over `n` rows, `size` per page, cursors `c<index>`; records each call. */
const pager = (n: number, size = 5) => {
  const all = Array.from({ length: n }, (_, i) => item(`org/repo-${String(i).padStart(2, '0')}`))
  const calls: [string, string | null | undefined][] = []
  const load: ChipLoad<ChipItem> = async (q, after) => {
    calls.push([q, after])
    const hit = all.filter((i) => i.label.includes(q))
    const start = after ? Number(after.slice(1)) : 0
    const page: ChipPage<ChipItem> = { items: hit.slice(start, start + size) }
    if (start + size < hit.length) page.next = `c${start + size}`
    return page
  }
  return { load, calls }
}

describe('the chip', () => {
  it('names itself by what it chooses and what is chosen, and says it opens a listbox', () => {
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} items={[]} />)
    expect(chip().getAttribute('aria-label')).toBe('Repository: cloud')
    expect(chip().getAttribute('aria-haspopup')).toBe('listbox')
    expect(chip().getAttribute('aria-expanded')).toBe('false')
    expect(chip().textContent).toBe('cloud')
  })

  it('opens on a click and on Enter from the keyboard', async () => {
    mount(<ChipSelect name="Branch" label="main" onChange={() => {}} items={[item('main'), item('dev')]} />)
    act(() => chip().click())
    expect(chip().getAttribute('aria-expanded')).toBe('true')
    expect(field()).toBeTruthy()

    key(field()!, 'Escape')
    await settle()
    expect(chip().getAttribute('aria-expanded')).toBe('false')

    expect(key(chip(), 'Enter')).toBe(true)
    expect(chip().getAttribute('aria-expanded')).toBe('true')
  })

  it('carries a typed key into the search', async () => {
    const { load, calls } = pager(3)
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} load={load} delay={0} />)
    key(chip(), 'r')
    await settle()
    expect(field()!.value).toBe('r')
    expect(calls.at(-1)).toEqual(['r', null])
  })

  it('is inert while disabled', () => {
    mount(<ChipSelect name="Branch" label="main" onChange={() => {}} items={[]} disabled />)
    key(chip(), 'Enter')
    expect(chip().getAttribute('aria-expanded')).toBe('false')
    expect(chip().getAttribute('tabindex')).toBe('-1')
  })
})

describe('the list', () => {
  it('pins the chosen row first, checked and aria-selected', async () => {
    const chosen = item('hanzo-inc/cloud')
    mount(
      <ChipSelect
        name="Repository"
        label="cloud"
        chosen={chosen}
        onChange={() => {}}
        items={[item('acme/site'), chosen, item('ad-xyz/adx')]}
      />,
    )
    act(() => chip().click())
    expect(labels()).toEqual(['hanzo-inc/cloud', 'acme/site', 'ad-xyz/adx'])
    expect(options()[0].getAttribute('aria-selected')).toBe('true')
    expect(options()[1].getAttribute('aria-selected')).toBe('false')
  })

  it('narrows a given list as the search is typed', async () => {
    mount(
      <ChipSelect name="Branch" label="main" onChange={() => {}} items={[item('main'), item('dev'), item('dev-2')]} />,
    )
    act(() => chip().click())
    type('dev')
    expect(labels()).toEqual(['dev', 'dev-2'])
  })

  it('shows the empty sentence when nothing matches', async () => {
    mount(<ChipSelect name="Branch" label="main" onChange={() => {}} items={[item('main')]} empty="None here." />)
    act(() => chip().click())
    type('zzz')
    expect(document.querySelector('[data-slot="chip-select-empty"]')?.textContent).toBe('None here.')
  })

  it('draws the footer and the call to action', () => {
    mount(
      <ChipSelect
        name="Repository"
        label="cloud"
        onChange={() => {}}
        items={[]}
        footer={<span>Not all repositories are shown.</span>}
        cta={<span>Connect</span>}
      />,
    )
    act(() => chip().click())
    expect(document.querySelector('[data-slot="chip-select-footer"]')?.textContent).toContain('Not all')
    expect(document.querySelector('[data-slot="chip-select-cta"]')?.textContent).toBe('Connect')
  })
})

describe('the loader', () => {
  it('reads the first page on open, with no search and no cursor', async () => {
    const { load, calls } = pager(12)
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} load={load} />)
    act(() => chip().click())
    await settle()
    expect(calls).toEqual([['', null]])
    expect(options()).toHaveLength(5)
  })

  it('waits out the debounce before searching, and searches once', async () => {
    const { load, calls } = pager(30)
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} load={load} delay={200} />)
    act(() => chip().click())
    await settle()
    vi.useFakeTimers()
    type('1')
    type('12')
    await act(async () => {
      vi.advanceTimersByTime(150)
    })
    expect(calls).toEqual([['', null]])
    await act(async () => {
      vi.advanceTimersByTime(60)
    })
    vi.useRealTimers()
    await settle()
    expect(calls).toEqual([
      ['', null],
      ['12', null],
    ])
    expect(labels()).toEqual(['org/repo-12'])
  })

  it('asks for the next page when the cursor reaches the end, and appends it', async () => {
    const { load, calls } = pager(12)
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} load={load} delay={0} />)
    act(() => chip().click())
    await settle()
    key(field()!, 'End')
    await settle()
    expect(calls).toEqual([
      ['', null],
      ['', 'c5'],
    ])
    expect(options()).toHaveLength(10)
    // The last page is the last: no cursor, no further call.
    key(field()!, 'End')
    await settle()
    key(field()!, 'End')
    await settle()
    expect(calls.at(-1)).toEqual(['', 'c10'])
    expect(options()).toHaveLength(12)
    const before = calls.length
    key(field()!, 'End')
    await settle()
    expect(calls.length).toBe(before)
  })

  it('drops an answer for a search that has since changed', async () => {
    let release: (p: ChipPage<ChipItem>) => void = () => {}
    const load: ChipLoad<ChipItem> = (q) =>
      q === 'slow'
        ? new Promise((r) => {
            release = r
          })
        : Promise.resolve({ items: [item(`fast:${q}`)] })
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} load={load} delay={0} />)
    act(() => chip().click())
    await settle()
    type('slow')
    await settle()
    type('quick')
    await settle()
    expect(labels()).toEqual(['fast:quick'])
    await act(async () => release({ items: [item('stale')] }))
    expect(labels()).toEqual(['fast:quick'])
  })

  it('says a failure and retries it', async () => {
    let fail = true
    const load: ChipLoad<ChipItem> = async () => {
      if (fail) throw new Error('GitHub did not answer.')
      return { items: [item('back')] }
    }
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} load={load} delay={0} />)
    act(() => chip().click())
    await settle()
    const alert = document.querySelector('[data-slot="chip-select-error"]')
    expect(alert?.getAttribute('role')).toBe('alert')
    expect(alert?.textContent).toContain('GitHub did not answer.')
    fail = false
    const retry = [...alert!.querySelectorAll<HTMLElement>('[role="button"]')].find((b) => b.textContent === 'Retry')!
    act(() => retry.click())
    await settle()
    expect(labels()).toEqual(['back'])
  })
})

describe('the keyboard', () => {
  it('moves a cursor the field owns through aria-activedescendant', () => {
    mount(<ChipSelect name="Branch" label="main" onChange={() => {}} items={[item('a'), item('b'), item('c')]} />)
    act(() => chip().click())
    const f = field()!
    expect(f.getAttribute('role')).toBe('combobox')
    expect(f.getAttribute('aria-activedescendant')).toBe(options()[0].id)
    key(f, 'ArrowDown')
    expect(f.getAttribute('aria-activedescendant')).toBe(options()[1].id)
    key(f, 'End')
    expect(f.getAttribute('aria-activedescendant')).toBe(options()[2].id)
    key(f, 'Home')
    expect(f.getAttribute('aria-activedescendant')).toBe(options()[0].id)
    key(f, 'ArrowUp')
    expect(f.getAttribute('aria-activedescendant')).toBe(options()[0].id)
  })

  it('picks the row under the cursor on Enter, closes, and returns focus to the chip', async () => {
    const onChange = vi.fn()
    mount(<ChipSelect name="Branch" label="main" onChange={onChange} items={[item('a'), item('b')]} />)
    act(() => chip().click())
    key(field()!, 'ArrowDown')
    key(field()!, 'Enter')
    await settle()
    expect(onChange).toHaveBeenCalledWith(item('b'))
    expect(chip().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(chip())
  })

  it('picks a row on a click', async () => {
    const onChange = vi.fn()
    mount(<ChipSelect name="Branch" label="main" onChange={onChange} items={[item('a'), item('b')]} />)
    act(() => chip().click())
    act(() => options()[1].click())
    await settle()
    expect(onChange).toHaveBeenCalledWith(item('b'))
  })

  it('runs the row action on Ctrl+Enter instead of choosing', async () => {
    const onChange = vi.fn()
    const onPress = vi.fn()
    mount(
      <ChipSelect
        name="Repository"
        label="cloud"
        onChange={onChange}
        items={[item('a'), item('b')]}
        action={{ label: 'Add to project', onPress }}
      />,
    )
    act(() => chip().click())
    expect(options()[0].getAttribute('aria-describedby')).toBeTruthy()
    key(field()!, 'Enter', { ctrlKey: true })
    await settle()
    expect(onPress).toHaveBeenCalledWith(item('a'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('leaves Home and End to the caret while there is text', () => {
    mount(<ChipSelect name="Branch" label="main" onChange={() => {}} items={[item('ab'), item('ac')]} />)
    act(() => chip().click())
    type('a')
    expect(key(field()!, 'End')).toBe(false)
  })
})

describe('accessibility', () => {
  it('has no axe violations closed', async () => {
    mount(<ChipSelect name="Repository" label="cloud" onChange={() => {}} items={[]} />)
    expect(await audit(host)).toEqual([])
  })

  it('has no axe violations open, with a footer, an action and a chosen row', async () => {
    const chosen = item('hanzo-inc/cloud')
    mount(
      <ChipSelect
        name="Repository"
        label="cloud"
        chosen={chosen}
        onChange={() => {}}
        items={[chosen, item('acme/site')]}
        footer={<span>Not all repositories are shown.</span>}
        action={{ label: 'Add to project', onPress: () => {} }}
      />,
    )
    act(() => chip().click())
    expect(await audit(document.body)).toEqual([])
  })
})
