// @hanzo/ui — the one Hanzo component library, on @hanzo/gui + @hanzo/design.
//
// ONE substrate: every component renders through @hanzo/gui primitives, so the
// same import works on web, native (expo) and desktop (Tauri). The ROOT barrel is
// the canonical component API apps import; the product layer and the design
// tokens are their own subpaths, so importing a Button never drags in a chart.
//
//   import { Button, Card, Dialog, DropdownMenu, Input, Toaster } from '@hanzo/ui'  // component API
//   import { PageHeader, Sparkline, EmptyState } from '@hanzo/ui/product'           // product/app layer
//   import { RecordsView, registerField } from '@hanzo/ui/data'                     // metadata record layer
//   import { ModelSelector } from '@hanzo/ui/models'                                // unified model picker
//   import { cn, themes, colors } from '@hanzo/ui/core'                             // design core + tokens
//   import '@hanzo/ui/theme.css'                                                    // the self-contained identity
//
// Styling is theme tokens, never utility classes: `$background`, `$color12`,
// `$borderColor` resolve through the gui token config on every host. Touch
// targets meet the 44px floor via `hitSlop`, never via padding.
// Named, not `export *`.
//
// This module is a client boundary ('use client' above), and Next 16 refuses
// `export *` across one: "It's currently unsupported to use `export *` in a client
// boundary." Every app importing the root barrel failed to build on that one line.
//
// Naming them also restores tree-shaking, which `export *` defeats — a bundler
// cannot prove which members are unused through a star, so importing Button pulled
// the whole surface in.
//
// ./backends/gui declares these as explicit named blocks and this list mirrors it.
//
// It is maintained BY HAND — `scripts/gen-primitives.mjs` writes `src/primitives/`,
// not this file, so nothing regenerates it and nothing used to notice when the two
// drifted. Glass, Grid, Section and CardMedia were all exported by the backend and
// absent here, which means a consumer could not import them AT ALL: the component
// existed, the docs named it, and `import { Grid } from '@hanzo/ui'` was undefined.
// `src/__tests__/barrel.test.ts` now fails when the two disagree.
export {
  AspectRatio, Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardAction,
  CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle, Checkbox,
  Collapsible,
  CollapsibleContent, CollapsibleTrigger, Command, CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, Dialog,
  DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay,
  DialogPortal, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger, Em, Glass, Fill, Grid, H1, H2, H3, H4, H5, H6, Heading, Image, Input,
  Label, Popover, PopoverAnchor, PopoverClose,
  PopoverContent,
  PopoverTrigger, Progress, ResizableHandle, ResizablePanel, ResizablePanelGroup, ScrollArea,
  ScrollBar, Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue,
  Paragraph, Screen, ScrollView, Section, Separator, SizableText, Slider, Spacer, Span, Spinner, Strong,
  Switch, Tabs, TabsContent,
  TabsList, TabsTrigger, Textarea,
  Toaster,
  Text, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, View, XStack, YStack,
  ZStack, badgeVariants, buttonVariants,
  toast,
  Accordion, AccordionContent, AccordionItem, AccordionTrigger, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, HoverCard, HoverCardContent, HoverCardTrigger, RadioGroup, RadioGroupItem, ToggleGroup, ToggleGroupItem, } from './backends/gui'

export type {
  AspectRatioProps, BadgeProps, BadgeVariant, ButtonProps, ButtonSize, ButtonVariant,
  CommandFilter, CommandProps, DropdownMenuProps, InputProps, ResizableHandleProps, SpinnerProps,
  ResizablePanelGroupProps, ResizablePanelProps,
  AccordionContentProps, AccordionItemProps, AccordionProps, AccordionTriggerProps, AlertDialogContentProps, AlertDialogOverlayProps, AlertDialogProps, AlertDialogSectionProps, ContextMenuContentProps, ContextMenuItemProps, ContextMenuSubContentProps, HoverCardContentProps, HoverCardProps, HoverCardTriggerProps, RadioGroupItemProps, RadioGroupProps, ToggleGroupItemProps, ToggleGroupProps,
  ToggleGroupSize, ToggleGroupVariant,
} from './backends/gui'

// LAYOUT — the stacks and the type scale reach consumers through the component
// barrel above, which already names XStack/YStack/ZStack, the type scale
// (SizableText, Paragraph, Heading, H1-H6, Span, Strong, Em) and Image, Spacer,
// ScrollView, View and Text. This block adds only what that one lacks.
//
// It used to repeat all twenty, and TypeScript rejects a name exported twice from
// one module: `error TS2300: Duplicate identifier 'Em'` and nineteen more, so
// `tsc -p tsconfig.build.json` failed and @hanzo/ui could not build AT ALL. That
// took the whole cicd lane down with it — the test gate runs
// `pnpm --filter @hanzo/ui... build` first, so no test ever ran and ui.hanzo.ai
// could not ship.
//
// The concern the duplication came from is real and still holds: a name must be
// on the ROOT barrel to reach a consumer — 8.0.65 added these to the backend only
// and the dist still had no XStack, a green release that changed nothing. The fix
// for that is to name it once here, not twice.
export {
  Anchor,
  type GuiElement,
} from './backends/gui'

// `Hanzo` — the root, and the only thing an app mounts. It carries the gui
// config and the generated stylesheet, so `npm i @hanzo/ui` is the whole setup:
// no gui.config.ts, no CSS import, no generator script.
export { Hanzo, type HanzoProps } from './root'

// `cn` — the class-name composer, surfaced for convenience.
export { cn } from './core/cn'

// The design-token scale (colors, dark/light themes, radii, spacing, typography)
// lives on the `@hanzo/ui/core` / `@hanzo/ui/tokens` subpath — pure data, no
// runtime.

export { tw, type Parsed, type Props as TwProps } from './tw'
export { Box, type BoxProps } from './box'
