'use client'

/**
 * LimelightNav — a row of items with a glowing highlight that slides to
 * whichever one is active, plus a small beam of light hanging above it, the
 * way a spotlight follows a performer across a stage.
 *
 * The glow's position is a plain `getBoundingClientRect()` measurement of the
 * active item relative to the rail, applied as a CSS `transform`/`width`
 * transition — the same technique `AnimatedBeam` and `Dock` already use in
 * this backend, so no animation library is pulled in for one moving pill. It
 * remeasures on resize via `ResizeObserver` and whenever the active item
 * changes.
 *
 * `variant="floating"` is a self-sizing rounded pill, the shape a command bar
 * or a segmented control takes. `variant="bar"` spans the full width with a
 * bottom hairline, the shape a page's primary navigation takes.
 */
import { SizableText, XStack, YStack, styled, type GuiElement } from '@hanzo/gui'
import * as React from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

export type LimelightNavItem = {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
}

export type LimelightNavVariant = 'floating' | 'bar'

export type LimelightNavProps = {
  items: LimelightNavItem[]
  /** Controlled active item id. */
  value?: string
  /** Uncontrolled initial active item id; defaults to the first item. */
  defaultValue?: string
  onValueChange?: (id: string) => void
  variant?: LimelightNavVariant
  'aria-label'?: string
}

const ITEM_H = 40

/** The DOM box behind a ref, if there is one; a native view has none. */
const box = (el: GuiElement | null) =>
  typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null

const Rail = styled(XStack, {
  name: 'LimelightNavRail',
  position: 'relative',
  items: 'center',
  gap: '$1',
  rounded: '$6',
  bg: '$hover',
  p: '$1',
  self: 'flex-start',

  variants: {
    variant: {
      floating: {},
      bar: {
        rounded: 0,
        bg: 'transparent',
        borderBottomWidth: 1,
        borderColor: '$borderColor',
        width: '100%',
        self: 'stretch',
        justify: 'flex-start',
        gap: '$4',
        px: '$4',
        py: 0,
      },
    },
  } as const,

  defaultVariants: { variant: 'floating' },
})

const Item = styled(XStack, {
  name: 'LimelightNavItem',
  items: 'center',
  justify: 'center',
  gap: '$1.5',
  px: '$3',
  height: ITEM_H,
  rounded: '$5',
  cursor: 'pointer',
  hoverStyle: { opacity: 0.85 },
  style: { zIndex: 1 },
})

const Glow = styled(YStack, {
  name: 'LimelightNavGlow',
  position: 'absolute',
  l: 0,
  rounded: '$5',
  bg: '$accentBackground',
  pointerEvents: 'none',
  style: { zIndex: 0 },

  variants: {
    variant: {
      floating: { t: '$1', b: '$1' },
      bar: { t: 0, b: 0, rounded: 0, borderBottomWidth: 2, borderColor: '$accentColor', bg: 'transparent' },
    },
  } as const,

  defaultVariants: { variant: 'floating' },
})

/** A small beam of light hanging above the active item, floating variant only. */
const Beam = styled(YStack, {
  name: 'LimelightNavBeam',
  position: 'absolute',
  l: 0,
  height: 6,
  rounded: 999,
  bg: '$accentBackground',
  pointerEvents: 'none',
  style: { top: -10, zIndex: 0, filter: 'blur(4px)' },
})

export function LimelightNav({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'floating',
  ...props
}: LimelightNavProps) {
  const [own, setOwn] = React.useState(defaultValue ?? items[0]?.id)
  const active = value ?? own

  const railRef = React.useRef<GuiElement | null>(null)
  const itemRefs = React.useRef(new Map<string, HTMLElement>())
  const [rect, setRect] = React.useState({ left: 0, width: 0 })

  const measure = React.useCallback(() => {
    const rail = box(railRef.current)
    const el = active ? itemRefs.current.get(active) : undefined
    if (!rail || !el) return
    const railBox = rail.getBoundingClientRect()
    const itemBox = el.getBoundingClientRect()
    setRect((prev) => {
      const next = { left: itemBox.left - railBox.left, width: itemBox.width }
      return prev.left === next.left && prev.width === next.width ? prev : next
    })
  }, [active])

  React.useLayoutEffect(() => {
    measure()
  }, [measure, items.length, variant])

  React.useEffect(() => {
    const rail = box(railRef.current)
    if (!rail || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [measure])

  const select = (id: string) => {
    if (value === undefined) setOwn(id)
    onValueChange?.(id)
  }

  /** Roving-tabindex arrow/Home/End navigation, per the WAI-ARIA tabs pattern. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const from = items.findIndex((item) => item.id === active)
    if (from < 0) return
    const to =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (from + 1) % items.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (from - 1 + items.length) % items.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? items.length - 1
              : -1
    if (to < 0) return
    e.preventDefault()
    const next = items[to]
    select(next.id)
    itemRefs.current.get(next.id)?.focus()
  }

  return (
    <Rail ref={railRef} {...slot('limelight-nav')} role="tablist" aria-label={props['aria-label'] ?? 'Navigation'} variant={variant}>
      {variant === 'floating' && (
        <Beam
          {...slot('limelight-nav-beam')}
          style={{ transform: `translateX(${rect.left}px)`, width: rect.width, transition: 'transform 200ms ease, width 200ms ease' }}
        />
      )}
      <Glow
        {...slot('limelight-nav-glow')}
        variant={variant}
        style={{ transform: `translateX(${rect.left}px)`, width: rect.width, transition: 'transform 200ms ease, width 200ms ease' }}
      />
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <Item
            key={item.id}
            ref={(node: GuiElement | null) => {
              const el = box(node)
              if (el) itemRefs.current.set(item.id, el)
              else itemRefs.current.delete(item.id)
            }}
            {...slot('limelight-nav-item')}
            render={item.href ? 'a' : 'button'}
            {...(item.href ? { href: item.href } : ({ type: 'button' } as object))}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => select(item.id)}
            onKeyDown={onKeyDown}
            {...touch(ITEM_H, 44, 'y')}
          >
            {item.icon}
            {ink(item.label, SizableText, {
              size: '$2',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? '$accentColor' : '$ink',
            })}
          </Item>
        )
      })}
    </Rail>
  )
}
