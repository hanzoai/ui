// @vitest-environment jsdom

/**
 * DataTable's actual behaviour — sorting flips row order, the filter narrows
 * rows, a checkbox toggles `data-state="selected"` and the footer count,
 * pagination moves between pages, and the Columns menu hides a column — all
 * asserted on a live DOM (`render`/`fireEvent`), never on markup alone, because
 * every one of these is a state transition a static snapshot cannot see.
 *
 * Imports `./data-table` directly rather than the backend barrel, like
 * `accordion.test.tsx`: a test for one component should not fail because a
 * different one's dependency moved.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { DataTable, DataTableColumnHeader, type DataTableColumnDef } from './data-table'

// floating-ui's autoUpdate observes the reference element; jsdom has neither.
beforeAll(() => {
  const Noop = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  globalThis.ResizeObserver ??= Noop as never
  globalThis.IntersectionObserver ??= Noop as never
})

afterEach(cleanup)

const mount = (node: React.ReactNode) =>
  render(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

type Payment = { id: string; amount: number; status: string; email: string }

const data: Payment[] = [
  { id: 'a', amount: 100, status: 'pending', email: 'zed@example.com' },
  { id: 'b', amount: 300, status: 'success', email: 'abe@example.com' },
  { id: 'c', amount: 200, status: 'failed', email: 'mo@example.com' },
]

const baseColumns: Array<DataTableColumnDef<Payment>> = [
  { id: 'status', accessorKey: 'status', header: 'Status' },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  { id: 'amount', accessorKey: 'amount', header: 'Amount' },
]

const emailCells = (host: HTMLElement) =>
  [...host.querySelectorAll('[data-slot="data-table-cell"]')]
    .map((c) => c.textContent ?? '')
    .filter((t) => t.includes('@'))

describe('DataTable', () => {
  it('renders one header per visible column and one cell per row per column', () => {
    const { container } = mount(<DataTable columns={baseColumns} data={data} pageSize={0} />)
    expect(container.querySelectorAll('[data-slot="data-table-head"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-slot="data-table-cell"]')).toHaveLength(9)
  })

  it('shows the empty message when there are no rows', () => {
    const { getByText } = mount(<DataTable columns={baseColumns} data={[]} emptyMessage="Nothing here." />)
    expect(getByText('Nothing here.')).toBeTruthy()
  })

  it('sorts ascending then descending on repeated header clicks', () => {
    const { container } = mount(<DataTable columns={baseColumns} data={data} pageSize={0} />)
    const header = container.querySelector('[data-slot="data-table-column-header"]') as HTMLElement
    expect(header).toBeTruthy()

    act(() => void fireEvent.click(header))
    expect(emailCells(container)).toEqual(['abe@example.com', 'mo@example.com', 'zed@example.com'])
    expect(header.closest('[data-slot="data-table-head"]')?.getAttribute('aria-sort')).toBe('ascending')

    act(() => void fireEvent.click(header))
    expect(emailCells(container)).toEqual(['zed@example.com', 'mo@example.com', 'abe@example.com'])
    expect(header.closest('[data-slot="data-table-head"]')?.getAttribute('aria-sort')).toBe('descending')
  })

  it('narrows rows to the ones matching the filter, case-insensitively', () => {
    const { container } = mount(
      <DataTable columns={baseColumns} data={data} filterColumnId="email" filterPlaceholder="Filter emails…" />,
    )
    const input = container.querySelector('[data-slot="data-table-filter"]') as HTMLInputElement
    expect(input).toBeTruthy()

    act(() => void fireEvent.change(input, { target: { value: 'ABE' } }))
    expect(emailCells(container)).toEqual(['abe@example.com'])
  })

  it('selects a row via its checkbox and reports the count in the footer', () => {
    const columns: Array<DataTableColumnDef<Payment>> = [{ id: 'select', enableSorting: false, enableHiding: false }, ...baseColumns]
    const { container, getByText } = mount(<DataTable columns={columns} data={data} pageSize={0} />)

    const rows = [...container.querySelectorAll('[data-slot="data-table-row"]')]
    expect(rows).toHaveLength(3)
    const firstCheckbox = rows[0].querySelector('button[role="checkbox"], input[type="checkbox"]') as HTMLElement

    act(() => void fireEvent.click(firstCheckbox))

    expect(rows[0].getAttribute('data-state')).toBe('selected')
    expect(getByText('1 of 3 row(s) selected.')).toBeTruthy()
  })

  it('selects every row on the page from the header checkbox', () => {
    const columns: Array<DataTableColumnDef<Payment>> = [{ id: 'select', enableSorting: false, enableHiding: false }, ...baseColumns]
    const { container, getByText } = mount(<DataTable columns={columns} data={data} pageSize={0} />)

    const headCheckbox = container
      .querySelector('[data-slot="data-table-header-row"]')!
      .querySelector('button[role="checkbox"], input[type="checkbox"]') as HTMLElement

    act(() => void fireEvent.click(headCheckbox))

    expect(getByText('3 of 3 row(s) selected.')).toBeTruthy()
    const rows = [...container.querySelectorAll('[data-slot="data-table-row"]')]
    expect(rows.every((r) => r.getAttribute('data-state') === 'selected')).toBe(true)
  })

  it('paginates: Previous starts disabled, Next moves to the next page and then disables', () => {
    const { container } = mount(<DataTable columns={baseColumns} data={data} pageSize={2} />)

    const [previous, next] = [...container.querySelectorAll('[data-slot="data-table-pagination"] button')] as HTMLButtonElement[]
    expect(previous.getAttribute('aria-disabled')).toBe('true')
    expect(next.getAttribute('aria-disabled')).not.toBe('true')
    expect(emailCells(container)).toEqual(['zed@example.com', 'abe@example.com'])

    act(() => void fireEvent.click(next))

    expect(emailCells(container)).toEqual(['mo@example.com'])
    expect(next.getAttribute('aria-disabled')).toBe('true')
    expect(previous.getAttribute('aria-disabled')).not.toBe('true')
  })

  it('hides a column from the Columns menu', () => {
    const { container, getByText } = mount(<DataTable columns={baseColumns} data={data} pageSize={0} />)

    expect(container.querySelectorAll('[data-slot="data-table-head"]')).toHaveLength(3)

    const trigger = container.querySelector('[data-slot="data-table-view-options"]') as HTMLElement
    act(() => void fireEvent.click(trigger))

    const item = getByText('status')
    act(() => void fireEvent.click(item))

    expect(container.querySelectorAll('[data-slot="data-table-head"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-slot="data-table-cell"]')).toHaveLength(6)
  })
})
