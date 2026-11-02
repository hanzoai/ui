// @vitest-environment jsdom

/**
 * RecordsView's saved views: a host's built-in views cannot be deleted, so they
 * carry no delete control; its own saved views do, and pressing it deletes that
 * view and does not open it.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { config } from '@hanzo/ui'

import '../field/registerDefaults'
import type { FieldDefinition } from '../field/types'
import { RecordsView } from './RecordsView'
import { emptyView } from './logic'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const FIELDS: FieldDefinition[] = [{ name: 'name', label: 'Name', type: 'text' }]
const views = [
  { ...emptyView('table', 'starter:all', 'All people') },
  { ...emptyView('table', 'starter:investors', 'Investors') },
  { ...emptyView('table', 'v1', 'My investors') },
]

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

describe('saved views', () => {
  it('offers delete on the views a host lets go, and only on those', () => {
    const onDelete = vi.fn()
    const onSelect = vi.fn()
    act(() => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <RecordsView
            fields={FIELDS}
            records={[{ id: '1', name: 'Ada' }]}
            view={views[0]}
            savedViews={{ views, activeId: 'starter:all', onSelect, onSave: () => {}, onDelete, deletable: (id) => !id.startsWith('starter:') }}
          />
        </GuiProvider>,
      )
    })
    const deletes = [...host.querySelectorAll('[aria-label^="Delete view"]')]
    expect(deletes.map((d) => d.getAttribute('aria-label'))).toEqual(['Delete view My investors'])
    act(() => (deletes[0] as HTMLElement).click())
    expect(onDelete).toHaveBeenCalledWith('v1')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
