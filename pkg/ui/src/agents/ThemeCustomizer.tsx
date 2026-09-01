import React from 'react'

export interface ThemeConfig {
  blurLevel: 'low' | 'medium' | 'high' | 'ultra'
  accentColor: string
  mode: 'dark' | 'light' | 'system'
}

export interface ThemeCustomizerProps {
  config: ThemeConfig
  onChange: (config: ThemeConfig) => void
  className?: string
}

const ACCENTS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
]

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  config,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-4 p-4 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl ${className}`}
      aria-label="Liquid Glass Theme Customizer"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">🎨</span>
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
          Appearance & Liquid Glass
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-neutral-400 font-medium">Accent Palette</label>
        <div className="flex items-center gap-2">
          {ACCENTS.map((accent) => (
            <button
              key={accent.value}
              onClick={() => onChange({ ...config, accentColor: accent.value })}
              className={`w-6 h-6 rounded-full transition-transform ${
                config.accentColor === accent.value
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: accent.value }}
              title={accent.name}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-neutral-400 font-medium">Glassmorphism Intensity</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['low', 'medium', 'high', 'ultra'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onChange({ ...config, blurLevel: level })}
              className={`py-1 rounded-lg text-xs font-medium capitalize transition-all border ${
                config.blurLevel === level
                  ? 'bg-white/20 text-white border-white/30 font-semibold'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
