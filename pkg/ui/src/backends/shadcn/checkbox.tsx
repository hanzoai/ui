'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import * as React from 'react'

import { cn } from './utils'

/**
 * Checkbox — standard-token control. Checked state uses `bg-primary` /
 * `text-primary-foreground` (was the app-private `bg-brand`), border uses
 * `border-input` (was `border-gray-400`), so it reads correctly in any host.
 */
const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox"
    className={cn(
      'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-invalid:border-destructive',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className={cn('flex items-center justify-center text-current')}
    >
      <CheckIcon className="size-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
