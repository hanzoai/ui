'use client'

import React from 'react'
import { HanzoMark } from './HanzoMark'
import { AppSwitcher } from './AppSwitcher'
import { UserOrgDropdown } from './UserOrgDropdown'
import { DEFAULT_HANZO_APPS, type HanzoShellProps } from './types'

/**
 * HanzoHeader — shared top navigation bar for all Hanzo properties.
 *
 * Style: monochrome #09090b / white, same as hanzo.ai docs & console.
 *
 * Features:
 * - Official Hanzo H-mark (animates on hover, brand context menu on right-click)
 * - Current app breadcrumb
 * - App switcher (billing, console, chat, platform, account)
 * - User + org dropdown (orgs from IAM, sign-out)
 *
 * Usage:
 * ```tsx
 * import { HanzoHeader, useHanzoAuth } from '@hanzo/ui/navigation'
 *
 * export default function Layout({ children }) {
 *   const { user, organizations, currentOrgId, switchOrg, signOut } = useHanzoAuth()
 *   return (
 *     <>
 *       <HanzoHeader
 *         currentApp="Billing"
 *         currentAppId="billing"
 *         user={user}
 *         organizations={organizations}
 *         currentOrgId={currentOrgId}
 *         onOrgSwitch={switchOrg}
 *         onSignOut={signOut}
 *       />
 *       <main>{children}</main>
 *     </>
 *   )
 * }
 * ```
 */
export function HanzoHeader({
  currentApp,
  currentAppId,
  user,
  organizations,
  currentOrgId,
  onOrgSwitch,
  onSignOut,
  apps = DEFAULT_HANZO_APPS,
  headerRight,
}: Omit<HanzoShellProps, 'children'>) {
  return (
    <header
      className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/[0.07] bg-[#09090b]/90 px-4 backdrop-blur-xl"
      role="banner"
    >
      {/* ── Left: logo · breadcrumb · app switcher ── */}
      <div className="flex min-w-0 items-center gap-2.5">
        <a
          href="https://hanzo.id/account"
          className="flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label="Hanzo Account"
        >
          <HanzoMark size={22} brandMenu animate />
        </a>

        <span className="select-none text-white/[0.15]">/</span>

        <span className="truncate text-[13px] font-medium text-white/50">{currentApp}</span>

        <AppSwitcher apps={apps} currentAppId={currentAppId} />
      </div>

      {/* ── Right: extra slot + user/org ── */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {headerRight}
        <UserOrgDropdown
          user={user}
          organizations={organizations}
          currentOrgId={currentOrgId}
          onOrgSwitch={onOrgSwitch}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  )
}
