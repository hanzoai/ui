'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DEFAULT_HANZO_APPS, type HanzoApp } from './types'

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
        <div className="absolute left-0 top-10 z-50 w-64 rounded-xl border border-white/[0.08] bg-[#0e0e13] p-2 shadow-2xl">
          <p className="px-2 pb-1.5 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
            Hanzo Apps
          </p>
          {apps
            .filter((a) => a.id !== currentAppId)
            .map((app) => (
              <a
                key={app.id}
                href={app.href}
                className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="text-[13px] font-medium text-white/80">{app.label}</span>
                {app.description && (
                  <span className="text-[11px] text-white/30">{app.description}</span>
                )}
              </a>
            ))}
        </div>
      )}
    </div>
  )
}
