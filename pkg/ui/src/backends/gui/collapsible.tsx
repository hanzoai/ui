'use client'

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
    // `GuiCollapsible.Trigger` compiles from `styled(View, { render: 'button' })`
    // and has no `unstyled` variant; resetting `bg`/`borderWidth`/`cursor`
    // removes UA button chrome without forwarding `unstyled` onto `<button>`.
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
