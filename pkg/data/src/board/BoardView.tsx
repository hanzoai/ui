'use client'

// BoardView — the kanban view. Records are grouped into columns by a select /
// status / boolean / relation field (board/logic), each rendered as a RecordCard.
// Dragging a card to another column emits the record patch that move implies
// (movePatch) via onRecordChange; the move is optimistic (the card follows the
// pointer and lands immediately) and reverts if persistence fails — responsive,
// never fabricated. The same FieldDisplay engine as the table, so the card
// understands every field type. Presentational + data-injected.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from '@hanzogui/lucide-icons-2'
import { ScrollView, Text, XStack, YStack } from '@hanzo/gui'
import type { FieldDefinition } from '../field/types'
import { RecordCard } from '../table/RecordCard'
import { Tag } from '../field/displays'
import { tokens, tagTone } from '../theme'
import { boardColumns, movePatch, groupKeyOf, NO_VALUE, type BoardColumn } from './logic'

type Record_ = Record<string, unknown>

const COL_W = 300

export interface BoardViewProps {
  fields: FieldDefinition[]
  records: Record_[]
  /** The field records are grouped into columns by (a select / status / boolean / relation). */
  groupField: string
  /** The card title field (defaults to the first non-group field). */
  titleField?: string
  /** Fields shown on each card (defaults to a few beyond the title/group). */
  cardFields?: FieldDefinition[]
  onOpen?: (record: Record_) => void
  /** Persist a card's move to another column. May be async; reverts on failure. */
  onRecordChange?: (record: Record_, patch: Record<string, unknown>) => void | Promise<void>
  /** Create a record in a column (the column value is pre-filled). */
  onCreate?: (columnKey: string) => void
  getRowKey?: (record: Record_) => string
}

export function BoardView(props: BoardViewProps) {
  const { fields, records, groupField, titleField, cardFields, onOpen, onRecordChange, onCreate, getRowKey } = props
  const keyOf = (r: Record_) => (getRowKey ? getRowKey(r) : String(r.id ?? ''))

  const field = fields.find((f) => f.name === groupField)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  useEffect(() => { setOverrides({}) }, [records])

  const boardRef = useRef<HTMLElement | null>(null)
  const colRefs = useRef<Array<HTMLElement | null>>([])
  const [drag, setDrag] = useState<{ id: string; from: string; x: number; y: number; target: string } | null>(null)

  const effective = useMemo(
    () => (field ? records.map((r) => (overrides[keyOf(r)] != null ? { ...r, [field.name]: overrides[keyOf(r)] === NO_VALUE ? null : overrides[keyOf(r)] } : r)) : records),
    [records, overrides, field],
  )
  const columns: BoardColumn[] = useMemo(() => (field ? boardColumns(effective, field) : []), [effective, field])

  if (!field) {
    return (
      <YStack p={24} items="center" borderWidth={1} rounded={10} style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
        <Text style={{ color: tokens.textFaint }}>Pick a select or status field to group the board by.</Text>
      </YStack>
    )
  }

  const startDrag = (record: Record_) => (e: { clientX?: number; clientY?: number; nativeEvent?: { clientX?: number; clientY?: number } }) => {
    if (!onRecordChange) return
    const id = keyOf(record)
    const from = groupKeyOf(field, record[field.name])
    const rects = colRefs.current.map((n) => n?.getBoundingClientRect() ?? null)
    const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0
    const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0
    setDrag({ id, from, x: cx, y: cy, target: from })
    const move = (ev: PointerEvent) => {
      let target = from
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (r && ev.clientX >= r.left && ev.clientX <= r.right) { target = columns[i]?.key ?? from; break }
      }
      setDrag({ id, from, x: ev.clientX, y: ev.clientY, target })
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      setDrag((d) => {
        if (d && d.target !== d.from) {
          setOverrides((o) => ({ ...o, [d.id]: d.target }))
          Promise.resolve(onRecordChange(record, movePatch(field, d.target))).catch(() =>
            setOverrides((o) => { const next = { ...o }; delete next[d.id]; return next }),
          )
        }
        return null
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const draggedRecord = drag ? effective.find((r) => keyOf(r) === drag.id) : undefined
  const boardRect = () => boardRef.current?.getBoundingClientRect()

  return (
    <YStack ref={(node: unknown) => { boardRef.current = node as HTMLElement | null }} style={{ position: 'relative' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap={12} py={2} items="flex-start">
          {columns.map((col, i) => {
            const isTarget = drag && drag.target === col.key && drag.from !== col.key
            return (
              <YStack
                key={col.key || '∅'}
                width={COL_W}
                ref={(node: unknown) => { colRefs.current[i] = (node as HTMLElement | null) }}
                gap={8}
                p={8}
                rounded={12}
                style={{ backgroundColor: tokens.surfaceRaised, borderWidth: 1, borderColor: isTarget ? tokens.accent : tokens.border }}
              >
                <XStack items="center" justify="space-between" px={4} py={2}>
                  <XStack items="center" gap={8}>
                    {col.key === NO_VALUE ? (
                      <Text fontSize={13} fontWeight="700" style={{ color: tokens.textMuted }}>{col.label}</Text>
                    ) : (
                      <Tag label={col.label} color={col.color} />
                    )}
                    <Text fontSize={12} style={{ color: tokens.textFaint }}>{col.records.length}</Text>
                  </XStack>
                  {onCreate ? (
                    <YStack cursor="pointer" p={3} rounded={6} hoverStyle={{ bg: tokens.hover }} onPress={() => onCreate(col.key)}>
                      <Plus size={14} color={tokens.textMuted} />
                    </YStack>
                  ) : null}
                </XStack>

                <YStack gap={8} style={{ minHeight: 40 }}>
                  {col.records.map((r) => {
                    const dragging = drag?.id === keyOf(r)
                    return (
                      <YStack key={keyOf(r)} onPointerDown={startDrag(r)} style={{ opacity: dragging ? 0.35 : 1, cursor: onRecordChange ? 'grab' : undefined }}>
                        <RecordCard titleField={titleField} fields={cardFields ?? fields.filter((f) => f.name !== field.name)} record={r} onPress={onOpen} />
                      </YStack>
                    )
                  })}
                  {col.records.length === 0 ? (
                    <YStack items="center" justify="center" py={16} rounded={8} style={{ borderWidth: 1, borderColor: tokens.border, borderStyle: 'dashed' }}>
                      <Text fontSize={12} style={{ color: tokens.textFaint }}>Drop here</Text>
                    </YStack>
                  ) : null}
                </YStack>
              </YStack>
            )
          })}
        </XStack>
      </ScrollView>

      {/* floating card follows the pointer during a drag */}
      {drag && draggedRecord ? (
        <YStack
          width={COL_W - 20}
          style={{ position: 'absolute', left: (drag.x - (boardRect()?.left ?? 0)) - (COL_W - 20) / 2, top: (drag.y - (boardRect()?.top ?? 0)) - 20, pointerEvents: 'none', zIndex: 50, transform: [{ rotate: '2deg' }], boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
        >
          <RecordCard titleField={titleField} fields={cardFields ?? fields.filter((f) => f.name !== field.name)} record={draggedRecord} />
        </YStack>
      ) : null}
    </YStack>
  )
}
