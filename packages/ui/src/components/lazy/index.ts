/**
 * Lazy-loaded components with optional dependencies
 * These components will only load if their dependencies are installed
 * 
 * Note: Using 'any' type to avoid complex type inference issues with lazy loading
 */

import { withOptionalDep } from '../with-deps'

// Calendar components (date-fns, react-day-picker)
export const Calendar = withOptionalDep<any>(
  'Calendar',
  ['react-day-picker', 'date-fns'],
  () => import('../calendar').then(m => ({ default: m.Calendar || m.default }))
)

// Command palette (cmdk)
export const Command = withOptionalDep<any>(
  'Command',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.Command || m.default }))
)

export const CommandDialog = withOptionalDep<any>(
  'CommandDialog',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandDialog }))
)

export const CommandInput = withOptionalDep<any>(
  'CommandInput',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandInput }))
)

export const CommandList = withOptionalDep<any>(
  'CommandList',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandList }))
)

export const CommandEmpty = withOptionalDep<any>(
  'CommandEmpty',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandEmpty }))
)

export const CommandGroup = withOptionalDep<any>(
  'CommandGroup',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandGroup }))
)

export const CommandItem = withOptionalDep<any>(
  'CommandItem',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandItem }))
)

export const CommandShortcut = withOptionalDep<any>(
  'CommandShortcut',
  ['cmdk'],
  () => import('../command').then(m => ({ default: m.CommandShortcut }))
)

// Carousel (embla-carousel-react)
export const Carousel = withOptionalDep<any>(
  'Carousel',
  ['embla-carousel-react'],
  () => import('../carousel').then(m => ({ default: m.Carousel }))
)

export const CarouselContent = withOptionalDep<any>(
  'CarouselContent',
  ['embla-carousel-react'],
  () => import('../carousel').then(m => ({ default: m.CarouselContent }))
)

export const CarouselItem = withOptionalDep<any>(
  'CarouselItem',
  ['embla-carousel-react'],
  () => import('../carousel').then(m => ({ default: m.CarouselItem }))
)

export const CarouselNext = withOptionalDep<any>(
  'CarouselNext',
  ['embla-carousel-react'],
  () => import('../carousel').then(m => ({ default: m.CarouselNext }))
)

export const CarouselPrevious = withOptionalDep<any>(
  'CarouselPrevious',
  ['embla-carousel-react'],
  () => import('../carousel').then(m => ({ default: m.CarouselPrevious }))
)

// Form components (react-hook-form, @hookform/resolvers, zod)
export const Form = withOptionalDep<any>(
  'Form',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.Form }))
)

export const FormField = withOptionalDep<any>(
  'FormField',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.FormField }))
)

export const FormItem = withOptionalDep<any>(
  'FormItem',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.FormItem }))
)

export const FormLabel = withOptionalDep<any>(
  'FormLabel',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.FormLabel }))
)

export const FormControl = withOptionalDep<any>(
  'FormControl',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.FormControl }))
)

export const FormDescription = withOptionalDep<any>(
  'FormDescription',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.FormDescription }))
)

export const FormMessage = withOptionalDep<any>(
  'FormMessage',
  ['react-hook-form'],
  () => import('../form').then(m => ({ default: m.FormMessage }))
)

// Toast notifications (sonner)
export const Toaster = withOptionalDep<any>(
  'Toaster',
  ['sonner'],
  () => import('../sonner').then(m => ({ default: m.Toaster }))
)

// Drawer (vaul)
export const Drawer = withOptionalDep<any>(
  'Drawer',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.Drawer }))
)

export const DrawerTrigger = withOptionalDep<any>(
  'DrawerTrigger',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.DrawerTrigger }))
)

export const DrawerContent = withOptionalDep<any>(
  'DrawerContent',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.DrawerContent }))
)

export const DrawerHeader = withOptionalDep<any>(
  'DrawerHeader',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.DrawerHeader }))
)

export const DrawerFooter = withOptionalDep<any>(
  'DrawerFooter',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.DrawerFooter }))
)

export const DrawerTitle = withOptionalDep<any>(
  'DrawerTitle',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.DrawerTitle }))
)

export const DrawerDescription = withOptionalDep<any>(
  'DrawerDescription',
  ['vaul'],
  () => import('../drawer').then(m => ({ default: m.DrawerDescription }))
)

// OTP Input (input-otp)
export const InputOTP = withOptionalDep<any>(
  'InputOTP',
  ['input-otp'],
  () => import('../input-otp').then(m => ({ default: m.InputOTP }))
)

export const InputOTPGroup = withOptionalDep<any>(
  'InputOTPGroup',
  ['input-otp'],
  () => import('../input-otp').then(m => ({ default: m.InputOTPGroup }))
)

export const InputOTPSlot = withOptionalDep<any>(
  'InputOTPSlot',
  ['input-otp'],
  () => import('../input-otp').then(m => ({ default: m.InputOTPSlot }))
)

export const InputOTPSeparator = withOptionalDep<any>(
  'InputOTPSeparator',
  ['input-otp'],
  () => import('../input-otp').then(m => ({ default: m.InputOTPSeparator }))
)

// Resizable panels (react-resizable-panels)
export const ResizablePanelGroup = withOptionalDep<any>(
  'ResizablePanelGroup',
  ['react-resizable-panels'],
  () => import('../resizable').then(m => ({ default: m.ResizablePanelGroup }))
)

export const ResizablePanel = withOptionalDep<any>(
  'ResizablePanel',
  ['react-resizable-panels'],
  () => import('../resizable').then(m => ({ default: m.ResizablePanel }))
)

export const ResizableHandle = withOptionalDep<any>(
  'ResizableHandle',
  ['react-resizable-panels'],
  () => import('../resizable').then(m => ({ default: m.ResizableHandle }))
)