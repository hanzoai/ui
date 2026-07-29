'use client'

/** Collapsible — @hanzogui/collapsible's three parts under the flat names. */
import { Collapsible as GuiCollapsible } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

export type CollapsibleProps = ComponentProps<typeof GuiCollapsible>
export type CollapsibleTriggerProps = ComponentProps<typeof GuiCollapsible.Trigger>
export type CollapsibleContentProps = ComponentProps<typeof GuiCollapsible.Content>

const Collapsible = (p: CollapsibleProps) => <GuiCollapsible {...slot('collapsible')} {...p} />
const CollapsibleTrigger = (p: CollapsibleTriggerProps) => (
  <GuiCollapsible.Trigger {...slot('collapsible-trigger')} unstyled {...touch(28)} {...p} />
)
const CollapsibleContent = (p: CollapsibleContentProps) => (
  <GuiCollapsible.Content {...slot('collapsible-content')} {...p} />
)

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
