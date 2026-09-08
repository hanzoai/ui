'use client'

/**
 * MotionHighlight — a soft radial glow that follows the pointer across its
 * children, the way a flashlight passed behind glass would.
 *
 * The frame owns pointer tracking, a single `YStack` positions the glow at
 * the last-seen coordinate with a CSS transform, and children stack above it
 * at a higher `z`. Fired only on web, where a pointer position exists at
 * all — native has no hover concept, so there the glow never mounts and
 * children render plainly.
 */
import { YStack, isWeb, type GuiElement } from '@hanzo/gui'
import * as React from 'react'
import { slot } from './slot'

export type MotionHighlightProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  /** Diameter of the glow, in px. */
  size?: number
  /** Glow color; any CSS color, including a token's resolved value. */
  color?: string
}

const Glow = ({ x, y, size, color }: { x: number; y: number; size: number; color: string }) => (
  <YStack
    {...slot('motion-highlight-glow')}
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: size,
      height: size,
      borderRadius: '9999px',
      background: color,
      filter: 'blur(24px)',
      transform: `translate(${x - size / 2}px, ${y - size / 2}px)`,
      pointerEvents: 'none',
      zIndex: 0,
    }}
  />
)

export const MotionHighlight = React.forwardRef<GuiElement, MotionHighlightProps>(
  ({ children, size = 128, color = 'rgba(120,120,255,0.15)', style, onMouseMove, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const [pos, setPos] = React.useState({ x: 0, y: 0 })
    const [hovered, setHovered] = React.useState(false)

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      onMouseMove?.(e)
    }
    const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setHovered(true)
      onMouseEnter?.(e)
    }
    const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setHovered(false)
      onMouseLeave?.(e)
    }

    return (
      <YStack
        ref={ref}
        {...slot('motion-highlight')}
        position="relative"
        overflow="hidden"
        onMouseMove={isWeb ? handleMove : undefined}
        onMouseEnter={isWeb ? handleEnter : undefined}
        onMouseLeave={isWeb ? handleLeave : undefined}
        style={style}
        {...(props as object)}
      >
        {isWeb && hovered && <Glow x={pos.x} y={pos.y} size={size} color={color} />}
        <YStack {...slot('motion-highlight-content')} style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </YStack>
      </YStack>
    )
  },
)
MotionHighlight.displayName = 'MotionHighlight'
