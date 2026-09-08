'use client'

/**
 * DataTable — a sortable, filterable, paginated grid over an array of rows,
 * driven by a column-definition array exactly the way the upstream guide's
 * `ColumnDef[]` is: a column names an `accessorKey`, an optional `header` and
 * `cell` renderer, and whether it can be sorted or hidden. Two ids carry
 * meaning by convention, matched by the reference implementation's own demo —
 * a column `id: 'select'` gets its checkbox for free, everything else (an
 * `id: 'actions'` column included) is rendered by whatever `cell` you give it.
 *
 * There is no TanStack Table here: the workspace does not carry it, and a
 * generic column model over a plain array needs none of what a headless
 * library buys a real backend — grouping, virtualization, server-side
 * pagination. Sorting, filtering, visibility, selection and pagination are
 * ~120 lines of arithmetic over arrays, kept in one `useState` each, matching
 * the guide's own `SortingState`/`ColumnFiltersState`/`VisibilityState` split.
 *
 * The grid is `@hanzo/ui`'s own `Grid`/`Cell` — a real CSS grid, which is the
 * one correct host for a two-dimensional layout — with the WAI-ARIA
 * `table`/`row`/`columnheader`/`cell` roles standing in for the semantics a
 * native `<table>` would otherwise carry.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from '@hanzogui/lucide-icons-2'
import { useMemo, useState, type ReactNode } from 'react'
import { Cell, Grid } from '../../grid'
import { Button } from './button'
import { Checkbox } from './checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { ink } from './ink'
import { Input } from './input'
import { slot } from './slot'

export type DataTableAlign = 'left' | 'center' | 'right'
export type DataTableSortDirection = 'asc' | 'desc' | false

/** What a column can be asked and told, independent of any one row. */
export interface DataTableColumnApi<TData> {
  readonly id: string
  getCanSort: () => boolean
  getIsSorted: () => DataTableSortDirection
  toggleSorting: (desc?: boolean) => void
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (visible?: boolean) => void
}

/** One row, and the handful of things a `cell` renderer needs from it. */
export interface DataTableRow<TData> {
  readonly id: string
  readonly original: TData
  getValue: (columnId: string) => unknown
  getIsSelected: () => boolean
  toggleSelected: (value?: boolean) => void
}

export interface DataTableColumnDef<TData> {
  id: string
  /** Read directly off the row when no `cell` is given. */
  accessorKey?: keyof TData
  header?: ReactNode | ((ctx: { column: DataTableColumnApi<TData> }) => ReactNode)
  cell?: (ctx: { row: DataTableRow<TData> }) => ReactNode
  /** A CSS grid track for this column. Defaults to `1fr`. */
  width?: number | string
  align?: DataTableAlign
  enableSorting?: boolean
  enableHiding?: boolean
  /** The value compared when this column is the active sort. Defaults to `accessorKey`. */
  sortingValue?: (row: TData) => string | number
  /** The text searched when this column is the active filter. Defaults to `accessorKey`. */
  filterValue?: (row: TData) => string
}

/** The aggregate operations a custom `header`/`cell` can reach for — one
 *  object, built fresh each render, mirroring the guide's own `table`. */
export interface DataTableInstance<TData> {
  getColumn: (id: string) => DataTableColumnApi<TData> | undefined
  getAllColumns: () => DataTableColumnApi<TData>[]
  getRowModel: () => { rows: DataTableRow<TData>[] }
  getFilteredRowModel: () => { rows: DataTableRow<TData>[] }
  getFilteredSelectedRowModel: () => { rows: DataTableRow<TData>[] }
  getIsAllPageRowsSelected: () => boolean
  getIsSomePageRowsSelected: () => boolean
  toggleAllPageRowsSelected: (value?: boolean) => void
  getCanPreviousPage: () => boolean
  getCanNextPage: () => boolean
  previousPage: () => void
  nextPage: () => void
  getPageCount: () => number
}

export interface DataTableProps<TData> {
  columns: DataTableColumnDef<TData>[]
  data: TData[]
  /** Identifies a row for selection/sort stability. Defaults to its index. */
  getRowId?: (row: TData, index: number) => string
  /** The column id the toolbar's text field searches. Omit to hide the field. */
  filterColumnId?: string
  filterPlaceholder?: string
  /** Rows per page. `0` (the default) shows every row with no pager. */
  pageSize?: number
  emptyMessage?: ReactNode
  onRowSelectionChange?: (rows: TData[]) => void
}

export interface DataTableColumnHeaderProps<TData> {
  column: DataTableColumnApi<TData>
  title: ReactNode
  className?: string
}

/**
 * A column's header cell: plain text when the column cannot sort, otherwise a
 * button that toggles ascending/descending and shows which way it is set —
 * the same affordance the reference `data-table-demo.tsx` wires up by hand.
 */
function DataTableColumnHeader<TData>({ column, title, className }: DataTableColumnHeaderProps<TData>) {
  if (!column.getCanSort())
    return (
      <SizableText size="$2" fontWeight="600" color="$quiet" className={className}>
        {title}
      </SizableText>
    )

  const sorted = column.getIsSorted()
  return (
    <Button
      {...slot('data-table-column-header')}
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {title}
      {sorted === 'desc' ? <ArrowDown size={14} /> : sorted === 'asc' ? <ArrowUp size={14} /> : <ArrowUpDown size={14} />}
    </Button>
  )
}

const cellValue = <TData,>(column: DataTableColumnDef<TData>, row: TData): unknown =>
  column.accessorKey !== undefined ? row[column.accessorKey] : undefined

const sortKey = <TData,>(column: DataTableColumnDef<TData>, row: TData): string | number => {
  if (column.sortingValue) return column.sortingValue(row)
  const v = cellValue(column, row)
  return typeof v === 'number' ? v : String(v ?? '')
}

const filterText = <TData,>(column: DataTableColumnDef<TData>, row: TData): string =>
  column.filterValue ? column.filterValue(row) : String(cellValue(column, row) ?? '')

const track = (width: number | string | undefined): string =>
  width === undefined ? '1fr' : typeof width === 'number' ? `${width}px` : width

const justify = (a: DataTableAlign | undefined): 'flex-start' | 'center' | 'flex-end' =>
  a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start'

type Entry<TData> = { row: TData; id: string }

function DataTable<TData>({
  columns,
  data,
  getRowId,
  filterColumnId,
  filterPlaceholder = 'Filter…',
  pageSize = 0,
  emptyMessage = 'No results.',
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null)
  const [filter, setFilter] = useState('')
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [pageIndex, setPageIndex] = useState(0)

  const withIds = useMemo<Entry<TData>[]>(
    () => data.map((row, i) => ({ row, id: getRowId ? getRowId(row, i) : String(i) })),
    [data, getRowId],
  )

  const filterColumn = filterColumnId ? columns.find((c) => c.id === filterColumnId) : undefined

  const filtered = useMemo(() => {
    if (!filterColumn || filter.trim() === '') return withIds
    const needle = filter.toLowerCase()
    return withIds.filter(({ row }) => filterText(filterColumn, row).toLowerCase().includes(needle))
  }, [withIds, filterColumn, filter])

  const sorted = useMemo(() => {
    if (!sorting) return filtered
    const column = columns.find((c) => c.id === sorting.id)
    if (!column) return filtered
    const keyed = filtered.map((entry) => ({ entry, key: sortKey(column, entry.row) }))
    keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    if (sorting.desc) keyed.reverse()
    return keyed.map((k) => k.entry)
  }, [filtered, columns, sorting])

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const paged = pageSize > 0 ? sorted.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize) : sorted

  const visibleColumns = columns.filter((c) => hidden[c.id] !== true)
  const hideable = columns.filter((c) => c.enableHiding !== false)

  const setSelectedFor = (id: string, value: boolean) => {
    const next = { ...selected, [id]: value }
    setSelected(next)
    onRowSelectionChange?.(withIds.filter((e) => next[e.id]).map((e) => e.row))
  }

  const toggleAllPage = (value: boolean) => {
    const next = { ...selected }
    for (const entry of paged) next[entry.id] = value
    setSelected(next)
    onRowSelectionChange?.(withIds.filter((e) => next[e.id]).map((e) => e.row))
  }

  const rowApi = (entry: Entry<TData>): DataTableRow<TData> => ({
    id: entry.id,
    original: entry.row,
    getValue: (columnId) => {
      const column = columns.find((c) => c.id === columnId)
      return column ? cellValue(column, entry.row) : undefined
    },
    getIsSelected: () => selected[entry.id] === true,
    toggleSelected: (value) => setSelectedFor(entry.id, value ?? !selected[entry.id]),
  })

  const columnApi = (column: DataTableColumnDef<TData>): DataTableColumnApi<TData> => ({
    id: column.id,
    getCanSort: () => column.enableSorting !== false,
    getIsSorted: () => (sorting?.id === column.id ? (sorting.desc ? 'desc' : 'asc') : false),
    toggleSorting: (desc = false) => {
      if (column.enableSorting === false) return
      setSorting({ id: column.id, desc })
    },
    getCanHide: () => column.enableHiding !== false,
    getIsVisible: () => hidden[column.id] !== true,
    toggleVisibility: (visible) =>
      setHidden((h) => ({ ...h, [column.id]: visible === undefined ? h[column.id] !== true : !visible })),
  })

  const pageIds = paged.map((e) => e.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected[id])
  const somePageSelected = pageIds.some((id) => selected[id])

  const table: DataTableInstance<TData> = {
    getColumn: (id) => {
      const column = columns.find((c) => c.id === id)
      return column ? columnApi(column) : undefined
    },
    getAllColumns: () => columns.map(columnApi),
    getRowModel: () => ({ rows: paged.map(rowApi) }),
    getFilteredRowModel: () => ({ rows: filtered.map(rowApi) }),
    getFilteredSelectedRowModel: () => ({ rows: filtered.filter((e) => selected[e.id]).map(rowApi) }),
    getIsAllPageRowsSelected: () => allPageSelected,
    getIsSomePageRowsSelected: () => somePageSelected,
    toggleAllPageRowsSelected: (value) => toggleAllPage(value ?? !allPageSelected),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < pageCount - 1,
    previousPage: () => setPageIndex((p) => Math.max(0, p - 1)),
    nextPage: () => setPageIndex((p) => Math.min(pageCount - 1, p + 1)),
    getPageCount: () => pageCount,
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const filteredCount = table.getFilteredRowModel().rows.length
  const trackList = visibleColumns.map((c) => track(c.width)).join(' ')

  const headerContent = (column: DataTableColumnDef<TData>): ReactNode => {
    if (column.id === 'select')
      return (
        <Checkbox
          aria-label="Select all"
          checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
          onCheckedChange={(value: boolean) => toggleAllPage(!!value)}
        />
      )
    if (typeof column.header === 'function') return column.header({ column: columnApi(column) })
    return ink(column.header ?? column.id, SizableText, { size: '$2', fontWeight: '600', color: '$quiet' })
  }

  const cellContent = (column: DataTableColumnDef<TData>, entry: Entry<TData>): ReactNode => {
    if (column.id === 'select')
      return (
        <Checkbox
          aria-label="Select row"
          checked={selected[entry.id] === true}
          onCheckedChange={(value: boolean) => setSelectedFor(entry.id, !!value)}
        />
      )
    if (column.cell) return column.cell({ row: rowApi(entry) })
    return ink(String(cellValue(column, entry.row) ?? ''), SizableText, { size: '$2' })
  }

  const ariaSort = (column: DataTableColumnDef<TData>): 'ascending' | 'descending' | 'none' => {
    if (sorting?.id !== column.id) return 'none'
    return sorting.desc ? 'descending' : 'ascending'
  }

  return (
    <YStack {...slot('data-table')} width="100%" gap="$3">
      {(filterColumnId || hideable.length > 0) && (
        <XStack {...slot('data-table-toolbar')} items="center" gap="$2">
          {filterColumnId && (
            <Input
              {...slot('data-table-filter')}
              placeholder={filterPlaceholder}
              value={filter}
              onChangeText={setFilter}
              maxW={360}
              width="100%"
            />
          )}
          {hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button {...slot('data-table-view-options')} variant="outline" size="sm" ml="auto">
                  Columns
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hideable.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={hidden[column.id] !== true}
                    onCheckedChange={(value: boolean) => setHidden((h) => ({ ...h, [column.id]: !value }))}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </XStack>
      )}

      <YStack {...slot('data-table-grid')} role="table" rounded="$3" borderWidth={1} borderColor="$borderColor" overflow="hidden">
        <YStack borderBottomWidth={1} borderBottomColor="$borderColor" bg="$panel">
          <Grid role="row" {...slot('data-table-header-row')} columns={trackList} gap={0}>
            {visibleColumns.map((column) => (
              <Cell
                key={column.id}
                role="columnheader"
                aria-sort={ariaSort(column)}
                {...slot('data-table-head')}
                style={{ display: 'flex', alignItems: 'center', padding: 12, justifyContent: justify(column.align) }}
              >
                {headerContent(column)}
              </Cell>
            ))}
          </Grid>
        </YStack>

        {paged.length === 0 ? (
          <YStack {...slot('data-table-empty')} height={96} items="center" justify="center">
            <SizableText size="$2" color="$quiet">
              {emptyMessage}
            </SizableText>
          </YStack>
        ) : (
          paged.map((entry) => {
            const isSelected = selected[entry.id] === true
            return (
              <YStack
                key={entry.id}
                data-state={isSelected ? 'selected' : undefined}
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
                bg={isSelected ? '$hover' : undefined}
              >
                <Grid role="row" {...slot('data-table-row')} data-state={isSelected ? 'selected' : undefined} columns={trackList} gap={0}>
                  {visibleColumns.map((column) => (
                    <Cell
                      key={column.id}
                      role="cell"
                      {...slot('data-table-cell')}
                      style={{ display: 'flex', alignItems: 'center', padding: 12, justifyContent: justify(column.align) }}
                    >
                      {cellContent(column, entry)}
                    </Cell>
                  ))}
                </Grid>
              </YStack>
            )
          })
        )}
      </YStack>

      <XStack {...slot('data-table-footer')} items="center" justify="space-between">
        <SizableText size="$2" color="$quiet">
          {selectedCount} of {filteredCount} row(s) selected.
        </SizableText>
        {pageSize > 0 && (
          <XStack {...slot('data-table-pagination')} gap="$2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              aria-disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              aria-disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </XStack>
        )}
      </XStack>
    </YStack>
  )
}

export { DataTable, DataTableColumnHeader }
