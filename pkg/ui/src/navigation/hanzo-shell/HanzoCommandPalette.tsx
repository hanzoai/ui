'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_HANZO_APPS, type HanzoApp } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommandItem = {
  id: string
  title: string
  description?: string
  href?: string
  action?: () => void
  icon?: React.ReactNode
  category: string
  external?: boolean
  keywords?: string[]
}

export type HanzoCommandPaletteProps = {
  /** Additional app-specific commands merged with built-in cross-app commands */
  commands?: CommandItem[]
  /** Override the default Hanzo apps used for cross-app navigation */
  apps?: HanzoApp[]
  /** Current app id — used to exclude from cross-app navigation */
  currentAppId?: string
  /** Controlled open state */
  open?: boolean
  /** Called when palette wants to close */
  onOpenChange?: (open: boolean) => void
  /** Custom navigation handler (defaults to window.location for external, history push for relative) */
  onNavigate?: (href: string, external?: boolean) => void
}

// ---------------------------------------------------------------------------
// Built-in cross-app commands derived from DEFAULT_HANZO_APPS
// ---------------------------------------------------------------------------

function buildCrossAppCommands(apps: HanzoApp[], currentAppId?: string): CommandItem[] {
  return apps
    .filter((app) => app.id !== currentAppId)
    .map((app) => ({
      id: `app-${app.id}`,
      title: app.label,
      description: app.description,
      href: app.href,
      category: 'Hanzo Apps',
      external: true,
      keywords: [app.id, app.label.toLowerCase()],
    }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HanzoCommandPalette({
  commands: appCommands = [],
  apps,
  currentAppId,
  open: controlledOpen,
  onOpenChange,
  onNavigate,
}: HanzoCommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = useCallback(
    (v: boolean) => {
      if (onOpenChange) onOpenChange(v)
      else setInternalOpen(v)
    },
    [onOpenChange],
  )

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Merge cross-app + app-specific commands
  const crossApp = buildCrossAppCommands(apps ?? DEFAULT_HANZO_APPS, currentAppId)
  const allCommands = [...appCommands, ...crossApp]

  // Filter
  const q = search.toLowerCase()
  const filtered = q
    ? allCommands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q)),
      )
    : allCommands

  // Group by category
  const grouped: Record<string, CommandItem[]> = {}
  for (const cmd of filtered) {
    ;(grouped[cmd.category] ??= []).push(cmd)
  }
  const flat = Object.values(grouped).flat()

  // Reset on search change
  useEffect(() => setSelectedIndex(0), [search])

  // Focus on open
  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Global Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, setOpen])

  // Navigate helper
  const go = useCallback(
    (cmd: CommandItem) => {
      if (cmd.action) {
        cmd.action()
      } else if (cmd.href) {
        if (onNavigate) {
          onNavigate(cmd.href, cmd.external)
        } else if (cmd.external) {
          window.open(cmd.href, '_blank')
        } else {
          window.location.href = cmd.href
        }
      }
      setOpen(false)
    },
    [onNavigate, setOpen],
  )

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % (flat.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + (flat.length || 1)) % (flat.length || 1))
      } else if (e.key === 'Enter' && flat[selectedIndex]) {
        e.preventDefault()
        go(flat[selectedIndex])
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    [flat, selectedIndex, go, setOpen],
  )

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101]">
        <div className="bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
            <svg
              className="w-4 h-4 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-white text-[13px] placeholder-white/30 outline-none"
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.06] rounded text-white/30">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
            {flat.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/30 text-[13px]">
                No results for &ldquo;{search}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                    {category}
                  </div>
                  {items.map((cmd) => {
                    const idx = flat.indexOf(cmd)
                    const selected = idx === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        data-idx={idx}
                        onClick={() => go(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          selected ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:bg-white/[0.03]'
                        }`}
                      >
                        {cmd.icon && (
                          <span className={`w-5 h-5 flex items-center justify-center ${selected ? 'text-white/70' : 'text-white/25'}`}>
                            {cmd.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-medium truncate block">{cmd.title}</span>
                          {cmd.description && (
                            <span className="text-[11px] text-white/25 truncate block">{cmd.description}</span>
                          )}
                        </div>
                        {selected && (
                          <span className="text-white/25 text-[11px]">↵</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-white/20">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">↑</kbd>
                <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">↵</kbd>
                select
              </span>
            </div>
            <span className="text-[10px] text-white/20">⌘K</span>
          </div>
        </div>
      </div>
    </>
  )
}
