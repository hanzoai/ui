'use client'

import React, { useRef, useState } from 'react'
import {
  ChevronRight,
  Folder,
  File as FileIcon,
  Plus,
  Upload,
  Download,
  Trash2,
  HardDrive,
  RefreshCw,
} from '@hanzogui/lucide-icons-2'
import { Text } from '../index'

export interface StorageBucket {
  name: string
  createdAt?: number
}

export interface StorageEntry {
  key: string
  isDir: boolean
  size: number
  lastModified: number
  contentType?: string
}

export interface DriveViewerProps {
  buckets: StorageBucket[]
  currentBucket: string | null
  prefix: string
  entries: StorageEntry[]
  loading?: boolean
  uploading?: boolean
  error?: string | null
  onSelectBucket: (bucket: string) => void
  onNavigatePrefix: (prefix: string) => void
  onUploadFile?: (files: FileList) => Promise<void> | void
  onCreateFolder?: (name: string) => Promise<void> | void
  onDownloadFile?: (entry: StorageEntry) => Promise<void> | void
  onDeleteEntry?: (entry: StorageEntry) => Promise<void> | void
  onRefresh?: () => void
}

const weigh = (bytes: number): string => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const step = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** step
  return `${size < 10 && step > 0 ? size.toFixed(1) : Math.round(size)} ${units[step]}`
}

export const DriveViewer: React.FC<DriveViewerProps> = ({
  buckets,
  currentBucket,
  prefix,
  entries,
  loading = false,
  uploading = false,
  error = null,
  onSelectBucket,
  onNavigatePrefix,
  onUploadFile,
  onCreateFolder,
  onDownloadFile,
  onDeleteEntry,
  onRefresh,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const segments = prefix.split('/').filter(Boolean)

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim() || !onCreateFolder) return
    await onCreateFolder(newFolderName.trim())
    setNewFolderName('')
    setIsCreatingFolder(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--background)', borderRadius: 12, border: '1px solid var(--borderColor)', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--borderColor)', backgroundColor: 'var(--color2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--color12)' }}>
            <HardDrive size={16} />
            {buckets.length > 1 ? (
              <select
                value={currentBucket ?? ''}
                onChange={(e) => onSelectBucket(e.target.value)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--borderColor)', borderRadius: 6, padding: '2px 6px', fontSize: 12, color: 'var(--color12)', outline: 'none' }}
              >
                {buckets.map((b) => (
                  <option key={b.name} value={b.name} style={{ backgroundColor: 'var(--background)' }}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span>{currentBucket ?? 'Drive'}</span>
            )}
          </div>

          {currentBucket && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color10)' }}>
              <ChevronRight size={14} />
              <button
                onClick={() => onNavigatePrefix('')}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                root
              </button>
              {segments.map((seg, idx) => {
                const stepPrefix = segments.slice(0, idx + 1).join('/') + '/'
                const isLast = idx === segments.length - 1
                return (
                  <React.Fragment key={stepPrefix}>
                    <ChevronRight size={12} />
                    <button
                      disabled={isLast}
                      onClick={() => onNavigatePrefix(stepPrefix)}
                      style={{ background: 'none', border: 'none', color: isLast ? 'var(--color12)' : 'inherit', fontWeight: isLast ? 600 : 400, cursor: isLast ? 'default' : 'pointer', padding: 0 }}
                    >
                      {seg}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{ padding: 6, borderRadius: 6, border: '1px solid var(--borderColor)', background: 'none', color: 'var(--color10)', cursor: 'pointer', display: 'flex' }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          )}

          {currentBucket && onUploadFile && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onUploadFile(e.target.files)
                  }
                }}
              />
              <button
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, backgroundColor: 'var(--color12)', color: 'var(--background)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }}
              >
                <Upload size={14} />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main File Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, textAlign: 'center', padding: 16 }}>
            <Text style={{ fontSize: 12, color: 'var(--red10)', marginBottom: 4 }}>{error}</Text>
            <Text style={{ fontSize: 12, color: 'var(--color9)' }}>
              Ensure you have sufficient storage permissions.
            </Text>
          </div>
        ) : loading && entries.length === 0 ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{ height: 38, borderRadius: 8, backgroundColor: 'var(--color2)', border: '1px solid var(--borderColor)' }}
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, textAlign: 'center' }}>
            <Folder size={32} />
            <Text style={{ fontSize: 12, color: 'var(--color10)', marginTop: 8 }}>This folder is empty.</Text>
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--borderColor)', color: 'var(--color9)' }}>
                <th style={{ padding: '10px 16px', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '10px 16px', fontWeight: 500, width: 110, textAlign: 'right' }}>Size</th>
                <th style={{ padding: '10px 16px', fontWeight: 500, width: 140, textAlign: 'right' }}>Modified</th>
                <th style={{ padding: '10px 16px', fontWeight: 500, width: 80, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const displayName = entry.key.replace(prefix, '').replace(/\/$/, '')
                return (
                  <tr
                    key={entry.key}
                    style={{ borderBottom: '1px solid var(--borderColor)', transition: 'background-color 0.15s ease' }}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      {entry.isDir ? (
                        <button
                          onClick={() => onNavigatePrefix(entry.key)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color12)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <Folder size={16} />
                          <span>{displayName}</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color11)' }}>
                          <FileIcon size={16} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{displayName}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--color9)', fontFamily: 'monospace', fontSize: 11 }}>
                      {entry.isDir ? '—' : weigh(entry.size)}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--color9)', fontSize: 11 }}>
                      {entry.lastModified
                        ? new Date(entry.lastModified).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        {!entry.isDir && onDownloadFile && (
                          <button
                            onClick={() => onDownloadFile(entry)}
                            style={{ padding: 4, borderRadius: 4, background: 'none', border: 'none', color: 'var(--color10)', cursor: 'pointer' }}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        {onDeleteEntry && (
                          <button
                            onClick={() => onDeleteEntry(entry)}
                            style={{ padding: 4, borderRadius: 4, background: 'none', border: 'none', color: 'var(--color10)', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
