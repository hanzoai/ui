'use client'

// DataTable — the Twenty-grade, metadata-driven record grid. Columns are
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
// interaction state. Palette is the package's raw-hex tokens (theme-independent).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Maximize2 } from '@hanzogui/lucide-icons-2'
import type { FieldDefinition, SelectOption } from '../field/types'
import { FieldDisplay } from '../field/FieldDisplay'
import { FieldInput, isEditable } from '../field/FieldInput'
import { CheckBox } from '../primitives'
import { tokens } from '../theme'
import { cycleSort, orderedColumns, paginate, sortDirOf, type SortRule } from './logic'

type Record_ = Record<string, unknown>

/** Field types whose editor commits on selection (a dropdown / toggle), not on Enter. */
const INSTANT = new Set(['boolean', 'select', 'multiSelect', 'date', 'dateTime', 'relation', 'rating', 'files'])

const SELECT_COL_W = 44
const MIN_COL_W = 80
const DEFAULT_ROW_H = 44
// The open-record button. Drawn at 26 so it sits inside a 44px row without
// crowding the cell, then padded out to a 44px touch target with hitSlop.
const OPEN_HIT = 26
const OPEN_SLOP = (44 - OPEN_HIT) / 2

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
  rowHeight?: number
}

export function DataTable(props: DataTableProps) {
  const {
    fields, records, getRowKey, loading, empty = 'No records yet.',
    sorts = [], onSortChange, onOpen,
    selectable, onSelectionChange, bulkActions,
    editable, onEditCommit, fieldOptions,
    columnOrder, onColumnOrderChange, hiddenFields,
    pageSize = 25, rowHeight = DEFAULT_ROW_H,
  } = props

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

  const pageData = useMemo(
    () => (pageSize > 0 ? paginate(records, page, pageSize) : { items: records, page: 1, pageCount: 1, total: records.length, from: records.length ? 1 : 0, to: records.length }),
    [records, page, pageSize],
  )
  useEffect(() => { if (page > pageData.pageCount) setPage(pageData.pageCount) }, [page, pageData.pageCount])

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

  return (
    <YStack rounded={10} overflow="hidden" borderWidth={1} style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
      {selectable && selected.size > 0 ? (
        <XStack items="center" justify="space-between" px={12} py={8} style={{ backgroundColor: tokens.surfaceRaised, borderBottomWidth: 1, borderBottomColor: tokens.border }}>
          <Text fontSize={13} fontWeight="600" style={{ color: tokens.text }}>{selected.size} selected</Text>
          <XStack items="center" gap={8}>
            {bulkActions?.([...selected])}
            <Text fontSize={13} cursor="pointer" onPress={() => emit(new Set())} style={{ color: tokens.accent }}>Clear</Text>
          </XStack>
        </XStack>
      ) : null}

      <YStack style={{ minWidth: gridMinWidth }}>
        {/* header */}
        <XStack style={{ backgroundColor: tokens.surfaceRaised, borderBottomWidth: 1, borderBottomColor: tokens.border }}>
          {selectable ? (
            <XStack width={SELECT_COL_W} items="center" justify="center" py={10}>
              <CheckBox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={toggleAll} />
            </XStack>
          ) : null}
          {columns.map((c, i) => {
            const dir = sortDirOf(sorts, c.name)
            const isDropTarget = dragCol && dragCol.target === i && dragCol.from !== i
            return (
              <XStack
                key={c.name}
                {...cellWidthProps(c)}
                items="center"
                gap={4}
                px={12}
                py={10}
                ref={(node: unknown) => { headerRefs.current[i] = (node as HTMLElement | null) }}
                style={{ position: 'relative', borderLeftWidth: isDropTarget ? 2 : 0, borderLeftColor: tokens.accent, opacity: dragCol?.from === i ? 0.5 : 1 }}
              >
                <XStack items="center" gap={5} flex={1} cursor="pointer" onPress={() => onHeaderSort(c.name)} onPointerDown={beginReorder(i)}>
                  <Text fontSize={11} fontWeight="700" numberOfLines={1} style={{ color: tokens.textFaint, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                    {c.label}
                  </Text>
                  {dir === 'asc' ? <ArrowUp size={12} color={tokens.textMuted} /> : dir === 'desc' ? <ArrowDown size={12} color={tokens.textMuted} /> : onSortChange ? <ChevronsUpDown size={12} color={tokens.border} /> : null}
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
          <XStack px={16} py={32} items="center" justify="center" gap={10}>
            <Spinner size="small" color={tokens.textMuted} />
            <Text style={{ color: tokens.textFaint }}>Loading…</Text>
          </XStack>
        ) : pageData.items.length === 0 ? (
          <YStack px={16} py={40} items="center" gap={4}>
            {typeof empty === 'string' ? <Text style={{ color: tokens.textFaint }}>{empty}</Text> : empty}
          </YStack>
        ) : (
          pageData.items.map((record, i) => {
            const rowKey = keyOf(record, i)
            const isSel = selected.has(rowKey)
            return (
              <XStack
                key={rowKey}
                group
                items="stretch"
                cursor={rowPressable ? 'pointer' : undefined}
                onPress={rowPressable ? () => onOpen?.(record) : undefined}
                hoverStyle={{ bg: tokens.hover }}
                style={{ borderBottomWidth: 1, borderBottomColor: tokens.border, backgroundColor: isSel ? tokens.hover : 'transparent', minHeight: rowHeight }}
              >
                {selectable ? (
                  <XStack width={SELECT_COL_W} items="center" justify="center">
                    <CheckBox checked={isSel} onChange={() => toggleOne(rowKey)} />
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
                    <XStack key={c.name} {...cellWidthProps(c)} items="center" px={12} py={6} style={{ position: 'relative' }}>
                      {isEditingCell ? (
                        <YStack flex={1} onPress={(e: { stopPropagation?: () => void }) => e.stopPropagation?.()}>
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
                          items="center"
                          minH={rowHeight - 12}
                          cursor={canEdit ? 'text' : undefined}
                          onPress={canEdit ? () => startEdit(rowKey, c, record[c.name]) : undefined}
                          hoverStyle={canEdit ? { bg: tokens.surfaceRaised } : undefined}
                          rounded={6}
                          px={canEdit ? 6 : 0}
                          style={{ marginLeft: canEdit ? -6 : 0 }}
                        >
                          <FieldDisplay field={c} value={record[c.name]} />
                          {savingCell === cellId ? <Spinner size="small" color={tokens.textFaint} /> : null}
                        </XStack>
                      )}
                      {/* Open affordance on the first column. ALWAYS visible, never hover-gated.
                          An editable row is not row-pressable (a press has to reach the cell editor),
                          so this button is the only way into the record — and a control that only
                          appears on hover does not exist on a touch device at all, and is
                          undiscoverable with a mouse. It stays quiet via colour, not via opacity. */}
                      {ci === 0 && onOpen && editable && !isEditingCell ? (
                        <XStack
                          items="center"
                          justify="center"
                          width={OPEN_HIT}
                          height={OPEN_HIT}
                          rounded={6}
                          cursor="pointer"
                          aria-label="Open record"
                          hitSlop={OPEN_SLOP}
                          onPress={() => onOpen(record)}
                          hoverStyle={{ bg: tokens.border }}
                          style={{ position: 'absolute', right: 6, backgroundColor: tokens.surfaceRaised }}
                        >
                          <Maximize2 size={13} color={tokens.textMuted} />
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
        <XStack items="center" justify="space-between" px={12} py={8} style={{ backgroundColor: tokens.surfaceRaised, borderTopWidth: 1, borderTopColor: tokens.border }}>
          <Text fontSize={12} style={{ color: tokens.textFaint }}>{`${pageData.from}–${pageData.to} of ${pageData.total}`}</Text>
          <XStack items="center" gap={4}>
            <PagerButton disabled={pageData.page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} color={pageData.page <= 1 ? tokens.border : tokens.textMuted} /></PagerButton>
            <Text fontSize={12} px={6} style={{ color: tokens.textMuted }}>{`${pageData.page} / ${pageData.pageCount}`}</Text>
            <PagerButton disabled={pageData.page >= pageData.pageCount} onPress={() => setPage((p) => Math.min(pageData.pageCount, p + 1))}><ChevronRight size={15} color={pageData.page >= pageData.pageCount ? tokens.border : tokens.textMuted} /></PagerButton>
          </XStack>
        </XStack>
      ) : null}
    </YStack>
  )
}

function PagerButton({ children, disabled, onPress }: { children: ReactNode; disabled?: boolean; onPress: () => void }) {
  return (
    <XStack
      width={28}
      height={28}
      items="center"
      justify="center"
      rounded={6}
      cursor={disabled ? undefined : 'pointer'}
      onPress={disabled ? undefined : onPress}
      hoverStyle={disabled ? undefined : { bg: tokens.hover }}
    >
      {children}
    </XStack>
  )
}
