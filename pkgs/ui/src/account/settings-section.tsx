'use client'
/**
 * SettingsSection — titled scaffold so every settings page composes the same.
 *
 * Title + optional description + children, in a neutral card. The `danger`
 * variant recolors the frame and heading to destructive for irreversible
 * actions (delete org, transfer ownership) — the one sanctioned use of hue.
 */
import * as React from 'react'

import { cn } from '../utils'

export interface SettingsSectionProps {
  title: string
  description?: React.ReactNode
  /** Optional actions aligned to the header's right edge. */
  action?: React.ReactNode
  /** Destructive framing for irreversible operations. */
  danger?: boolean
  children?: React.ReactNode
  className?: string
  /** Class applied to the body wrapper (below the header). */
  contentClassName?: string
}

export const SettingsSection = React.forwardRef<
  HTMLElement,
  SettingsSectionProps
>(
  (
    { title, description, action, danger = false, children, className, contentClassName },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        danger && 'border-destructive/40',
        className,
      )}
    >
      <header
        className={cn(
          'flex items-start justify-between gap-4 px-5 py-4',
          children && 'border-b',
        )}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            className={cn(
              'text-sm font-semibold tracking-tight',
              danger && 'text-destructive',
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children && (
        <div className={cn('px-5 py-4', contentClassName)}>{children}</div>
      )}
    </section>
  ),
)
SettingsSection.displayName = 'SettingsSection'
