'use client'

/**
 * Cursor — a container that replaces the pointer with a small round follower
 * while the pointer sits over it.
 *
 * A `mousemove` on the frame turns the client point into a position relative
 * to the frame's own box (`getBoundingClientRect`), so the follower is placed
 * with plain `left`/`top` inside a `position: relative` parent — no fixed
 * positioning, no document listener, and nothing rendered before the pointer
 * has actually entered. `cursorText` draws a label inside the dot; leaving it
 * unset draws a bare dot. The frame hides the native cursor for its own box
 * only (`cursor: none`), so the effect is local to whatever the caller wraps,
 * unlike a page-wide replacement.
 */
import { SizableText, YStack, isWeb } from '@hanzo/gui'
import { useState, type ReactNode } from 'react'
import { sx } from '../../sx'
import { slot } from './slot'

export type CursorPosition = { x: number; y: number }

export type CursorProps = {
  /** Content the cursor effect plays over. */
  children: ReactNode
  /** Label drawn inside the follower dot; omit for a bare dot. */
  cursorText?: string
  /** Diameter of the follower dot, in px. */
  cursorSize?: number
  /** Class notation, converted to style props on the frame. */
  className?: string
}

export function Cursor({ children, cursorText, cursorSize = 20, className }: CursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  return (
    <YStack
      {...slot('cursor')}
      position="relative"
      style={isWeb ? { cursor: 'none' } : undefined}
      {...sx(className)}
      onMouseMove={(e: React.MouseEvent<HTMLElement>) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <YStack
          {...slot('cursor-dot')}
          position="absolute"
          items="center"
          justify="center"
          rounded={9999}
          bg="$color6"
          pointerEvents="none"
          style={{
            left: position.x,
            top: position.y,
            width: cursorSize,
            height: cursorSize,
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
          }}
        >
          {cursorText && (
            <SizableText size="$1" fontWeight="500" color="$color">
              {cursorText}
            </SizableText>
          )}
        </YStack>
      )}
    </YStack>
  )
}
