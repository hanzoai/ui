'use client'

// DataTable — the metadata-driven record grid. Columns are
// FieldDefinitions, rows are records; every cell renders through FieldDisplay /
// FieldInput, so the grid understands every field type and a new type needs zero
// table changes. It adds the record-app essentials on the same one model:
//   • click-to-sort headers (controlled by the view; carets show direction)
//   • drag-resize + drag-reorder columns (pointer events; snapshot rects)
//   • row selection with a header select-all (indeterminate) + bulk callback
//   • inline cell editing (click an editable cell → the field's own editor)
//   • pagination, hover-reveal "open" affordance, honest empty / loading
// Presentational + data-injected: the host supplies records (already filtered +
// sorted by the view) and the persistence callbacks; the table owns only its
// interaction state.
//
// Drawn with @hanzo/ui's record kit and its theme rungs, so it follows the theme.
// Under `<Density value="compact">` it takes the record density — 32px rows, an
// 8px cell gutter, a 28px selection column, a framed hover action at a cell's end
// — the cell geometry the source kit's tables are built from (MIT, see NOTICE); a host
// that sets no density keeps its 44px rows.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Maximize2 } from '@hanzogui/lucide-icons-2'
import { Button, ButtonGroup, useDensity } from '@hanzo/ui'
import type { FieldDefinition, SelectOption } from '../field/types'
import { FieldDisplay } from '../field/FieldDisplay'
import { FieldInput, isEditable } from '../field/FieldInput'
import { CheckBox } from '../primitives'
import { cycleSort, orderedColumns, paginate, sortDirOf, type SortRule } from './logic'

type Record_ = Record<string, unknown>

/** Field types whose editor commits on selection (a dropdown / toggle), not on Enter. */
const INSTANT = new Set(['boolean', 'select', 'multiSelect', 'date', 'dateTime', 'relation', 'rating', 'files'])

const MIN_COL_W = 80

/** The two densities' geometry: row height, cell gutter, selection column. */
const GEOMETRY = {
  regular: { row: 44, pad: 12, select: 44 },
  compact: { row: 32, pad: 8, select: 28 },
} as const

export interface DataTableProps {
  fields: FieldDefinition[]
  /** Rows, already filtered + sorted by the host/view (a flat name→value map each). */
  records: Record_[]
  getRowKey?: (record: Record_, index: number) => string
  loading?: boolean
  empty?: ReactNode

  // sort — controlled by the view; a header click cycles the column
  sorts?: SortRule[]
  onSortChange?: (sorts: SortRule[]) => void

  // open a record (an expand affordance appears on row hover)
  onOpen?: (record: Record_) => void

  // selection
  selectable?: boolean
  onSelectionChange?: (ids: string[]) => void
  /** Bulk-action bar content, shown when ≥1 row is selected. */
  bulkActions?: (ids: string[]) => ReactNode

  // inline editing
  editable?: boolean
  /** Persist one cell edit. May be async; the cell shows a saving state until it settles. */
  onEditCommit?: (record: Record_, field: FieldDefinition, value: unknown) => void | Promise<void>
  /** Inject candidate options for a field's editor (e.g. relation records). */
  fieldOptions?: (field: FieldDefinition) => SelectOption[] | undefined

  // column layout (uncontrolled internal state, mirrored up when provided)
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  hiddenFields?: string[]

  // pagination (0 / undefined → show all)
  pageSize?: number
  /**
   * The rows are one page a server answered: `records` is shown as it is, and the
   * pager reads `total` and moves by `onPage`. Unset, the table pages `records`
   * itself.
   */
  remote?: RemotePage
  /** Row height; unset, the density's (44, or 32 under `<Density value="compact">`). */
  rowHeight?: number
}

/** One page of a server's answer: where it sits, how many there are, how to move. */
export interface RemotePage {
  /** 1-based page shown. */
  page: number
  /** How many records the query admits in all. */
  total: number
  onPage: (page: number) => void
}

export function DataTable(props: DataTableProps) {
  const {
    fields, records, getRowKey, loading, empty = 'No records yet.',
    sorts = [], onSortChange, onOpen,
    selectable, onSelectionChange, bulkActions,
    editable, onEditCommit, fieldOptions,
    columnOrder, onColumnOrderChange, hiddenFields,
    pageSize = 25,
    remote,
  } = props
  const geo = GEOMETRY[useDensity()]
  const rowHeight = props.rowHeight ?? geo.row
  const SELECT_COL_W = geo.select

  const hidden = useMemo(() => new Set(hiddenFields ?? []), [hiddenFields])
  const [order, setOrder] = useState<string[] | undefined>(columnOrder)
  useEffect(() => { if (columnOrder) setOrder(columnOrder) }, [columnOrder])
  const columns = useMemo(() => orderedColumns(fields, order, hidden), [fields, order, hidden])

  const [widths, setWidths] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<{ key: string; field: string } | null>(null)
  const [draft, setDraft] = useState<unknown>(undefined)
  const [savingCell, setSavingCell] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const keyOf = useCallback(
    (r: Record_, i: number) => (getRowKey ? getRowKey(r, i) : r.id != null ? String(r.id) : String(i)),
    [getRowKey],
  )

  const pageData = useMemo(() => {
    if (remote) {
      const size = pageSize > 0 ? pageSize : Math.max(1, records.length)
      const from = remote.total === 0 || records.length === 0 ? 0 : (remote.page - 1) * size + 1
      return {
        items: records,
        page: remote.page,
        pageCount: Math.max(1, Math.ceil(remote.total / size)),
        total: remote.total,
        from,
        to: from === 0 ? 0 : from + records.length - 1,
      }
    }
    return pageSize > 0 ? paginate(records, page, pageSize) : { items: records, page: 1, pageCount: 1, total: records.length, from: records.length ? 1 : 0, to: records.length }
  }, [records, page, pageSize, remote])
  useEffect(() => { if (!remote && page > pageData.pageCount) setPage(pageData.pageCount) }, [remote, page, pageData.pageCount])
  const goTo = (p: number) => {
    const next = Math.min(Math.max(1, p), pageData.pageCount)
    if (remote) remote.onPage(next)
    else setPage(next)
  }

  const emit = useCallback((next: Set<string>) => { setSelected(next); onSelectionChange?.([...next]) }, [onSelectionChange])
  const pageKeys = pageData.items.map((r, i) => keyOf(r, i))
  const allOnPage = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k))
  const someOnPage = pageKeys.some((k) => selected.has(k))
  const toggleAll = () => {
    const next = new Set(selected)
    if (allOnPage) pageKeys.forEach((k) => next.delete(k))
    else pageKeys.forEach((k) => next.add(k))
    emit(next)
  }
  const toggleOne = (k: string) => {
    const next = new Set(selected)
    next.has(k) ? next.delete(k) : next.add(k)
    emit(next)
  }

  const onHeaderSort = (name: string) => onSortChange?.(cycleSort(sorts, name))

  // ── column resize + reorder (pointer events; snapshot rects at drag start) ──
  const headerRefs = useRef<Array<HTMLElement | null>>([])
  const [dragCol, setDragCol] = useState<{ from: number; x: number; target: number } | null>(null)

  const beginResize = (name: string, startNode: HTMLElement | null) => (e: { clientX?: number; nativeEvent?: { clientX?: number } }) => {
    const startX = e.clientX ?? e.nativeEvent?.clientX ?? 0
    const startW = startNode?.getBoundingClientRect().width ?? MIN_COL_W
    const move = (ev: PointerEvent) => setWidths((w) => ({ ...w, [name]: Math.max(MIN_COL_W, startW + (ev.clientX - startX)) }))
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const beginReorder = (from: number) => (e: { clientX?: number; nativeEvent?: { clientX?: number } }) => {
    if (!onColumnOrderChange && columnOrder) return
    const rects = headerRefs.current.map((n) => n?.getBoundingClientRect() ?? null)
    const startX = e.clientX ?? e.nativeEvent?.clientX ?? 0
    setDragCol({ from, x: startX, target: from })
    const move = (ev: PointerEvent) => {
      let target = rects.length - 1
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (r && ev.clientX < r.left + r.width / 2) { target = i; break }
      }
      setDragCol({ from, x: ev.clientX, target })
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      setDragCol((d) => {
        if (d && d.target !== d.from) {
          const names = columns.map((c) => c.name)
          const [moved] = names.splice(d.from, 1)
          names.splice(d.target, 0, moved)
          setOrder(names)
          onColumnOrderChange?.(names)
        }
        return null
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  // ── inline edit ─────────────────────────────────────────────────────────────
  const startEdit = (rowKey: string, field: FieldDefinition, current: unknown) => {
    if (!editable || field.readOnly || !isEditable(field.type)) return
    setEditing({ key: rowKey, field: field.name })
    setDraft(current)
  }
  const cancelEdit = () => { setEditing(null); setDraft(undefined) }
  const commitEdit = useCallback(async (record: Record_, field: FieldDefinition, value: unknown) => {
    const cellId = `${editing?.key}:${field.name}`
    setEditing(null)
    setDraft(undefined)
    if (!onEditCommit) return
    try { setSavingCell(cellId); await onEditCommit(record, field, value) } finally { setSavingCell(null) }
  }, [editing, onEditCommit])

  // Read-only rows open on a full-row press; editable rows open via the expand
  // affordance (so a cell click edits instead of opening — no interaction conflict).
  const rowPressable = !editable && Boolean(onOpen)
  const gridMinWidth = (selectable ? SELECT_COL_W : 0) + columns.reduce((s, c) => s + (widths[c.name] ?? c.width ?? 160), 0)

  const cellWidthProps = (c: FieldDefinition) => {
    const w = widths[c.name] ?? c.width
    return w ? { width: w } : { flex: 1, minW: 140 }
  }
  const hairline = { borderBottomWidth: 1, borderColor: '$borderColor' } as const

  return (
    <YStack {...({ 'data-slot': 'data-table' } as object)} rounded="$3" overflow="hidden" borderWidth={1} borderColor="$borderColor" bg="$background">
      {selectable && selected.size > 0 ? (
        <XStack items="center" justify="space-between" px={geo.pad} py="$2" bg="$panel" {...hairline}>
          <Text fontSize="$2" fontWeight="600" color="$ink">{`${selected.size} selected`}</Text>
          <XStack items="center" gap="$2">
            {bulkActions?.([...selected])}
            <Button size="xs" variant="ghost" emphasis="subtle" onPress={() => emit(new Set())}>
              Clear
            </Button>
          </XStack>
        </XStack>
      ) : null}

      <YStack {...({ role: 'table', 'aria-rowcount': pageData.total + 1 } as object)} style={{ minWidth: gridMinWidth }}>
        {/* header */}
        <XStack bg="$panel" minH={rowHeight} {...hairline} {...({ role: 'row' } as object)}>
          {selectable ? (
            <XStack width={SELECT_COL_W} items="center" justify="center" shrink={0} {...({ role: 'columnheader' } as object)}>
              <CheckBox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={toggleAll} label="Select all rows" />
            </XStack>
          ) : null}
          {columns.map((c, i) => {
            const dir = sortDirOf(sorts, c.name)
            const isDropTarget = dragCol && dragCol.target === i && dragCol.from !== i
            return (
              <XStack
                key={c.name}
                {...cellWidthProps(c)}
                {...({ role: 'columnheader', 'aria-sort': dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined } as object)}
                items="center"
                gap="$1"
                px={geo.pad}
                borderLeftWidth={isDropTarget ? 2 : 0}
                borderLeftColor={'var(--primary)' as never}
                opacity={dragCol?.from === i ? 0.5 : 1}
                ref={(node: unknown) => { headerRefs.current[i] = (node as HTMLElement | null) }}
                style={{ position: 'relative' }}
              >
                <XStack items="center" gap="$1" flex={1} minW={0} cursor="pointer" onPress={() => onHeaderSort(c.name)} onPointerDown={beginReorder(i)}>
                  <Text fontSize="$2" fontWeight="500" numberOfLines={1} color="$aside">
                    {c.label}
                  </Text>
                  {dir === 'asc' ? <ArrowUp size={12} color="$hint" /> : dir === 'desc' ? <ArrowDown size={12} color="$hint" /> : onSortChange ? <ChevronsUpDown size={12} color="$hush" /> : null}
                </XStack>
                {/* resize handle */}
                <YStack
                  width={8}
                  height="100%"
                  cursor="col-resize"
                  onPointerDown={beginResize(c.name, headerRefs.current[i])}
                  style={{ position: 'absolute', right: -4, top: 0, zIndex: 2 }}
                />
              </XStack>
            )
          })}
        </XStack>

        {/* body */}
        {loading ? (
          <XStack {...({ role: 'row' } as object)}>
            <XStack flex={1} px="$4" py="$6" items="center" justify="center" gap="$2" {...({ role: 'cell', 'aria-live': 'polite' } as object)}>
              <Spinner size="small" aria-hidden />
              <Text fontSize="$2" color="$hint">Loading…</Text>
            </XStack>
          </XStack>
        ) : pageData.items.length === 0 ? (
          <XStack {...({ role: 'row' } as object)}>
            <YStack flex={1} px="$4" py="$7" items="center" gap="$1" {...({ role: 'cell' } as object)}>
              {typeof empty === 'string' ? <Text fontSize="$2" color="$hint">{empty}</Text> : empty}
            </YStack>
          </XStack>
        ) : (
          pageData.items.map((record, i) => {
            const rowKey = keyOf(record, i)
            const isSel = selected.has(rowKey)
            return (
              <XStack
                key={rowKey}
                group
                {...({ role: 'row', 'aria-selected': selectable ? isSel : undefined } as object)}
                items="stretch"
                cursor={rowPressable ? 'pointer' : undefined}
                onPress={rowPressable ? () => onOpen?.(record) : undefined}
                bg={isSel ? '$hover' : 'transparent'}
                hoverStyle={{ bg: '$hover' }}
                minH={rowHeight}
                {...hairline}
              >
                {selectable ? (
                  <XStack width={SELECT_COL_W} items="center" justify="center" shrink={0} {...({ role: 'cell' } as object)}>
                    <CheckBox checked={isSel} onChange={() => toggleOne(rowKey)} label={`Select row ${pageData.from + i}`} />
                  </XStack>
                ) : null}
                {columns.map((c, ci) => {
                  const isEditingCell = editable && editing?.key === rowKey && editing.field === c.name
                  const canEdit = editable && !c.readOnly && isEditable(c.type)
                  const cellId = `${rowKey}:${c.name}`
                  const withOpts: FieldDefinition = fieldOptions?.(c)
                    ? { ...c, metadata: { ...(c.metadata as object), options: fieldOptions(c) } as FieldDefinition['metadata'] }
                    : c
                  return (
                    <XStack key={c.name} {...cellWidthProps(c)} {...({ role: 'cell' } as object)} items="center" px={geo.pad} minW={0} style={{ position: 'relative' }}>
                      {isEditingCell ? (
                        <YStack flex={1} minW={0} py="$1" onPress={(e: { stopPropagation?: () => void }) => e.stopPropagation?.()}>
                          <FieldInput
                            field={withOpts}
                            value={draft}
                            autoFocus
                            onChange={(v) => (INSTANT.has(c.type) ? void commitEdit(record, c, v) : setDraft(v))}
                            onSubmit={() => void commitEdit(record, c, draft)}
                            onCancel={cancelEdit}
                          />
                        </YStack>
                      ) : (
                        <XStack
                          flex={1}
                          minW={0}
                          items="center"
                          gap="$1"
                          minH={rowHeight - 8}
                          cursor={canEdit ? 'text' : undefined}
                          onPress={canEdit ? () => startEdit(rowKey, c, record[c.name]) : undefined}
                          hoverStyle={canEdit ? { bg: '$raised' } : undefined}
                          rounded="$xs"
                          px={canEdit ? '$1' : 0}
                          mx={canEdit ? -4 : 0}
                          overflow="hidden"
                        >
                          <FieldDisplay field={c} value={record[c.name]} />
                          {savingCell === cellId ? <Spinner size="small" aria-hidden /> : null}
                        </XStack>
                      )}
                      {/* open action on the first column, revealed on row hover — editable rows only; read-only rows open on a full-row press */}
                      {ci === 0 && onOpen && editable && !isEditingCell ? (
                        <XStack position="absolute" r={geo.pad / 2} opacity={0} $group-hover={{ opacity: 1 }} focusWithinStyle={{ opacity: 1 }}>
                          <ButtonGroup framed size="icon-2xs" variant="ghost">
                            <Button size="icon-2xs" variant="ghost" emphasis="subtle" aria-label="Open record" onPress={() => onOpen(record)}>
                              <Maximize2 />
                            </Button>
                          </ButtonGroup>
                        </XStack>
                      ) : null}
                    </XStack>
                  )
                })}
              </XStack>
            )
          })
        )}
      </YStack>

      {/* footer / pagination */}
      {!loading && pageSize > 0 && pageData.total > 0 ? (
        <XStack items="center" justify="space-between" px={geo.pad} py="$1" bg="$panel" borderTopWidth={1} borderColor="$borderColor">
          <Text fontSize="$1" color="$hint">{`${pageData.from.toLocaleString()}–${pageData.to.toLocaleString()} of ${pageData.total.toLocaleString()}`}</Text>
          <XStack items="center" gap="$1">
            <Button size="icon-xs" variant="ghost" emphasis="subtle" aria-label="Previous page" disabled={pageData.page <= 1} onPress={() => goTo(pageData.page - 1)}>
              <ChevronLeft />
            </Button>
            <Text fontSize="$1" px="$1" color="$hint">{`${pageData.page.toLocaleString()} / ${pageData.pageCount.toLocaleString()}`}</Text>
            <Button size="icon-xs" variant="ghost" emphasis="subtle" aria-label="Next page" disabled={pageData.page >= pageData.pageCount} onPress={() => goTo(pageData.page + 1)}>
              <ChevronRight />
            </Button>
          </XStack>
        </XStack>
      ) : null}
    </YStack>
  )
}
