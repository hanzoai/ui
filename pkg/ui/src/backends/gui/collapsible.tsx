
/** Collapsible — @hanzogui/collapsible's three parts under the flat names. */
import { Collapsible as GuiCollapsible } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

export type CollapsibleProps = ComponentProps<typeof GuiCollapsible>
export type CollapsibleTriggerProps = ComponentProps<typeof GuiCollapsible.Trigger>
export type CollapsibleContentProps = ComponentProps<typeof GuiCollapsible.Content>

const Collapsible = (p: CollapsibleProps) => <GuiCollapsible {...slot('collapsible')} {...p} />
const CollapsibleTrigger = ({ children, ...p }: CollapsibleTriggerProps) => (
  <GuiCollapsible.Trigger
    {...slot('collapsible-trigger')}
    unstyled
    // `unstyled` means gui applies nothing — which on web leaves the UA's own
    // button chrome, and a native <button> is #efefef with a 2px outset black
    // border. Unstyled must mean "no chrome", not "the browser's chrome".
    bg="transparent"
    borderWidth={0}
    cursor="pointer"
    {...touch(28)}
    {...p}
  >
    {ink(children, undefined, { color: '$ink' })}
  </GuiCollapsible.Trigger>
)
const CollapsibleContent = (p: CollapsibleContentProps) => (
  <GuiCollapsible.Content {...slot('collapsible-content')} {...p} />
)

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
