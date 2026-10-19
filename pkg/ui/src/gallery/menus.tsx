'use client'

/**
 * The record kit's menus, rows and floating surfaces in the gallery: every part
 * merged from twenty-ui's Dropdown, MenuItem, ListItem, Tooltip, Popover and
 * ResizeHandle (MIT, NOTICE), regular and compact.
 *
 * The rows render in place as well as inside open menus. A portalled panel draws
 * only once a browser mounts it, so the standalone rows are what a server render
 * (and the stylesheet it harvests) can see; the open menus are what a browser
 * measures. Every Search here passes `autoFocus={false}`: the gallery holds many
 * surfaces open at once, and a field that took focus on load would pull the page
 * to it.
 */
import { useState } from 'react'
import { XStack, YStack } from '@hanzo/gui'
import { BarChart3, Building2, Copy, Info, Kanban, LineChart, Pencil, Settings, Table, Trash2, User } from '@hanzogui/lucide-icons-2'
import { Section } from './section'
import { Density } from '../backends/gui/density'
import { Button } from '../backends/gui/button'
import { Grip } from '../backends/gui/grip'
import { Item } from '../backends/gui/item'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../backends/gui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui/popover'
import {
  DropdownMenu,
  DropdownMenuBack,
  DropdownMenuClose,
  DropdownMenuContent,
  DropdownMenuEmpty,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLoading,
  DropdownMenuOptionItem,
  DropdownMenuPage,
  DropdownMenuSearch,
  DropdownMenuSection,
  DropdownMenuSelectionGroup,
  DropdownMenuSeparator,
  DropdownMenuTitle,
  DropdownMenuTrigger,
} from '../backends/gui/dropdown-menu'
import { MenuRow } from '../product/MenuRow'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../backends/gui/tabs'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../backends/gui/breadcrumb'
import { Card, CardContent, CardFooter, CardHeader } from '../backends/gui/card'
import { ToggleGroup, ToggleGroupItem } from '../backends/gui/toggle-group'
import { FieldSwitch } from '../product/Field'
import { Heading as SettingsHeading } from '../settings/Section'
import { Text, VisuallyHidden } from '../backends/gui/layout'

/** The record page's surfaces: line tabs, the trail, a compact card, picker tiles, a settings row. */
export function Surfaces() {
  return (
    <>
      <Section name="tabs-line">
        <Tabs variant="line" defaultValue="timeline" width={480}>
          <TabsList>
            <TabsTrigger value="timeline" startIcon={<LineChart size={16} />}>
              Timeline
            </TabsTrigger>
            <TabsTrigger value="tasks" badge={<Text fontSize="$1" color="$hint">3</Text>}>
              Tasks
            </TabsTrigger>
            <TabsTrigger value="notes" size="sm">
              Notes
            </TabsTrigger>
            <TabsTrigger value="files" highlighted>
              Files
            </TabsTrigger>
            <TabsTrigger value="emails" disabled>
              Emails
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">Timeline</TabsContent>
        </Tabs>
      </Section>
      <Section name="breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#companies">Companies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Acme Corporation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>
      <Section name="card-compact">
        <Card density="compact" width={320}>
          <CardHeader>Email</CardHeader>
          <CardContent divider>ada@acme.com</CardContent>
          <CardFooter>Synced 2 minutes ago</CardFooter>
        </Card>
        <Card density="compact" interactive width={200} onPress={NOOP}>
          <CardContent>Interactive</CardContent>
        </Card>
      </Section>
      <Section name="toggle-tile">
        <ToggleGroup type="single" variant="tile" defaultValue="table" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)' }}>
          <ToggleGroupItem value="table" aria-label="Table">
            <Table size={16} />
            Table
          </ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Kanban">
            <Kanban size={16} />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="chart" aria-label="Chart" disabled>
            <BarChart3 size={16} />
            Chart
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>
      <Section name="settings-row">
        <YStack width={320} gap={2}>
          <FieldSwitch label="Compact view" description="Fewer fields per card" checked onChange={NOOP} />
          <FieldSwitch label="Hide empty groups" checked={false} onChange={NOOP} disabled />
        </YStack>
        <Density value="compact">
          <YStack width={360}>
            <SettingsHeading title="Members" detail="Who can see and edit records in this workspace." />
          </YStack>
        </Density>
        <Text>
          Visible
          <VisuallyHidden>
            <Text>read aloud only</Text>
          </VisuallyHidden>
        </Text>
      </Section>
    </>
  )
}

const NOOP = () => {}

const Edit = () => (
  <Button size="icon-2xs" variant="ghost" emphasis="subtle" aria-label="Edit">
    <Pencil />
  </Button>
)

/** Every row variant that carries its own style, standalone. */
export function Rows() {
  return (
    <>
      <Section name="menu-row">
        <YStack width={240} gap={2}>
          <MenuRow size="row" label="People" icon={<User size={16} />} onPress={NOOP} />
          <MenuRow size="row" label="Companies" icon={<Building2 size={16} />} iconContainer contextual="12" onPress={NOOP} />
          <MenuRow size="row" label="Settings" icon={<Settings size={16} />} contextual="⌘," contextualPosition="right" onPress={NOOP} />
          <MenuRow size="row" label="Copy link" icon={<Copy size={16} />} shortcut={['⌘', 'L']} onPress={NOOP} />
          <MenuRow size="row" label="Group by" submenu onPress={NOOP} />
          <MenuRow size="row" label="Sort" submenu="open" onPress={NOOP} />
          <MenuRow size="row" label="Delete" icon={<Trash2 size={16} />} danger onPress={NOOP} />
          <MenuRow size="row" label="Add a field" placeholder onPress={NOOP} />
          <MenuRow size="row" label="Name" icon={<User size={16} />} grip="always" onPress={NOOP} />
          <MenuRow size="row" label="Email" icon={<User size={16} />} grip="onHover" onPress={NOOP} />
          <MenuRow size="row" label="Phones" actions={<Edit />} onPress={NOOP} />
          <MenuRow size="row" label="Links" actions={<Edit />} actionsVisibility="always" onPress={NOOP} />
          <MenuRow size="row" label="Ada Lovelace" variant="suggestion" selected onPress={NOOP} />
          <MenuRow size="row" label="Grace Hopper" variant="suggestion" onPress={NOOP} />
          <MenuRow size="row" label="Focused" focused onPress={NOOP} />
          <MenuRow size="row" label="Disabled" disabled onPress={NOOP} />
        </YStack>
      </Section>

      <Section name="item-row">
        <YStack width={240} gap={2}>
          <Item size="row" indicator="check" selected>
            Selected, check
          </Item>
          <Item size="row" indicator="checkbox" selected>
            Selected, box
          </Item>
          <Item size="row" indicator="checkbox">
            Unselected, box
          </Item>
          <Item size="row" selected>
            Selected, tint
          </Item>
          <Item size="row" focused>
            Focused
          </Item>
          <Item size="row" shortcut={['⌘', 'K']}>
            Shortcut
          </Item>
          <Item size="row" actions={<Edit />}>
            Actions on hover
          </Item>
          <Item size="row" actions={<Edit />} actionsVisibility="always">
            Actions always
          </Item>
          <Item size="row" hasSubmenu>
            Submenu
          </Item>
          <Item size="row" color="danger">
            Danger
          </Item>
          <Item size="row" disabled hasSubmenu>
            Disabled
          </Item>
          <Item size="row" render="button" onPress={NOOP}>
            As a button
          </Item>
        </YStack>
      </Section>

      <Section name="grip-record">
        <XStack position="relative" width={160} height={96} borderWidth={1} borderColor="$borderColor" rounded="$3">
          <Grip side="right" span={160} floor={120} ceil={240} onSpan={NOOP} label="Resize panel" bar="edge" />
        </XStack>
        <XStack position="relative" width={160} height={96} borderWidth={1} borderColor="$borderColor" rounded="$3">
          <Grip side="left" span={160} floor={120} ceil={240} onSpan={NOOP} label="Resize pane" bar="inline" />
        </XStack>
      </Section>
    </>
  )
}

/** A record picker: search, a scrollable section of options, actions, an empty line. */
export function Picker({ autoFocus = false, open = true }: { autoFocus?: boolean; open?: boolean }) {
  const [q, setQ] = useState('')
  const all = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton', 'Radia Perlman', 'Barbara Liskov', 'Frances Allen']
  const shown = all.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <DropdownMenu {...(open ? { open: true } : null)}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          Assignee
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent minW={240} {...({ 'data-gallery-menu': 'picker' } as object)}>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search people" autoFocus={autoFocus} />
        <DropdownMenuSelectionGroup multiple defaultValue={['Ada Lovelace']}>
          <DropdownMenuSection label="People" scrollable>
            {shown.map((n) => (
              <DropdownMenuOptionItem key={n} value={n}>
                {n}
              </DropdownMenuOptionItem>
            ))}
          </DropdownMenuSection>
        </DropdownMenuSelectionGroup>
        {shown.length === 0 ? <DropdownMenuEmpty>No person matches</DropdownMenuEmpty> : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem actions={<Edit />} onSelect={NOOP}>
          Add person
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** View options: pages, a back row, a header with a close. */
export function Paged({ open = true }: { open?: boolean }) {
  return (
    <DropdownMenu {...(open ? { open: true } : null)} defaultPage="options">
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent {...({ 'data-gallery-menu': 'paged' } as object)}>
        <DropdownMenuPage id="options">
          <DropdownMenuHeader>
            <DropdownMenuTitle>View options</DropdownMenuTitle>
            <DropdownMenuClose aria-label="Close" />
          </DropdownMenuHeader>
          <DropdownMenuItem page="fields">Fields</DropdownMenuItem>
          <DropdownMenuSelectionGroup defaultValue="table">
            <DropdownMenuLabel variant="band">Layout</DropdownMenuLabel>
            <DropdownMenuOptionItem value="table">Table</DropdownMenuOptionItem>
            <DropdownMenuOptionItem value="kanban">Kanban</DropdownMenuOptionItem>
            <DropdownMenuOptionItem value="calendar" indicator="none">
              Calendar
            </DropdownMenuOptionItem>
          </DropdownMenuSelectionGroup>
          <DropdownMenuLoading>Counting records</DropdownMenuLoading>
        </DropdownMenuPage>
        <DropdownMenuPage id="fields">
          <DropdownMenuBack>Fields</DropdownMenuBack>
          <DropdownMenuItem>Name</DropdownMenuItem>
        </DropdownMenuPage>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Menus() {
  return (
    <>
      <Rows />
      <Surfaces />
      <Section name="dropdown-record">
        <Picker />
        <Paged />
      </Section>
      <Section name="floating-record">
        <TooltipProvider delay={0}>
          <Tooltip open>
            <TooltipTrigger>Sync</TooltipTrigger>
            <TooltipContent startIcon={<Info size={14} />} description={'Last synced 2 minutes ago.\nNext in 3.'}>
              Mailbox sync
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Popover open>
          <PopoverTrigger>Small panel</PopoverTrigger>
          <PopoverContent size="sm" arrow>
            Record preview
          </PopoverContent>
        </Popover>
      </Section>
      <Density value="compact">
        <Section name="menus-compact">
          <YStack width={240} gap={2}>
            <MenuRow size="row" label="Compact row" onPress={NOOP} />
          </YStack>
          <Popover open>
            <PopoverTrigger>Compact panel</PopoverTrigger>
            <PopoverContent>Compact preview</PopoverContent>
          </Popover>
        </Section>
      </Density>
    </>
  )
}
