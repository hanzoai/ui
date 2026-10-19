// @vitest-environment jsdom

/**
 * The record table on the kit: its geometry at both densities (read off the
 * server markup, where each box is an atomic class), and its behaviour against
 * a live DOM — sort, select, inline edit with the FT-100 keys, paging — and axe.
 */
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import { config, Density } from '@hanzo/ui'

import { audit } from '../../../ui/test/axe'
import { DataTable, type DataTableProps } from './DataTable'
import type { FieldDefinition } from '../field/types'

const FIELDS: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'stage', label: 'Stage', type: 'select', metadata: { options: [{ value: 'lead', label: 'Lead', color: 'sky' }, { value: 'won', label: 'Won', color: 'green' }] } },
  { name: 'amount', label: 'Amount', type: 'currency' },
]
const RECORDS = [
  { id: 'a', name: 'Acme', stage: 'lead', amount: { amount: 1200, currencyCode: 'USD' } },
  { id: 'b', name: 'Globex', stage: 'won', amount: { amount: 900, currencyCode: 'USD' } },
  { id: 'c', name: 'Initech', stage: null, amount: null },
]

const wrap = (node: React.ReactNode, compact = false) => (
  <GuiProvider config={config} defaultTheme="dark">
    {compact ? <Density value="compact">{node}</Density> : node}
  </GuiProvider>
)

const html = (props: Partial<DataTableProps>, compact = false) =>
  renderToStaticMarkup(wrap(<DataTable fields={FIELDS} records={RECORDS} {...props} />, compact)).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

const rowsOf = (markup: string) => [...markup.matchAll(/<div[^>]*role="row"[^>]*>/g)].map((m) => m[0])

describe('geometry', () => {
  it('regular: 44px rows, a 12px cell gutter', () => {
    const markup = html({})
    const [, first] = rowsOf(markup)
    expect(first).toMatch(/_minH-44px/)
    expect(markup).toMatch(/role="cell"[^>]*_pl-12px|_pl-12px[^>]*role="cell"/)
  })

  it('compact: the record density — 32px rows, an 8px gutter, a 28px selection column', () => {
    const markup = html({ selectable: true }, true)
    const [, first] = rowsOf(markup)
    expect(first).toMatch(/_minH-32px/)
    expect(markup).toMatch(/_width-28px/)
    expect(markup).toMatch(/_pl-8px/)
  })

  it('draws on theme rungs, not the old dark literals', () => {
    const markup = html({})
    expect(markup).not.toMatch(/#09090b|#27272a|#0a0a0a/)
    expect(markup).toMatch(/_btc-borderColor|_bbc-borderColor|_borderBottomColor-borderColor/)
  })

  it('an empty table says so in the tertiary ink', () => {
    const markup = renderToStaticMarkup(wrap(<DataTable fields={FIELDS} records={[]} />))
    expect(markup).toContain('No records yet.')
    expect(markup).toMatch(/_col-hint/)
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
const mount = (props: Partial<DataTableProps>) => act(() => root.render(wrap(<DataTable fields={FIELDS} records={RECORDS} {...props} />, true)))
const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

describe('behaviour', () => {
  it('a header press cycles the sort and states it as aria-sort', () => {
    const onSortChange = vi.fn()
    mount({ sorts: [{ field: 'name', dir: 'asc' }], onSortChange })
    const header = [...host.querySelectorAll('[role="columnheader"]')]
    expect(header[0].getAttribute('aria-sort')).toBe('ascending')
    act(() => (header[1].querySelector('[class*="_cur-"]') as HTMLElement).click())
    expect(onSortChange).toHaveBeenCalled()
  })

  it('selection: one row, then all on the page; the header box goes indeterminate between', () => {
    const onSelectionChange = vi.fn()
    mount({ selectable: true, onSelectionChange })
    const box = (label: string) => host.querySelector<HTMLElement>(`[aria-label="${label}"]`)!
    act(() => box('Select row 1').click())
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
    expect(box('Select all rows').getAttribute('aria-checked')).toBe('mixed')
    expect(host.textContent).toContain('1 selected')
    act(() => box('Select all rows').click())
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c'])
  })

  it('a pressed cell becomes its editor; Enter commits the draft', async () => {
    const onEditCommit = vi.fn()
    mount({ editable: true, onEditCommit })
    const cell = [...host.querySelectorAll<HTMLElement>('[role="cell"] [class*="_cur-"]')].find((c) => c.textContent === 'Acme')!
    act(() => cell.click())
    const field = host.querySelector<HTMLInputElement>('input')!
    expect(field.value).toBe('Acme')
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, 'Acme Inc')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => {
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    await settle()
    expect(onEditCommit).toHaveBeenCalledWith(RECORDS[0], FIELDS[0], 'Acme Inc')
    expect(host.querySelector('input')).toBeNull()
  })

  it('Escape leaves the cell without committing', async () => {
    const onEditCommit = vi.fn()
    mount({ editable: true, onEditCommit })
    const cell = [...host.querySelectorAll<HTMLElement>('[role="cell"] [class*="_cur-"]')].find((c) => c.textContent === 'Globex')!
    act(() => cell.click())
    act(() => {
      host.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    await settle()
    expect(onEditCommit).not.toHaveBeenCalled()
    expect(host.querySelector('input')).toBeNull()
  })

  it('an editable row opens through its named action, not a row press', () => {
    const onOpen = vi.fn()
    mount({ editable: true, onOpen })
    act(() => host.querySelector<HTMLElement>('[aria-label="Open record"]')!.click())
    expect(onOpen).toHaveBeenCalledWith(RECORDS[0])
  })

  it('pages with named buttons', () => {
    mount({ pageSize: 2 })
    expect(host.textContent).toContain('1–2 of 3')
    act(() => host.querySelector<HTMLElement>('[aria-label="Next page"]')!.click())
    expect(host.textContent).toContain('3–3 of 3')
  })

  it('passes axe', async () => {
    mount({ selectable: true, editable: true, onOpen: () => {} })
    await settle()
    expect(await audit(host)).toEqual([])
  })
})

describe('the empty and loading states keep the table semantics', () => {
  it.each([
    ['empty', { records: [] }],
    ['loading', { loading: true }],
  ] as const)('%s passes axe', async (_, props) => {
    act(() => root.render(wrap(<DataTable fields={FIELDS} records={RECORDS} {...(props as object)} />)))
    await settle()
    expect(await audit(host)).toEqual([])
  })
})
