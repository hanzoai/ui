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
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
  type CarouselOptions,
  type CarouselProps,
} from './carousel'
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
  type SheetSide,
} from './sheet'
export { Skeleton } from './skeleton'
export { MediaStack, fit, type MediaStackProps } from './media-stack'
export { NavItems, type NavItemsProps } from './nav-items'
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'
export { StepIndicator, type StepIndicatorProps } from './step-indicator'
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  type InputOTPProps,
  type OTPSlot,
} from './input-otp'
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu'
export {
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerTrigger,
  type DrawerContentProps,
  type DrawerProps,
  type SnapPoint,
} from './drawer'
export { Card3D, Card3DContent, Card3DDescription, Card3DFooter, Card3DHeader, Card3DTitle, type Card3DContentProps, type Card3DDescriptionProps, type Card3DFooterProps, type Card3DHeaderProps, type Card3DProps, type Card3DTitleProps } from './3d-card'
export { AdvancedChart, type AdvancedChartInterval, type AdvancedChartProps, type AdvancedChartTheme } from './advanced-chart'
export { Android, type AndroidProps, type AndroidSize } from './android'
export { Pin3D, type Pin3DProps } from './3d-pin'
export { Alert, AlertDescription, AlertTitle, type AlertDescriptionProps, type AlertProps, type AlertTitleProps, type AlertVariant } from './alert'
export { Marquee3D, Marquee3DFloating, Marquee3DPreset, type Marquee3DDirection, type Marquee3DFloatingProps, type Marquee3DPerspective, type Marquee3DProps, type Marquee3DSize, type Marquee3DVariant } from './3d-marquee'
export { Announcement, type AnnouncementProps } from './announcement'
export { AnimatedTooltip, type AnimatedTooltipProps } from './animated-tooltip'
export { AnimatedBeam, type AnimatedBeamProps } from './animated-beam'
export { AnimatedTestimonials, type AnimatedTestimonialsProps, type Testimonial } from './animated-testimonials'
export { AnimatedCursor, type AnimatedCursorBlendMode, type AnimatedCursorProps, type AnimatedCursorShape, type CursorPosition as AnimatedCursorPosition, type CursorState } from './animated-cursor'
export { AppleCardsCarousel, gradientPresets, type AppleCardsCarouselProps, type CarouselCard } from './apple-cards-carousel'
export { AppleHelloEffect, type AppleHelloEffectProps } from './apple-hello-effect'
export { Banner, type BannerProps, type BannerVariant } from './banner'
export { Choicebox, type ChoiceboxOption, type ChoiceboxProps } from './choicebox'
export { Calendar, type CalendarMultipleProps, type CalendarProps, type CalendarRange, type CalendarRangeProps, type CalendarSingleProps } from './calendar'
export { CodeEditor, type CodeEditorProps, type CodeEditorTheme, type CodeEditorWordWrap } from './code-editor'
export { CodeBlock, type CodeBlockDiff, type CodeBlockProps, type CodeBlockSize, type CodeBlockTheme } from './code-block'
export { CompanyProfile, type CompanyProfileProps, type CompanyProfileTheme } from './company-profile'
export { CreditCard, type CreditCardProps, type CreditCardVariant } from './credit-card'
export { Comparison, type ComparisonColumn, type ComparisonItem, type ComparisonProps } from './comparison'
export { CodeTabs, type CodeTabsProps, type CodeTabsTab } from './code-tabs'
export { Combobox, ComboboxWithIcons, type ComboboxIconOption, type ComboboxOption, type ComboboxProps, type ComboboxWithIconsProps } from './combobox'
export { ColorPicker, type ColorPickerProps } from './color-picker'
export { CryptoScreener, type CryptoScreenerColumn, type CryptoScreenerMarket, type CryptoScreenerProps, type CryptoScreenerTheme } from './crypto-screener'
export { Cursor, type CursorPosition, type CursorProps } from './cursor'
export { MarketOverview, type MarketOverviewPreset, type MarketOverviewProps, type MarketOverviewSymbol, type MarketOverviewTab, type MarketOverviewTheme } from './crypto-market'
export { Desktop, useDesktopSettings, useKeyboardShortcuts, useOverlayManager, useWindowManager, type ColorScheme, type DesktopProps, type DesktopSettings, type DesktopSettingsActions, type DockPosition as DesktopDockPosition, type KeyboardShortcut, type OverlayManager, type OverlayState, type WindowId, type WindowManager, type WindowState } from './desktop'
export { DataTable, DataTableColumnHeader, type DataTableColumnApi, type DataTableColumnDef, type DataTableColumnHeaderProps, type DataTableInstance, type DataTableProps, type DataTableRow, type DataTableSortDirection } from './data-table'
export { DatePicker, type DatePickerPreset, type DatePickerProps, type DatePickerRangeProps, type DatePickerSingleProps } from './date-picker'
export { DialogStack, type DialogStackItem, type DialogStackProps } from './dialog-stack'
export { DesktopWindow, DesktopWindowControls, type DesktopWindowControlsProps, type DesktopWindowProps, type DesktopWindowType } from './desktop-window'
export { Dropzone, type DropzoneAccept, type DropzoneProps } from './dropzone'
export { Editor, type EditorCommand, type EditorProps } from './editor'
export { Dock, DockItem, DockSeparator, type DockItemProps, type DockPosition, type DockProps, type DockSeparatorProps } from './dock'
export { Spotlight, type SpotlightItem, type SpotlightProps } from './desktop-spotlight'
export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, type EmptyContentProps, type EmptyDescriptionProps, type EmptyHeaderProps, type EmptyMediaProps, type EmptyMediaVariant, type EmptyProps, type EmptyTitleProps } from './empty'
export { ForexScreener, type ForexScreenerColumn, type ForexScreenerMarket, type ForexScreenerProps, type ForexScreenerScreen, type ForexScreenerTheme } from './forex-screener'
export { ForexMarket, type ForexMarketPreset, type ForexMarketProps, type ForexMarketSymbol, type ForexMarketTab, type ForexMarketTheme } from './forex-market'
export { Gantt, type GanttProps, type GanttTask } from './gantt'
export { Financials, type FinancialsDisplayMode, type FinancialsProps, type FinancialsTheme } from './financials'
