'use client'

/**
 * <WalletMenu/> — the ONE wallet indicator for every Hanzo surface.
 * Presentation only: address, PQ identity, selected-network alignment,
 * explorer link, connect/disconnect. Custody lives in the injected
 * `WalletAdapter` (desktop lux-wallet, web EIP-1193, …).
 */

import * as React from 'react'

import { useNetwork } from '../network/store'
import { shortAddress, type WalletAdapter, type WalletState } from './types'

function useWalletState(adapter: WalletAdapter): WalletState {
  return React.useSyncExternalStore(
    React.useCallback((cb: () => void) => adapter.subscribe(cb), [adapter]),
    adapter.getState,
    adapter.getState,
  )
}

export interface WalletMenuProps {
  adapter: WalletAdapter
  /** Connect (auto-provision on custodial surfaces) on first mount. */
  autoConnect?: boolean
  /** Where the menu opens relative to the trigger (headers: bottom; footers: top). */
  menuSide?: 'top' | 'bottom'
  className?: string
}

export function WalletMenu({ adapter, autoConnect = false, menuSide = 'bottom', className = '' }: WalletMenuProps) {
  const state = useWalletState(adapter)
  const { network } = useNetwork()
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const attempted = React.useRef(false)

  React.useEffect(() => {
    if (!autoConnect || attempted.current || state.status !== 'disconnected') return
    attempted.current = true
    adapter.connect().catch(() => {
      // Surfaced via adapter state; the menu shows the error.
    })
  }, [autoConnect, adapter, state.status])

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (permissions); nothing to do.
    }
  }

  const mismatch =
    state.status === 'ready' && state.chainId !== null && state.chainId !== network.evmChainID

  if (state.status !== 'ready' || !state.account) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => {
            adapter.connect().catch(() => {
              // Surfaced via adapter state.
            })
          }}
          disabled={state.status === 'connecting'}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          <WalletIcon className="h-3.5 w-3.5" />
          {state.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {state.status === 'error' && state.error && (
          <p className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-border bg-popover p-2 text-[10px] text-destructive shadow-md">
            {state.error}
          </p>
        )}
      </div>
    )
  }

  const { account } = state

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <span
          className={`h-2 w-2 rounded-full ${mismatch ? 'bg-amber-500' : 'bg-emerald-500'}`}
          aria-hidden
        />
        <span className="font-mono">{shortAddress(account.address)}</span>
        {account.pqPublicKey && (
          <span className="rounded bg-violet-500/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-violet-500">
            PQ
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-72 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md ${menuSide === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          <div className="px-1 pb-2">
            {account.label && <p className="text-xs font-semibold">{account.label}</p>}
            <div className="flex items-center gap-1.5">
              <code className="truncate font-mono text-[11px] text-muted-foreground">{account.address}</code>
              <button
                type="button"
                onClick={() => copy(account.address)}
                className="shrink-0 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {account.pqPublicKey && (
            <div className="border-t border-border px-1 py-2">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Post-quantum identity
                <span className="rounded bg-violet-500/15 px-1 py-px text-[9px] font-semibold text-violet-500">
                  ML-DSA-65
                </span>
              </p>
              <code className="block truncate font-mono text-[10px] text-muted-foreground">
                {account.pqPublicKey}
              </code>
              {account.pqNodeId && (
                <code className="block truncate font-mono text-[10px] text-muted-foreground">
                  {account.pqNodeId}
                </code>
              )}
            </div>
          )}

          <div className="border-t border-border px-1 py-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network</span>
              <span>
                {network.label} · {network.evmChainID}
              </span>
            </div>
            {mismatch && adapter.ensureNetwork && (
              <button
                type="button"
                onClick={() => {
                  adapter.ensureNetwork?.(network).catch(() => {
                    // Wallet refused the switch; state stays as-is.
                  })
                }}
                className="mt-1.5 w-full rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-500/25"
              >
                Wallet is on chain {state.chainId} — switch to {network.label}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-1 pt-2">
            {network.explorerEndpoint ? (
              <a
                href={`${network.explorerEndpoint.replace(/\/+$/, '')}/address/${account.address}`}
                target="_blank"
                rel="noreferrer"
                className="rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Explorer ↗
              </a>
            ) : (
              <span />
            )}
            {adapter.disconnect && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  void adapter.disconnect?.()
                }}
                className="rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  )
}
