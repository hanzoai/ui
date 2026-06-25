'use client'

import React, { useEffect } from 'react'
import { useHanzoAuth } from '../navigation/hanzo-shell/useHanzoAuth'
import { startIamLogin } from './iam'

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
        // Canonical IAM authorization-code + PKCE-S256 flow (HIP-0111).
        void startIamLogin({ serverUrl: 'https://hanzo.id', clientId })
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
