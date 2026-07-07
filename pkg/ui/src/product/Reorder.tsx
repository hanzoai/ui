'use client'

/**
 * Reorder — a tiny pointer-driven drag-to-reorder list. No dependency: it uses
 * Pointer Events (so it works with mouse AND touch) and CSS transforms, matching
 * the shell's transform-driven motion. Rows are a FIXED height (all pinned rows
 * are), which keeps the "where does it drop?" math exact and pure (`targetIndex`)
 * and the reflow buttery — the lifted row follows the pointer 1:1 while its
 * displaced siblings ease into place.
 *
 * The list is controlled: `onReorder(from, to)` fires once on drop; the parent
 * owns the data (here, the account-backed pins model). `renderItem` gets a
 * `handle` to spread on the drag affordance so the rest of the row stays
 * interactive (tap to open, etc.).
 */
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { YStack } from '@hanzo/gui'

/** Final index for a drag: start + rounded rows travelled, clamped. PURE. */
export function targetIndex(from: number, dy: number, rowH: number, count: number): number {
  if (rowH <= 0 || count <= 0) return from
  const raw = from + Math.round(dy / rowH)
  return Math.max(0, Math.min(raw, count - 1))
}

/** Vertical shift for row `i` during a drag from `from`→`to` (the dragged row
 *  follows the pointer; rows between them make room). PURE. */
export function rowShift(i: number, from: number, to: number, dy: number, rowH: number): number {
  if (i === from) return dy
  if (from < to && i > from && i <= to) return -rowH
  if (from > to && i < from && i >= to) return rowH
  return 0
}

export type DragHandle = { onPointerDown: (e: { clientY?: number; pointerId?: number; nativeEvent?: { clientY?: number } }) => void }

export function Reorder<T>({
  items,
  keyOf,
  rowHeight = 44,
  onReorder,
  renderItem,
}: {
  items: T[]
  keyOf: (t: T) => string
  rowHeight?: number
  onReorder: (from: number, to: number) => void
  renderItem: (item: T, handle: DragHandle, dragging: boolean) => ReactNode
}) {
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null)
  const startRef = useRef<{ from: number; startY: number } | null>(null)

  const to = drag ? targetIndex(drag.from, drag.dy, rowHeight, items.length) : -1

  const begin = useCallback(
    (index: number) =>
      (e: { clientY?: number; pointerId?: number; nativeEvent?: { clientY?: number } }) => {
        const startY = e.clientY ?? e.nativeEvent?.clientY ?? 0
        startRef.current = { from: index, startY }
        setDrag({ from: index, dy: 0 })

        const move = (ev: PointerEvent) => {
          if (!startRef.current) return
          setDrag({ from: startRef.current.from, dy: ev.clientY - startRef.current.startY })
        }
        const end = () => {
          const s = startRef.current
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', end)
          window.removeEventListener('pointercancel', end)
          startRef.current = null
          setDrag((d) => {
            if (s && d) {
              const t = targetIndex(s.from, d.dy, rowHeight, items.length)
              if (t !== s.from) onReorder(s.from, t)
            }
            return null
          })
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
      },
    [items.length, rowHeight, onReorder],
  )

  return (
    <YStack>
      {items.map((item, i) => {
        const dragging = drag?.from === i
        const shift = drag && to >= 0 ? rowShift(i, drag.from, to, drag.dy, rowHeight) : 0
        return (
          <YStack
            key={keyOf(item)}
            height={rowHeight}
            justify="center"
            className="hz-drag-item"
            style={{
              transform: `translateY(${shift}px)`,
              zIndex: dragging ? 2 : 1,
              ...(dragging ? { transition: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.28)' } : null),
            }}
          >
            {renderItem(item, { onPointerDown: begin(i) }, dragging)}
          </YStack>
        )
      })}
    </YStack>
  )
}
