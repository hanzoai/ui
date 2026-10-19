// @vitest-environment jsdom

/**
 * The record page's field list and the create form, on theme rungs, with the
 * inline-edit model: a value opens its own editor by press or by Enter, a picker
 * commits on a choice, text on Enter.
 */
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { config } from '@hanzo/ui'

import { RecordDetail, RecordForm } from './RecordDetail'
import type { FieldDefinition } from '../field/types'

const FIELDS: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'id', label: 'ID', type: 'uuid', readOnly: true },
]
const RECORD = { name: 'Ada Lovelace', email: 'ada@example.com', id: 'u1' }

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="light">
    {node}
  </GuiProvider>
)

describe('RecordDetail', () => {
  it('labels each value in the tertiary ink, sentence case, and draws the title', () => {
    const markup = renderToStaticMarkup(wrap(<RecordDetail fields={FIELDS} record={RECORD} title="Ada Lovelace" />))
    expect(markup).toMatch(/_col-hint/)
    expect(markup).not.toMatch(/text-transform:uppercase/)
    expect(markup).toContain('ada@example.com')
  })
})

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

describe('inline edit', () => {
  it('Enter on an editable value opens its editor; Enter there commits', () => {
    const onEditCommit = vi.fn()
    act(() => root.render(wrap(<RecordDetail fields={FIELDS} record={RECORD} editable onEditCommit={onEditCommit} />)))
    const value = host.querySelector<HTMLElement>('[aria-label="Edit Name"]')!
    act(() => {
      value.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    const field = host.querySelector<HTMLInputElement>('input')!
    expect(field.value).toBe('Ada Lovelace')
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, 'Ada King')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => {
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    expect(onEditCommit).toHaveBeenCalledWith(FIELDS[0], 'Ada King')
  })

  it('a read-only field offers no editor', () => {
    act(() => root.render(wrap(<RecordDetail fields={FIELDS} record={RECORD} editable onEditCommit={() => {}} />)))
    expect(host.querySelector('[aria-label="Edit ID"]')).toBeNull()
  })
})

describe('RecordForm', () => {
  it('emits each field’s change by name', () => {
    const onChange = vi.fn()
    act(() => root.render(wrap(<RecordForm fields={FIELDS} values={{}} onChange={onChange} />)))
    const email = host.querySelector<HTMLInputElement>('input[aria-label="Email"]')!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(email, 'a@b.co')
      email.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(onChange).toHaveBeenLastCalledWith('email', 'a@b.co')
  })
})
