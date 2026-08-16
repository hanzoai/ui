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
import { Box } from './box'
import { Workbench } from './product/Workbench'

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger, AlertDialog, AlertDialogAction,
  AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger, HoverCard, HoverCardContent,
  HoverCardTrigger, RadioGroup, RadioGroupItem, ToggleGroup, ToggleGroupItem,
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
  TooltipTrigger, Grid, Section as PageSection, CardMedia, CommandDialog, Spinner,
  type BadgeVariant, type ButtonSize, type ButtonVariant,
} from './backends/gui'

/** A real <img> with real intrinsic pixels, inline so nothing hits the network.
 *  120x40 on purpose: the wrong ratio for every box it goes in, so a frame that
 *  fails to cover-fit its child is visible rather than merely untested. */
const SWATCH =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    // `#` is written literally and encodeURIComponent turns it into %23. Writing
    // %23 here instead double-encodes it to %25888, the fill is invalid, and the
    // swatch silently renders black — which it did.
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#888"/></svg>',
  )

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
      {/* Both orientations: the root restores `flexDirection` from `orientation`
          (gui consumes it for aria + roving focus and never forwards it), so the
          row axis is a distinct style VALUE and needs its own render. */}
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
        <RadioGroupItem value="c" disabled />
      </RadioGroup>
      <RadioGroup orientation="horizontal" defaultValue="a">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>
    </Section>

    {/* Every variant x size, because gui compiles each distinct style value to
        its own class — an unrendered combination is an unwritten rule. Both
        `type`s: single gets `role=radiogroup` + `aria-checked`, multiple gets
        `toolbar` + `aria-pressed`, and the two selected fills differ. */}
    <Section name="toggle-group">
      {(['default', 'outline'] as const).map((variant) =>
        (['default', 'sm', 'lg'] as const).map((size) => (
          <ToggleGroup
            key={`${variant}-${size}`}
            type="single"
            defaultValue="a"
            variant={variant}
            size={size}
          >
            <ToggleGroupItem value="a">A</ToggleGroupItem>
            <ToggleGroupItem value="b">B</ToggleGroupItem>
            <ToggleGroupItem value="c" disabled>
              C
            </ToggleGroupItem>
          </ToggleGroup>
        )),
      )}
      <ToggleGroup type="multiple" defaultValue={['a']}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" orientation="vertical" defaultValue="a">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    </Section>

    {/* Open on purpose: `AccordionContent` mounts only while its item is, so a
        closed accordion writes no rule for the panel or the rotated chevron. */}
    <Section name="accordion">
      <Accordion type="single" collapsible defaultValue="one">
        <AccordionItem value="one">
          <AccordionTrigger>Accordion trigger</AccordionTrigger>
          <AccordionContent>Accordion content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="two">
          <AccordionTrigger>Second trigger</AccordionTrigger>
          <AccordionContent>Second content</AccordionContent>
        </AccordionItem>
      </Accordion>
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

    <Section name="spinner">
      {[12, 16, 20, 32].map((size) => (
        <Spinner key={size} size={size} />
      ))}
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

      {/* CommandDialog, OPEN, driving a host-owned preview from the highlighted
          row. That readout is the assertion: before CommandDialog forwarded the
          palette's props it rendered `<Command>` bare, `onValueChange` never
          reached a host, and a two-pane palette was impossible — which is why
          hanzo.app rebuilt the dialog by hand. `shouldFilter` comes through the
          same door, so typing must narrow the list. */}
      <CommandDialog
        open
        defaultValue="alpha"
        onValueChange={(v) => {
          const el = document.querySelector('[data-palette-selected]')
          if (el) el.setAttribute('data-palette-selected', v)
        }}
      >
        <CommandInput />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Palette">
            <CommandItem value="alpha">alpha</CommandItem>
            <CommandItem value="beta">beta</CommandItem>
            <CommandItem value="gamma">gamma</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <span data-palette-selected="" />
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
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alert title</AlertDialogTitle>
            <AlertDialogDescription>Alert description</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <HoverCard open>
        <HoverCardTrigger>Hover card</HoverCardTrigger>
        <HoverCardContent>Hover card content</HoverCardContent>
      </HoverCard>
      {/* ContextMenu is the one surface this list cannot open: it has no `open`
          prop by design (Radix's has none either) — it opens from a real
          `contextmenu` event, which no static render fires. Its panel and row
          style objects are byte-identical IN VALUE to dropdown-menu.tsx's, and
          gui keys an atomic class on the value, so those rules are already
          written by the DropdownMenu above. Only the trigger is new here. */}
      <ContextMenu>
        <ContextMenuTrigger>Context menu</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Label</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem>Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Toaster />
    </Section>
    <Section name="layout">
      {/* A Grid of SEVEN cards — deliberately not a multiple of any column
          count, so an uneven last row is exercised at every width. The consumer
          test measures these at 390/768/1280: equal widths within a row, zero
          horizontal overflow, and every media box taller than zero. */}
      <Grid min={240} gap="$3" style={{ width: '100%' }} data-grid="auto">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardMedia ratio={16 / 10}>
              <img src={SWATCH} alt="" />
            </CardMedia>
            <CardHeader>
              <CardTitle>Card {i}</CardTitle>
              <CardDescription>Sized by its content, never by a pinned height.</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Grid>

      {/* The capped grid: 2-up on a phone, never more than 4 on a desktop, with
          no breakpoint props anywhere. Six items so the cap has something to
          refuse. */}
      <Grid min={160} max={4} gap="$3" style={{ width: '100%' }} data-grid="capped">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i}><CardContent>cap {i}</CardContent></Card>
        ))}
      </Grid>

      {/* A track WIDER than a phone. This is the case `min(Npx, 100%)` exists
          for: a bare minmax(900px, 1fr) forces a 900px column into a 390px
          window and the document scrolls sideways. A 240px min never shows it,
          because 240 already fits. */}
      <Grid min={900} gap="$3" style={{ width: '100%' }} data-grid="wide">
        <Card><CardContent>wide</CardContent></Card>
        <Card><CardContent>wide</CardContent></Card>
      </Grid>

      {/* Fixed count, and one child holds an unbreakable string. `minmax(0,1fr)`
          is the only reason this row stays even. */}
      {/* The wrapper clips: in the HEALTHY case the nowrap span is wider than its
          285px cell and would otherwise scroll the page, which is a different
          failure from the one under test. */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <Grid cols={3} gap="$3" style={{ width: '100%' }} data-grid="fixed">
          <Card><CardContent>short</CardContent></Card>
          <Card>
            <CardContent>
              {/* nowrap, so its min-content really is the whole string. A long
                  BREAKABLE string proves nothing — the browser wraps it and the
                  track never feels it, which is why the first version of this
                  probe stayed green through the mutation. */}
              <span style={{ whiteSpace: 'nowrap' }}>
                MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
              </span>
            </CardContent>
          </Card>
          <Card><CardContent>short</CardContent></Card>
        </Grid>
      </div>

      {/* Four times the content of its neighbour: a Card GROWS, it does not clip. */}
      <div
        data-grid="growth"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}
      >
        <Card data-card="lean"><CardContent>one line</CardContent></Card>
        <Card data-card="fat">
          <CardContent>one line</CardContent>
          <CardContent>two line</CardContent>
          <CardContent>three line</CardContent>
          <CardContent>four line</CardContent>
        </Card>
      </div>

      <Card interactive data-card="interactive">
        <CardHeader><CardTitle>Interactive card</CardTitle></CardHeader>
      </Card>

      <PageSection maxWidth={600} data-section="demo">
        <CardTitle>Section</CardTitle>
      </PageSection>

      {/* The Button constraint. A Button PINS its height, correctly — it is a
          control. Given a block child it must not silently clip it to a sliver,
          which is the defect that shipped a 119px thumbnail rendered at 30px. */}
      {/* `$mono` must resolve to a real face. gui emits nothing at all for a
          font token it does not know, so this renders as proof the token exists
          rather than as decoration. */}
      <CardTitle fontFamily="$mono" data-type="mono">1234567890</CardTitle>

      <Button data-button="block-child">
        <span data-block-child style={{ display: 'block', height: 119, width: 119 }} />
      </Button>
    </Section>

    {/* Every dock side, because gui compiles each distinct style VALUE to its
        own class — a side never rendered is a rule never written. */}
    <Section name="workbench">
      {/* 880 is the width this demo needs — three docks around a centre — and it
          is a MAXIMUM, not a floor. Written as a flat `width` it stayed 880 in a
          390px viewport and dragged the whole document to 759px of horizontal
          scroll, which is the one thing a page may never do. A component with an
          intrinsic minimum width scrolls inside its OWN box; the body does not
          scroll for it. */}
      <div style={{ display: 'flex', height: 220, width: 880, maxWidth: '100%', overflowX: 'auto' }}>
        <Workbench
          left={{ tabs: [{ id: 'files', title: 'Files', content: <CardTitle>left</CardTitle> }] }}
          right={{
            tabs: [
              { id: 'chat', title: 'Side chat', content: <CardTitle>chat</CardTitle> },
              { id: 'browser', title: 'Browser', content: <CardTitle>browser</CardTitle> },
            ],
          }}
          bottom={{
            tabs: [
              { id: 'console', title: 'Console', closable: false, content: <CardTitle>console</CardTitle> },
            ],
          }}
        >
          <CardTitle>center</CardTitle>
        </Workbench>
      </div>
    </Section>


    {/* Box renders whatever `tw` read out of the classes, so the gallery has to
        carry a real utility string or none of those rules get written. */}
    <Section name="box">
      <Box className="flex items-center gap-4 px-6 py-3 rounded-lg border">
        <CardTitle>utility classes</CardTitle>
      </Box>
      <Box className="flex-col gap-2 max-w-3xl mx-auto overflow-hidden">
        <CardTitle>column</CardTitle>
      </Box>
    </Section>

  </div>
)

export default Gallery
