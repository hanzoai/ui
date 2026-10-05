'use client'

/**
 * The grip under a pane that resizes it, shared by CodeEditor and JsonTree.
 *
 * The footer is the drag target and the knob is the separator a keyboard and a
 * screen reader find. A drag, or ArrowUp / ArrowDown on the knob, sets a height
 * of the reader's own, as tall as they like; a double-click on the footer hands
 * the height back to the content. `useGrip` owns that height; `Grip` draws the
 * knob.
 */
import { XStack } from '@hanzo/gui'
import { GripHorizontal } from '@hanzogui/lucide-icons-2'
import * as React from 'react'

import { slot } from './slot'

/** How far one ArrowUp / ArrowDown on the knob moves the height. */
const STEP = 24
/** The separator's stated maximum, in px: the drag itself has none. */
const CEILING = 4096

export interface GripOptions {
  enabled: boolean
  /** The shortest a drag makes the pane, in px. */
  min: number
  /** The pane's height now, read when a drag or a key starts. */
  measure: () => number
  /** A height to start from, as `onChange` last reported it. */
  initial?: number | null
  /** Every height the reader sets, and `null` when a double-click hands it back. */
  onChange?: (height: number | null) => void
}

export function useGrip({ enabled, min, measure, initial = null, onChange }: GripOptions) {
  const grip = React.useRef<HTMLElement | null>(null)
  const knob = React.useRef<HTMLElement | null>(null)
  const [height, setHeight] = React.useState<number | null>(initial)
  const latest = React.useRef({ measure, onChange })
  latest.current = { measure, onChange }

  const set = React.useCallback((next: number | null) => {
    setHeight(next)
    latest.current.onChange?.(next)
  }, [])

  React.useEffect(() => {
    const el = grip.current
    const handle = knob.current
    if (!el || !handle || !enabled) return
    let pointer = -1
    let startY = 0
    let startH = 0
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      pointer = e.pointerId
      startY = e.clientY
      startH = latest.current.measure()
      el.setPointerCapture?.(pointer)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      set(Math.max(min, Math.round(startH + e.clientY - startY)))
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      el.releasePointerCapture?.(pointer)
      pointer = -1
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      set(Math.max(min, Math.round(latest.current.measure() + (e.key === 'ArrowDown' ? STEP : -STEP))))
    }
    const reset = () => set(null)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('dblclick', reset)
    handle.addEventListener('keydown', key)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('dblclick', reset)
      handle.removeEventListener('keydown', key)
    }
  }, [enabled, min, set])

  return { grip, knob, height }
}

/** The knob: a separator that names what it resizes and says how tall it is. */
export function Grip({
  knob,
  name,
  label,
  min,
  height,
}: {
  knob: React.RefObject<HTMLElement | null>
  /** Its `data-slot`. */
  name: string
  /** What it resizes, for "Resize <label>". */
  label: string
  min: number
  height: number | null
}) {
  return (
    <XStack
      ref={knob as never}
      {...slot(name)}
      {...({
        role: 'separator',
        'aria-orientation': 'horizontal',
        'aria-label': `Resize ${label}`,
        'aria-valuemin': min,
        // A drag has no ceiling; this stands in for "as tall as you like".
        'aria-valuemax': CEILING,
        'aria-valuenow': height ?? min,
        'aria-valuetext': height === null ? 'Fits its content' : `${height} pixels`,
        tabIndex: 0,
      } as object)}
      rounded="$2"
      p="$1"
      focusVisibleStyle={{ bg: '$hover' }}
    >
      <GripHorizontal size={14} color="$soft" />
    </XStack>
  )
}
