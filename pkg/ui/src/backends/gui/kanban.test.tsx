// @vitest-environment jsdom

/**
 * Kanban behaviour, asserted on a live DOM: search filters cards, the add
 * dialog creates one, the menu deletes one, a full column disables its add
 * button, and a native drag-drop moves a card across columns.
 *
 * Imports `./kanban` directly rather than the backend barrel, so this test
 * only fails on this component's own regressions.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { KanbanBoard, type KanbanBoardData } from './kanban'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    rerender: (next: React.ReactNode) => act(() => root.render(wrap(next))),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const now = new Date().toISOString()

const board = (): KanbanBoardData => ({
  id: 'board-1',
  title: 'Project Board',
  labels: [{ id: 'bug', name: 'Bug', color: '#ef4444' }],
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      limit: 1,
      cards: [
        { id: 'card-1', title: 'Setup project', description: 'Init', priority: 'high', createdAt: now, updatedAt: now },
      ],
    },
    { id: 'doing', title: 'In Progress', cards: [] },
  ],
})

/** A fake DataTransfer good enough for dragstart→drop across two nodes. */
const dataTransfer = () => {
  const store = new Map<string, string>()
  return {
    effectAllowed: 'none',
    setData: (k: string, v: string) => store.set(k, v),
    getData: (k: string) => store.get(k) ?? '',
  } as unknown as DataTransfer
}

const fire = (el: Element, type: string, dt: DataTransfer) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: dt })
  act(() => {
    el.dispatchEvent(event)
  })
}

describe('KanbanBoard', () => {
  it('renders the board title, columns and cards', () => {
    const { host, cleanup } = mount(<KanbanBoard board={board()} onUpdateBoard={() => {}} />)

    expect(host.querySelectorAll('[data-slot="kanban-column"]')).toHaveLength(2)
    expect(host.querySelectorAll('[data-slot="kanban-card"]')).toHaveLength(1)
    expect(host.textContent).toContain('Project Board')
    expect(host.textContent).toContain('Setup project')

    cleanup()
  })

  it('filters cards by the search query without touching the source board', () => {
    let current = board()
    const { host, rerender, cleanup } = mount(<KanbanBoard board={current} onUpdateBoard={() => {}} />)

    const search = host.querySelector<HTMLInputElement>('[data-slot="kanban-search"]')!
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(search, 'nomatch')
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(host.querySelectorAll('[data-slot="kanban-card"]')).toHaveLength(0)
    expect(current.columns[0].cards).toHaveLength(1)

    rerender(<KanbanBoard board={current} onUpdateBoard={() => {}} />)
    cleanup()
  })

  it('disables Add on a column that is at its limit', () => {
    const { host, cleanup } = mount(<KanbanBoard board={board()} onUpdateBoard={() => {}} />)

    const columns = [...host.querySelectorAll('[data-slot="kanban-column"]')]
    const todoAdd = columns[0].querySelector<HTMLButtonElement>('[data-slot="kanban-add-card"]')!
    const doingAdd = columns[1].querySelector<HTMLButtonElement>('[data-slot="kanban-add-card"]')!

    expect(todoAdd.getAttribute('aria-disabled')).toBe('true')
    expect(doingAdd.getAttribute('aria-disabled')).not.toBe('true')

    cleanup()
  })

  it('creates a card through the dialog and hands back the updated board', () => {
    let updated: KanbanBoardData | null = null
    const { host, cleanup } = mount(
      <KanbanBoard board={board()} onUpdateBoard={(b) => { updated = b }} />,
    )

    const columns = [...host.querySelectorAll('[data-slot="kanban-column"]')]
    const doingAdd = columns[1].querySelector<HTMLButtonElement>('[data-slot="kanban-add-card"]')!
    act(() => doingAdd.click())

    const titleInput = document.querySelector<HTMLInputElement>('#kanban-title')!
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(titleInput, 'Ship it')
      titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const form = document.querySelector('form')!
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(updated).not.toBeNull()
    expect(updated!.columns.find((c) => c.id === 'doing')?.cards.map((c) => c.title)).toEqual(['Ship it'])

    cleanup()
  })

  it('deletes a card from its menu', () => {
    let updated: KanbanBoardData | null = null
    const { host, cleanup } = mount(
      <KanbanBoard board={board()} onUpdateBoard={(b) => { updated = b }} />,
    )

    const menuTrigger = host.querySelector<HTMLButtonElement>('[data-slot="kanban-card-menu"]')!
    act(() => menuTrigger.click())

    const deleteItem = [...document.querySelectorAll('[role="menuitem"]')].find((el) =>
      el.textContent?.includes('Delete'),
    ) as HTMLElement
    act(() => deleteItem.click())

    expect(updated).not.toBeNull()
    expect(updated!.columns.find((c) => c.id === 'todo')?.cards).toHaveLength(0)

    cleanup()
  })

  it('moves a card to another column on drop', () => {
    let updated: KanbanBoardData | null = null
    const { host, cleanup } = mount(
      <KanbanBoard board={board()} onUpdateBoard={(b) => { updated = b }} />,
    )

    const card = host.querySelector('[data-slot="kanban-card"]')!
    const columns = [...host.querySelectorAll('[data-slot="kanban-column"]')]
    const doing = columns[1]

    const dt = dataTransfer()
    fire(card, 'dragstart', dt)
    fire(doing, 'drop', dt)

    expect(updated).not.toBeNull()
    expect(updated!.columns.find((c) => c.id === 'todo')?.cards).toHaveLength(0)
    expect(updated!.columns.find((c) => c.id === 'doing')?.cards.map((c) => c.id)).toEqual(['card-1'])

    cleanup()
  })

  it('refuses to drop into a column that is already at its limit', () => {
    let updated: KanbanBoardData | null = null
    const full: KanbanBoardData = {
      ...board(),
      columns: [
        { id: 'todo', title: 'To Do', cards: [] },
        {
          id: 'doing',
          title: 'In Progress',
          limit: 1,
          cards: [{ id: 'card-2', title: 'Already here', createdAt: now, updatedAt: now }],
        },
      ],
    }
    full.columns[0].cards.push({ id: 'card-1', title: 'Move me', createdAt: now, updatedAt: now })

    const { host, cleanup } = mount(<KanbanBoard board={full} onUpdateBoard={(b) => { updated = b }} />)

    const card = host.querySelector('[data-slot="kanban-card"]')!
    const columns = [...host.querySelectorAll('[data-slot="kanban-column"]')]
    const doing = columns[1]

    const dt = dataTransfer()
    fire(card, 'dragstart', dt)
    fire(doing, 'drop', dt)

    expect(updated).toBeNull()

    cleanup()
  })
})
