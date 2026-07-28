'use client'

/** Tooltip — hover/focus hint. `TooltipProvider` is gui's `TooltipGroup`. */
import { Tooltip as GuiTooltip, TooltipGroup } from '@hanzo/gui'
import { useEffect, type ComponentProps } from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { ink } from './ink'
import { slot } from './slot'

const DEFAULT_OFFSET = 4

export type TooltipProps = ComponentProps<typeof GuiTooltip>
export type TooltipContentProps = ComponentProps<typeof GuiTooltip.Content> & { sideOffset?: number }

const Tooltip = (props: TooltipProps) => <GuiTooltip offset={DEFAULT_OFFSET} {...props} />
const TooltipTrigger: typeof GuiTooltip.Trigger = GuiTooltip.Trigger
const TooltipProvider: typeof TooltipGroup = TooltipGroup

const TooltipContent = ({ sideOffset: _sideOffset, children, ...props }: TooltipContentProps) => {
  const themeName = useThemeName()
  return (
    <PortalTheme name={themeName}>
      <GuiTooltip.Content
        {...slot('tooltip-content')}
        bg="$color2"
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
