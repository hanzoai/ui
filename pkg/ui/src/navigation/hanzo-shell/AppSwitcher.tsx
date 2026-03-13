'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DEFAULT_HANZO_APPS, type HanzoApp } from './types'

/** Group IDs for sectioned display */
const APP_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Core', ids: ['account', 'billing', 'console'] },
  { label: 'AI', ids: ['chat', 'flow', 'bot'] },
  { label: 'Observability', ids: ['o11y', 'sentry', 'insights', 'analytics'] },
  { label: 'Infrastructure', ids: ['platform', 'cloud', 'storage', 'kms', 'dns', 'registry'] },
  { label: 'Apps', ids: ['commerce', 'base', 'search', 'auto'] },
  { label: 'Business', ids: ['team', 'sign', 'dataroom', 'captable'] },
  { label: 'Resources', ids: ['docs', 'status'] },
]

interface AppSwitcherProps {
  apps?: HanzoApp[]
  currentAppId?: string
}

export function AppSwitcher({ apps = DEFAULT_HANZO_APPS, currentAppId }: AppSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = apps.filter((a) => a.id !== currentAppId)
  const appMap = new Map(filtered.map((a) => [a.id, a]))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
        aria-label="Switch app"
        title="Switch app"
      >
        {/* 3x3 grid icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="4" height="4" rx="1" />
          <rect x="6" y="1" width="4" height="4" rx="1" />
          <rect x="11" y="1" width="4" height="4" rx="1" />
          <rect x="1" y="6" width="4" height="4" rx="1" />
          <rect x="6" y="6" width="4" height="4" rx="1" />
          <rect x="11" y="6" width="4" height="4" rx="1" />
          <rect x="1" y="11" width="4" height="4" rx="1" />
          <rect x="6" y="11" width="4" height="4" rx="1" />
          <rect x="11" y="11" width="4" height="4" rx="1" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-72 max-h-[80vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0e0e13] p-2 shadow-2xl">
          {APP_GROUPS.map((group) => {
            const groupApps = group.ids
              .map((id) => appMap.get(id))
              .filter(Boolean) as HanzoApp[]
            if (groupApps.length === 0) return null
            return (
              <div key={group.label}>
                <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-0.5">
                  {groupApps.map((app) => (
                    <a
                      key={app.id}
                      href={app.href}
                      className="flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-white/[0.06] transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-[13px] font-medium text-white/80">{app.label}</span>
                      {app.description && (
                        <span className="text-[11px] leading-tight text-white/30">{app.description}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
          {/* Any apps not in groups */}
          {(() => {
            const groupedIds = new Set(APP_GROUPS.flatMap((g) => g.ids))
            const ungrouped = filtered.filter((a) => !groupedIds.has(a.id))
            if (ungrouped.length === 0) return null
            return (
              <div>
                <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
                  Other
                </p>
                <div className="grid grid-cols-2 gap-0.5">
                  {ungrouped.map((app) => (
                    <a
                      key={app.id}
                      href={app.href}
                      className="flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-white/[0.06] transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-[13px] font-medium text-white/80">{app.label}</span>
                      {app.description && (
                        <span className="text-[11px] leading-tight text-white/30">{app.description}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
