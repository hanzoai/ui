
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
    bg="$hover"
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
    hoverStyle={{ bg: '$edge' }}
    focusStyle={{ bg: '$edge' }}
    // The selected tab. gui's `Tabs.Tab` spreads `activeStyle` only for the tab
    // whose `value` is current, and the `unstyled` frame drops its OWN active
    // default (`...!unstyled && !activeStyle && {…}` in the compiled frame) — so
    // without this the active tab is painted identically to the rest and the row
    // reads as though nothing is chosen. A raised `$background` pill on the
    // `$hover` track: shadcn's `data-[state=active]:bg-background shadow-sm`.
    activeStyle={{
      bg: '$background',
      shadowColor: '$shadowColor',
      shadowOpacity: 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    }}
    {...p}
  >
    {ink(children, undefined, { size: '$2', fontWeight: '500' })}
  </GuiTabs.Tab>
)

const TabsContent = ({ children, ...p }: TabsContentProps) => (
  <GuiTabs.Content {...slot('tabs-content')} flex={1} {...p}>
    {ink(children)}
  </GuiTabs.Content>
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
