'use client'

import * as React from 'react'
import { cn } from '../../utils'

export interface DashLayoutProps {
  /** Sidebar element (use DashSidebar) */
  sidebar: React.ReactNode
  /** Top header element (use DashHeader) */
  header?: React.ReactNode
  /** Main content */
  children: React.ReactNode
  /** Whether the sidebar is collapsed */
  sidebarCollapsed?: boolean
  /** Callback when sidebar collapse state changes */
  onSidebarCollapse?: (collapsed: boolean) => void
  className?: string
}

export function DashLayout({
  sidebar,
  header,
  children,
  sidebarCollapsed = false,
  onSidebarCollapse,
  className,
}: DashLayoutProps) {
  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden',
        'bg-[var(--dash-bg)] text-[var(--dash-text)]',
        className,
      )}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 overflow-y-auto overflow-x-hidden transition-[width] duration-200',
          'border-r border-[var(--dash-border)] bg-[var(--dash-surface)]',
          sidebarCollapsed
            ? 'w-[var(--dash-sidebar-collapsed-width)]'
            : 'w-[var(--dash-sidebar-width)]',
        )}
      >
        {sidebar}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {header && (
          <header className="flex-shrink-0 border-b border-[var(--dash-border)] bg-[var(--dash-surface)]">
            {header}
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => onSidebarCollapse?.(true)}
        />
      )}
    </div>
  )
}
