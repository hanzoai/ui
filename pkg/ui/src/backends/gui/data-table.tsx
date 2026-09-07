'use client'

/**
 * DataTable — a table over an array, with sorting, a text filter, column
 * visibility, row selection and pagination composed from one column list.
 *
 * A column names an `accessorKey` and, only where the default text rendering
 * is not enough, a `header`/`cell` render function; the render functions get a
 * `column`/`table` handle shaped like the one a caller already knows from
 * TanStack Table (`getIsSorted`, `toggleSorting`, `getIsSelected`, …), so a
 * column list ports over by keeping its shape and dropping only the
 * `ColumnDef` import. Rows keep the identity of their position in `data`, so
 * selection survives a sort or a filter.
 *
 * The grid is ONE `Grid` (`../../grid`), header and body cells alike, so every
 * column shares one set of tracks; each row is a `display: contents` wrapper
 * carrying `role="row"` so the cells inside stay direct grid children (Grid's
 * own note: `grid-column` only reaches a direct child) while still grouping
 * into a real accessible row.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, ChevronUp, ChevronsUpDown } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
import { Cell, Grid } from '../../grid'
import { Button } from './button'
import { Checkbox } from './checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Input } from './input'
import { slot } from './slot'

export type DataTableSortDirection = 'asc' | 'desc' | false

/** The handle a column's `header` render function gets for its own column. */
export interface DataTableColumnApi {
  id: string
  getIsSorted: () => DataTableSortDirection
  toggleSorting: (desc?: boolean) => void
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (visible?: boolean) => void
}

/** The handle a `cell` render function gets for the row it belongs to. */
export interface DataTableRow<TData> {
  id: string
  original: TData
  getValue: (columnId: string) => unknown
  getIsSelected: () => boolean
  toggleSelected: (selected?: boolean) => void
}

/** The whole-table handle, for a `select-all` header or a footer count. */
export interface DataTableInstance<TData> {
  getAllColumns: () => DataTableColumnApi[]
  getColumn: (id: string) => DataTableColumnApi | undefined
  getIsAllPageRowsSelected: () => boolean
  getIsSomePageRowsSelected: () => boolean
  toggleAllPageRowsSelected: (selected?: boolean) => void
  getFilteredRowModel: () => { rows: Array<DataTableRow<TData>> }
  getFilteredSelectedRowModel: () => { rows: Array<DataTableRow<TData>> }
  previousPage: () => void
  nextPage: () => void
  getCanPreviousPage: () => boolean
  getCanNextPage: () => boolean
}

export interface DataTableColumnDef<TData> {
  /** Stable id. Defaults to `String(accessorKey)` when omitted. */
  id?: string
  accessorKey?: keyof TData
  header?:
    | React.ReactNode
    | ((ctx: { column: DataTableColumnApi; table: DataTableInstance<TData> }) => React.ReactNode)
  cell?: (ctx: { row: DataTableRow<TData>; table: DataTableInstance<TData> }) => React.ReactNode
  enableSorting?: boolean
  enableHiding?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<TData> {
  columns: Array<DataTableColumnDef<TData>>
  data: TData[]
  /** Column id filtered by the toolbar's text input. Omit to hide it. */
  filterColumnId?: string
  filterPlaceholder?: string
  /** Rows per page. `0` disables pagination (and its footer). Default 10. */
  pageSize?: number
  emptyMessage?: string
}

interface Resolved<TData> {
  id: string
  def: DataTableColumnDef<TData>
}

const resolve = <TData,>(def: DataTableColumnDef<TData>): Resolved<TData> => ({
  id: def.id ?? (def.accessorKey != null ? String(def.accessorKey) : ''),
  def,
})

const cycle = (
  current: { id: string; desc: boolean } | null,
  id: string,
  desc: number | boolean | undefined,
): { id: string; desc: boolean } | null => {
  if (typeof desc === 'boolean') return { id, desc }
  if (!current || current.id !== id) return { id, desc: false }
  return current.desc ? null : { id, desc: true }
}

export function DataTable<TData>({
  columns,
  data,
  filterColumnId,
  filterPlaceholder = 'Filter…',
  pageSize = 10,
  emptyMessage = 'No results.',
}: DataTableProps<TData>) {
  const resolved = React.useMemo(() => columns.map(resolve<TData>), [columns])

  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean } | null>(null)
  const [filterValue, setFilterValue] = React.useState('')
  const [hidden, setHidden] = React.useState<Record<string, boolean>>({})
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [pageIndex, setPageIndex] = React.useState(0)

  const withIndex = React.useMemo(() => data.map((original, index) => ({ original, index })), [data])

  const filtered = React.useMemo(() => {
    if (!filterColumnId || filterValue === '') return withIndex
    const needle = filterValue.toLowerCase()
    return withIndex.filter(({ original }) => {
      const value = (original as Record<string, unknown>)[filterColumnId]
      return String(value ?? '').toLowerCase().includes(needle)
    })
  }, [withIndex, filterColumnId, filterValue])

  const sorted = React.useMemo(() => {
    if (!sorting) return filtered
    const col = resolved.find((c) => c.id === sorting.id)
    if (!col?.def.accessorKey) return filtered
    const key = col.def.accessorKey
    const dir = sorting.desc ? -1 : 1
    return [...filtered].sort((a, b) => {
      const av = (a.original as Record<string, unknown>)[key as string]
      const bv = (b.original as Record<string, unknown>)[key as string]
      if (av == null && bv == null) return 0
      if (av == null) return -1 * dir
      if (bv == null) return 1 * dir
      return av > bv ? dir : av < bv ? -dir : 0
    })
  }, [filtered, sorting, resolved])

  const paginate = pageSize > 0
  const pageCount = paginate ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const clampedPageIndex = Math.min(pageIndex, pageCount - 1)
  const pageRows = paginate
    ? sorted.slice(clampedPageIndex * pageSize, clampedPageIndex * pageSize + pageSize)
    : sorted

  const makeColumn = React.useCallback(
    (col: Resolved<TData>): DataTableColumnApi => ({
      id: col.id,
      getIsSorted: () => (sorting && sorting.id === col.id ? (sorting.desc ? 'desc' : 'asc') : false),
      toggleSorting: (desc) => setSorting((prev) => cycle(prev, col.id, desc)),
      getCanHide: () => col.def.enableHiding !== false,
      getIsVisible: () => hidden[col.id] !== true,
      toggleVisibility: (visible) =>
        setHidden((prev) => {
          const isHidden = prev[col.id] === true
          const nextHidden = visible === undefined ? !isHidden : !visible
          return { ...prev, [col.id]: nextHidden }
        }),
    }),
    [sorting, hidden],
  )

  const makeRow = React.useCallback(
    (index: number, original: TData): DataTableRow<TData> => {
      const id = String(index)
      return {
        id,
        original,
        getValue: (columnId) => {
          const col = resolved.find((c) => c.id === columnId)
          return col?.def.accessorKey ? (original as Record<string, unknown>)[col.def.accessorKey as string] : undefined
        },
        getIsSelected: () => selected[id] === true,
        toggleSelected: (value) =>
          setSelected((prev) => ({ ...prev, [id]: value === undefined ? !prev[id] : value })),
      }
    },
    [resolved, selected],
  )

  const instance: DataTableInstance<TData> = React.useMemo(
    () => ({
      getAllColumns: () => resolved.map(makeColumn),
      getColumn: (id) => {
        const col = resolved.find((c) => c.id === id)
        return col ? makeColumn(col) : undefined
      },
      getIsAllPageRowsSelected: () =>
        pageRows.length > 0 && pageRows.every(({ index }) => selected[String(index)] === true),
      getIsSomePageRowsSelected: () =>
        pageRows.some(({ index }) => selected[String(index)] === true) &&
        !pageRows.every(({ index }) => selected[String(index)] === true),
      toggleAllPageRowsSelected: (value) =>
        setSelected((prev) => {
          const allSelected = pageRows.every(({ index }) => prev[String(index)] === true)
          const next = value === undefined ? !allSelected : value
          const out = { ...prev }
          for (const { index } of pageRows) out[String(index)] = next
          return out
        }),
      getFilteredRowModel: () => ({ rows: sorted.map(({ original, index }) => makeRow(index, original)) }),
      getFilteredSelectedRowModel: () => ({
        rows: sorted.filter(({ index }) => selected[String(index)] === true).map(({ original, index }) => makeRow(index, original)),
      }),
      previousPage: () => setPageIndex((p) => Math.max(0, p - 1)),
      nextPage: () => setPageIndex((p) => Math.min(pageCount - 1, p + 1)),
      getCanPreviousPage: () => clampedPageIndex > 0,
      getCanNextPage: () => clampedPageIndex < pageCount - 1,
    }),
    [resolved, makeColumn, makeRow, pageRows, sorted, selected, pageCount, clampedPageIndex],
  )

  const visible = resolved.filter((c) => hidden[c.id] !== true)
  const hideable = resolved.filter((c) => c.def.enableHiding !== false)
  const hasSelectColumn = resolved.some((c) => c.id === 'select')
  const selectedCount = instance.getFilteredSelectedRowModel().rows.length
  const totalCount = instance.getFilteredRowModel().rows.length

  const align = (a: DataTableColumnDef<TData>['align']) =>
    a === 'right' ? 'right' : a === 'center' ? 'center' : 'left'

  return (
    <YStack gap="$3" width="100%" {...slot('data-table')}>
      {(filterColumnId || hideable.length > 0) && (
        <XStack items="center" justify="space-between" gap="$3" {...slot('data-table-toolbar')}>
          {filterColumnId ? (
            <Input
              placeholder={filterPlaceholder}
              value={filterValue}
              onChangeText={setFilterValue}
              maxW={360}
              flex={1}
              {...slot('data-table-filter')}
            />
          ) : (
            <XStack flex={1} />
          )}
          {hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" {...slot('data-table-view-options')}>
                  Columns <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hideable.map((col) => {
                  const api = makeColumn(col)
                  return (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={api.getIsVisible()}
                      onCheckedChange={(value: boolean) => api.toggleVisibility(!!value)}
                    >
                      {col.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </XStack>
      )}

      <YStack borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
        <Grid columns={visible.length || 1} gap={0} role="table" {...slot('data-table-grid')}>
          <div role="row" style={{ display: 'contents' }} {...slot('data-table-header-row')}>
            {visible.map((col) => {
              const api = makeColumn(col)
              const isSelectCol = col.id === 'select' && !col.def.header
              const content = isSelectCol ? (
                <Checkbox
                  aria-label="Select all"
                  checked={instance.getIsAllPageRowsSelected() ? true : instance.getIsSomePageRowsSelected() ? 'indeterminate' : false}
                  onCheckedChange={(value: boolean) => instance.toggleAllPageRowsSelected(!!value)}
                />
              ) : typeof col.def.header === 'function' ? (
                col.def.header({ column: api, table: instance })
              ) : col.def.header !== undefined ? (
                col.def.header
              ) : (
                <SizableText fontWeight="600" color="$quiet">
                  {col.id}
                </SizableText>
              )
              return (
                <Cell
                  key={col.id}
                  role="columnheader"
                  aria-sort={
                    api.getIsSorted() === 'asc' ? 'ascending' : api.getIsSorted() === 'desc' ? 'descending' : 'none'
                  }
                  style={{
                    padding: 12,
                    borderBottom: '1px solid var(--edge)',
                    textAlign: align(col.def.align),
                  }}
                  {...slot('data-table-head')}
                >
                  {content}
                </Cell>
              )
            })}
          </div>

          {pageRows.length ? (
            pageRows.map(({ original, index }, position) => {
              const row = makeRow(index, original)
              const isSelected = row.getIsSelected()
              const isLastRow = position === pageRows.length - 1
              return (
                <div
                  key={row.id}
                  role="row"
                  data-state={isSelected ? 'selected' : undefined}
                  style={{ display: 'contents' }}
                  {...slot('data-table-row')}
                >
                  {visible.map((col) => {
                    const isSelectCol = col.id === 'select' && !col.def.cell
                    const content = isSelectCol ? (
                      <Checkbox
                        aria-label="Select row"
                        checked={isSelected}
                        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
                      />
                    ) : col.def.cell ? (
                      col.def.cell({ row, table: instance })
                    ) : (
                      <SizableText>{String(row.getValue(col.id) ?? '')}</SizableText>
                    )
                    return (
                      <Cell
                        key={col.id}
                        role="cell"
                        style={{
                          padding: 12,
                          borderBottom: isLastRow ? undefined : '1px solid var(--edge)',
                          textAlign: align(col.def.align),
                          background: isSelected ? 'var(--hover)' : undefined,
                        }}
                        {...slot('data-table-cell')}
                      >
                        {content}
                      </Cell>
                    )
                  })}
                </div>
              )
            })
          ) : (
            <div role="row" style={{ display: 'contents' }}>
              <Cell
                col={visible.length || 1}
                role="cell"
                style={{ padding: 24, textAlign: 'center' }}
                {...slot('data-table-empty')}
              >
                <SizableText color="$quiet">{emptyMessage}</SizableText>
              </Cell>
            </div>
          )}
        </Grid>
      </YStack>

      {(hasSelectColumn || paginate) && (
        <XStack items="center" justify="space-between" gap="$3" {...slot('data-table-pagination')}>
          <SizableText fontSize="$1" color="$quiet">
            {hasSelectColumn ? `${selectedCount} of ${totalCount} row(s) selected.` : ''}
          </SizableText>
          {paginate && (
            <XStack gap="$2">
              <Button
                variant="outline"
                size="sm"
                disabled={!instance.getCanPreviousPage()}
                onPress={instance.previousPage}
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!instance.getCanNextPage()} onPress={instance.nextPage}>
                Next
              </Button>
            </XStack>
          )}
        </XStack>
      )}
    </YStack>
  )
}

export interface DataTableColumnHeaderProps {
  column: DataTableColumnApi
  title: string
}

/** A sortable header cell: a ghost button whose icon shows the active direction. */
export function DataTableColumnHeader({ column, title }: DataTableColumnHeaderProps) {
  const direction = column.getIsSorted()
  const Icon = direction === 'asc' ? ChevronUp : direction === 'desc' ? ChevronDown : ChevronsUpDown
  return (
    <Button
      variant="ghost"
      size="sm"
      onPress={() => column.toggleSorting(direction === 'asc')}
      {...slot('data-table-column-header')}
    >
      {title}
      <Icon size={14} />
    </Button>
  )
}
