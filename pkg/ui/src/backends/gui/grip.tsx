'use client'

/**
 * Grip — a box's free edge, which is also how big the box is: a separator a
 * person drags, or moves with the arrow keys, to size the box beside it. The one
 * resizer: a sidebar, an aside, a split between two panes, and an editor's
 * height all use it.
 *
 *   side      the edge the box is pinned to. `left` grows rightwards (a sidebar,
 *             the first pane of a split), `right` grows leftwards (an aside, a
 *             drawer), `top` grows downwards (an editor, a tree). One control,
 *             the arithmetic reflected.
 *   span      the box's size now, px, for assistive tech; `floor` and `ceil`
 *             bound it.
 *   onSpan    the size while it moves, at most once a frame.
 *   onKeep    the size it settled on: a drag let go, a key, a double-click.
 *   onShut    when given, a drag pulled well past the floor, or a key pressed at
 *             it, puts the box away (a sidebar snaps to its icons); absent, the
 *             floor holds.
 *   reset     the size a double-click returns to; `onReset` instead hands the
 *             size back to the box (an editor that follows its text).
 *
 * Keys: the arrows step 8px (32px with Shift), Home and End go to the floor and
 * the ceiling. Pointer events, so a mouse, a trackpad, a touchscreen and a pen
 * are one path, with the pointer captured: a drag that outruns the handle keeps
 * sizing. A drag and a key both start from the box as drawn, so the edge never
 * jumps to the cursor and a box that follows its content steps from where it is.
 *
 * It sits inside the box, absolutely, on the free edge; the rest of its props
 * place it elsewhere and win. The line is drawn only while a person reaches for
 * it: under the pointer, while it moves, and for a keyboard's focus, which it
 * draws instead of an outline.
 *
 * Moved here from @hanzo/build, where hanzo.ai's sidebar and asides used it.
 */
import { YStack, type YStackProps } from '@hanzo/gui'
import * as React from 'react'

/** A key's step, px; with Shift, the long one. */
const STEP = 8
const LONG = 32

/** How far past the floor a drag is pulled before it shuts the box, px: a deliberate pull, not a twitch. */
const SLACK = 48

/** The grab band's thickness, px; the line drawn inside it is 2. */
const BAND = 8

export type GripSide = 'left' | 'right' | 'top'

export interface GripProps extends Omit<YStackProps, 'children'> {
  side: GripSide
  span: number
  floor: number
  ceil: number
  reset?: number
  onReset?: () => void
  onSpan: (n: number) => void
  onKeep?: (n: number) => void
  onShut?: () => void
  /** The separator's accessible name: "Resize sidebar", "Resize Input". */
  label: string
}

type Point = { clientX: number; clientY: number }
type Keyed = { key?: string; shiftKey?: boolean; preventDefault?: () => void; currentTarget?: unknown }

export function Grip({
  side,
  span,
  floor,
  ceil,
  reset,
  onReset,
  onSpan,
  onKeep,
  onShut,
  label,
  ...rest
}: GripProps) {
  const tall = side === 'top'
  /** +1 when the pointer moving away from the pinned edge grows the box. */
  const grows = side === 'right' ? -1 : 1
  // The pinned edge in client coordinates, taken as the drag begins.
  const held = React.useRef(0)
  // Whether a press holds the pointer and whether it has moved since, the size it
  // last asked for, and the frame that will draw it. A press that never moves
  // keeps nothing.
  const drag = React.useRef<'none' | 'held' | 'moved'>('none')
  const want = React.useRef(span)
  const frame = React.useRef(0)
  const [hovered, setHovered] = React.useState(false)
  const [keyed, setKeyed] = React.useState(false)
  const [moving, setMoving] = React.useState(false)
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const clamp = (n: number) => Math.round(Math.min(ceil, Math.max(floor, n)))
  const along = (e: Point) => (tall ? e.clientY : e.clientX)
  /** The box as drawn, read off the element the grip sits in. */
  const drawn = (el: unknown) => {
    const box = (el as HTMLElement | null)?.parentElement?.getBoundingClientRect()
    return box ? (tall ? box.height : box.width) : span
  }
  const settle = (n: number) => {
    onSpan(n)
    onKeep?.(n)
  }
  const stop = () => {
    drag.current = 'none'
    cancelAnimationFrame(frame.current)
    frame.current = 0
    setMoving(false)
  }
  const end = () => {
    if (drag.current === 'none') return
    const moved = drag.current === 'moved'
    stop()
    if (moved) settle(want.current)
  }
  const wider = side === 'left' ? 'ArrowRight' : side === 'right' ? 'ArrowLeft' : 'ArrowDown'
  const narrower = side === 'left' ? 'ArrowLeft' : side === 'right' ? 'ArrowRight' : 'ArrowUp'
  const edge = tall
    ? { l: 0, r: 0, b: 0, height: BAND, justify: 'center' as const }
    : { t: 0, b: 0, width: BAND, items: 'center' as const, ...(side === 'left' ? { r: 0 } : { l: 0 }) }

  return (
    <YStack
      role="separator"
      aria-orientation={tall ? 'horizontal' : 'vertical'}
      aria-label={label}
      aria-valuenow={Math.round(span)}
      aria-valuemin={floor}
      aria-valuemax={ceil}
      tabIndex={0}
      data-slot="grip"
      data-side={side}
      data-moving={moving ? '' : undefined}
      position="absolute"
      {...edge}
      z={10}
      cursor={tall ? 'row-resize' : 'col-resize'}
      outlineWidth={0}
      focusVisibleStyle={{ outlineWidth: 0 }}
      style={{ touchAction: 'none' }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      // The line is the focus ring, drawn for a keyboard's focus and not a pointer's.
      onFocus={(e: React.FocusEvent<HTMLElement>) => setKeyed(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setKeyed(false)}
      onPointerDown={(e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return
        // No text selection starts under a drag.
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        const now = drawn(e.currentTarget)
        held.current = along(e) - grows * now
        want.current = clamp(now)
        drag.current = 'held'
        setMoving(true)
      }}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        if (drag.current === 'none') return
        drag.current = 'moved'
        const pulled = grows * (along(e) - held.current)
        if (onShut && pulled < floor - SLACK) {
          stop()
          e.currentTarget.releasePointerCapture?.(e.pointerId)
          onShut()
          return
        }
        want.current = clamp(pulled)
        if (frame.current) return
        frame.current = requestAnimationFrame(() => {
          frame.current = 0
          onSpan(want.current)
        })
      }}
      // A drag ends when the pointer is let go: lifted, or taken by the browser.
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => (onReset ? onReset() : settle(clamp(reset ?? span)))}
      onKeyDown={(e: Keyed) => {
        const step = e.shiftKey ? LONG : STEP
        const now = drawn(e.currentTarget)
        const to =
          e.key === wider
            ? now + step
            : e.key === narrower
              ? now - step
              : e.key === 'Home'
                ? floor
                : e.key === 'End'
                  ? ceil
                  : null
        if (to === null) return
        e.preventDefault?.()
        if (onShut && to < floor) return onShut()
        settle(clamp(to))
      }}
      {...rest}
    >
      {/* The line: the box's own edge until a person reaches for it. */}
      <YStack
        {...(tall ? { height: 2, width: '100%' } : { width: 2, height: '100%' })}
        rounded={1}
        bg={keyed || moving ? '$outlineColor' : hovered ? '$rim' : 'transparent'}
        pointerEvents="none"
      />
    </YStack>
  )
}
