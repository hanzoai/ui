'use client'

/**
 * Two panes and a handle between them.
 *
 * The split is a PERCENTAGE, not a pixel count, so the panes keep their
 * proportion when the window changes size — a pixel split silently becomes a
 * different layout on a smaller screen.
 *
 * The handle is a real `separator`: it takes focus and moves on the arrow keys.
 * A drag-only handle is unusable without a mouse, and a split pane is exactly
 * the control someone drives from the keyboard while reading the pane beside it.
 *
 * Drag state lives on `document` rather than the element because the pointer
 * leaves the 4px handle immediately — listening on the handle drops the drag as
 * soon as it starts.
 */
import { isWeb, XStack, YStack } from '@hanzo/gui'
import type { GuiElement } from '@hanzo/gui'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export type SplitProps = {
  left: ReactNode
  right: ReactNode
  /** Where the handle starts, as a percentage of the width. */
  defaultSplit?: number
  /** How narrow the left pane may get, as a percentage. */
  min?: number
  /** How wide the left pane may get, as a percentage. */
  max?: number
  onSplitChange?: (split: number) => void
}

const STEP = 2

export function Split({
  left,
  right,
  defaultSplit = 50,
  min = 20,
  max = 80,
  onSplitChange,
}: SplitProps) {
  const [split, setSplit] = useState(defaultSplit)
  const [dragging, setDragging] = useState(false)
  const container = useRef<GuiElement>(null)

  const move = useCallback(
    (to: number) => {
      const held = Math.max(min, Math.min(max, to))
      setSplit(held)
      onSplitChange?.(held)
    },
    [min, max, onSplitChange],
  )

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent) => {
      const el = container.current
      if (!el || !('getBoundingClientRect' in el)) return
      const box = el.getBoundingClientRect()
      move(((e.clientX - box.left) / box.width) * 100)
    }
    const onUp = () => setDragging(false)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    // A drag that paints a text selection across both panes reads as a bug.
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [dragging, move])

  return (
    <XStack ref={container} height="100%" width="100%">
      <YStack height="100%" overflow="hidden" style={{ width: `${split}%` }}>
        {left}
      </YStack>

      <YStack
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(split)}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        width={4}
        cursor="col-resize"
        bg={dragging ? '$hover' : '$borderColor'}
        hoverStyle={{ background: '$hover' }}
        focusStyle={{ background: '$hover' }}
        onMouseDown={(e: { preventDefault: () => void }) => {
          e.preventDefault()
          setDragging(true)
        }}
        // Keyboard is web-only by construction, the same guard `command.tsx`
        // uses: there are no arrow keys on a touch device, and the handler's
        // event shape is the DOM's rather than gui's.
        {...(isWeb
          ? {
              onKeyDown: ((e: KeyboardEvent) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  move(split - STEP)
                }
                if (e.key === 'ArrowRight') {
                  e.preventDefault()
                  move(split + STEP)
                }
              }) as never,
            }
          : null)}
      />

      <YStack height="100%" overflow="hidden" flex={1}>
        {right}
      </YStack>
    </XStack>
  )
}
