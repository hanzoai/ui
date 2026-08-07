'use client'

/**
 * HoverCard — the rich preview a pointer opens by resting on a trigger.
 *
 * gui ships no HoverCard primitive, but it ships the thing a hover card IS: a
 * `Popover` in hover mode. `hoverable` puts floating-ui's `useHover` +
 * `safePolygon` on the same popper the Popover already uses, so the cursor can
 * travel the gap into the panel without it closing, and `useFocus` opens it from
 * the keyboard. Nothing here re-implements hover timing, positioning or dismiss.
 *
 * TWO RENAMES, and they are the only two. Both are unavoidable — gui keeps on the
 * popper ROOT what Radix put on the children — so both are absorbed HERE and the
 * Radix call site is unchanged:
 *
 *   1. `openDelay` / `closeDelay` (root) -> one `hoverable={{ delay: {open, close} }}`.
 *      Radix's own defaults (700 / 300) are kept.
 *   2. `side` + `align` + `sideOffset` (Content) -> ONE `placement` and one
 *      `offset` on the ROOT. Content still ACCEPTS all three and publishes them
 *      up through a context — the same idiom `popover.tsx` uses for `sideOffset`
 *      — so `<HoverCardContent side="left" align="start">` lands as
 *      `placement="left-start"` instead of being silently dropped, which is what
 *      `PopoverContent` does with `align` today. gui's popper and Radix agree on
 *      the default here (`bottom`/`center`), so nothing has to be written out.
 *
 * One deliberate a11y deviation from Radix, in the safer direction. Radix's hover
 * card is sighted-user-only: its Content carries no role and its Trigger no aria
 * state. Riding gui's popper gives the trigger `aria-expanded` and the panel
 * `role="dialog"`, opens on keyboard FOCUS as well as hover, and closes on
 * Escape through the dismissable layer. That is strictly more reachable than the
 * component it replaces, so it is kept rather than suppressed.
 *
 * Press is NOT a trigger (`disablePressTrigger`): Radix's hover card never
 * toggled on click, and its trigger is usually a link whose click must navigate.
 *
 * `HoverCardContent` re-applies the trigger's resolved theme inside the portal
 * via `PortalTheme` — gui portals re-root the subtree, so theme context does not
 * flow. `GuiPopover.Content` portals itself, so there is no `HoverCardPortal`,
 * exactly as there is no `PopoverPortal`.
 */
import { Popover as GuiPopover } from '@hanzo/gui'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
} from 'react'

import { ink } from './ink'
import { slot } from './slot'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'

/** Radix's defaults, kept so a migrated call site behaves identically. */
const OPEN_DELAY = 700
const CLOSE_DELAY = 300
const DEFAULT_OFFSET = 4
/** Radix/shadcn ship `w-64`. */
const WIDTH = 256

type Placement = NonNullable<ComponentProps<typeof GuiPopover>['placement']>
type Side = 'top' | 'right' | 'bottom' | 'left'
type Align = 'start' | 'center' | 'end'

/** Root-owned floating geometry. Content publishes into it; see rename 2 above. */
const FloatContext = /* @__PURE__ */ createContext<
  ((placement: Placement, offset: number) => void) | null
>(null)

export type HoverCardProps = Omit<
  ComponentProps<typeof GuiPopover>,
  'hoverable' | 'placement' | 'offset'
> & {
  openDelay?: number
  closeDelay?: number
}

function HoverCard({
  openDelay = OPEN_DELAY,
  closeDelay = CLOSE_DELAY,
  ...props
}: HoverCardProps) {
  const [float, setFloat] = useState<{ placement: Placement; offset: number }>({
    placement: 'bottom',
    offset: DEFAULT_OFFSET,
  })
  // Identity-stable: an unchanged publish returns the same object, so Content's
  // effect cannot drive a render loop.
  const publish = useCallback(
    (placement: Placement, offset: number) =>
      setFloat((f) => (f.placement === placement && f.offset === offset ? f : { placement, offset })),
    [],
  )
  return (
    <FloatContext.Provider value={publish}>
      <GuiPopover
        hoverable={{ delay: { open: openDelay, close: closeDelay } }}
        placement={float.placement}
        offset={float.offset}
        {...props}
      />
    </FloatContext.Provider>
  )
}

export type HoverCardTriggerProps = ComponentProps<typeof GuiPopover.Trigger>

const HoverCardTrigger = (props: HoverCardTriggerProps) => (
  <GuiPopover.Trigger {...slot('hover-card-trigger')} disablePressTrigger {...props} />
)

export type HoverCardContentProps = ComponentProps<typeof GuiPopover.Content> & {
  side?: Side
  align?: Align
  sideOffset?: number
}

const HoverCardContent = ({
  side = 'bottom',
  align = 'center',
  sideOffset = DEFAULT_OFFSET,
  children,
  ...props
}: HoverCardContentProps) => {
  const themeName = useThemeName()
  const publish = useContext(FloatContext)
  useEffect(
    () => publish?.(align === 'center' ? side : (`${side}-${align}` as Placement), sideOffset),
    [publish, side, align, sideOffset],
  )
  return (
    <PortalTheme name={themeName}>
      <GuiPopover.Content
        {...slot('hover-card-content')}
        bg="$color2"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$4"
        p="$4"
        width={WIDTH}
        {...props}
      >
        {ink(children, undefined, { size: '$2' })}
      </GuiPopover.Content>
    </PortalTheme>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
