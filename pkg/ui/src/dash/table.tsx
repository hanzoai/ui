'use client'

import * as React from 'react'
import { cn } from '../../utils'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  id: string
  header: string
  /** Render cell content. Falls back to (row as any)[id]. */
  cell?: (row: T) => React.ReactNode
  /** Enable sorting on this column */
  sortable?: boolean
  /** Width hint (CSS value) */
  width?: string
  /** Alignment */
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T> {
  /** Column definitions */
  columns: Column<T>[]
  /** Row data */
  data: T[]
  /** Unique key extractor per row */
  rowKey: (row: T) => string
  /** Enable row selection checkboxes */
  selectable?: boolean
  /** Currently selected row keys */
  selectedKeys?: Set<string>
  /** Called when selection changes */
  onSelectionChange?: (keys: Set<string>) => void
  /** Searchable - shows search input above table */
  searchable?: boolean
  /** Search placeholder */
  searchPlaceholder?: string
  /** Pagination: total rows available (may exceed data.length for server pagination) */
  totalRows?: number
  /** Current page (0-indexed) */
  page?: number
  /** Rows per page */
  pageSize?: number
  /** Called when page changes */
  onPageChange?: (page: number) => void
  /** Called when page size changes */
  onPageSizeChange?: (size: number) => void
  /** Actions column renderer (edit, delete buttons etc.) */
  actions?: (row: T) => React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  className?: string
}

type SortState = { column: string; direction: 'asc' | 'desc' } | null

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Table<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  searchable = false,
  searchPlaceholder = 'Search...',
  totalRows,
  page = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  actions,
  loading = false,
  emptyMessage = 'No data',
  className,
}: TableProps<T>) {
  const [search, setSearch] = React.useState('')
  const [sort, setSort] = React.useState<SortState>(null)

  /* ---------- filtering ---------- */
  const filtered = React.useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.cell ? '' : String((row as Record<string, unknown>)[col.id] ?? '')
        return val.toLowerCase().includes(q)
      }),
    )
  }, [data, search, columns])

  /* ---------- sorting ---------- */
  const sorted = React.useMemo(() => {
    if (!sort) return filtered
    const { column, direction } = sort
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[column]
      const bv = (b as Record<string, unknown>)[column]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return direction === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort])

  /* ---------- pagination ---------- */
  const total = totalRows ?? sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rows = onPageChange ? sorted : sorted.slice(page * pageSize, (page + 1) * pageSize)

  /* ---------- selection ---------- */
  const selected = selectedKeys ?? new Set<string>()
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(rowKey(r)))

  function toggleAll() {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(rows.map(rowKey)))
    }
  }

  function toggleRow(key: string) {
    if (!onSelectionChange) return
    const next = new Set(selected)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onSelectionChange(next)
  }

  function handleSort(colId: string) {
    setSort((prev) => {
      if (prev?.column === colId) {
        return prev.direction === 'asc' ? { column: colId, direction: 'desc' } : null
      }
      return { column: colId, direction: 'asc' }
    })
  }

  const allColumns = actions
    ? [...columns, { id: '__actions', header: '', width: 'auto' } as Column<T>]
    : columns

  return (
    <div className={cn('rounded-[var(--dash-radius-lg)] border border-[var(--dash-border)] bg-[var(--dash-surface)]', className)}>
      {/* Toolbar */}
      {(searchable || selectable) && (
        <div className="flex items-center gap-3 border-b border-[var(--dash-border)] px-4 py-3">
          {searchable && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-8 w-64 max-w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 text-sm text-[var(--dash-text)]',
                'placeholder:text-[var(--dash-text-dim)]',
                'focus:border-[var(--dash-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-primary)]',
              )}
            />
          )}
          {selectable && selected.size > 0 && (
            <span className="text-xs text-[var(--dash-text-muted)]">
              {selected.size} selected
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--dash-border)]">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[var(--dash-border)] accent-[var(--dash-primary)]"
                  />
                </th>
              )}
              {allColumns.map((col) => (
                <th
                  key={col.id}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-2.5 text-[var(--dash-text-dim)] font-medium',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    !col.align && 'text-left',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--dash-text-muted)]',
                  )}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sort?.column === col.id && (
                      <span className="text-[10px]">{sort.direction === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={allColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-[var(--dash-text-dim)]"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={allColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-[var(--dash-text-dim)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = rowKey(row)
                const isSelected = selected.has(key)
                return (
                  <tr
                    key={key}
                    className={cn(
                      'border-b border-[var(--dash-border)] transition-colors',
                      isSelected
                        ? 'bg-[var(--dash-surface-active)]'
                        : 'hover:bg-[var(--dash-surface-hover)]',
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          className="h-4 w-4 rounded border-[var(--dash-border)] accent-[var(--dash-primary)]"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-2.5',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : String((row as Record<string, unknown>)[col.id] ?? '')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-2.5 text-right">{actions(row)}</td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--dash-border)] px-4 py-2.5 text-xs text-[var(--dash-text-muted)]">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="h-7 rounded border border-[var(--dash-border)] bg-[var(--dash-bg)] px-2 text-xs text-[var(--dash-text)] focus:outline-none"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded p-1 hover:bg-[var(--dash-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded p-1 hover:bg-[var(--dash-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
