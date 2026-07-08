'use client'

/**
 * <NetworkSwitcher/> — the ONE network selector for every Hanzo surface
 * (desktop, app, chat, team, console). Renders the selected environment
 * and a menu of configured networks + a custom-endpoint form, backed by
 * the shared selected-network store, so dropping this into a header is
 * the whole integration.
 *
 * Self-contained (React + semantic Tailwind tokens only), matching the
 * other @hanzo/ui domain modules.
 */

import * as React from 'react'

import { validateCustomNetwork, type Network, type NetworkEnv } from './networks'
import { useNetwork } from './store'

const ENV_DOT: Record<NetworkEnv, string> = {
  mainnet: 'bg-emerald-500',
  testnet: 'bg-amber-500',
  devnet: 'bg-sky-500',
  local: 'bg-zinc-400',
  custom: 'bg-violet-500',
}

export interface NetworkSwitcherProps {
  /** Called after the selection changes (endpoint rewiring is automatic). */
  onChange?: (network: Network) => void
  className?: string
}

interface CustomDraft {
  label: string
  chainID: string
  rpcEndpoint: string
  apiEndpoint: string
}

const EMPTY_DRAFT: CustomDraft = { label: '', chainID: '', rpcEndpoint: '', apiEndpoint: '' }

export function NetworkSwitcher({ onChange, className = '' }: NetworkSwitcherProps) {
  const { network, networks, select, selectCustom } = useNetwork()
  const [open, setOpen] = React.useState(false)
  const [customOpen, setCustomOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<CustomDraft>(EMPTY_DRAFT)
  const [error, setError] = React.useState<string | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const pick = (env: NetworkEnv) => {
    if (env === 'custom') {
      setCustomOpen(true)
      return
    }
    const next = select(env)
    setOpen(false)
    setCustomOpen(false)
    onChange?.(next)
  }

  const saveCustom = () => {
    const candidate: Omit<Network, 'env'> = {
      label: draft.label.trim() || 'Custom',
      networkID: Number(draft.chainID),
      evmChainID: Number(draft.chainID),
      rpcEndpoint: draft.rpcEndpoint.trim(),
      apiEndpoint: draft.apiEndpoint.trim(),
      currency: network.currency,
    }
    const invalid = validateCustomNetwork({ ...candidate, env: 'custom' })
    if (invalid) {
      setError(invalid)
      return
    }
    const next = selectCustom(candidate)
    setError(null)
    setDraft(EMPTY_DRAFT)
    setOpen(false)
    setCustomOpen(false)
    onChange?.(next)
  }

  const field =
    'w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <span className={`h-2 w-2 rounded-full ${ENV_DOT[network.env]}`} aria-hidden />
        <span className="max-w-[9rem] truncate">{network.label}</span>
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {networks.map((n) => (
            <button
              key={n.env}
              type="button"
              role="menuitemradio"
              aria-checked={network.env === n.env}
              onClick={() => pick(n.env)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${ENV_DOT[n.env]}`} aria-hidden />
              <span className="flex-1">
                <span className="block font-medium">{n.label}</span>
                <span className="block text-[10px] text-muted-foreground">
                  chain {n.evmChainID} &middot; {n.rpcEndpoint.replace(/^https?:\/\//, '')}
                </span>
              </span>
              {network.env === n.env && (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          <div className="my-1 h-px bg-border" role="separator" />

          {!customOpen ? (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={network.env === 'custom'}
              onClick={() => pick('custom')}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${ENV_DOT.custom}`} aria-hidden />
              <span className="flex-1 font-medium">
                {network.env === 'custom' ? network.label : 'Custom…'}
              </span>
              {network.env === 'custom' && (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ) : (
            <form
              className="space-y-1.5 p-2"
              onSubmit={(e) => {
                e.preventDefault()
                saveCustom()
              }}
            >
              <input
                className={field}
                placeholder="Label (optional)"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
              <input
                className={field}
                placeholder="Chain ID"
                inputMode="numeric"
                value={draft.chainID}
                onChange={(e) => setDraft({ ...draft, chainID: e.target.value })}
              />
              <input
                className={field}
                placeholder="RPC endpoint (https://…)"
                value={draft.rpcEndpoint}
                onChange={(e) => setDraft({ ...draft, rpcEndpoint: e.target.value })}
              />
              <input
                className={field}
                placeholder="API endpoint (https://…)"
                value={draft.apiEndpoint}
                onChange={(e) => setDraft({ ...draft, apiEndpoint: e.target.value })}
              />
              {error && <p className="text-[10px] text-destructive">{error}</p>}
              <div className="flex justify-end gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setCustomOpen(false)
                    setError(null)
                  }}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Connect
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
