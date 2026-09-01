import React, { useEffect, useRef } from 'react'

export interface LiveVoiceCallProps {
  active: boolean
  muted: boolean
  title?: string
  statusText?: string
  transcripts?: { speaker: string; text: string; time: string }[]
  onToggleMute: () => void
  onEndCall: () => void
  className?: string
}

export const LiveVoiceCall: React.FC<LiveVoiceCallProps> = ({
  active,
  muted,
  title = 'Duplex Voice Session',
  statusText = 'Connected · 24kHz Opus',
  transcripts = [],
  onToggleMute,
  onEndCall,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let phase = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const width = canvas.width
      const height = canvas.height
      const centerY = height / 2

      const bars = 36
      const barWidth = width / bars - 2

      for (let i = 0; i < bars; i++) {
        const amplitude = muted
          ? 4
          : Math.sin(phase + i * 0.3) * 18 + Math.cos(phase * 1.5 + i * 0.2) * 12 + 22
        const barHeight = Math.max(4, Math.abs(amplitude))

        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight)
        if (muted) {
          gradient.addColorStop(0, '#71717a')
          gradient.addColorStop(1, '#3f3f46')
        } else {
          gradient.addColorStop(0, '#818cf8')
          gradient.addColorStop(0.5, '#c084fc')
          gradient.addColorStop(1, '#38bdf8')
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(i * (barWidth + 2), centerY - barHeight / 2, barWidth, barHeight, 4)
        ctx.fill()
      }

      phase += muted ? 0.02 : 0.08
      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [active, muted])

  if (!active) return null

  return (
    <div
      className={`flex flex-col gap-4 p-5 bg-neutral-900/80 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl ${className}`}
      role="dialog"
      aria-label="Live Voice Call"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs text-neutral-400 font-mono">{statusText}</span>
      </div>

      <div className="flex items-center justify-center p-4 bg-neutral-950/60 rounded-xl border border-white/5">
        <canvas ref={canvasRef} width={380} height={70} className="w-full h-[70px]" />
      </div>

      {transcripts.length > 0 && (
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
          {transcripts.map((t, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="font-semibold text-neutral-300">{t.speaker}</span>
                <span>{t.time}</span>
              </div>
              <p className="text-neutral-200 bg-white/5 p-2 rounded-lg">{t.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onToggleMute}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
            muted
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
          }`}
        >
          <span>{muted ? '🔇 Unmute' : '🎙️ Mute'}</span>
        </button>

        <button
          onClick={onEndCall}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/30"
        >
          <span>📞 Leave Call</span>
        </button>
      </div>
    </div>
  )
}
