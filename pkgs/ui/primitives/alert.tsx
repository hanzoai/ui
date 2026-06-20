import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../src/utils';

const alertVariants = cva(
  'group/alert relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7 [&>svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground [&>svg]:text-foreground',
        destructive:
          'border-destructive/50 text-destructive bg-destructive/10 dark:border-destructive [&>svg]:text-destructive',
        // Hanzo-specific variants for backward compatibility
        info: 'text-muted-foreground bg-muted border-border [&>svg]:text-muted-foreground',
        warning:
          'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
        success:
          'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
        download:
          'border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 [&>svg]:text-cyan-600 dark:[&>svg]:text-cyan-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Alert({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'mb-1 leading-none font-medium tracking-tight [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm [&_p]:leading-relaxed [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
        className
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('mt-3 flex items-center gap-2', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants };
