import React from 'react'

export interface ChannelMember {
  id: string
  name: string
  role: string
  avatar?: string
  status: 'online' | 'offline' | 'busy'
  isAgent?: boolean
}

export interface ChannelMembersProps {
  members: ChannelMember[]
  onDirectMessage?: (memberId: string) => void
  onInviteMember?: () => void
  className?: string
  style?: React.CSSProperties
}

export const ChannelMembers: React.FC<ChannelMembersProps> = ({
  members,
  onDirectMessage,
  onInviteMember,
  className = '',
  style,
}) => {
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
      aria-label="Channel Member Roster"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Members ({members.length})
          </h3>
        </div>

        {onInviteMember && (
          <button
            onClick={onInviteMember}
            style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#d4d4d4', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, cursor: 'pointer' }}
          >
            + Invite
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 224, overflowY: 'auto', paddingRight: 4 }}>
        {members.map((m) => (
          <div
            key={m.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#d4d4d4', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {m.name.charAt(0)}
                </div>
                {m.status === 'online' && (
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34d399', border: '1px solid #171717' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.name}
                  {m.isAgent && (
                    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                      AI
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 10, color: '#a3a3a3' }}>{m.role}</span>
              </div>
            </div>

            {onDirectMessage && (
              <button
                onClick={() => onDirectMessage(m.id)}
                style={{ padding: '2px 8px', fontSize: 11, color: '#a3a3a3', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, border: 'none', cursor: 'pointer' }}
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
