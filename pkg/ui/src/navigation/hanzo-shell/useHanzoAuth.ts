'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HanzoUser, HanzoOrg } from './types'

const TOKEN_KEY = 'hanzo-auth-token'
const USER_KEY = 'hanzo-user'
const EXPIRES_KEY = 'hanzo-auth-expires'
const IAM_ENDPOINT = 'https://iam.hanzo.ai'

const ORG_MAP: Record<string, { name: string; slug: string }> = {
  hanzo: { name: 'Hanzo AI', slug: 'hanzo' },
  lux: { name: 'Lux Network', slug: 'lux' },
  zoo: { name: 'Zoo Labs', slug: 'zoo' },
  pars: { name: 'Pars', slug: 'pars' },
}

/**
 * Reads IAM auth from localStorage (shared across all hanzo.* apps) and fetches
 * current user info + orgs from iam.hanzo.ai. Zero-dependency hook — works in
 * billing.hanzo.ai, hanzo.id/account, console.hanzo.ai, etc.
 */
export function useHanzoAuth() {
  const [user, setUser] = useState<HanzoUser | undefined>(undefined)
  const [organizations, setOrganizations] = useState<HanzoOrg[]>([])
  const [currentOrgId, setCurrentOrgId] = useState<string | undefined>(undefined)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const expires = localStorage.getItem(EXPIRES_KEY)

      if (!storedToken || (expires && Date.now() > Number(expires))) {
        setLoading(false)
        return
      }

      setToken(storedToken)

      // Try to get from cache first for instant render
      const cached = localStorage.getItem(USER_KEY)
      if (cached) {
        try {
          const u = JSON.parse(cached)
          if (u?.email) {
            setUser({ id: u.id, name: u.displayName || u.name, email: u.email, avatar: u.avatar })
          }
        } catch { /* ignore */ }
      }

      // Fetch fresh from IAM
      const res = await fetch(`${IAM_ENDPOINT}/api/userinfo`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })

      if (res.ok) {
        const info = await res.json()
        const u: HanzoUser = {
          id: info.sub || info.id,
          name: info.name || info.displayName,
          email: info.email,
          avatar: info.picture || info.avatar,
        }
        setUser(u)
        localStorage.setItem(USER_KEY, JSON.stringify(info))

        // Build orgs from IAM groups
        const groups: string[] = info.groups || []
        const orgs: HanzoOrg[] = groups
          .map((g: string) => {
            const slug = g.toLowerCase().replace(/^\//, '')
            const meta = ORG_MAP[slug]
            return meta ? { id: slug, name: meta.name, slug: meta.slug } : null
          })
          .filter(Boolean) as HanzoOrg[]

        // Default: always include at least a personal org
        if (orgs.length === 0 && u.email) {
          orgs.push({ id: 'personal', name: 'Personal', slug: 'personal' })
        }

        setOrganizations(orgs)
        setCurrentOrgId(orgs[0]?.id)
      }
    } catch { /* silently fail */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    window.location.href = 'https://hanzo.id'
  }, [])

  const switchOrg = useCallback((orgId: string) => {
    setCurrentOrgId(orgId)
  }, [])

  return { user, organizations, currentOrgId, token, loading, signOut, switchOrg }
}
