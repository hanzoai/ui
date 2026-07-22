// @hanzo/ui — shadcn backend.
//
// The shadcn-compatible component surface: Radix primitives for behaviour
// (a11y, portalling, keyboard) styled entirely with STANDARD design tokens
// (`bg-popover`, `border-border`, `bg-primary`, `text-muted-foreground`, …) —
// no app-private token names, so every component renders solid against the
// Hanzo theme (`theme.css`) or any host that defines the standard shadcn
// variables. Fonts are inherited or bound to `font-sans`/`font-mono` (Geist via
// the theme); nothing here hard-codes a font family.
//
// This barrel is the canonical component API `@hanzo/ui` exposes at its root.
// The explicit named blocks below also serve as the manifest that
// `scripts/gen-primitives.mjs` reads to emit the per-member `./primitives/*`
// entrypoints (for hosts that modularize `@hanzo/ui` imports).

export { AspectRatio } from './aspect-ratio'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'
export { Badge, badgeVariants } from './badge'
export { Button, buttonVariants, type ButtonProps } from './button'
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
} from './dropdown-menu'
export { Input, type InputProps } from './input'
export { Label } from './label'
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './popover'
export { Progress } from './progress'
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
