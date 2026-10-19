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

  it('paints keys and each JSON type with its own code-theme key', () => {
    const ui = mount(<JsonTree data={{ s: 'x', n: 1, b: true, z: null }} />)
    const colour = (el: Element) => [...el.classList].find((c) => c.startsWith('_col-'))
    const values = [...ui.host.querySelectorAll('[data-slot="json-tree-value"]')].map((v) => [
      v.getAttribute('data-type'),
      colour(v),
    ])
    expect(values).toEqual([
      ['string', '_col-codeString'],
      ['number', '_col-codeNumber'],
      ['boolean', '_col-codeBoolean'],
      ['null', '_col-codeNull'],
    ])
    expect(colour(ui.slot('json-tree-key')!)).toBe('_col-codeKey')
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
    // The actions are icons, and each names itself.
    expect(ui.slot('json-tree-expand')?.getAttribute('aria-label')).toBe('Expand all')
    expect(ui.slot('json-tree-collapse')?.getAttribute('aria-label')).toBe('Collapse all')
    expect(ui.slot('json-tree-copy')?.getAttribute('aria-label')).toBe('Copy Raw response')

    act(() => ui.slot('json-tree-expand')?.click())
    expect(ui.keys()).toContain('payments:')

    act(() => ui.slot('json-tree-collapse')?.click())
    expect(ui.keys()).toEqual([])
    expect(ui.row('root')?.getAttribute('aria-expanded')).toBe('false')
    ui.cleanup()
  })

  it('keeps a dotted key and a nested key apart', () => {
    const ui = mount(<JsonTree data={{ 'a.b': { x: 1 }, a: { b: { y: 2 } } }} depth={1} />)
    act(() => ui.row('a.b')?.click())
    expect(ui.row('a.b')?.getAttribute('aria-expanded')).toBe('true')
    act(() => ui.row('a')?.click())
    expect(ui.row('b')?.getAttribute('aria-expanded')).toBe('false')
    ui.cleanup()
  })

  it('filters by key, by dotted path and by value, opening each match and its ancestors', () => {
    const ui = mount(<JsonTree data={DATA} depth={1} />)
    const type = (q: string) =>
      act(() => {
        const input = ui.slot('json-tree-filter') as HTMLInputElement
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
        set.call(input, q)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

    type('probabilities')
    expect(ui.keys()).toEqual(['answers:', 'team:', 'probabilities:', 'payments:', 'product:'])

    type('answers.team.choice')
    expect(ui.keys()).toEqual(['answers:', 'team:', 'choice:'])

    type('payments')
    // The value "payments" under `choice`, and the key `payments` under probabilities.
    expect(ui.keys()).toEqual(['answers:', 'team:', 'choice:', 'probabilities:', 'payments:'])

    type('zzz')
    expect(ui.keys()).toEqual([])
    expect(ui.slot('json-tree-empty')?.textContent).toContain('zzz')

    type('')
    expect(ui.keys()).toEqual(['id:', 'answers:', 'tags:', 'ok:', 'none:'])
    expect(ui.row('answers')?.getAttribute('aria-expanded')).toBe('false')
    ui.cleanup()
  })

  it('resizes from its bottom edge by keyboard, reports each height, and hands it back on a double-click', () => {
    const heights: (number | null)[] = []
    const ui = mount(<JsonTree data={DATA} resizable minHeight={80} maxHeight={200} onResize={(h) => heights.push(h)} />)
    const grip = ui.host.querySelector<HTMLElement>('[data-slot="grip"]')!
    expect(grip.getAttribute('role')).toBe('separator')
    expect(grip.getAttribute('aria-label')).toBe('Resize JSON')

    vi.spyOn(grip.parentElement!, 'getBoundingClientRect').mockReturnValue({ height: 150, width: 0 } as DOMRect)
    act(() => {
      grip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    })
    expect(heights).toEqual([158])
    expect(grip.getAttribute('aria-valuenow')).toBe('158')

    act(() => {
      grip.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    expect(heights).toEqual([158, null])
    ui.cleanup()

    const again = mount(<JsonTree data={DATA} resizable defaultHeight={240} />)
    expect(again.host.querySelector('[data-slot="grip"]')?.getAttribute('aria-valuenow')).toBe('240')
    again.cleanup()
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

describe('JsonTree, boxed', () => {
  it('boxes each arrow and each key, the key led by an icon of its type, 32px a level', () => {
    const ui = mount(<JsonTree data={{ a: { b: 'x', n: 2 } }} variant="boxed" depth={2} search={false} showCopyButton={false} />)
    const arrow = ui.slot('json-tree-arrow')!
    expect(getComputedStyle(arrow).width === '24px' || arrow.className.includes('_width-24px')).toBe(true)
    const keys = [...ui.host.querySelectorAll<HTMLElement>('[data-slot="json-tree-key"]')]
    expect(keys.map((k) => k.textContent)).toEqual(['a', 'b', 'n'])
    expect(keys.every((k) => k.querySelector('svg'))).toBe(true)
    const rows = [...ui.host.querySelectorAll<HTMLElement>('[data-slot="json-tree-row"]')]
    expect(rows[1].className).toMatch(/_pl-32px/)
    ui.cleanup()
  })

  it('marks a node by its dotted keyPath, and partial-blue only on the way there', () => {
    const seen: string[] = []
    const mark = (path: string) => {
      seen.push(path)
      return path === 'a.b' ? 'blue' : path === 'a' ? 'partial-blue' : path === 'a.n' ? 'red' : null
    }
    const ui = mount(<JsonTree data={{ a: { b: 'x', n: 2 } }} variant="boxed" depth={2} getNodeHighlighting={mark} />)
    expect(seen).toEqual(expect.arrayContaining(['a', 'a.b', 'a.n']))
    const rows = [...ui.host.querySelectorAll<HTMLElement>('[data-slot="json-tree-row"]')]
    expect(rows.map((r) => r.getAttribute('data-highlight'))).toEqual([null, 'partial-blue', 'blue', 'red'])
    ui.cleanup()
  })

  it('onNodeValueClick makes each leaf a button that names its path and value', () => {
    const pick = vi.fn()
    const ui = mount(<JsonTree data={{ user: { email: 'a@b.co' } }} depth={2} onNodeValueClick={pick} />)
    const button = ui.host.querySelector<HTMLElement>('[data-slot="json-tree-value-button"]')!
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-label')).toBe('user.email: "a@b.co"')
    act(() => button.click())
    expect(pick).toHaveBeenCalledWith('a@b.co', 'user.email')
    ui.cleanup()
  })

  it('entries draw a labelled root, keyed by id; the empty words are the host’s', () => {
    const pick = vi.fn()
    const ui = mount(
      <JsonTree
        variant="boxed"
        depth={2}
        search={false}
        showCopyButton={false}
        onNodeValueClick={pick}
        labels={{ emptyString: 'Vide', emptyArray: 'Aucun élément' }}
        entries={[
          { id: 'step1', label: 'Find person', value: '' },
          { id: 'step2', label: 'Send email', value: [] },
        ]}
      />,
    )
    expect(ui.keys()).toEqual(['Find person', 'Send email'])
    expect(ui.host.textContent).toContain('Vide')
    expect(ui.host.textContent).toContain('Aucun élément')
    act(() => ui.host.querySelector<HTMLElement>('[data-slot="json-tree-value-button"]')!.click())
    expect(pick).toHaveBeenCalledWith('', 'step1')
    ui.cleanup()
  })
})

