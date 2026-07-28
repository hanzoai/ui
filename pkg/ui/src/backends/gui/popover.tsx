'use client'

/**
 * Popover — floating panel anchored to a trigger.
 *
 * `PopoverContent` mounts its own portal and re-applies the trigger's resolved
 * theme inside it (gui portals re-root the subtree, so theme context does not
 * flow). `sideOffset` lands on the popper root, which is where gui keeps it.
 */
import { Popover as GuiPopover } from '@hanzo/gui'
import { createContext, useContext, useEffect, useState, type ComponentProps } from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { slot } from './slot'

const DEFAULT_OFFSET = 4

/** gui puts `offset` on the popper ROOT; the compound API puts `sideOffset` on
 *  Content. One value, one owner: the root holds it, Content publishes into it. */
const OffsetContext = /* @__PURE__ */ createContext<((n: number) => void) | null>(null)

export type PopoverProps = Omit<ComponentProps<typeof GuiPopover>, 'offset'> & { offset?: number }

function Popover({ offset = DEFAULT_OFFSET, ...props }: PopoverProps) {
  const [current, setOffset] = useState(offset)
  useEffect(() => setOffset(offset), [offset])
  return (
    <OffsetContext.Provider value={setOffset}>
      <GuiPopover offset={current} {...props} />
    </OffsetContext.Provider>
  )
}

const PopoverTrigger: typeof GuiPopover.Trigger = GuiPopover.Trigger
const PopoverAnchor: typeof GuiPopover.Anchor = GuiPopover.Anchor
const PopoverClose: typeof GuiPopover.Close = GuiPopover.Close

export type PopoverContentProps = ComponentProps<typeof GuiPopover.Content> & {
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
}

const PopoverContent = ({ sideOffset = DEFAULT_OFFSET, align: _align, ...props }: PopoverContentProps) => {
  const themeName = useThemeName()
  const setOffset = useContext(OffsetContext)
  useEffect(() => setOffset?.(sideOffset), [setOffset, sideOffset])
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
