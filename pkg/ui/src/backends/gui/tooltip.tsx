'use client'

/**
 * Tooltip — hover/focus hint. `TooltipProvider` is gui's `TooltipGroup`.
 *
 * gui keeps the offset on the tooltip ROOT while the compound API spells it on
 * Content, as `sideOffset`. One value, one owner: the root holds it, Content
 * publishes into it — the same split `popover` resolves, for the same reason.
 */
import { Tooltip as GuiTooltip, TooltipGroup } from '@hanzo/gui'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
} from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { ink } from './ink'
import { slot } from './slot'

const DEFAULT_OFFSET = 4

/** What Content declares and the root owns. */
type Placed = { offset?: number }

const Publish = /* @__PURE__ */ createContext<((p: Placed) => void) | null>(null)

export type TooltipProps = Omit<ComponentProps<typeof GuiTooltip>, 'offset'> & { offset?: number }
export type TooltipContentProps = ComponentProps<typeof GuiTooltip.Content> & { sideOffset?: number }

const Tooltip = ({ offset = DEFAULT_OFFSET, ...props }: TooltipProps) => {
  const [placed, setPlaced] = useState<Placed>({})
  const publish = useCallback((p: Placed) => setPlaced((prev) => ({ ...prev, ...p })), [])
  return (
    <Publish.Provider value={publish}>
      <GuiTooltip offset={placed.offset ?? offset} {...props} />
    </Publish.Provider>
  )
}
const TooltipTrigger: typeof GuiTooltip.Trigger = GuiTooltip.Trigger
const TooltipProvider: typeof TooltipGroup = TooltipGroup

const TooltipContent = ({ sideOffset, children, ...props }: TooltipContentProps) => {
  const themeName = useThemeName()
  const publish = useContext(Publish)
  // Only a Content that names an offset has anything to say about it; an absent
  // one leaves whatever the root was given standing.
  useEffect(() => {
    if (sideOffset !== undefined) publish?.({ offset: sideOffset })
  }, [publish, sideOffset])
  return (
    <PortalTheme name={themeName}>
      <GuiTooltip.Content
        {...slot('tooltip-content')}
        bg="$panel"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$3"
        px="$3"
        py="$1.5"
        {...props}
      >
        {ink(children, undefined, { size: '$1' })}
      </GuiTooltip.Content>
    </PortalTheme>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
