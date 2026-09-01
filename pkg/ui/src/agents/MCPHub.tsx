import React from 'react'

export interface MCPServerInfo {
  id: string
  name: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  transport: 'sse' | 'stdio' | 'websocket'
  endpoint?: string
  toolsCount: number
  resourcesCount: number
  tools: { name: string; description: string; enabled: boolean }[]
}

export interface MCPHubProps {
  servers: MCPServerInfo[]
  onToggleTool: (serverId: string, toolName: string, enabled: boolean) => void
  onReconnect: (serverId: string) => void
  onAddServer?: () => void
  className?: string
}

export const MCPHub: React.FC<MCPHubProps> = ({
  servers,
  onToggleTool,
  onReconnect,
  onAddServer,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl ${className}`}
      aria-label="Model Context Protocol Hub"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔌</span>
          <h3 className="text-sm font-semibold text-white">Model Context Protocol (MCP)</h3>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-neutral-300 font-mono">
            {servers.length} servers
          </span>
        </div>
        {onAddServer && (
          <button
            onClick={onAddServer}
            className="px-2.5 py-1 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all"
          >
            + Add Server
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {servers.map((server) => (
          <div
            key={server.id}
            className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    server.status === 'connected'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : server.status === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-400'
                  }`}
                />
                <span className="text-xs font-semibold text-white">{server.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono uppercase bg-white/5 px-1 py-0.5 rounded">
                  {server.transport}
                </span>
              </div>
              <button
                onClick={() => onReconnect(server.id)}
                className="text-[11px] text-neutral-400 hover:text-white transition-colors"
                title="Reconnect server"
              >
                ↻
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {server.tools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => onToggleTool(server.id, tool.name, !tool.enabled)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all border ${
                    tool.enabled
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-neutral-500 border-white/5 line-through opacity-60'
                  }`}
                  title={tool.description}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
