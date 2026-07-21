'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner'

import { cn } from './utils'

/**
 * Toaster — Sonner surface bound to STANDARD tokens. The prior version used
 * app-private classes (`bg-level-2`, `text-primary-fg`, `border-muted-3`); here
 * the toast surface maps to `--popover`, borders to `--border`, and buttons to
 * the primary/muted tokens via Sonner's CSS-variable API, so it matches the host
 * theme (light/dark) with no undefined tokens.
 */
const Toaster = ({ className, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className={cn('toaster group', className)}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
