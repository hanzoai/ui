'use client'

/**
 * Workbench — the shell a Hanzo surface runs inside: a center view with a dock
 * on the left, the right and the bottom.
 *
 * A dock is a strip of tabs over one visible pane. The three sides differ only
 * in where the strip sits and which edge drags, so they are ONE component given
 * a side; a second implementation is how two docks drift apart.
 *
 * Tabs are data. A side chat, a browser and the developer console are all Tab
 * values, so a surface adds one by pushing to an array rather than by teaching
 * the shell a new kind. What a tab renders is the surface's business — the
 * shell owns placement, activation and size, and nothing else.
 *
 * PAPER, NOT BOXES. Depth carries state: the workspace is the base sheet, a
 * dock is a sheet raised above it, and the active tab is raised again. Light
 * falls from the top, so every shadow points the same way and elevation reads
 * as a stack rather than as decoration. Outlines appear only where two sheets
 * meet edge-on — a hairline, never a border around a thing.
 *
 * The rungs come from `sheet()` (../glass), which reads @hanzo/design's
 * `--sheet-*` / `--shadow-sheet-*`. gui's own `elevation` prop is a DIFFERENT
 * idea wearing the same word: it synthesises a shadow from a number, carries no
 * lit edge, and answers to nothing — so a dock lit that way and a menu lit by
 * the ladder stand in two different rooms.
 */
import { useCallback, useRef, type ReactNode } from 'react'
import { Button, Separator, Text, XStack, YStack, useControllableState } from '@hanzo/gui'

import { sheet } from '../glass'

export type Side = 'left' | 'right' | 'bottom'

export type Tab = {
  id: string
  title: string
  icon?: ReactNode
  content: ReactNode
  /** Closable unless a surface says otherwise; the console usually is not. */
  closable?: boolean
}

export type DockProps = {
  side: Side
  tabs: Tab[]
  /** Controlled active tab; omit and the dock keeps its own. */
  activeId?: string
  defaultActiveId?: string
  onActivate?: (id: string) => void
  onClose?: (id: string) => void
  /** End of the strip — the surface's own control, e.g. a new-tab menu. */
  actions?: ReactNode
  /** Extent across the docked edge: width for left/right, height for bottom. */
  size?: number
  onResize?: (size: number) => void
  minSize?: number
  maxSize?: number
}

const DEFAULT_SIZE: Record<Side, number> = { left: 260, right: 380, bottom: 220 }

/** The edge facing the center carries the drag handle. */
const HANDLE_FIRST: Record<Side, boolean> = { left: false, right: true, bottom: true }

export function Dock({
  side,
  tabs,
  activeId,
  defaultActiveId,
  onActivate,
  onClose,
  actions,
  size,
  onResize,
  minSize = 160,
  maxSize = 900,
}: DockProps) {
  const [active, setActive] = useControllableState<string | undefined>({
    prop: activeId,
    defaultProp: defaultActiveId ?? tabs[0]?.id,
    // A tab id is always a string when one activates; the hook's own
    // signature admits undefined, so narrow rather than cast.
    onChange: (id?: string) => { if (id) onActivate?.(id) },
  })
  const [extent, setExtent] = useControllableState<number>({
    prop: size,
    defaultProp: DEFAULT_SIZE[side],
    onChange: onResize,
  })

  const horizontal = side !== 'bottom'
  const origin = useRef(0)
  const originExtent = useRef(0)

  // Pointer capture, so a drag that leaves the handle still tracks.
  const onDown = useCallback(
    (e: any) => {
      origin.current = horizontal ? e.clientX : e.clientY
      originExtent.current = extent ?? DEFAULT_SIZE[side]
      e.currentTarget?.setPointerCapture?.(e.pointerId)
    },
    [horizontal, extent, side],
  )

  const onMove = useCallback(
    (e: any) => {
      if (!e.currentTarget?.hasPointerCapture?.(e.pointerId)) return
      const delta = (horizontal ? e.clientX : e.clientY) - origin.current
      // Left grows rightward; right and bottom grow the other way.
      const signed = side === 'left' ? delta : -delta
      setExtent(Math.min(maxSize, Math.max(minSize, originExtent.current + signed)))
    },
    [horizontal, side, minSize, maxSize, setExtent],
  )

  if (!tabs.length) return null
  const current = tabs.find((t) => t.id === active) ?? tabs[0]

  // The seam between two sheets, and where the dock is resized.
  const seam = (
    <YStack
      onPointerDown={onDown}
      onPointerMove={onMove}
      cursor={horizontal ? 'col-resize' : 'row-resize'}
      width={horizontal ? 5 : undefined}
      height={horizontal ? undefined : 5}
      hoverStyle={{ bg: '$rim' }}
    />
  )

  const dock = (
    <YStack
      overflow="hidden"
      {...sheet(1)}
      {...(horizontal ? { width: extent } : { height: extent })}
    >
      <XStack items="center" gap="$1" px="$2" pt="$1.5">
        {tabs.map((t) => {
          const on = t.id === current.id
          return (
            <XStack
              key={t.id}
              items="center"
              gap="$1.5"
              px="$2.5"
              py="$1.5"
              cursor="pointer"
              // The active tab is a raised sheet whose bottom corners stay
              // square, so it reads as continuous with the pane beneath it —
              // which is why both stand on rung 2 rather than merely looking
              // similar. An inactive tab is not a sheet at all; it is the
              // dock's own surface showing through.
              rounded="$3"
              {...(on ? sheet(2) : { backgroundColor: 'transparent' })}
              hoverStyle={{ bg: on ? undefined : '$panel' }}
            >
              <YStack onPress={() => setActive(t.id)}>
                <XStack items="center" gap="$1.5">
                  {t.icon}
                  <Text fontSize="$2" numberOfLines={1} opacity={on ? 1 : 0.7}>
                    {t.title}
                  </Text>
                </XStack>
              </YStack>
              {t.closable === false ? null : (
                <Button
                  size="$1"
                  chromeless
                  circular
                  aria-label={`Close ${t.title}`}
                  onPress={() => onClose?.(t.id)}
                >
                  ×
                </Button>
              )}
            </XStack>
          )
        })}
        {actions}
      </XStack>
      {/* Where the tab sheet meets the pane, edge-on. */}
      <Separator opacity={0.4} />
      {/* The pane is the active tab CONTINUED, so it stands on the same rung.
          It was `$hover` — the selected-item fill, a state and not a surface,
          which is the one substitution `panel` exists to stop. */}
      <YStack flex={1} overflow="hidden" {...sheet(2)}>
        {current.content}
      </YStack>
    </YStack>
  )

  // Named rather than an array: a list of children needs keys, and two siblings
  // that are not a list should not have to invent identities to sit beside
  // each other.
  const [first, second] = HANDLE_FIRST[side] ? [seam, dock] : [dock, seam]
  const Row = horizontal ? XStack : YStack
  return (
    <Row>
      {first}
      {second}
    </Row>
  )
}

export type WorkbenchProps = {
  left?: Omit<DockProps, 'side'>
  right?: Omit<DockProps, 'side'>
  bottom?: Omit<DockProps, 'side'>
  /** The center view — the work itself, and the lowest sheet. */
  children: ReactNode
}

/**
 * Left and right run the full height; the bottom spans the center column, so a
 * console sits under the work and not under the navigation.
 */
export function Workbench({ left, right, bottom, children }: WorkbenchProps) {
  return (
    <XStack flex={1} overflow="hidden" bg="$sunken">
      {left ? <Dock side="left" {...left} /> : null}
      <YStack flex={1} overflow="hidden">
        <YStack flex={1} overflow="hidden">
          {children}
        </YStack>
        {bottom ? <Dock side="bottom" {...bottom} /> : null}
      </YStack>
      {right ? <Dock side="right" {...right} /> : null}
    </XStack>
  )
}
