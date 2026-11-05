import React from 'react'
import { Text } from '@hanzo/gui'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'

export interface ShortcutItem {
  key: string
  description: string
  category: 'navigation' | 'actions' | 'tools' | 'workspace'
}

export interface ShortcutsSheetProps {
  shortcuts?: ShortcutItem[]
  onClose?: () => void
  open?: boolean
  className?: string
  style?: React.CSSProperties
}

/** How a category heading reads. */
const CATEGORY: Record<ShortcutItem['category'], string> = {
  navigation: phrase('navigation'),
  actions: phrase('actions'),
  tools: phrase('tools'),
  workspace: phrase('workspace'),
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { key: '⌘ + K', description: phrase('Open Command Palette & Global Search'), category: 'navigation' },
  { key: '⌘ + /', description: phrase('Open Keyboard Shortcuts Sheet'), category: 'navigation' },
  { key: '⌘ + .', description: phrase('Toggle Live AI Voice Call'), category: 'actions' },
  { key: '⌘ + J', description: phrase('Toggle Artifacts Inspector & Code Diff'), category: 'workspace' },
  { key: '⌘ + I', description: phrase('Toggle Intelligence Dock (Channels & Roster)'), category: 'workspace' },
  { key: '⌘ + B', description: phrase('Toggle Left Channels & Conversation Rail'), category: 'workspace' },
  { key: '⌘ + N', description: phrase('Create New Conversation or Channel'), category: 'actions' },
  { key: 'Esc', description: phrase('Close Active Modal / Clear Selection'), category: 'actions' },
]

export const ShortcutsSheet: React.FC<ShortcutsSheetProps> = ({
  shortcuts: given,
  onClose,
  open = true,
  className = '',
  style,
}) => {
  const { t } = useI18n()
  if (!open) return null
  const shortcuts = given ?? DEFAULT_SHORTCUTS.map((s) => ({ ...s, description: t(s.description) }))

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--surface-scrim, rgb(0 0 0 / .75))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#171717',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          padding: 24,
          gap: 16,
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={t('Keyboard Shortcuts')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⌨️</span>
            <Text render="h2" fontSize={14} fontWeight="600" color={'#ffffff' as never} m={0}>
              {t('Keyboard Shortcuts')}
            </Text>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{ color: '#a3a3a3', fontSize: 12, padding: '4px 8px', borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', border: 'none', cursor: 'pointer' }}
            >
              {t('Close ({key})', { key: 'Esc' })}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 384, overflowY: 'auto', paddingInlineEnd: 4 }}>
          {categories.map((cat) => (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {CATEGORY[cat] ? t(CATEGORY[cat]) : cat}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {shortcuts
                  .filter((s) => s.category === cat)
                  .map((s, idx) => (
                    <div
                      key={idx}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)', fontSize: 12, color: '#e5e5e5' }}
                    >
                      <span>{s.description}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {s.key.split(' ').map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: '#262626', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: 11, fontFamily: 'monospace', color: '#d4d4d4', fontWeight: 600 }}
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
