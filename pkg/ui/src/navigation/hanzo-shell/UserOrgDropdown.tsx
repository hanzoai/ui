'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { HanzoUser, HanzoOrg } from './types'

interface UserOrgDropdownProps {
  user?: HanzoUser
  organizations?: HanzoOrg[]
  currentOrgId?: string
  onOrgSwitch?: (orgId: string) => void
  onSignOut?: () => void
}

function Initials({ name, email }: { name?: string; email?: string }) {
  const seed = name || email || 'U'
  const initials = seed
    .split(/[\s@._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-semibold text-white/70">
      {initials}
    </span>
  )
}

export function UserOrgDropdown({
  user,
  organizations = [],
  currentOrgId,
  onOrgSwitch,
  onSignOut,
}: UserOrgDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const currentOrg = organizations.find((o) => o.id === currentOrgId)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.06] transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || user.email}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <Initials name={user.name} email={user.email} />
        )}
        <div className="hidden flex-col items-start sm:flex">
          {user.name && (
            <span className="text-[12px] font-medium text-white/70 leading-none">{user.name}</span>
          )}
          <span className="text-[11px] text-white/30 leading-none mt-0.5">{user.email}</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/30 hidden sm:block"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-white/[0.08] bg-[#0e0e13] shadow-2xl">
          {/* User info */}
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-[13px] font-medium text-white/80">{user.name || 'User'}</p>
            <p className="text-[11px] text-white/40">{user.email}</p>
          </div>

          {/* Org switcher */}
          {organizations.length > 0 && (
            <div className="border-b border-white/[0.06] p-2">
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
                Organizations
              </p>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => {
                    onOrgSwitch?.(org.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <span className="text-[13px] text-white/70">{org.name}</span>
                  {org.id === currentOrgId && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/50"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="p-2">
            <a
              href="https://hanzo.id/account"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
              onClick={() => setOpen(false)}
            >
              Account settings
            </a>
            <a
              href="https://billing.hanzo.ai"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
              onClick={() => setOpen(false)}
            >
              Billing
            </a>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSignOut?.()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/40 hover:bg-white/[0.06] hover:text-red-400/70 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
