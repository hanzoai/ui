// Standard primitives exports - excludes heavy dependencies
// FileUploader (react-dropzone, filesize) and MarkdownText (react-syntax-highlighter)
// are available via direct imports if needed

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
  AlertDescription,
  AlertAction,
  alertVariants,
} from './alert'

export {
  Avatar,
  AvatarImage,
  AvatarFallback
} from './avatar'

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
  CardAction,
  CardDescription,
  CardContent,
} from './card'

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
} from './button-group'

export {
  type CarouselApi,
  type CarouselOptions,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel'

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
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerHandle,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './drawer'

export {
  Dialog,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from './empty'

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
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from './field'

// Form components available via '@hanzo/ui/form' - NOT bundled here due to
// react-hook-form ESM/CJS interop issues with Next.js 15 when bundled

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from './hover-card'

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './input-otp'

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from './input-group'

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
} from './item'

export {
  Kbd,
  KbdGroup,
} from './kbd'

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
} from './menubar'

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from './navigation-menu'

export {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from './popover'

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './resizable'

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

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table'

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
} from './tabs'

export * from './tooltip'

export { default as ActionButton } from './action-button'
export { default as ApplyTypography, type TypographySize} from './apply-typography'
export { default as AspectRatio } from './aspect-ratio'
export { default as Badge } from './badge'
export { default as BreakpointIndicator } from './breakpoint-indicator'
export { default as Calendar } from './calendar'
export { default as Checkbox } from './checkbox'
export { default as Combobox, type ComboboxTriggerProps } from './combobox'
export { default as DialogVideoController } from './dialog-video-controller'
export { default as Input } from './input'
export { default as Label } from './label'
export type { default as ListAdaptor } from './list-adaptor'
export { default as ListBox } from './list-box'
export { default as LoadingSpinner } from './loading-spinner'
export { NativeSelect, NativeSelectOption, NativeSelectOptGroup } from './native-select'
export { default as Progress } from './progress'
export { RadioGroup, RadioGroupItem } from './radio-group'
export { ScrollArea, ScrollBar } from './scroll-area'
export { SearchInput } from './search-input'
export { default as Separator } from './separator'
export { default as Slider } from './slider'
export { default as Skeleton } from './skeleton'
export { Spinner } from './spinner'
export { default as StepIndicator } from './step-indicator'
export { default as Switch } from './switch'
export { Textarea } from './textarea'
// TextField available via @hanzo/ui/form - requires react-hook-form
export { Toaster, toast } from './sonner'
export { Toggle, toggleVariants } from './toggle'
export { ToggleGroup, ToggleGroupItem } from './toggle-group'
export { default as VideoPlayer } from './video-player'

// Chat components
export { ChatInput } from './chat/chat-input'
export { ChatInputArea } from './chat/chat-input-area'

// Additional components (excluding heavy dependencies)
export { CopyToClipboardIcon } from './copy-to-clipboard-icon'
export { DotsLoader } from './dots-loader'
export { default as JsonForm } from './chat/json-form'
export { PrettyJsonPrint } from './pretty-json-print'

// Re-export Tooltip components individually
export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  TooltipPortal,
} from './tooltip'

// Export icons
export * as Icons from './icons'

// Next.js specific components
export { default as Image } from './next/image'
export { default as InlineIcon } from './next/inline-icon'
export { default as LinkElement } from './next/link-element'
export { default as MDXLink } from './next/mdx-link'
export { default as MediaStack } from './next/media-stack'
export { default as NavItems } from './next/nav-items'
export { default as YouTubeEmbed } from './next/youtube-embed'
export { YouTubePipPlayer, youtubePipPlayerVariants } from './youtube-pip-player'

// Re-export assets for compatibility
export * from '../assets'

// NOTE: Docs components are NOT re-exported here to avoid path alias resolution issues
// during build. Import directly from @hanzo/ui/docs/* if needed:
//   - DocsLayout: @hanzo/ui/docs/layouts/docs
//   - HomeLayout: @hanzo/ui/docs/layouts/home
//   - NotebookLayout: @hanzo/ui/docs/layouts/notebook
//   - DocsPage, DocsBody, DocsTitle, DocsDescription: @hanzo/ui/docs/page
//   - defaultMdxComponents: @hanzo/ui/docs/mdx
//   - RootProvider: @hanzo/ui/docs/provider/next
//   - loader: @hanzo/ui/docs/source
