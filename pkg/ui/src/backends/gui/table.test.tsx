// @vitest-environment jsdom

/**
 * Table renders a real `<table>` — sections, rows and cells keep their native
 * tag and a matching `display: table-*`, so `colSpan` and cross-row column
 * alignment are the browser's job, never ours to fake with a grid.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const full = () => (
  <Table>
    <TableCaption>A list of your recent invoices.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>INV001</TableCell>
        <TableCell>Paid</TableCell>
        <TableCell>$250.00</TableCell>
      </TableRow>
      <TableRow selected>
        <TableCell>INV002</TableCell>
        <TableCell>Pending</TableCell>
        <TableCell>$150.00</TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={2}>Total</TableCell>
        <TableCell>$400.00</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
)

describe('Table', () => {
  it('renders every part as its matching native table element', () => {
    const markup = html(full())

    expect(tag(markup, 'table').startsWith('<table')).toBe(true)
    expect(tag(markup, 'table-header').startsWith('<thead')).toBe(true)
    expect(tag(markup, 'table-body').startsWith('<tbody')).toBe(true)
    expect(tag(markup, 'table-footer').startsWith('<tfoot')).toBe(true)
    expect(tag(markup, 'table-caption').startsWith('<caption')).toBe(true)
    const rows = [...markup.matchAll(/<tr[^>]*data-slot="table-row"[^>]*>/g)]
    expect(rows).toHaveLength(4)
    const heads = [...markup.matchAll(/<th[^>]*data-slot="table-head"[^>]*>/g)]
    expect(heads).toHaveLength(3)
    const cells = [...markup.matchAll(/<td[^>]*data-slot="table-cell"[^>]*>/g)]
    expect(cells).toHaveLength(8)
  })

  it('carries the table display so the browser computes real columns', () => {
    const markup = html(full())
    const table = tag(markup, 'table')
    const header = tag(markup, 'table-header')
    const row = markup.match(/<tr[^>]*data-slot="table-row"[^>]*>/)?.[0] ?? ''
    const head = markup.match(/<th[^>]*data-slot="table-head"[^>]*>/)?.[0] ?? ''

    expect(table).toContain('display:table')
    expect(header).toContain('display:table-header-group')
    expect(row).toContain('display:table-row')
    expect(head).toContain('display:table-cell')
  })

  it('marks a selected row on data-state, and only that row', () => {
    const markup = html(full())
    const states = [...markup.matchAll(/<tr[^>]*data-slot="table-row"[^>]*data-state="([^"]*)"/g)].map(
      (m) => m[1],
    )

    // Two body rows plus one footer row: only the second carries "selected".
    expect(states.filter((s) => s === 'selected')).toHaveLength(1)
  })

  it('spans the footer total cell across the columns it summarises', () => {
    const markup = html(full())
    const footerCell = markup.match(/<td[^>]*data-slot="table-cell"[^>]*colSpan="2"[^>]*>/)

    expect(footerCell).not.toBeNull()
  })

  it('keeps the caption text and cell text intact', () => {
    const markup = html(full())

    expect(markup).toContain('A list of your recent invoices.')
    expect(markup).toContain('INV001')
    expect(markup).toContain('$400.00')
  })
})
