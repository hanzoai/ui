import React from 'react'

export interface AgentDescriptor {
  id: string
  name: string
  handle: string
  icon: string
  role: string
  active?: boolean
}

export interface SwarmBarProps {
  agents: AgentDescriptor[]
  selectedAgentId?: string
  onSelectAgent?: (agentId: string) => void
  onAddAgent?: () => void
  className?: string
  style?: React.CSSProperties
}

export const SwarmBar: React.FC<SwarmBarProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onAddAgent,
  className = '',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        backgroundColor: '#0c0c0e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        ...style,
      }}
      aria-label="Multi-Agent Swarm Bar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
        {agents.map((agent) => {
          const isSelected = agent.id === selectedAgentId
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent?.(agent.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500,
                border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#c7d2fe' : '#d4d4d4',
                cursor: 'pointer',
              }}
              title={agent.role}
            >
              <span style={{ fontSize: 14 }}>{agent.icon}</span>
              <span>{agent.handle}</span>
            </button>
          )
        })}

        {onAddAgent && (
          <button
            onClick={onAddAgent}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              borderRadius: 8,
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#a3a3a3',
              cursor: 'pointer',
            }}
            title="Add Agent to Swarm"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  )
}
