'use client'

/**
 * Popover — floating panel anchored to a trigger.
 *
 * `PopoverContent` mounts its own portal and re-applies the trigger's resolved
 * theme inside it (gui portals re-root the subtree, so theme context does not
 * flow).
 *
 * gui keeps BOTH placement facts on the popper ROOT — `offset` and `placement`
 * — while the compound API spells them on Content, as `sideOffset` and `align`.
 * One value, one owner: the root holds them, Content publishes into it.
 *
 * `size="sm"` is the record panel (twenty-ui's Popover, MIT, NOTICE): an 8px
 * inset, sized to its content up to the room there is, 8px clear of its anchor.
 * A `<Density value="compact">` makes it the default for a panel that names no
 * size. The default stays the 16px-inset, 288-wide panel every surface has. The
 * fill stays Hanzo's near-opaque panel — not twenty-ui's translucent glass.
 * `arrow` adds a 12×6 pointer in the panel's own fill and edge.
 */
import { Popover as GuiPopover } from '@hanzo/gui'
import { Density, useDensity } from './density'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
} from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { place, type Align } from './place'
import { slot } from './slot'

const DEFAULT_OFFSET = 4
const DEFAULT_SIDE = 'bottom'

export type { Align }

/** What Content declares and the root owns. */
type Placed = { offset?: number; align?: Align }

const Publish = /* @__PURE__ */ createContext<((p: Placed) => void) | null>(null)

/** Whether the panel this one opened from is solid. A list opened inside a solid
 *  panel stands on the same ground, so the pair reads as one surface. */
const Solid = /* @__PURE__ */ createContext(false)

export type PopoverProps = Omit<ComponentProps<typeof GuiPopover>, 'offset'> & { offset?: number }

function Popover({ offset, placement, ...props }: PopoverProps) {
  const density = useDensity()
  offset ??= density === 'compact' ? 8 : DEFAULT_OFFSET
  const [placed, setPlaced] = useState<Placed>({})
  const publish = useCallback((p: Placed) => setPlaced((prev) => ({ ...prev, ...p })), [])
  return (
    <Publish.Provider value={publish}>
      <GuiPopover
        offset={placed.offset ?? offset}
        placement={place(placement ?? DEFAULT_SIDE, placed.align) as typeof placement}
        {...props}
      />
    </Publish.Provider>
  )
}

const PopoverTrigger: typeof GuiPopover.Trigger = GuiPopover.Trigger
const PopoverAnchor: typeof GuiPopover.Anchor = GuiPopover.Anchor
const PopoverClose: typeof GuiPopover.Close = GuiPopover.Close

export type PopoverContentProps = ComponentProps<typeof GuiPopover.Content> & {
  sideOffset?: number
  align?: Align
  /**
   * Stand on the opaque `--popover` ground instead of glass. For a panel over
   * something that moves, such as a menu over a streaming transcript, where the
   * text behind would read through the frost. It keeps the rung's shadow and
   * lit edge, and any popover opened from inside it is solid too.
   */
  solid?: boolean
  /** `sm`: an 8px inset, content-sized up to the room there is. Unset, the nearest `<Density>` decides. */
  size?: 'default' | 'sm'
  /** A 12×6 pointer toward the anchor, in the panel's fill (gui's arrow is a turned square: 8.5 across is 12 wide, 6 out). */
  arrow?: boolean
}

const PopoverContent = ({ sideOffset, align, solid, size, arrow = false, children, ...props }: PopoverContentProps) => {
  const themeName = useThemeName()
  const density = useDensity()
  const publish = useContext(Publish)
  const inherited = useContext(Solid)
  const opaque = solid ?? inherited
  const small = (size ?? (density === 'compact' ? 'sm' : 'default')) === 'sm'
  const offset = sideOffset ?? (density === 'compact' ? 8 : DEFAULT_OFFSET)
  useEffect(() => publish?.({ offset, align }), [publish, offset, align])
  const ground = opaque ? 'var(--popover)' : '$panel'
  return (
    <Solid.Provider value={opaque}>
      <PortalTheme name={themeName}>
        <Density value={density}>
          <GuiPopover.Content
            {...slot('popover-content')}
            {...(opaque ? { 'data-material': 'solid' } : null)}
            {...(small ? { 'data-size': 'sm' } : null)}
            bg={ground}
            borderWidth={1}
            borderColor="$borderColor"
            rounded="$4"
            {...(small
              ? { p: '$2', gap: '$1', maxW: 'var(--hanzogui-popper-available-width, 100vw)' as never }
              : { p: '$4', width: 288 })}
            {...props}
          >
            {arrow ? <GuiPopover.Arrow {...slot('popover-arrow')} size={8.5} bg={ground} borderWidth={1} borderColor="$borderColor" /> : null}
            {children}
          </GuiPopover.Content>
        </Density>
      </PortalTheme>
    </Solid.Provider>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose }
