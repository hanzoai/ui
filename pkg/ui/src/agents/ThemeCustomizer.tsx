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
  style?: React.CSSProperties
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
      aria-label="Theme Customizer"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🎨</span>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Appearance & Glassmorphism
        </h3>
      </div>

      {/* Accent selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500 }}>Accent Palette</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {ACCENTS.map((accent) => (
            <button
              key={accent.value}
              onClick={() => onChange({ ...config, accentColor: accent.value })}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: accent.value,
                cursor: 'pointer',
                border: config.accentColor === accent.value ? '2px solid #ffffff' : 'none',
                boxShadow: config.accentColor === accent.value ? '0 0 10px ' + accent.value : 'none',
              }}
              title={accent.name}
            />
          ))}
        </div>
      </div>

      {/* Blur / Glass level */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500 }}>Glassmorphism Intensity</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {(['low', 'medium', 'high', 'ultra'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onChange({ ...config, blurLevel: level })}
              style={{
                padding: '6px 0',
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'capitalize',
                borderRadius: 8,
                border: config.blurLevel === level ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: config.blurLevel === level ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: config.blurLevel === level ? '#c7d2fe' : '#a3a3a3',
                cursor: 'pointer',
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
