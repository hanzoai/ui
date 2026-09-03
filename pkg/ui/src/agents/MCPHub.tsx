import React from 'react'

export interface MCPServerInfo {
  id: string
  name: string
  transport: 'sse' | 'stdio' | 'websocket'
  status: 'connected' | 'disconnected' | 'error'
  toolsCount: number
  resourcesCount: number
}

export interface MCPHubProps {
  servers: MCPServerInfo[]
  onConnectServer?: (serverId: string) => void
  onDisconnectServer?: (serverId: string) => void
  onOpenSettings?: () => void
  className?: string
  style?: React.CSSProperties
}

export const MCPHub: React.FC<MCPHubProps> = ({
  servers,
  onConnectServer,
  onDisconnectServer,
  onOpenSettings,
  className = '',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
        backgroundColor: '#0c0c0e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        ...style,
      }}
      aria-label="MCP Server Hub"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔌</span>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>Model Context Protocol (MCP)</h3>
          <span style={{ padding: '2px 6px', borderRadius: 9999, fontSize: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#d4d4d4', fontFamily: 'monospace' }}>
            {servers.length} Active
          </span>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#a5b4fc', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 8, cursor: 'pointer' }}
          >
            Manage Servers
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {servers.map((server) => {
          const isConnected = server.status === 'connected'
          return (
            <div
              key={server.id}
              style={{ padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#34d399' : '#f87171',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{server.name}</span>
                  <span style={{ fontSize: 10, color: '#a3a3a3', fontFamily: 'monospace', textTransform: 'uppercase', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2px 4px', borderRadius: 4 }}>
                    {server.transport}
                  </span>
                </div>

                <button
                  onClick={() => (isConnected ? onDisconnectServer?.(server.id) : onConnectServer?.(server.id))}
                  style={{ fontSize: 11, color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#a3a3a3', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 4 }}>
                  🛠️ {server.toolsCount} tools
                </span>
                <span style={{ fontSize: 11, color: '#a3a3a3', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 4 }}>
                  📦 {server.resourcesCount} resources
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
