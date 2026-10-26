'use client'

import React, { useMemo, useState } from 'react'
import { ArrowUpRight, Check, Search, X } from '@hanzogui/lucide-icons-2'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  ScrollArea,
  Text,
} from '../index'

export type DirectoryTab = 'apps' | 'channels' | 'plugins' | 'skills'

export interface DirectoryItem {
  id: string
  name: string
  publisher: string
  description: string
  kind: 'MCP' | 'native'
  installs?: number
  connected?: boolean
  installed?: boolean
  iconUrl?: string
}

export interface DirectoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTab?: DirectoryTab
  onTabChange?: (tab: DirectoryTab) => void
  items: DirectoryItem[]
  loading?: boolean
  error?: string | null
  onInstall?: (item: DirectoryItem) => Promise<void> | void
  onConnect?: (item: DirectoryItem) => Promise<void> | void
  consoleUrl?: string
  authRequired?: boolean
  onSignIn?: () => void
}

const TABS: { id: DirectoryTab; label: string }[] = [
  { id: 'apps', label: phrase('Apps') },
  { id: 'channels', label: phrase('Channels') },
  { id: 'plugins', label: phrase('Plugins') },
  { id: 'skills', label: phrase('Skills') },
]

/** What each tab's search, sign-in wall and empty result say. */
const SEARCH: Record<DirectoryTab, string> = {
  apps: phrase('Search apps...'),
  channels: phrase('Search channels...'),
  plugins: phrase('Search plugins...'),
  skills: phrase('Search skills...'),
}
const WALL: Record<DirectoryTab, string> = {
  apps: phrase('Sign in required to manage apps'),
  channels: phrase('Sign in required to manage channels'),
  plugins: phrase('Sign in required to manage plugins'),
  skills: phrase('Sign in required to manage skills'),
}
const NONE: Record<DirectoryTab, string> = {
  apps: phrase('No apps match "{query}".'),
  channels: phrase('No channels match "{query}".'),
  plugins: phrase('No plugins match "{query}".'),
  skills: phrase('No skills match "{query}".'),
}

export const DirectoryModal: React.FC<DirectoryModalProps> = ({
  open,
  onOpenChange,
  activeTab = 'apps',
  onTabChange,
  items,
  loading = false,
  error = null,
  onInstall,
  onConnect,
  consoleUrl = 'https://console.hanzo.ai',
  authRequired = false,
  onSignIn,
}) => {
  const [tab, setTab] = useState<DirectoryTab>(activeTab)
  const [query, setQuery] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const { t } = useI18n()

  const currentTab = onTabChange ? activeTab : tab
  const handleTabChange = (next: DirectoryTab) => {
    if (onTabChange) onTabChange(next)
    else setTab(next)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.publisher.toLowerCase().includes(q)
    )
  }, [items, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 760, padding: 0, overflow: 'hidden', borderRadius: 16, backgroundColor: 'var(--background)', border: '1px solid var(--borderColor)' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--borderColor)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <DialogTitle fontSize={18} fontWeight="600" letterSpacing={-0.36} m={0}>
                {t('Directory')}
              </DialogTitle>
              <Text style={{ fontSize: 12, color: 'var(--color10)', marginTop: 2 }}>
                {t('Extend your workspace with integrations, channels, plugins, and skills.')}
              </Text>
            </div>
            <a
              href={consoleUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--color11)',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--borderColor)',
                textDecoration: 'none',
              }}
            >
              <span>Console</span>
              <ArrowUpRight size={14} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', padding: 4, backgroundColor: 'var(--color3)', borderRadius: 10, border: '1px solid var(--borderColor)' }}>
              {TABS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: currentTab === item.id ? 'var(--background)' : 'transparent',
                    color: currentTab === item.id ? 'var(--color12)' : 'var(--color10)',
                    boxShadow: currentTab === item.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', insetInlineStart: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color9)', pointerEvents: 'none', display: 'flex' }}>
                <Search size={14} />
              </span>
              <Input
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder={t(SEARCH[currentTab])}
                style={{ paddingInlineStart: 32, height: 34, fontSize: 12, borderRadius: 10, backgroundColor: 'var(--color2)', borderColor: 'var(--borderColor)' }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color9)', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea style={{ height: 420, padding: 20 }}>
          {authRequired ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, textAlign: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color11)' }}>
                {t(WALL[currentTab])}
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--color9)', maxWidth: 320, marginTop: 4, marginBottom: 16 }}>
                {t("Access your organization's custom plugins, connected accounts and private skills.")}
              </Text>
              {onSignIn && (
                <button
                  onClick={onSignIn}
                  style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, backgroundColor: 'var(--color12)', color: 'var(--background)', border: 'none', cursor: 'pointer' }}
                >
                  {t('Sign In')}
                </button>
              )}
            </div>
          ) : loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: 110, borderRadius: 12, border: '1px solid var(--borderColor)', backgroundColor: 'var(--color2)' }}
                />
              ))}
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, textAlign: 'center' }}>
              <Text style={{ fontSize: 12, color: 'var(--red10)', marginBottom: 8 }}>{error}</Text>
              <Text style={{ fontSize: 12, color: 'var(--color9)' }}>
                {t('Check console connection or network availability.')}
              </Text>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, textAlign: 'center' }}>
              <Text style={{ fontSize: 12, color: 'var(--color10)' }}>
                {t(NONE[currentTab], { query })}
              </Text>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {filtered.map((item) => {
                const isWorking = acting === item.id
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid var(--borderColor)',
                      backgroundColor: 'var(--color2)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            backgroundColor: item.kind === 'MCP' ? 'var(--blue3)' : 'var(--color4)',
                            color: item.kind === 'MCP' ? 'var(--blue11)' : 'var(--color11)',
                            border: item.kind === 'MCP' ? '1px solid var(--blue6)' : 'none',
                          }}
                        >
                          {item.kind}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color9)', marginBottom: 4 }}>
                        {t('by {publisher}', { publisher: item.publisher })}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color10)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--borderColor)' }}>
                      <span style={{ fontSize: 11, color: 'var(--color9)' }}>
                        {item.installs !== undefined ? t('{n} installs', { n: item.installs.toLocaleString() }) : ''}
                      </span>

                      {item.connected ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green11)', fontWeight: 600 }}>
                          <Check size={14} />
                          <span>{t('Connected')}</span>
                        </span>
                      ) : item.installed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color11)', fontWeight: 600 }}>
                          <Check size={14} />
                          <span>{t('Installed')}</span>
                        </span>
                      ) : (
                        <button
                          disabled={isWorking}
                          onClick={async () => {
                            setActing(item.id)
                            try {
                              if (onConnect && currentTab === 'apps') await onConnect(item)
                              else if (onInstall) await onInstall(item)
                            } finally {
                              setActing(null)
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            backgroundColor: 'var(--color4)',
                            color: 'var(--color12)',
                            border: '1px solid var(--borderColor)',
                            cursor: 'pointer',
                            opacity: isWorking ? 0.5 : 1,
                          }}
                        >
                          {isWorking ? t('Adding...') : currentTab === 'apps' ? t('Connect') : t('Install')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
