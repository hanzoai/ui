'use client'

import * as React from 'react'
import { cn } from '../../utils'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface DashHeaderProps {
  /** Breadcrumb trail */
  breadcrumbs?: BreadcrumbItem[]
  /** Search input placeholder */
  searchPlaceholder?: string
  /** Called when search query changes */
  onSearch?: (query: string) => void
  /** User avatar URL */
  avatarUrl?: string
  /** User display name */
  userName?: string
  /** Dropdown menu rendered on avatar click */
  userDropdown?: React.ReactNode
  /** Toggle dark/light theme */
  onToggleTheme?: () => void
  /** Current theme */
  theme?: 'dark' | 'light'
  /** Extra actions (buttons, etc.) rendered right of search */
  actions?: React.ReactNode
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DashHeader({
  breadcrumbs,
  searchPlaceholder = 'Search...',
  onSearch,
  avatarUrl,
  userName,
  userDropdown,
  onToggleTheme,
  theme = 'dark',
  actions,
  className,
}: DashHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  return (
    <div
      className={cn(
        'flex h-[var(--dash-header-height)] items-center gap-4 px-4',
        'bg-[var(--dash-surface)] text-[var(--dash-text)]',
        className,
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className="text-[var(--dash-text-dim)]">/</span>
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[var(--dash-text)]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      {onSearch && (
        <div className="relative hidden sm:block">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--dash-text-dim)]"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className={cn(
              'h-8 w-56 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] pl-8 pr-3 text-sm text-[var(--dash-text)]',
              'placeholder:text-[var(--dash-text-dim)]',
              'focus:border-[var(--dash-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-primary)]',
              'transition-colors',
            )}
          />
        </div>
      )}

      {/* Extra actions */}
      {actions}

      {/* Theme toggle */}
      {onToggleTheme && (
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-[var(--dash-radius-sm)] p-1.5 text-[var(--dash-text-dim)] hover:bg-[var(--dash-surface-hover)] hover:text-[var(--dash-text)] transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 9.5A6.5 6.5 0 016.5 2 5.5 5.5 0 1014 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {/* User avatar */}
      {(avatarUrl || userName) && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-[var(--dash-radius-sm)] p-1 hover:bg-[var(--dash-surface-hover)] transition-colors"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName ?? 'User'}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--dash-primary)] text-xs font-medium text-[var(--dash-primary-text)]">
                {(userName ?? '?')[0].toUpperCase()}
              </div>
            )}
          </button>

          {dropdownOpen && userDropdown && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-1 shadow-lg">
              {userDropdown}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
