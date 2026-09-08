import React, { useEffect, useRef, useState } from 'react'

export interface LiveVoiceCallProps {
  title?: string
  status?: 'connecting' | 'connected' | 'speaking' | 'listening' | 'ended'
  onEndCall?: () => void
  onToggleMute?: (muted: boolean) => void
  isMuted?: boolean
  transcripts?: Array<{ speaker: string; text: string; time: string }>
  className?: string
  style?: React.CSSProperties
}

export const LiveVoiceCall: React.FC<LiveVoiceCallProps> = ({
  title = 'AI Voice Call',
  status = 'connected',
  onEndCall,
  onToggleMute,
  isMuted = false,
  transcripts = [],
  className = '',
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [muted, setMuted] = useState(isMuted)

  // Animated visualizer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let phase = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const centerY = canvas.height / 2
      const numBars = 32
      const barWidth = 4
      const spacing = (canvas.width - numBars * barWidth) / (numBars - 1)

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + spacing)
        const height =
          status === 'speaking' || status === 'listening'
            ? Math.sin(phase + i * 0.25) * 20 + 24
            : 6

        ctx.fillStyle =
          status === 'speaking'
            ? '#34d399'
            : status === 'listening'
            ? '#818cf8'
            : '#737373'

        ctx.beginPath()
        ctx.roundRect(x, centerY - height / 2, barWidth, height, 2)
        ctx.fill()
      }

      phase += 0.08
      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [status])

  const handleMute = () => {
    const next = !muted
    setMuted(next)
    onToggleMute?.(next)
  }

  const statusText =
    status === 'speaking'
      ? 'Agent is speaking...'
      : status === 'listening'
      ? 'Listening to you...'
      : status === 'connecting'
      ? 'Connecting stream...'
      : 'Call active'

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
      aria-label="Live Voice Call"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#34d399' }} />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>{title}</h3>
        </div>
        <span style={{ fontSize: 12, color: '#a3a3a3', fontFamily: 'monospace' }}>{statusText}</span>
      </div>

      {/* Visualizer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(10, 10, 10, 0.6)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <canvas ref={canvasRef} width={380} height={70} style={{ width: '100%', height: 70 }} />
      </div>

      {/* Live transcript stream */}
      {transcripts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
          {transcripts.map((t, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#737373' }}>
                <span style={{ fontWeight: 600, color: '#d4d4d4' }}>{t.speaker}</span>
                <span>{t.time}</span>
              </div>
              <p style={{ color: '#e5e5e5', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 8, margin: 0 }}>{t.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Call controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
        <button
          onClick={handleMute}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            backgroundColor: muted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: muted ? '#fda4af' : '#d4d4d4',
          }}
        >
          {muted ? 'Unmute Mic' : 'Mute Mic'}
        </button>

        {onEndCall && (
          <button
            onClick={onEndCall}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: '#e11d48', color: '#ffffff', fontSize: 12, fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer' }}
          >
            End Call
          </button>
        )}
      </div>
    </div>
  )
}
