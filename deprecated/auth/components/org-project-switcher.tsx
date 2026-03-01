'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'

/**
 * Shared organization & project switcher component.
 *
 * Uses @hanzo/iam/react hooks for data when available, but also
 * accepts data via props for apps that manage state differently.
 *
 * @example
 * ```tsx
 * // With @hanzo/iam/react (recommended)
 * import { OrgProjectSwitcher } from '@hanzo/auth'
 * import { useOrganizations } from '@hanzo/iam/react'
 *
 * function Nav() {
 *   const orgState = useOrganizations()
 *   return <OrgProjectSwitcher {...orgState} />
 * }
 *
 * // Or with props directly
 * <OrgProjectSwitcher
 *   organizations={orgs}
 *   currentOrgId="my-org"
 *   switchOrg={(id) => setOrg(id)}
 *   projects={projects}
 *   currentProjectId="my-project"
 *   switchProject={(id) => setProject(id)}
 * />
 * ```
 */

interface Organization {
  name: string
  displayName?: string
  owner?: string
}

interface Project {
  name: string
  displayName?: string
  organization?: string
  isDefault?: boolean
}

export interface OrgProjectSwitcherProps {
  /** Available organizations. */
  organizations: Organization[]
  /** Currently selected org name. */
  currentOrgId: string | null
  /** Callback to switch organization. */
  switchOrg: (orgId: string) => void
  /** Available projects for the current org. */
  projects?: Project[]
  /** Currently selected project name. */
  currentProjectId?: string | null
  /** Callback to switch project (null to clear). */
  switchProject?: (projectId: string | null) => void
  /** Called whenever org or project changes. Useful for syncing to external stores. */
  onTenantChange?: (orgId: string | null, projectId: string | null) => void
  /** Current environment badge text (e.g. "dev", "staging", "production"). */
  environment?: string | null
  /** Additional CSS class. */
  className?: string
  /** If true, always show even with single org. */
  alwaysShow?: boolean
}

const OrgProjectSwitcher: FC<OrgProjectSwitcherProps> = ({
  organizations,
  currentOrgId,
  switchOrg,
  projects = [],
  currentProjectId = null,
  switchProject,
  onTenantChange,
  environment,
  className = '',
  alwaysShow = false,
}) => {

  // Notify parent when tenant changes
  useEffect(() => {
    onTenantChange?.(currentOrgId, currentProjectId ?? null)
  }, [currentOrgId, currentProjectId, onTenantChange])

  const handleOrgChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    switchOrg(e.target.value)
  }, [switchOrg])

  const handleProjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    switchProject?.(e.target.value || null)
  }, [switchProject])

  // Don't render if only one org (unless alwaysShow)
  if (!alwaysShow && organizations.length <= 1 && projects.length <= 1) {
    // Still render the org name as a label if there's exactly one
    if (organizations.length === 1) {
      const org = organizations[0]
      return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
          <span className="font-medium">{org.displayName || org.name}</span>
          {projects.length === 1 && (
            <>
              <span className="text-muted-foreground">/</span>
              <span>{projects[0].displayName || projects[0].name}</span>
            </>
          )}
          {environment && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {environment}
            </span>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Organization selector */}
      <select
        value={currentOrgId ?? ''}
        onChange={handleOrgChange}
        className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Switch organization"
      >
        {organizations.map((org) => (
          <option key={org.name} value={org.name}>
            {org.displayName || org.name}
          </option>
        ))}
      </select>

      {/* Project selector (only if projects exist) */}
      {projects.length > 0 && switchProject && (
        <>
          <span className="text-muted-foreground">/</span>
          <select
            value={currentProjectId ?? ''}
            onChange={handleProjectChange}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Switch project"
          >
            {projects.map((proj) => (
              <option key={proj.name} value={proj.name}>
                {proj.displayName || proj.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Environment badge */}
      {environment && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {environment}
        </span>
      )}
    </div>
  )
}

export default OrgProjectSwitcher
