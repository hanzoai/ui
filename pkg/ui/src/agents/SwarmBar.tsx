import React from 'react'

export interface AgentDescriptor {
  id: string
  name: string
  role: string
  icon: string
  color: string
  status: 'idle' | 'working' | 'ready'
  capabilities: string[]
}

export interface SwarmBarProps {
  agents: AgentDescriptor[]
  activeAgentId: string
  swarmMode: boolean
  onSelectAgent: (id: string) => void
  onToggleSwarm: (enabled: boolean) => void
  className?: string
}

export const SwarmBar: React.FC<SwarmBarProps> = ({
  agents,
  activeAgentId,
  swarmMode,
  onSelectAgent,
  onToggleSwarm,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl ${className}`}
      role="toolbar"
      aria-label="Swarm & Agents Bar"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {agents.map((agent) => {
          const isActive = agent.id === activeAgentId
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
              title={`${agent.name} — ${agent.role}`}
            >
              <span className="text-sm">{agent.icon}</span>
              <span>{agent.name}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  agent.status === 'working'
                    ? 'bg-amber-400 animate-pulse'
                    : agent.status === 'ready'
                    ? 'bg-emerald-400'
                    : 'bg-neutral-500'
                }`}
              />
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onToggleSwarm(!swarmMode)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
          swarmMode
            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
            : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
        }`}
        title="Swarm Mode coordinates multi-agent task execution"
      >
        <span>⚡ Swarm</span>
        <span
          className={`px-1 py-0.2 rounded text-[10px] ${
            swarmMode ? 'bg-indigo-500 text-white font-bold' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {swarmMode ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  )
}
