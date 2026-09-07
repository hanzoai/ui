'use client'

/**
 * Cursor — a custom pointer that replaces the native one only inside its own
 * frame, following the mouse and optionally carrying a short label.
 *
 * Position tracks locally off `getBoundingClientRect`, so the dot sits in the
 * frame's own coordinate space rather than the viewport's, and it renders
 * nothing until the pointer has actually entered — a plain `mouseenter`/
 * `mouseleave` pair, no document listener, since the effect never needs to
 * reach past the frame it is masking. `cursor: none` is scoped to that same
 * frame, so nothing outside it loses its native pointer.
 */
import { SizableText, YStack, isWeb } from '@hanzo/gui'
import { useState, type ReactNode } from 'react'
import { sx } from '../../sx'
import { slot } from './slot'

export type CursorPosition = { x: number; y: number }

export type CursorProps = {
  children: ReactNode
  /** Short label shown inside the dot. */
  cursorText?: string
  /** Diameter of the dot, in px. */
  cursorSize?: number
  /** Class notation for the frame. */
  className?: string
}

export function Cursor({ children, cursorText, cursorSize = 20, className }: CursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <YStack
      {...slot('cursor')}
      position="relative"
      style={isWeb ? { cursor: 'none' } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...sx(className)}
    >
      {children}
      {isHovered && (
        <YStack
          {...slot('cursor-dot')}
          items="center"
          justify="center"
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: cursorSize,
            height: cursorSize,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'color-mix(in srgb, var(--color) 20%, transparent)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {cursorText && (
            <SizableText {...slot('cursor-text')} size="$1" fontWeight="600" color="$color">
              {cursorText}
            </SizableText>
          )}
        </YStack>
      )}
    </YStack>
  )
}
