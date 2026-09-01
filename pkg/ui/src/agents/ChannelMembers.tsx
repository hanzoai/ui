import React from 'react'

export interface ChannelMember {
  id: string
  name: string
  role: string
  avatar?: string
  isAgent?: boolean
  online?: boolean
}

export interface ChannelMembersProps {
  members: ChannelMember[]
  onInvite?: () => void
  onDirectMessage?: (memberId: string) => void
  className?: string
}

export const ChannelMembers: React.FC<ChannelMembersProps> = ({
  members,
  onInvite,
  onDirectMessage,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl ${className}`}
      aria-label="Channel Members Roster"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">👥</span>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Members ({members.length})
          </h3>
        </div>
        {onInvite && (
          <button
            onClick={onInvite}
            className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
          >
            + Invite
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-300 border border-white/10">
                  {m.avatar || m.name.slice(0, 2).toUpperCase()}
                </div>
                {m.online && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-neutral-900" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white flex items-center gap-1.5">
                  {m.name}
                  {m.isAgent && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      AGENT
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-400">{m.role}</span>
              </div>
            </div>

            {onDirectMessage && !m.isAgent && (
              <button
                onClick={() => onDirectMessage(m.id)}
                className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white bg-white/5 rounded-md transition-colors"
              >
                DM
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
