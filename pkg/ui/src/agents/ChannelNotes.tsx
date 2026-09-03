import React, { useState } from 'react'

export interface ChannelNotesProps {
  channelName: string
  notes: string
  onSaveNotes: (notes: string) => void
  onExtractActionItems?: (notes: string) => void
  isLiveNoteTakerActive?: boolean
  className?: string
  style?: React.CSSProperties
}

export const ChannelNotes: React.FC<ChannelNotesProps> = ({
  channelName,
  notes,
  onSaveNotes,
  onExtractActionItems,
  isLiveNoteTakerActive = false,
  className = '',
  style,
}) => {
  const [content, setContent] = useState(notes)
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onSaveNotes(content)
    setIsEditing(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        backgroundColor: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        ...style,
      }}
      aria-label="Channel Collaborative Notes"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Notes · #{channelName}
          </h3>
          {isLiveNoteTakerActive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, fontSize: 10, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', fontWeight: 500, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399' }} />
              AI Note Taker
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onExtractActionItems && (
            <button
              onClick={() => onExtractActionItems(content)}
              style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#d8b4fe', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 8, cursor: 'pointer' }}
              title="Extract tasks and action items from notes"
            >
              ✨ Extract Tasks
            </button>
          )}

          {isEditing ? (
            <button
              onClick={handleSave}
              style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#ffffff', backgroundColor: '#4f46e5', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#d4d4d4', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, cursor: 'pointer' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write shared channel notes, meeting agenda, or AI summaries..."
          rows={6}
          style={{ width: '100%', padding: 12, backgroundColor: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, fontSize: 12, color: '#e5e5e5', fontFamily: 'monospace', outline: 'none', resize: 'vertical' }}
        />
      ) : (
        <div style={{ padding: 12, backgroundColor: 'rgba(10, 10, 10, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 12, fontSize: 12, color: '#d4d4d4', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 240, overflowY: 'auto', lineHeight: 1.5 }}>
          {content || <span style={{ color: '#737373', fontStyle: 'italic' }}>No notes recorded yet for this channel.</span>}
        </div>
      )}
    </div>
  )
}
