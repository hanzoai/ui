import React from 'react'
import type { OgConfig } from './types.js'
import { MODALITY_COLORS } from './theme.js'

// Design tokens
const TEXT = '#ffffff'
const MUTED = '#888888'
const BORDER = '#2a2a2a'
const CARD = '#111111'
const FONT = 'Inter, system-ui, sans-serif'
const MONO = 'JetBrains Mono, Menlo, monospace'

function BrandMark({ svgIcon, accentColor }: { svgIcon?: string; accentColor: string }) {
  if (svgIcon) {
    return (
      <img
        src={`data:image/svg+xml,${encodeURIComponent(svgIcon)}`}
        width={32}
        height={32}
        style={{ borderRadius: '4px' }}
      />
    )
  }
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        background: accentColor,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ color: TEXT, fontWeight: 'bold', fontSize: '18px', fontFamily: FONT }}>H</span>
    </div>
  )
}

function Pill({
  text,
  bg = '#1a1a1a',
  border = BORDER,
  color = '#cccccc',
  fontSize = '14px',
}: {
  text: string
  bg?: string
  border?: string
  color?: string
  fontSize?: string
}) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '100px',
        padding: '7px 16px',
        color,
        fontSize,
        fontFamily: FONT,
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  )
}

function Header({
  domain,
  siteName,
  badge,
  accentColor,
  svgIcon,
}: {
  domain: string
  siteName?: string
  badge?: string
  accentColor: string
  svgIcon?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '40px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BrandMark svgIcon={svgIcon} accentColor={accentColor} />
        {siteName && (
          <span style={{ color: TEXT, fontSize: '16px', fontWeight: '600', fontFamily: FONT }}>
            {siteName}
          </span>
        )}
        <span style={{ color: MUTED, fontSize: '15px', fontFamily: FONT }}>{domain}</span>
      </div>
      {badge && (
        <div
          style={{
            background: accentColor,
            borderRadius: '100px',
            padding: '6px 14px',
            color: TEXT,
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: FONT,
          }}
        >
          {badge}
        </div>
      )}
    </div>
  )
}

function Footer({ pills, accentColor }: { pills?: string[]; accentColor: string }) {
  if (!pills || pills.length === 0) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginTop: '32px',
        flexShrink: 0,
      }}
    >
      {pills.map((p) => (
        <Pill key={p} text={p} />
      ))}
    </div>
  )
}

// --- Layout renderers ---

function LayoutPage(config: OgConfig & { accentColor: string; bgColor: string }) {
  const lines = config.title.split('\n')
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h1
          style={{
            color: TEXT,
            fontSize: lines.some((l) => l.length > 20) ? '72px' : '80px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            margin: 0,
            fontFamily: FONT,
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {i === lines.length - 1 && lines.length > 1 ? (
                <span style={{ color: config.accentColor }}>{line}</span>
              ) : (
                line
              )}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {config.subtitle && (
          <p style={{ color: MUTED, fontSize: '22px', marginTop: '24px', maxWidth: '740px', fontFamily: FONT }}>
            {config.subtitle}
          </p>
        )}
      </div>
      <Footer pills={config.pills} accentColor={config.accentColor} />
    </>
  )
}

function LayoutStat(config: OgConfig & { accentColor: string }) {
  const lines = config.title.split('\n')
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {config.stat && (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
            <span
              style={{
                color: config.accentColor,
                fontSize: '120px',
                fontWeight: 'bold',
                lineHeight: 1.0,
                fontFamily: FONT,
              }}
            >
              {config.stat.value}
            </span>
            <span style={{ color: TEXT, fontSize: '28px', fontWeight: '600', fontFamily: FONT }}>
              {config.stat.label}
            </span>
          </div>
        )}
        <h1
          style={{
            color: TEXT,
            fontSize: '52px',
            fontWeight: 'bold',
            lineHeight: 1.15,
            margin: 0,
            fontFamily: FONT,
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {config.subtitle && (
          <p style={{ color: MUTED, fontSize: '20px', marginTop: '16px', fontFamily: FONT }}>
            {config.subtitle}
          </p>
        )}
      </div>
      <Footer pills={config.pills} accentColor={config.accentColor} />
    </>
  )
}

function LayoutCode(config: OgConfig & { accentColor: string }) {
  const lines = config.title.split('\n')
  const codeLines = (config.codeSnippet ?? '').split('\n')
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h1
          style={{
            color: TEXT,
            fontSize: '64px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            margin: '0 0 24px 0',
            fontFamily: FONT,
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {config.codeSnippet && (
          <div
            style={{
              background: '#0d1117',
              border: `1px solid ${BORDER}`,
              borderRadius: '10px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {codeLines.map((line, i) => (
              <span
                key={i}
                style={{
                  color: '#e6edf3',
                  fontSize: '15px',
                  fontFamily: MONO,
                  whiteSpace: 'pre',
                }}
              >
                {line}
              </span>
            ))}
          </div>
        )}
        {config.subtitle && (
          <p style={{ color: MUTED, fontSize: '18px', marginTop: '20px', fontFamily: FONT }}>
            {config.subtitle}
          </p>
        )}
      </div>
      <Footer pills={config.pills} accentColor={config.accentColor} />
    </>
  )
}

function LayoutSplit(config: OgConfig & { accentColor: string }) {
  const lines = config.title.split('\n')
  const pills = config.pills ?? []
  return (
    <div style={{ display: 'flex', flex: 1, gap: '48px' }}>
      {/* Left 55% */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: '55 1 0', justifyContent: 'center' }}>
        <h1
          style={{
            color: TEXT,
            fontSize: '68px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            margin: 0,
            fontFamily: FONT,
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {config.subtitle && (
          <p style={{ color: MUTED, fontSize: '20px', marginTop: '20px', fontFamily: FONT }}>
            {config.subtitle}
          </p>
        )}
      </div>
      {/* Right 45% */}
      <div
        style={{
          display: 'flex',
          flex: '45 1 0',
          flexWrap: 'wrap',
          gap: '10px',
          alignContent: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {pills.map((p) => (
          <div
            key={p}
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              padding: '10px 18px',
              color: '#cccccc',
              fontSize: '15px',
              fontFamily: FONT,
              flexShrink: 0,
            }}
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  )
}

function LayoutModel(config: OgConfig & { accentColor: string }) {
  const modalities = config.modalities ?? []
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {config.provider && (
          <span style={{ color: MUTED, fontSize: '18px', marginBottom: '12px', fontFamily: FONT }}>
            {config.provider}
          </span>
        )}
        <h1
          style={{
            color: TEXT,
            fontSize: (config.title?.length ?? 0) > 24 ? '56px' : '72px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            margin: '0 0 20px 0',
            fontFamily: FONT,
          }}
        >
          {config.title}
        </h1>
        {/* badges row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {config.contextWindow && (
            <div
              style={{
                background: '#1a2a1a',
                border: '1px solid #22c55e44',
                borderRadius: '6px',
                padding: '5px 12px',
                color: '#22c55e',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: FONT,
              }}
            >
              {config.contextWindow} ctx
            </div>
          )}
          {modalities.slice(0, 6).map((mod) => (
            <div
              key={mod}
              style={{
                background: `${MODALITY_COLORS[mod] ?? '#666'}22`,
                border: `1px solid ${MODALITY_COLORS[mod] ?? '#666'}44`,
                borderRadius: '6px',
                padding: '5px 12px',
                color: MODALITY_COLORS[mod] ?? '#ccc',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: FONT,
              }}
            >
              {mod}
            </div>
          ))}
        </div>
        {config.subtitle && (
          <p style={{ color: MUTED, fontSize: '18px', margin: 0, fontFamily: FONT }}>
            {config.subtitle}
          </p>
        )}
      </div>
      {config.pills && config.pills.length > 0 && (
        <Footer pills={config.pills} accentColor={config.accentColor} />
      )}
    </>
  )
}

function LayoutMinimal(config: OgConfig & { accentColor: string }) {
  const lines = config.title.split('\n')
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <h1
        style={{
          color: TEXT,
          fontSize: '88px',
          fontWeight: 'bold',
          lineHeight: 1.1,
          margin: 0,
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </h1>
      {config.subtitle && (
        <p style={{ color: MUTED, fontSize: '22px', margin: 0, textAlign: 'center', fontFamily: FONT }}>
          {config.subtitle}
        </p>
      )}
    </div>
  )
}

/**
 * Renders the JSX element for ImageResponse.
 * Call this inside your opengraph-image.tsx:
 *   return new ImageResponse(renderOgImage(config), { width, height })
 */
export function renderOgImage(config: OgConfig): React.ReactElement {
  const accentColor = config.accentColor ?? '#EF4444'
  const bgColor = config.bgColor ?? '#0a0a0a'
  const domain = config.domain ?? 'hanzo.ai'
  const layout = config.layout ?? 'page'

  const resolved = { ...config, accentColor, bgColor, domain }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: bgColor,
        padding: '56px 64px',
        fontFamily: FONT,
      }}
    >
      <Header
        domain={domain}
        siteName={config.siteName}
        badge={config.badge}
        accentColor={accentColor}
        svgIcon={config.svgIcon}
      />

      {layout === 'stat' && <LayoutStat {...resolved} />}
      {layout === 'code' && <LayoutCode {...resolved} />}
      {layout === 'split' && <LayoutSplit {...resolved} />}
      {layout === 'model' && <LayoutModel {...resolved} />}
      {layout === 'minimal' && <LayoutMinimal {...resolved} />}
      {(layout === 'page' || !layout) && <LayoutPage {...resolved} />}
    </div>
  )
}
