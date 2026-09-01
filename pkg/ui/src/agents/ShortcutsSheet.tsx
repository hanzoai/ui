import React from 'react'

export interface ShortcutItem {
  keys: string[]
  label: string
  category: 'Workspace' | 'Navigation' | 'Chat' | 'Editing'
}

export interface ShortcutsSheetProps {
  isOpen: boolean
  onClose: () => void
  customShortcuts?: ShortcutItem[]
  className?: string
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { keys: ['⌘', 'K'], label: 'Open Omni Search / Command Palette', category: 'Navigation' },
  { keys: ['⌘', 'B'], label: 'Toggle Explorer Sidebar', category: 'Workspace' },
  { keys: ['⌘', 'J'], label: 'Toggle Far-Right Intelligence Dock', category: 'Workspace' },
  { keys: ['⌘', '/'], label: 'Show Keyboard Shortcuts Cheat Sheet', category: 'Workspace' },
  { keys: ['⌘', 'Enter'], label: 'Submit Prompt / Message', category: 'Chat' },
  { keys: ['⌘', 'E'], label: 'Export Markdown Transcript', category: 'Chat' },
  { keys: ['⌘', 'D'], label: 'Toggle Code Diff Inspector', category: 'Editing' },
  { keys: ['⌘', 'M'], label: 'Toggle Duplex Voice Mic Mute', category: 'Chat' },
]

export const ShortcutsSheet: React.FC<ShortcutsSheetProps> = ({
  isOpen,
  onClose,
  customShortcuts,
  className = '',
}) => {
  if (!isOpen) return null

  const list = customShortcuts || DEFAULT_SHORTCUTS
  const categories = Array.from(new Set(list.map((s) => s.category)))

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div className="flex flex-col w-full max-w-lg bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl p-6 gap-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌨️</span>
            <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
          >
            Esc
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat} className="flex flex-col gap-2">
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {cat}
              </h3>
              <div className="flex flex-col gap-1.5">
                {list
                  .filter((s) => s.category === cat)
                  .map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/5 text-xs text-neutral-200"
                    >
                      <span>{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k, kidx) => (
                          <kbd
                            key={kidx}
                            className="px-2 py-0.5 rounded bg-neutral-800 border border-white/10 text-[11px] font-mono text-neutral-300 font-semibold shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
