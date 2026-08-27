// @hanzo/ui — gui backend. THE canonical component surface.
//
// One cross-platform (web + native/expo + desktop/Tauri) component layer built on
// @hanzo/gui primitives (YStack/XStack/Text/styled + the gui token config).
// Presentational and host-agnostic — data and effects arrive as props.
//
// COMPONENT API ONLY. The product/app layer (charts, metrics, page headers,
// status tags, empty states, combobox, slide-over, drag-reorder, provider marks,
// theme toggle) is its own subpath, `@hanzo/ui/product`, so importing a button
// never drags a chart in.
//
// The explicit named blocks below are ALSO the manifest that
// `scripts/gen-primitives.mjs` reads to emit the per-member `./primitives/*`
// entrypoints, so root, `./primitives` and `./primitives/*` are three entry
// points onto the same surface. Re-run after changing the surface:
//   node scripts/gen-primitives.mjs

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
} from './accordion'
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogProps,
  type AlertDialogOverlayProps,
  type AlertDialogContentProps,
  type AlertDialogSectionProps,
} from './alert-dialog'
export { AspectRatio, type AspectRatioProps } from './aspect-ratio'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'
export { Badge, badgeVariants, type BadgeProps, type BadgeVariant } from './badge'
export { Button, buttonVariants, type ButtonProps, type ButtonSize, type ButtonVariant } from './button'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardMedia,
  type CardMediaProps,
} from './card'
export { Checkbox } from './checkbox'
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible'
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  type CommandFilter,
  type CommandProps,
} from './command'
// The compound, shadcn-shaped ContextMenu. `@hanzo/ui/product` still exports a
// DIFFERENT, declarative `ContextMenu` (`trigger` + `items`) — the two names now
// collide across subpaths exactly as DropdownMenu's did before it collapsed onto
// one component here. Same collapse is owed to this one; it needs
// dropdown-menu.tsx's private `renderSpec` hoisted onto a shared module first.
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
  type ContextMenuContentProps,
  type ContextMenuSubContentProps,
  type ContextMenuItemProps,
} from './context-menu'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog'
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  type DropdownMenuProps,
} from './dropdown-menu'
export { Glass, type GlassProps } from './glass'
// Grid is not part of this surface. It renders a `div` with `display: grid`,
// neither of which exists on React Native, so it ships at `@hanzo/ui/grid`.

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  type HoverCardProps,
  type HoverCardTriggerProps,
  type HoverCardContentProps,
} from './hover-card'
export { Input, type InputProps } from './input'
export { Label } from './label'
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose } from './popover'
export { Progress } from './progress'
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
  type RadioGroupItemProps,
} from './radio-group'
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ResizablePanelGroupProps,
  type ResizablePanelProps,
  type ResizableHandleProps,
} from './resizable'
// The layout primitives. Without these an app cannot obey "import from
// @hanzo/ui" — it has to reach past this package to @hanzo/gui, which is how
// 216 files in hanzo.app ended up doing exactly that. See ./layout.
export {
  XStack, YStack, ZStack,
  SizableText, Paragraph, Heading, H1, H2, H3, H4, H5, H6, Span, Strong, Em,
  Anchor, Image, Separator, Spacer, ScrollView, View, Text,
  type GuiElement,
} from './layout'
export { ScrollArea, ScrollBar } from './scroll-area'
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select'
export { Band, type BandProps } from './band'
export { Screen, Fill, type ScreenProps, type FillProps } from './screen'
export { Slider } from './slider'
export { Spinner, type SpinnerProps } from './spinner'
export { Switch } from './switch'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export { Textarea } from './textarea'
export { Toaster, toast } from './toaster'
export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
  type ToggleGroupItemProps,
  type ToggleGroupVariant,
  type ToggleGroupSize,
} from './toggle-group'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from './form'
export {
  ApplyTypography,
  type ApplyTypographyProps,
  type ProseTag,
  type TypographySize,
} from './prose'
export {
  Link,
  useLink,
  MDXLink,
  LinkElement,
  type LinkComponent,
  type LinkElementProps,
} from './link'
export {
  VideoPlayer,
  YouTubeEmbed,
  type VideoPlayerProps,
  type YouTubeEmbedProps,
} from './video'
