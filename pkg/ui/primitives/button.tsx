import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '../src/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 border border-transparent text-sm font-semibold transition-colors focus-visible:ring-1 focus-visible:ring-gray-50 focus-visible:outline-hidden focus-visible:ring-inset',
  {
    variants: {
      variant: {
        default:
          'bg-brand hover:bg-brand-500 text-black disabled:bg-gray-800 disabled:text-gray-400 disabled:opacity-60',
        destructive:
          'disabled:text-text-secondary bg-red-500 text-white hover:bg-red-500/90 disabled:bg-gray-600',
        outline:
          'border border-gray-600 bg-transparent text-white hover:border-gray-400 hover:bg-gray-900 hover:text-white',
        tertiary:
          'bg-transparent text-gray-300 hover:bg-gray-900 hover:text-white',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[50px] px-8 text-sm',
        xs: 'h-[34px] gap-1.5 px-3 text-xs',
        sm: 'h-[36px] gap-1.5 px-3 text-xs',
        md: 'h-[40px] gap-1.5 px-3 text-xs',
        lg: 'h-[48px] gap-2 px-2 text-sm',
        icon: 'h-9 w-9',
        auto: 'h-auto p-4',
      },
      rounded: {
        full: 'rounded-full',
        lg: 'rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'full',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  ref?: React.RefObject<HTMLButtonElement>;
}

const Button = ({
  className,
  variant,
  size,
  rounded,
  asChild = false,
  isLoading = false,
  ref,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <Loader2
          className={cn('h-4 w-4 animate-spin', size !== 'icon' && 'mr-2')}
        />
      ) : null}
      {isLoading && size === 'icon' ? null : props.children}
    </Comp>
  );
};

Button.displayName = 'Button';

export { Button, buttonVariants };
