import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../util"

const variant = {
  primary: "bg-primary text-primary-fg md:hover:bg-primary-hover font-nav whitespace-nowrap not-typography",
  secondary: "bg-secondary text-secondary-fg md:hover:bg-secondary-hover font-nav whitespace-nowrap not-typography",
  outline: "text-foreground bg-background border border-muted-4 md:hover:bg-level-1 md:hover:text-accent md:hover:border-accent font-nav whitespace-nowrap not-typography",
  destructive: "bg-destructive text-destructive-fg font-sans whitespace-nowrap md:hover:bg-destructive-hover",
  ghost: "text-foreground md:hover:bg-level-1 md:hover:text-accent whitespace-nowrap font-sans ",
  link: "text-foreground md:hover:text-muted-1 font-sans ",
  linkFG: "text-foreground md:hover:text-muted-1 font-sans ", // marker to style nav as regular link
}

const size = {
  link: '',
  xs: "h-8 px-2 text-xs",
  sm: "h-9 px-3 text-xs",
  square: 'h-10 py-2 px-2 text-sm aspect-square',
  default: "h-10 py-2 px-4 text-sm md:text-base font-semibold min-w-0",
  lg: "h-10 px-8 text-sm md:text-base font-semibold min-w-0 md:min-w-[260px] lg:min-w-[300px]",
  icon: "h-10 w-10",
}

const rounded = {
  full: 'rounded-full',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  none: ''
}


const buttonVariants = cva(
  "flex items-center justify-center font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant,
      size,
      rounded
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      rounded: 'md'
    },
  }
)

interface ButtonProps extends
  React.ButtonHTMLAttributes<HTMLButtonElement>, 
  VariantProps<typeof buttonVariants> 
{
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded }), className )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { 
  Button as default, 
  type ButtonProps,
  buttonVariants,
}
