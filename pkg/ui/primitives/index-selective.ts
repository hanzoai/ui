/**
 * Selective exports for @hanzo/ui
 * This file provides exports that don't eagerly load optional dependencies
 */

// Core components - always available, no heavy deps
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from './accordion'

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog'

export {
  Alert,
  AlertTitle,
  AlertDescription
} from './alert'

export {
  Avatar,
  AvatarImage,
  AvatarFallback
} from './avatar'

export {
  Badge
} from './badge'

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb'

export {
  default as Button,
  type ButtonProps,
  buttonVariants,
} from './button'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from './card'

export {
  Checkbox
} from './checkbox'

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './collapsible'

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
} from './context-menu'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from './hover-card'

export { Input, type InputProps } from './input'
export { Label } from './label'

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './navigation-menu'

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './popover'

export { Progress } from './progress'

export {
  RadioGroup,
  RadioGroupItem,
} from './radio-group'

export {
  ScrollArea,
  ScrollBar,
} from './scroll-area'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './select'

export { Separator } from './separator'

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './sheet'

export { Skeleton } from './skeleton'
export { Slider } from './slider'
export { Switch } from './switch'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './table'

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './tabs'

export { Textarea } from './textarea'
export { Toggle } from './toggle'

export {
  ToggleGroup,
  ToggleGroupItem,
} from './toggle-group'

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './tooltip'

// Utilities - always available
export { cn } from '../src/utils'

// Types that don't require dependencies
export type { ButtonProps } from './button'
export type { InputProps } from './input'

/**
 * Components with optional dependencies
 * These are NOT exported here to avoid loading their dependencies
 * Users should import them specifically when needed:
 * 
 * import { Calendar } from '@hanzo/ui/calendar'
 * import { Command } from '@hanzo/ui/command'
 * import { Carousel } from '@hanzo/ui/carousel'
 * import { Form } from '@hanzo/ui/form'
 * etc.
 */