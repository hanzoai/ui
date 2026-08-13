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
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { slot } from './slot'

const DEFAULT_OFFSET = 4
const DEFAULT_SIDE = 'bottom'

export type Align = 'start' | 'center' | 'end'

/**
 * The placement a SIDE and an ALIGN name together. gui speaks floating-ui's
 * one string; the compound API splits the same fact in two, so this rejoins
 * them. `center` is the ABSENCE of a suffix rather than a suffix of its own,
 * and a side that already carries one is re-aligned rather than appended to.
 *
 * Example: place('bottom', 'start') === 'bottom-start'
 */
export const place = (side: string, align: Align = 'center'): string => {
  const base = side.split('-')[0]
  return align === 'center' ? base : `${base}-${align}`
}

/** What Content declares and the root owns. */
type Placed = { offset?: number; align?: Align }

const Publish = /* @__PURE__ */ createContext<((p: Placed) => void) | null>(null)

export type PopoverProps = Omit<ComponentProps<typeof GuiPopover>, 'offset'> & { offset?: number }

function Popover({ offset = DEFAULT_OFFSET, placement, ...props }: PopoverProps) {
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
}

const PopoverContent = ({ sideOffset = DEFAULT_OFFSET, align, ...props }: PopoverContentProps) => {
  const themeName = useThemeName()
  const publish = useContext(Publish)
  useEffect(() => publish?.({ offset: sideOffset, align }), [publish, sideOffset, align])
  return (
    <PortalTheme name={themeName}>
      <GuiPopover.Content
        {...slot('popover-content')}
        bg="$color2"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$4"
        p="$4"
        width={288}
        {...props}
      />
    </PortalTheme>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose }
