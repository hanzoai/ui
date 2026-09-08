'use client'

/**
 * Magnetic — a wrapper that pulls its child toward the pointer.
 *
 * While the pointer is over the frame, the child translates by the distance
 * from the frame's centre to the pointer, scaled by `strength`; it eases back
 * to rest the moment the pointer leaves. Wrap a button or a card in it for a
 * pull-toward-the-cursor affordance.
 *
 * The live offset is an inline style rather than a style prop: gui compiles a
 * style prop to one class per distinct value, and the offset takes a new value
 * on every pixel of travel.
 */
import { YStack, styled } from '@hanzo/gui'
import { useState, type ComponentProps, type PointerEvent } from 'react'
import { slot } from './slot'

const Frame = styled(YStack, {
  name: 'Magnetic',
  display: 'inline-flex',
  self: 'flex-start',
})

export type MagneticProps = ComponentProps<typeof Frame> & {
  /** Fraction of the pointer's distance from centre the child travels. */
  strength?: number
}

const REST = { x: 0, y: 0 }

export function Magnetic({ strength = 0.3, children, ...p }: MagneticProps) {
  const [at, setAt] = useState(REST)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    setAt({ x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength })
  }
  const rest = () => setAt(REST)

  return (
    <Frame
      {...slot('magnetic')}
      data-state={at.x === 0 && at.y === 0 ? 'idle' : 'hover'}
      style={{
        transform: `translate(${at.x}px, ${at.y}px)`,
        transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onPointerMove={move}
      onPointerLeave={rest}
      {...p}
    >
      {children}
    </Frame>
  )
}
