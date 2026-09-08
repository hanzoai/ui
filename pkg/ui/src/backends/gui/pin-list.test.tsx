// @vitest-environment jsdom

/**
 * PinList's pin/unpin behaviour, asserted on a live DOM and on compiled markup
 * — never on text alone, since @hanzo/gui drops an unrecognised prop silently.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { PinList, type PinListItem } from './pin-list'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    rows: () => [...host.querySelectorAll<HTMLElement>('[data-slot="pin-list-row"]')],
    toggles: () => [...host.querySelectorAll<HTMLButtonElement>('[data-slot="pin-list-toggle"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const items: PinListItem[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
]

describe('PinList', () => {
  it('renders one row per item, each a real toggle button', () => {
    const markup = html(<PinList items={items} />)

    expect([...markup.matchAll(/data-slot="pin-list-row"/g)]).toHaveLength(3)
    const toggle = markup.match(/<button[^>]*data-slot="pin-list-toggle"[^>]*>/)?.[0] ?? ''
    expect(toggle).toContain('type="button"')
    expect(toggle).toMatch(/aria-pressed="(true|false)"/)
  })

  it('starts nothing pinned, and every row reports aria-pressed=false', () => {
    const markup = html(<PinList items={items} />)
    const pressed = [...markup.matchAll(/data-slot="pin-list-toggle"[^>]*aria-pressed="([^"]+)"/g)].map(
      (m) => m[1],
    )

    expect(pressed).toEqual(['false', 'false', 'false'])
  })

  it('honours defaultValue and marks those rows pinned', () => {
    const markup = html(<PinList items={items} defaultValue={['b']} />)
    const rows = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="pin-list-row"[^>]*>/g)].map((m) => m[0])

    // pinnedFirst defaults true, so b moves to the front.
    expect(rows[0]).toContain('data-pinned="true"')
    expect(rows[1]).toContain('data-pinned="false"')
    expect(rows[2]).toContain('data-pinned="false"')
  })

  it('pins a row on click, moves it to the top, and reports the new value', () => {
    const onValueChange = vi.fn()
    const view = mount(<PinList items={items} onValueChange={onValueChange} />)

    act(() => {
      view.toggles()[2].click() // Charlie
    })

    expect(onValueChange).toHaveBeenCalledWith(['c'])
    const rows = view.rows()
    expect(rows[0].textContent).toContain('Charlie')
    expect(rows[0].getAttribute('data-pinned')).toBe('true')
    expect(view.toggles()[0].getAttribute('aria-pressed')).toBe('true')

    view.cleanup()
  })

  it('unpins a pinned row and returns it to its base position', () => {
    const onValueChange = vi.fn()
    const view = mount(<PinList items={items} defaultValue={['b']} onValueChange={onValueChange} />)

    // b is first (pinned); its toggle is the first one rendered.
    act(() => {
      view.toggles()[0].click()
    })

    expect(onValueChange).toHaveBeenCalledWith([])
    const rows = view.rows()
    expect(rows.map((r) => r.textContent?.trim())).toEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(rows.every((r) => r.getAttribute('data-pinned') === 'false')).toBe(true)

    view.cleanup()
  })

  it('keeps base order when pinnedFirst is false', () => {
    const view = mount(<PinList items={items} defaultValue={['c']} pinnedFirst={false} />)

    // Order is unchanged: Charlie stays last even though it is pinned.
    expect(view.rows().map((r) => r.textContent?.trim())).toEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(view.rows()[2].getAttribute('data-pinned')).toBe('true')

    view.cleanup()
  })

  it('disables further pinning at max, without disabling unpin on already-pinned rows', () => {
    const view = mount(<PinList items={items} defaultValue={['a']} max={1} />)

    const toggles = view.toggles()
    // a is pinned and sorted first; its toggle stays enabled to allow unpin.
    expect(toggles[0].disabled).toBe(false)
    // b and c are unpinned and the cap is reached, so their toggles are disabled.
    expect(toggles[1].disabled).toBe(true)
    expect(toggles[2].disabled).toBe(true)

    act(() => {
      toggles[1].click()
    })
    // Clicking a disabled button does nothing — still only 'a' pinned.
    expect(view.rows()[0].textContent).toContain('Alpha')

    view.cleanup()
  })

  it('is a controlled component when value is supplied', () => {
    const onValueChange = vi.fn()
    const view = mount(<PinList items={items} value={[]} onValueChange={onValueChange} />)

    act(() => {
      view.toggles()[0].click()
    })

    expect(onValueChange).toHaveBeenCalledWith(['a'])
    // Parent did not update `value`, so the DOM stays unpinned.
    expect(view.rows()[0].getAttribute('data-pinned')).toBe('false')

    view.cleanup()
  })
})
