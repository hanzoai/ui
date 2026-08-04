'use client'

/**
 * The gallery — every component @hanzo/ui exports, rendered once, in every
 * variant that carries its own styling.
 *
 * It exists because three different jobs need the same answer to "what does this
 * package have to style", and three copies of that list would drift:
 *
 *   1. `scripts/gen-css.mjs` renders this in Node and harvests the atomic CSS
 *      that render produces. A component missing here ships with classes and no
 *      rules — the exact defect this package now guarantees against.
 *   2. `src/gallery.test.tsx` mounts it, so a component that throws on first
 *      paint fails the build.
 *   3. The consumer test installs the tarball and renders this in a browser,
 *      then asserts computed styles against it.
 *
 * So the list is the specification, and the generator, the unit test and the
 * consumer test all read it. Add a component to the barrel, add it here.
 *
 * Variants are enumerated rather than sampled: gui compiles each distinct style
 * VALUE to its own class, so an unrendered variant is an unwritten rule.
 */
import type { ReactNode } from 'react'

import {
  AspectRatio, Avatar, AvatarFallback, Badge, Button, Card, CardAction, CardContent,
  CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, Collapsible,
  CollapsibleContent, CollapsibleTrigger, Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut, Dialog, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogTitle, DropdownMenu,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, Input, Label, Popover, PopoverContent, PopoverTrigger, Progress,
  ResizableHandle, ResizablePanel, ResizablePanelGroup, ScrollArea, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, Separator, Slider, Switch, Tabs, TabsContent,
  TabsList, TabsTrigger, Textarea, Toaster, Tooltip, TooltipContent, TooltipProvider,
  TooltipTrigger,
  type BadgeVariant, type ButtonSize, type ButtonVariant,
} from './backends/gui'

const BUTTON_VARIANTS: ButtonVariant[] = [
  'default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'primary', 'linkFG', 'linkMuted',
]
const BUTTON_SIZES: ButtonSize[] = ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg']
const BADGE_VARIANTS: BadgeVariant[] = ['default', 'secondary', 'destructive', 'outline']

/** One section. Plain CSS on a plain div — the gallery is a harness, and laying
 *  it out with the components under test would make a layout bug read as a
 *  styling bug. Rows wrap so the same tree is legible at 390px and at 1280px,
 *  which is what makes the screenshot baselines worth comparing. */
const Section = ({ name, children }: { name: string; children: ReactNode }) => (
  <section
    data-gallery={name}
    style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', maxWidth: 880 }}
  >
    {children}
  </section>
)

/**
 * Every component, once. `data-gallery` names each section so a browser test can
 * scope its assertions without depending on document order.
 */
export const Gallery = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: 24, maxWidth: 928 }}>
    <Section name="button">
      {BUTTON_VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
      {BUTTON_SIZES.map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
      <Button disabled>disabled</Button>
      <Button isLoading>loading</Button>
    </Section>

    <Section name="badge">
      {BADGE_VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </Section>

    <Section name="card">
      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description</CardDescription>
          <CardAction>
            <Button size="sm" variant="ghost">
              action
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>Card content</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    </Section>

    <Section name="form">
      <Label>Label</Label>
      <Input placeholder="Input" />
      <Input placeholder="Password" type="password" />
      <Textarea placeholder="Textarea" />
      <Checkbox />
      <Checkbox checked />
      <Switch />
      <Switch checked />
      <Slider defaultValue={[40]} />
      <Progress value={40} />
    </Section>

    <Section name="tabs">
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one</TabsContent>
      </Tabs>
    </Section>

    <Section name="surface">
      <Separator />
      <AspectRatio ratio={16 / 9} />
      <Avatar>
        <AvatarFallback>HZ</AvatarFallback>
      </Avatar>
      <ScrollArea height={80}>Scroll area</ScrollArea>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel />
        <ResizableHandle />
        <ResizablePanel />
      </ResizablePanelGroup>
    </Section>

    <Section name="collapsible">
      <Collapsible open>
        <CollapsibleTrigger>Collapsible trigger</CollapsibleTrigger>
        <CollapsibleContent>Collapsible content</CollapsibleContent>
      </Collapsible>
    </Section>

    <Section name="command">
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Group">
            <CommandItem value="a">
              Item<CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>
    </Section>

    {/* Portalled surfaces. Rendered open so their panels produce styles too —
        closed, they render nothing and their rules would never be written. */}
    <Section name="overlay">
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open>
        <PopoverTrigger>Popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x" index={0}>
            Option
          </SelectItem>
        </SelectContent>
      </Select>
      <TooltipProvider delay={0}>
        <Tooltip open>
          <TooltipTrigger>Tooltip</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Toaster />
    </Section>
  </div>
)

export default Gallery
