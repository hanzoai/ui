'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Copy,
  Check,
  RotateCw,
  Maximize2,
  Minimize2,
  Trash2,
} from '@hanzogui/lucide-icons-2'
import { Text } from '../index'

export interface TerminalTab {
  id: string
  title: string
  status?: 'running' | 'idle' | 'failed' | 'success'
  output: string[]
  cwd?: string
}

export interface TerminalViewerProps {
  tabs: TerminalTab[]
  activeTabId: string
  onSelectTab: (id: string) => void
  onCloseTab?: (id: string) => void
  onNewTab?: () => void
  onSendCommand?: (id: string, command: string) => void
  onKillCommand?: (id: string) => void
  onClearOutput?: (id: string) => void
}

export const TerminalViewer: React.FC<TerminalViewerProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onSendCommand,
  onKillCommand,
  onClearOutput,
}) => {
  const [commandInput, setCommandInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTab?.output?.length])

  const handleCopy = () => {
    if (!activeTab) return
    navigator.clipboard.writeText(activeTab.output.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandInput.trim() || !activeTab || !onSendCommand) return
    onSendCommand(activeTab.id, commandInput.trim())
    setCommandInput('')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0c0c0e',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        borderRadius: 12,
        border: '1px solid var(--borderColor)',
        overflow: 'hidden',
        ...(isExpanded
          ? { position: 'fixed', inset: 16, zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }
          : { height: '100%', minHeight: 300 }),
      }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#141418', borderBottom: '1px solid #24242a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  border: isActive ? '1px solid #34343e' : 'none',
                  backgroundColor: isActive ? '#1e1e24' : 'transparent',
                  color: isActive ? '#ffffff' : '#888892',
                  cursor: 'pointer',
                }}
              >
                <TerminalIcon size={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{tab.title}</span>
                {tab.status === 'running' && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34d399' }} />
                )}
                {tab.status === 'failed' && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f87171' }} />
                )}
              </button>
            )
          })}

          {onNewTab && (
            <button
              onClick={onNewTab}
              style={{ padding: '4px 8px', fontSize: 12, color: '#888892', background: 'none', border: 'none', cursor: 'pointer' }}
              title="New Terminal"
            >
              +
            </button>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {activeTab && onClearOutput && (
            <button
              onClick={() => onClearOutput(activeTab.id)}
              style={{ padding: 4, color: '#888892', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              title="Clear output"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{ padding: 4, color: '#888892', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            title="Copy terminal output"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ padding: 4, color: '#888892', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Output Console */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', fontSize: 12, lineHeight: 1.5 }}>
        {activeTab?.cwd && (
          <div style={{ color: '#6e6e7c', fontSize: 11, marginBottom: 8, fontFamily: 'sans-serif' }}>
            Working directory: <code style={{ fontFamily: 'monospace', color: '#a0a0b0' }}>{activeTab.cwd}</code>
          </div>
        )}

        {activeTab?.output?.length === 0 ? (
          <div style={{ color: '#555562', fontStyle: 'italic' }}>Terminal ready. Type a command below.</div>
        ) : (
          activeTab?.output.map((line, idx) => {
            const isCmd = line.startsWith('>') || line.startsWith('$')
            const isErr = line.includes('error') || line.includes('Error') || line.includes('ERR')
            const isWarn = line.includes('warn') || line.includes('WARN')
            const isOk = line.includes('✓') || line.includes('success')
            return (
              <div
                key={idx}
                style={{
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  color: isCmd ? '#67e8f9' : isErr ? '#fb7185' : isWarn ? '#fcd34d' : isOk ? '#34d399' : '#c8c8d4',
                  fontWeight: isCmd ? 600 : 400,
                  marginTop: isCmd ? 6 : 0,
                }}
              >
                {line}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Prompt */}
      {onSendCommand && activeTab && (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#121216', borderTop: '1px solid #24242a' }}
        >
          <span style={{ color: '#22d3ee', userSelect: 'none', fontSize: 12, fontWeight: 'bold' }}>$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type shell command..."
            style={{ flex: 1, background: 'transparent', fontSize: 12, color: '#ffffff', outline: 'none', border: 'none', fontFamily: 'monospace' }}
          />
          {activeTab.status === 'running' && onKillCommand && (
            <button
              type="button"
              onClick={() => onKillCommand(activeTab.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, color: '#fda4af', backgroundColor: 'rgba(76, 5, 25, 0.6)', border: '1px solid rgba(159, 18, 57, 0.5)', borderRadius: 4, cursor: 'pointer' }}
            >
              <Square size={12} />
              <span>Stop</span>
            </button>
          )}
        </form>
      )}
    </div>
  )
}
