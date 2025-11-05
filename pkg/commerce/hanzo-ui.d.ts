// Temporary type declarations for @hanzo/ui imports
// Until proper .d.ts files are generated

declare module '@hanzo/ui/types' {
  export type Dimensions = any
  export type MediaStackDef = any
  export type ImageDef = any
  export type VideoDef = any
  export type AnimationDef = any
  export type MediaTransform = any
  export type LinkDef = any
}

declare module '@hanzo/ui/primitives' {
  export type CarouselApi = any
  export type CarouselOptions = any
  export const Carousel: any
  export const CarouselContent: any
  export const CarouselItem: any
  export const CarouselNext: any
  export const CarouselPrevious: any
  export const Button: any
  export const buttonVariants: any
  export const Input: any
  export const Label: any
  export const Separator: any
  export const toast: any
  export const Toaster: any
  export const Image: any
  export const Select: any
  export const SelectContent: any
  export const SelectGroup: any
  export const SelectItem: any
  export const SelectTrigger: any
  export const SelectValue: any
  export const Form: any
  export const FormControl: any
  export const FormField: any
  export const FormItem: any
  export const FormMessage: any
  export const RadioGroup: any
  export const ScrollArea: any
  export const ApplyTypography: any
  export const MediaStack: any
  export const Slider: any
  export const Skeleton: any
  export const Card: any
  export const CardContent: any
  export const CardFooter: any
  export const CardHeader: any
  export const CardTitle: any
  export const ToggleGroup: any
  export const ToggleGroupItem: any
  export const Tabs: any
  export const TabsContent: any
  export const TabsList: any
  export const TabsTrigger: any
}

declare module '@hanzo/ui/util' {
  export function cn(...inputs: any[]): string
  export type VariantProps<T> = any
}

// Workaround for lucide-react with React 19 type mismatches
declare module 'lucide-react' {
  import type { SVGProps } from 'react'
  export type LucideProps = SVGProps<SVGSVGElement>
  export const ChevronLeft: any
  export const ChevronRight: any
  export const Minus: any
  export const Plus: any
  export const X: any
  export const Check: any
  export const CreditCard: any
  export const ShoppingCart: any
  export const Menu: any
  export const Loader2: any
  export const ChevronDown: any
  export const ChevronsLeft: any
  export const ChevronsRight: any
  export const Image: any
  export const Trash2: any
  export const Search: any
  export const Barcode: any
  export const LockKeyhole: any
  export const Copy: any
}

// Workaround for react-square-web-payments-sdk with React 19
declare module 'react-square-web-payments-sdk' {
  export const ApplePay: any
  export const GooglePay: any
  export const CreditCard: any
  export const PaymentForm: any
}

// Workaround for next/image with React 19
declare module 'next/image' {
  const Image: any
  export default Image
}
