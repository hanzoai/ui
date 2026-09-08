'use client'

/**
 * StarsScrollingWheel — a picker wheel for a star rating.
 *
 * Every whole (or half, at `step={0.5}`) rating from 0 to `max` sits in its
 * own row, drawn as that many stars. The row centered in the viewport is the
 * current value. Drag, the mouse wheel, a click on a row, or the arrow keys
 * move it — the same one-value contract as `Slider`, aimed at a rating rather
 * than a continuous range.
 *
 * The drag itself rides `drag()` from `./gesture`, the one pointer/responder
 * contract this backend already uses for the color-picker's swatches: each
 * move recomputes the index from the pointer's total displacement since the
 * drag began, so there is no accumulator to drift.
 */
import { XStack, YStack } from '@hanzo/gui'
import { Star, StarFull, StarHalf } from '@hanzogui/lucide-icons-2'
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { drag, dragPos, touch, type DragEvent } from './gesture'
import { slot } from './slot'

export type StarsScrollingWheelOrientation = 'vertical' | 'horizontal'
export type StarsScrollingWheelSize = 'sm' | 'default' | 'lg'

const CELL: Record<StarsScrollingWheelSize, number> = { sm: 28, default: 36, lg: 44 }
const ICON: Record<StarsScrollingWheelSize, number> = { sm: 14, default: 18, lg: 22 }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** The stars one row draws for rating `n` out of `max` — full, at most one half, empty. */
const Rating = ({ n, max, size }: { n: number; max: number; size: number }) => {
  const full = Math.floor(n)
  const half = n - full >= 0.5
  return (
    <XStack {...slot('stars-scrolling-wheel-rating')} gap="$0.5" items="center" pointerEvents="none">
      {Array.from({ length: max }, (_, i) => {
        const Icon = i < full ? StarFull : i === full && half ? StarHalf : Star
        return <Icon key={i} size={size} />
      })}
    </XStack>
  )
}

export type StarsScrollingWheelProps = {
  /** The current rating. Omit for an uncontrolled wheel. */
  value?: number
  /** The rating an uncontrolled wheel starts at. Default 0. */
  defaultValue?: number
  /** Fires with the new rating, already clamped to `[0, max]` and rounded to `step`. */
  onValueChange?: (value: number) => void
  /** Highest rating the wheel offers. Default 5. */
  max?: number
  /** Rating increment between rows. Default 1; 0.5 adds a half-star row between each pair. */
  step?: number
  /** Which axis the wheel scrolls on. Default 'vertical'. */
  orientation?: StarsScrollingWheelOrientation
  /** Row size and star scale. Default 'default'. */
  size?: StarsScrollingWheelSize
  /** How many rows are visible in the viewport at once. Default 5. */
  visibleCount?: number
  disabled?: boolean
  'aria-label'?: string
}

export function StarsScrollingWheel({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  step = 1,
  orientation = 'vertical',
  size = 'default',
  visibleCount = 5,
  disabled = false,
  'aria-label': ariaLabel = 'Star rating',
}: StarsScrollingWheelProps) {
  const [uncontrolled, setUncontrolled] = useState(clamp(defaultValue, 0, max))
  const current = clamp(value ?? uncontrolled, 0, max)
  const horizontal = orientation === 'horizontal'
  const cell = CELL[size]
  const icon = ICON[size]
  const count = Math.round(max / step) + 1
  const index = Math.round(current / step)
  const viewport = cell * visibleCount
  const center = ((visibleCount - 1) / 2) * cell

  const commit = useCallback(
    (next: number) => {
      const stepped = clamp(Math.round(next / step) * step, 0, max)
      if (value === undefined) setUncontrolled(stepped)
      if (stepped !== current) onValueChange?.(stepped)
    },
    [current, max, onValueChange, step, value],
  )

  const dragState = useRef({ start: 0, startIndex: 0 })

  const begin = useCallback(
    (e: DragEvent) => {
      if (disabled) return
      dragState.current = { start: dragPos(e, horizontal), startIndex: index }
    },
    [disabled, horizontal, index],
  )

  const move = useCallback(
    (e: DragEvent) => {
      if (disabled) return
      const total = dragPos(e, horizontal) - dragState.current.start
      const delta = Math.round(-total / cell)
      commit((dragState.current.startIndex + delta) * step)
    },
    [cell, commit, disabled, horizontal, step],
  )

  const gesture = drag({ begin, move, end: () => {}, enabled: !disabled })

  const handleWheel = useCallback(
    (e: ReactWheelEvent) => {
      if (disabled) return
      const delta = horizontal ? e.deltaX || e.deltaY : e.deltaY
      if (!delta) return
      e.preventDefault()
      commit((index + (delta > 0 ? 1 : -1)) * step)
    },
    [commit, disabled, horizontal, index, step],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault()
        commit((index + 1) * step)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault()
        commit((index - 1) * step)
      } else if (e.key === 'Home') {
        e.preventDefault()
        commit(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        commit(max)
      }
    },
    [commit, disabled, index, max, step],
  )

  const rows = useMemo(() => Array.from({ length: count }, (_, i) => i * step), [count, step])

  const Viewport = horizontal ? XStack : YStack
  const Track = horizontal ? XStack : YStack

  return (
    <Viewport
      {...slot('stars-scrolling-wheel')}
      data-orientation={orientation}
      data-disabled={disabled ? '' : undefined}
      role="slider"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      position="relative"
      width={horizontal ? viewport : cell * 3}
      height={horizontal ? cell * 3 : viewport}
      overflow="hidden"
      items="center"
      justify="center"
      rounded="$2"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$background"
      cursor={disabled ? 'default' : horizontal ? 'ew-resize' : 'ns-resize'}
      opacity={disabled ? 0.5 : 1}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      {...touch(cell, 44, horizontal ? 'x' : 'y')}
      {...gesture}
    >
      {/* The center band — the only row a click, drag or scroll ever lands on
          when the wheel settles — marked so a caller can style "what's selected"
          without inferring it from the track's transform. */}
      <XStack
        {...slot('stars-scrolling-wheel-indicator')}
        position="absolute"
        width={horizontal ? cell : '100%'}
        height={horizontal ? '100%' : cell}
        borderWidth={1}
        borderColor="$borderColor"
        bg="$hover"
        rounded="$1"
        pointerEvents="none"
      />
      <Track
        {...slot('stars-scrolling-wheel-track')}
        items="center"
        style={{
          transform: horizontal
            ? `translateX(${center - index * cell}px)`
            : `translateY(${center - index * cell}px)`,
          transition: 'transform 120ms ease',
        }}
      >
        {rows.map((rowValue, i) => (
          <XStack
            key={rowValue}
            {...slot('stars-scrolling-wheel-row')}
            data-value={rowValue}
            data-active={i === index ? '' : undefined}
            width={horizontal ? cell : '100%'}
            height={horizontal ? '100%' : cell}
            items="center"
            justify="center"
            opacity={i === index ? 1 : 0.4}
            cursor={disabled ? 'default' : 'pointer'}
            onClick={() => !disabled && commit(rowValue)}
          >
            <Rating n={rowValue} max={max} size={icon} />
          </XStack>
        ))}
      </Track>
    </Viewport>
  )
}
