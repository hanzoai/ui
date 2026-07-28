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
// entrypoints, so root, `./primitives` and `./primitives/*` are three doors into
// one room. Re-run after changing the surface:
//   node scripts/gen-primitives.mjs

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
export { Input, type InputProps } from './input'
export { Label } from './label'
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose } from './popover'
export { Progress } from './progress'
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ResizablePanelGroupProps,
  type ResizablePanelProps,
  type ResizableHandleProps,
} from './resizable'
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
export { Separator } from './separator'
export { Slider } from './slider'
export { Switch } from './switch'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export { Textarea } from './textarea'
export { Toaster, toast } from './toaster'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
