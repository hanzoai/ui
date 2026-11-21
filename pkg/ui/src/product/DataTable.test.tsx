// @vitest-environment jsdom

/**
 * The product DataTable is a table to assistive technology.
 *
 * Its header row said `role="row"` and nothing above it was a table, so axe reported
 * `aria-required-parent` on every table in every console; the body rows and cells had no
 * roles at all, so a screen reader read a header with no data under it; and the scroller
 * of a table wider than its box was not focusable (`scrollable-region-focusable`), so a
 * keyboard user could not reach the columns past the edge. These read the live DOM.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { DataTable } from './DataTable'

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

type Row = { id: string; name: string; size: number }
const rows: Row[] = [
  { id: 'a', name: 'alpha', size: 1 },
  { id: 'b', name: 'beta', size: 2 },
]
const mount = () =>
  render(
    <GuiProvider config={config} defaultTheme="dark">
      <DataTable<Row>
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'size', header: 'Size', align: 'right' },
        ]}
        rows={rows}
        rowKey={(r) => r.id}
      />
    </GuiProvider>,
  )

describe('DataTable roles', () => {
  it('puts the header row, the body rows and the cells under one table', () => {
    const { container } = mount()
    const table = container.querySelector('[role="table"]')
    expect(table).not.toBeNull()
    const headerRows = table!.querySelectorAll(':scope > [role="row"]')
    expect(headerRows).toHaveLength(1)
    const group = table!.querySelector('[role="rowgroup"]')
    expect(group).not.toBeNull()
    const bodyRows = group!.querySelectorAll('[role="row"]')
    expect(bodyRows).toHaveLength(rows.length)
    for (const row of bodyRows) expect(row.querySelectorAll('[role="cell"]')).toHaveLength(2)
    expect(table!.querySelectorAll('[role="columnheader"]')).toHaveLength(2)
  })

  it('makes the sideways scroller a keyboard stop', () => {
    const { container } = mount()
    const table = container.querySelector('[role="table"]')!
    const scroller = table.parentElement!
    expect(scroller.getAttribute('tabindex')).toBe('0')
  })
})
