'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../util'

const toggleVariants = cva(
  'inline-flex items-center justify-center text-sm font-medium ' + 
  'ring-offset-background ' + 
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' + 
  'focus-visible:ring-offset-2 disabled:pointer-events-none ' +
  'active:bg-level-3 active:text-accent ',
  {
    variants: {
      variant: {
        default: 'text-muted-1 hover:text-accent ' + 
          'data-[state=off]:bg-level-1 hover:data-[state=off]:text-foreground ' + 
          'data-[state=on]:text-foreground data-[state=on]:bg-level-3  ' + 
          'data-[state=on]:hover:bg-level-3 ',

        outline: 'border border-muted-3 text-muted-1 ' +
          'data-[state=off]:bg-level-1 hover:data-[state=off]:text-foreground ' + 
          'data-[state=on]:bg-level-3 data-[state=on]:border-muted data-[state=on]:text-foreground',
      },
      size: {
        default: 'h-10 px-3',
        hfull: 'h-full px-3',
        sm: 'h-9 px-2',
        lg: 'h-11 px-5',
      },
      rounded: {
        full: 'rounded-full',
        sm: 'rounded-sm',
        lsm: 'rounded-l-sm',
        rsm: 'rounded-r-sm',
        md: 'rounded-md',
        lmd: 'rounded-l-md',
        rmd: 'rounded-r-md',
        lg: 'rounded-lg',
        llg: 'rounded-l-lg',
        rlg: 'rounded-r-lg',
        xl: 'rounded-xl',
        lxl: 'rounded-l-xl',
        rxl: 'rounded-r-xl',
        none: 'rounded-none'
      }
      
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'md'
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, rounded, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, rounded} ), className  )}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
