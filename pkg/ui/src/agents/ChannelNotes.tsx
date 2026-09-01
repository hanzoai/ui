import React, { useState } from 'react'

export interface ChannelNotesProps {
  channelName: string
  notes: string
  onSaveNotes: (notes: string) => void
  onExtractActionItems?: (notes: string) => void
  isLiveNoteTakerActive?: boolean
  className?: string
}

export const ChannelNotes: React.FC<ChannelNotesProps> = ({
  channelName,
  notes,
  onSaveNotes,
  onExtractActionItems,
  isLiveNoteTakerActive = false,
  className = '',
}) => {
  const [content, setContent] = useState(notes)
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onSaveNotes(content)
    setIsEditing(false)
  }

  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl ${className}`}
      aria-label="Channel Collaborative Notes"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Notes · #{channelName}
          </h3>
          {isLiveNoteTakerActive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Note Taker
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onExtractActionItems && (
            <button
              onClick={() => onExtractActionItems(content)}
              className="px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
              title="Extract tasks and action items from notes"
            >
              ✨ Extract Tasks
            </button>
          )}

          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
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
          className="w-full p-3 bg-neutral-950/80 border border-white/10 rounded-xl text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500 resize-y"
        />
      ) : (
        <div className="p-3 bg-neutral-950/40 border border-white/5 rounded-xl text-xs text-neutral-300 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto leading-relaxed">
          {content || <span className="text-neutral-500 italic">No notes recorded yet for this channel.</span>}
        </div>
      )}
    </div>
  )
}
