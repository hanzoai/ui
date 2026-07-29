'use client'

/** Tabs — `TabsTrigger` is gui's `Tabs.Tab`; rows meet the 44px touch floor. */
import { Tabs as GuiTabs } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

const ROW_H = 36

export type TabsProps = ComponentProps<typeof GuiTabs>
export type TabsListProps = ComponentProps<typeof GuiTabs.List>
export type TabsTriggerProps = ComponentProps<typeof GuiTabs.Tab>
export type TabsContentProps = ComponentProps<typeof GuiTabs.Content>

const Tabs = (p: TabsProps) => <GuiTabs {...slot('tabs')} flexDirection="column" gap="$2" {...p} />

const TabsList = (p: TabsListProps) => (
  <GuiTabs.List
    {...slot('tabs-list')}
    items="center"
    justify="center"
    self="flex-start"
    height={ROW_H}
    p={3}
    gap={2}
    bg="$color3"
    rounded="$4"
    {...p}
  />
)

const TabsTrigger = ({ children, ...p }: TabsTriggerProps) => (
  <GuiTabs.Tab
    {...slot('tabs-trigger')}
    unstyled
    items="center"
    justify="center"
    height="100%"
    px="$3"
    gap="$1.5"
    rounded="$3"
    cursor="pointer"
    {...touch(ROW_H, 44, 'y')}
    hoverStyle={{ bg: '$color4' }}
    focusStyle={{ bg: '$color4' }}
    {...p}
  >
    {ink(children, undefined, { size: '$2', fontWeight: '500' })}
  </GuiTabs.Tab>
)

const TabsContent = (p: TabsContentProps) => <GuiTabs.Content {...slot('tabs-content')} flex={1} {...p} />

export { Tabs, TabsList, TabsTrigger, TabsContent }
