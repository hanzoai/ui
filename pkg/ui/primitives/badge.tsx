import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../src/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&>svg]:pointer-events-none overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 border-transparent shadow-sm focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        ghost:
          'hover:bg-accent hover:text-accent-foreground border-transparent',
        link: 'text-primary underline-offset-4 hover:underline border-transparent',
        // Hanzo-specific variants for backward compatibility
        inputAdornment: 'bg-gray-600 px-2 font-medium text-white border-transparent',
        tags: 'text-muted-foreground border-border bg-muted rounded-lg px-2 py-1 font-normal capitalize',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export default Badge;
