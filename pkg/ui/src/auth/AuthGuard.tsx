'use client'

import React, { useEffect } from 'react'
import { useHanzoAuth } from '../navigation/hanzo-shell/useHanzoAuth'

export interface AuthGuardProps {
  /** Where to redirect when not authenticated (defaults to IAM login) */
  loginUrl?: string
  /** OAuth client ID for IAM redirect */
  clientId?: string
  /** Show loading state while checking auth */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Wrapper component that redirects to IAM login if user is not authenticated.
 * Uses useHanzoAuth to check localStorage token.
 */
export function AuthGuard({
  loginUrl,
  clientId,
  fallback,
  children,
}: AuthGuardProps) {
  const { user, loading } = useHanzoAuth()

  useEffect(() => {
    if (!loading && !user) {
      if (loginUrl) {
        window.location.href = loginUrl
      } else if (clientId) {
        const redirect = `${window.location.origin}/auth/callback`
        const url = new URL('https://hanzo.id/login/oauth/authorize')
        url.searchParams.set('client_id', clientId)
        url.searchParams.set('response_type', 'code')
        url.searchParams.set('redirect_uri', redirect)
        url.searchParams.set('scope', 'openid profile email')
        window.location.href = url.toString()
      } else {
        window.location.href = 'https://hanzo.id'
      }
    }
  }, [loading, user, loginUrl, clientId])

  if (loading) {
    return (
      <>
        {fallback ?? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#09090b', color: '#888' }}>
            Loading...
          </div>
        )}
      </>
    )
  }

  if (!user) return null

  return <>{children}</>
}
