'use client'

/**
 * The host seam — the ONE place an app injects its effects into this layer.
 *
 * The product layer is presentational and host-agnostic: it never imports a
 * router or an auth module. An honest state card still has to OFFER "Sign in
 * again" (401) or "Add credits" (402), so the app provides those two effects
 * once at its root and every card below renders the right affordance. Without a
 * provider the affordance is simply not offered — nothing is faked.
 */
import { createContext, useContext, type ReactNode } from 'react'

export type HostActions = {
  /** Re-authenticate and return to this exact page (401). */
  signIn?: () => void
  /** Navigate to the org's top-up surface (402). */
  addCredits?: () => void
}

const HostCtx = createContext<HostActions>({})

export const HostProvider = ({ actions, children }: { actions: HostActions; children: ReactNode }) => (
  <HostCtx.Provider value={actions}>{children}</HostCtx.Provider>
)

export const useHost = (): HostActions => useContext(HostCtx)
