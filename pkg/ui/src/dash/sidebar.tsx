'use client'

import * as React from 'react'
import { cn } from '../../utils'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  active?: boolean
}

export interface NavGroup {
  title?: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

export interface SidebarProps {
  /** Logo or brand element rendered at the top */
  logo?: React.ReactNode
  /** Navigation groups */
  groups: NavGroup[]
  /** User menu rendered at the bottom */
  userMenu?: React.ReactNode
  /** Whether the sidebar is collapsed (icon-only mode) */
  collapsed?: boolean
  /** Toggle collapse */
  onToggleCollapse?: () => void
  /** Called when a nav item is clicked */
  onNavigate?: (href: string) => void
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Hanzo H mark (default logo)                                       */
/* ------------------------------------------------------------------ */

function HanzoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4h4v6h8V4h4v16h-4v-6H8v6H4V4z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Sidebar({
  logo,
  groups,
  userMenu,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  className,
}: SidebarProps) {
  return (
    <nav
      className={cn(
        'flex h-full flex-col',
        'bg-[var(--dash-surface)] text-[var(--dash-text)]',
        className,
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          'flex h-[var(--dash-header-height)] items-center border-b border-[var(--dash-border)]',
          collapsed ? 'justify-center px-2' : 'px-4',
        )}
      >
        {logo ?? <HanzoMark />}
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="ml-auto rounded p-1 text-[var(--dash-text-dim)] hover:bg-[var(--dash-surface-hover)] hover:text-[var(--dash-text)]"
            aria-label="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute -right-3 top-4 z-50 hidden rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface)] p-1 text-[var(--dash-text-dim)] hover:text-[var(--dash-text)] lg:flex"
            aria-label="Expand sidebar"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {groups.map((group, gi) => (
          <SidebarGroup
            key={gi}
            group={group}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* User menu */}
      {userMenu && (
        <div className="border-t border-[var(--dash-border)] p-2">
          {userMenu}
        </div>
      )}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  SidebarGroup (internal)                                           */
/* ------------------------------------------------------------------ */

function SidebarGroup({
  group,
  collapsed,
  onNavigate,
}: {
  group: NavGroup
  collapsed: boolean
  onNavigate?: (href: string) => void
}) {
  const [open, setOpen] = React.useState(group.defaultOpen !== false)
  const isCollapsible = group.collapsible !== false && !!group.title

  return (
    <div className="mb-1">
      {group.title && !collapsed && (
        <button
          type="button"
          onClick={() => isCollapsible && setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--dash-text-dim)]',
            isCollapsible && 'cursor-pointer hover:text-[var(--dash-text-muted)]',
          )}
        >
          <span className="flex-1 text-left">{group.title}</span>
          {isCollapsible && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              className={cn('transition-transform', open ? 'rotate-0' : '-rotate-90')}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {(open || collapsed) && (
        <ul className="space-y-0.5 px-2">
          {group.items.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => onNavigate?.(item.href)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[var(--dash-radius-sm)] px-2 py-1.5 text-sm transition-colors',
                  item.active
                    ? 'bg-[var(--dash-primary)] text-[var(--dash-primary-text)]'
                    : 'text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface-hover)] hover:text-[var(--dash-text)]',
                  collapsed && 'justify-center px-0',
                )}
              >
                {item.icon && (
                  <span className="flex h-5 w-5 items-center justify-center flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-[var(--dash-primary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--dash-primary-text)]">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
