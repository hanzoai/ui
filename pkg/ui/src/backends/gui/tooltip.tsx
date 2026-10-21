'use client'

/**
 * Tooltip — hover/focus hint. `TooltipProvider` is gui's `TooltipGroup`.
 *
 * gui keeps the offset on the tooltip ROOT while the compound API spells it on
 * Content, as `sideOffset`. One value, one owner: the root holds it, Content
 * publishes into it — the same split `popover` resolves, for the same reason.
 *
 * The panel FOLLOWS THE THEME — a dark hint on a dark page, a light one on a
 * light page (Hanzo's decision; the source kit's is a dark slab in both). It did not
 * before, measured: gui's Tooltip frame carries a `t_Tooltip` sub-theme that
 * inverts the ground, so on the dark page the hint was a light-grey slab
 * (`--background` 85% lightness under glass) with near-black text, and on the
 * light page a dark one. Naming the frame's component `Hint`, which no theme
 * table carries, leaves it in the theme it was opened from. It takes the source
 * kit's geometry (MIT, NOTICE): 4×6 padding, 12px text on
 * a 16px line, 10px clear of its anchor, at most 300 wide, opening after 600ms.
 * A title may lead with a 14px icon and carry a quieter description under it,
 * line breaks kept.
 */
import { Text, Tooltip as GuiTooltip, TooltipGroup, XStack, YStack } from '@hanzo/gui'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { ink } from './ink'
import { slot } from './slot'

const DEFAULT_OFFSET = 10
/** How long a pointer rests before the hint opens, ms. */
const DEFAULT_DELAY = 600
const MAX_W = 300

/** What Content declares and the root owns. */
type Placed = { offset?: number }

const Publish = /* @__PURE__ */ createContext<((p: Placed) => void) | null>(null)

export type TooltipProps = Omit<ComponentProps<typeof GuiTooltip>, 'offset'> & { offset?: number }
export type TooltipContentProps = ComponentProps<typeof GuiTooltip.Content> & {
  sideOffset?: number
  /** A 14px icon before the title. */
  startIcon?: ReactNode
  /** A quieter line under the title, line breaks kept. */
  description?: ReactNode
}

/**
 * Whether a tooltip sits in a `TooltipProvider`. gui lets a tooltip's own
 * `delay` override its group's, so a tooltip in a group must leave the delay
 * unsaid for the group's to hold; one standing alone takes the 600ms default.
 */
const Grouped = /* @__PURE__ */ createContext(false)

const Tooltip = ({ offset = DEFAULT_OFFSET, delay, ...props }: TooltipProps) => {
  const [placed, setPlaced] = useState<Placed>({})
  const publish = useCallback((p: Placed) => setPlaced((prev) => ({ ...prev, ...p })), [])
  const grouped = useContext(Grouped)
  return (
    <Publish.Provider value={publish}>
      <GuiTooltip offset={placed.offset ?? offset} delay={delay ?? (grouped ? undefined : DEFAULT_DELAY)} {...props} />
    </Publish.Provider>
  )
}
const TooltipTrigger: typeof GuiTooltip.Trigger = GuiTooltip.Trigger

/** gui's `TooltipGroup`: the tooltips in it share one delay, 600ms unless told otherwise. */
const TooltipProvider = ({ delay = DEFAULT_DELAY, ...props }: Omit<ComponentProps<typeof TooltipGroup>, 'delay'> & { delay?: ComponentProps<typeof TooltipGroup>['delay'] }) => (
  <Grouped.Provider value>
    <TooltipGroup delay={delay} {...props} />
  </Grouped.Provider>
)

const TooltipContent = ({ sideOffset, startIcon, description, children, ...props }: TooltipContentProps) => {
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
        componentName="Hint"
        bg="$panel"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$3"
        px="$1.5"
        py="$1"
        maxW={MAX_W}
        {...props}
      >
        {startIcon || description ? (
          <YStack gap="$0.5">
            <XStack items="center" gap="$1">
              {startIcon ? <XStack shrink={0}>{startIcon}</XStack> : null}
              {ink(children, undefined, { size: '$1', fontWeight: '500' })}
            </XStack>
            {description ? (
              typeof description === 'string' ? (
                <Text {...slot('tooltip-description')} fontSize="$1" lineHeight="$1" color="$aside" style={{ whiteSpace: 'pre-line' }}>
                  {description}
                </Text>
              ) : (
                description
              )
            ) : null}
          </YStack>
        ) : (
          ink(children, undefined, { size: '$1' })
        )}
      </GuiTooltip.Content>
    </PortalTheme>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
