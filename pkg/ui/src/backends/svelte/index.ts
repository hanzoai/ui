/**
 * @hanzo/ui — svelte backend barrel.
 *
 * The Hanzo shared primitive surface on the Svelte substrate. Same component
 * vocabulary as the shadcn + gui backends (so a feature's markup reads the same
 * across backends), drawn from the SAME design core — standard design tokens
 * (bg-popover, border-border, bg-primary, …) and Geist typography — never
 * app-private tokens, never a hard-coded font family.
 *
 * Behaviour-heavy families (Dialog, DropdownMenu, Select, Popover, Tooltip,
 * Tabs) are clean-room reimplementations rather than ports of Huly's
 * platform-coupled `packages/ui` primitives: those import @hanzoteam/platform,
 * @hanzoteam/analytics, and Huly's private theme/focus/tooltip subsystems, which
 * cannot be extracted without dragging the platform. Their disclosure/selection
 * state is shared root→parts through the keyed contexts in ./internal/context;
 * portalling, dismissal, focus-trap, and roving focus come from
 * ./internal/actions (the Svelte analogue of what Radix gives the shadcn
 * backend).
 */

// Badge
export { default as Badge, badgeVariants, type BadgeVariant } from './Badge.svelte'

// Button
export {
  default as Button,
  buttonVariants,
  type ButtonVariant,
  type ButtonSize,
} from './Button.svelte'

// Card
export { default as Card } from './Card.svelte'
export { default as CardAction } from './CardAction.svelte'
export { default as CardContent } from './CardContent.svelte'
export { default as CardDescription } from './CardDescription.svelte'
export { default as CardFooter } from './CardFooter.svelte'
export { default as CardHeader } from './CardHeader.svelte'
export { default as CardTitle } from './CardTitle.svelte'

// Checkbox
export { default as Checkbox } from './Checkbox.svelte'

// Dialog
export { default as Dialog } from './Dialog.svelte'
export { default as DialogClose } from './DialogClose.svelte'
export { default as DialogContent } from './DialogContent.svelte'
export { default as DialogDescription } from './DialogDescription.svelte'
export { default as DialogFooter } from './DialogFooter.svelte'
export { default as DialogHeader } from './DialogHeader.svelte'
export { default as DialogTitle } from './DialogTitle.svelte'
export { default as DialogTrigger } from './DialogTrigger.svelte'

// DropdownMenu
export { default as DropdownMenu } from './DropdownMenu.svelte'
export { default as DropdownMenuContent } from './DropdownMenuContent.svelte'
export { default as DropdownMenuGroup } from './DropdownMenuGroup.svelte'
export { default as DropdownMenuItem } from './DropdownMenuItem.svelte'
export { default as DropdownMenuLabel } from './DropdownMenuLabel.svelte'
export { default as DropdownMenuSeparator } from './DropdownMenuSeparator.svelte'
export { default as DropdownMenuTrigger } from './DropdownMenuTrigger.svelte'

// Input / Label / Separator / Textarea
export { default as Input } from './Input.svelte'
export { default as Label } from './Label.svelte'
export { default as Separator } from './Separator.svelte'
export { default as Textarea } from './Textarea.svelte'

// Popover
export { default as Popover } from './Popover.svelte'
export { default as PopoverAnchor } from './PopoverAnchor.svelte'
export { default as PopoverContent } from './PopoverContent.svelte'
export { default as PopoverTrigger } from './PopoverTrigger.svelte'

// Select
export { default as Select } from './Select.svelte'
export { default as SelectContent } from './SelectContent.svelte'
export { default as SelectGroup } from './SelectGroup.svelte'
export { default as SelectItem } from './SelectItem.svelte'
export { default as SelectLabel } from './SelectLabel.svelte'
export { default as SelectSeparator } from './SelectSeparator.svelte'
export { default as SelectTrigger } from './SelectTrigger.svelte'
export { default as SelectValue } from './SelectValue.svelte'

// Switch
export { default as Switch } from './Switch.svelte'

// Tabs
export { default as Tabs } from './Tabs.svelte'
export { default as TabsContent } from './TabsContent.svelte'
export { default as TabsList } from './TabsList.svelte'
export { default as TabsTrigger } from './TabsTrigger.svelte'

// Tooltip
export { default as Tooltip } from './Tooltip.svelte'
export { default as TooltipContent } from './TooltipContent.svelte'
export { default as TooltipProvider } from './TooltipProvider.svelte'
export { default as TooltipTrigger } from './TooltipTrigger.svelte'
