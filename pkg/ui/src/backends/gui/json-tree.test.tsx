// @vitest-environment jsdom

/**
 * JsonTree on a live DOM: the first `depth` levels open, a branch row is a
 * button that toggles its children and says which way it is, Expand all and
 * Collapse all reach every level, leaves are typed for the reader, and Copy
 * writes the whole value, indented.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { JsonTree } from './json-tree'
import { toast } from './toaster'

vi.mock('./toaster', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const DATA = {
  id: 'dec_1',
  answers: { team: { type: 'choice', choice: 'payments', probabilities: { payments: 0.9, product: 0.1 } } },
  tags: [],
  ok: true,
  none: null,
}

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {node}
      </GuiProvider>,
    ),
  )
  const keys = () => [...host.querySelectorAll('[data-slot="json-tree-key"]')].map((k) => k.textContent)
  const row = (key: string) =>
    [...host.querySelectorAll<HTMLElement>('[role="button"]')].find((r) => r.getAttribute('aria-label')?.startsWith(`${key} `))
  return {
    host,
    keys,
    row,
    slot: (name: string) => host.querySelector<HTMLElement>(`[data-slot="${name}"]`),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('JsonTree', () => {
  it('opens the first `depth` levels and counts what a closed branch holds', () => {
    const ui = mount(<JsonTree data={DATA} depth={2} />)
    expect(ui.keys()).toEqual(['id:', 'answers:', 'team:', 'tags:', 'ok:', 'none:'])
    expect(ui.row('team')?.getAttribute('aria-expanded')).toBe('false')
    expect(ui.row('team')?.textContent).toContain('{3 keys}')
    expect(ui.row('answers')?.getAttribute('aria-expanded')).toBe('true')
    ui.cleanup()
  })

  it('types every leaf, and draws an empty branch without a toggle', () => {
    const ui = mount(<JsonTree data={DATA} />)
    const types = [...ui.host.querySelectorAll('[data-slot="json-tree-value"]')].map((v) => [
      v.getAttribute('data-type'),
      v.textContent,
    ])
    expect(types).toEqual([
      ['string', '"dec_1"'],
      ['boolean', 'true'],
      ['null', 'null'],
    ])
    expect(ui.row('tags')).toBeUndefined()
    expect(ui.host.textContent).toContain('[]')
    ui.cleanup()
  })

  it('toggles a branch on press and on Enter', () => {
    const ui = mount(<JsonTree data={DATA} depth={2} />)
    act(() => ui.row('team')?.click())
    expect(ui.row('team')?.getAttribute('aria-expanded')).toBe('true')
    expect(ui.keys()).toContain('choice:')

    act(() => {
      ui.row('team')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    expect(ui.keys()).not.toContain('choice:')
    ui.cleanup()
  })

  it('expands and collapses every level from the header', () => {
    const ui = mount(<JsonTree data={DATA} depth={1} title="Raw response" />)
    expect(ui.slot('json-tree-header')?.textContent).toContain('Raw response')

    act(() => ui.slot('json-tree-expand')?.click())
    expect(ui.keys()).toContain('payments:')

    act(() => ui.slot('json-tree-collapse')?.click())
    expect(ui.keys()).toEqual([])
    expect(ui.row('root')?.getAttribute('aria-expanded')).toBe('false')
    ui.cleanup()
  })

  it('copies the whole value, indented', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const ui = mount(<JsonTree data={DATA} />)

    await act(async () => {
      ui.slot('json-tree-copy')?.click()
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(DATA, null, 2))
    expect(toast.success).toHaveBeenCalledWith('JSON copied to clipboard')
    ui.cleanup()
  })
})
