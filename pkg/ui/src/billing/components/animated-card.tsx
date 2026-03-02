'use client'

import * as React from 'react'

// ── Types ─────────────────────────────────────────────────────────────────

export interface AnimatedCardProps {
  number: string      // raw digits only, up to 16
  name: string
  expiry: string      // MM/YY format
  cvv: string
  cvvFocused: boolean
}

// ── Network detection ─────────────────────────────────────────────────────

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'

function detectNetwork(digits: string): CardNetwork {
  if (digits.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^6(?:011|5)/.test(digits)) return 'discover'
  return 'unknown'
}

// ── SVG logos (inline, no external deps) ─────────────────────────────────

function VisaLogo() {
  return (
    <svg viewBox="0 0 60 20" width="60" height="20" aria-label="Visa">
      <text x="0" y="16" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="18" fill="white" letterSpacing="-1">VISA</text>
    </svg>
  )
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 48 30" width="48" height="30" aria-label="Mastercard">
      <circle cx="15" cy="15" r="14" fill="#eb001b" opacity="0.9" />
      <circle cx="33" cy="15" r="14" fill="#f79e1b" opacity="0.9" />
      <path d="M24 4.8a14 14 0 0 1 0 20.4A14 14 0 0 1 24 4.8z" fill="#ff5f00" opacity="0.9" />
    </svg>
  )
}

function AmexLogo() {
  return (
    <svg viewBox="0 0 70 20" width="70" height="20" aria-label="American Express">
      <text x="0" y="15" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="white" letterSpacing="0.5">AMERICAN</text>
      <text x="0" y="28" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="white" letterSpacing="0.5">EXPRESS</text>
    </svg>
  )
}

function DiscoverLogo() {
  return (
    <svg viewBox="0 0 80 22" width="80" height="22" aria-label="Discover">
      <text x="0" y="16" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="14" fill="white">DISCOVER</text>
      <circle cx="72" cy="11" r="9" fill="#f76f20" />
    </svg>
  )
}

function NetworkLogo({ network }: { network: CardNetwork }) {
  if (network === 'visa') return <VisaLogo />
  if (network === 'mastercard') return <MastercardLogo />
  if (network === 'amex') return <AmexLogo />
  if (network === 'discover') return <DiscoverLogo />
  return null
}

// ── Chip SVG ──────────────────────────────────────────────────────────────

function ChipIcon() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="43" height="33" rx="5.5" fill="#c8a951" stroke="#b8993e" />
      <rect x="14" y="0.5" width="16" height="33" fill="#b8993e" opacity="0.5" />
      <rect x="0.5" y="11" width="43" height="12" fill="#b8993e" opacity="0.5" />
      <rect x="14" y="11" width="16" height="12" fill="#c8a951" opacity="0.8" />
      <line x1="14" y1="0.5" x2="14" y2="33.5" stroke="#a08030" strokeWidth="0.5" />
      <line x1="30" y1="0.5" x2="30" y2="33.5" stroke="#a08030" strokeWidth="0.5" />
      <line x1="0.5" y1="11" x2="43.5" y2="11" stroke="#a08030" strokeWidth="0.5" />
      <line x1="0.5" y1="23" x2="43.5" y2="23" stroke="#a08030" strokeWidth="0.5" />
    </svg>
  )
}

// ── Number masking ────────────────────────────────────────────────────────

function maskNumber(digits: string, network: CardNetwork): string {
  const len = network === 'amex' ? 15 : 16
  const padded = digits.padEnd(len, '\u2022')

  if (network === 'amex') {
    // 4-6-5 format
    return `${padded.slice(0, 4)} ${padded.slice(4, 10)} ${padded.slice(10, 15)}`
  }
  // 4-4-4-4 format, mask all but last 4
  const groups = [
    padded.slice(0, 4),
    padded.slice(4, 8),
    padded.slice(8, 12),
    padded.slice(12, 16),
  ]
  return groups
    .map((g, i) => (i < 3 ? g.replace(/\d/g, '\u2022') : g))
    .join('  ')
}

// ── Animated card ─────────────────────────────────────────────────────────

export function AnimatedCard({ number, name, expiry, cvv, cvvFocused }: AnimatedCardProps) {
  const digits = number.replace(/\D/g, '')
  const network = detectNetwork(digits)
  const maskedNum = maskNumber(digits, network)
  const displayName = name.trim() || 'YOUR NAME'
  const displayExpiry = expiry || 'MM/YY'
  const displayCvv = cvv ? cvv.replace(/./g, '\u2022') : '\u2022\u2022\u2022'

  // Card dimensions: standard 85.6mm x 53.98mm ratio
  const cardStyle: React.CSSProperties = {
    perspective: '1000px',
    width: '340px',
    height: '215px',
  }

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: cvvFocused ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }

  const faceBase: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: '16px',
    overflow: 'hidden',
  }

  const frontStyle: React.CSSProperties = {
    ...faceBase,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
  }

  const backStyle: React.CSSProperties = {
    ...faceBase,
    background: 'linear-gradient(135deg, #12121f 0%, #1a1a2e 100%)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
    transform: 'rotateY(180deg)',
  }

  return (
    <div style={cardStyle} role="img" aria-label="Payment card preview">
      <div style={innerStyle}>
        {/* Front face */}
        <div style={frontStyle}>
          {/* Glossy shine overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          {/* Top row: chip + network */}
          <div style={{ position: 'absolute', top: '22px', left: '22px', right: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <ChipIcon />
            <NetworkLogo network={network} />
          </div>

          {/* Card number */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '22px',
            right: '22px',
            transform: 'translateY(-50%)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}>
            {maskedNum}
          </div>

          {/* Bottom row: name + expiry */}
          <div style={{
            position: 'absolute',
            bottom: '22px',
            left: '22px',
            right: '22px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Card holder</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Expires</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                {displayExpiry}
              </div>
            </div>
          </div>
        </div>

        {/* Back face */}
        <div style={backStyle}>
          {/* Magnetic stripe */}
          <div style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            right: 0,
            height: '46px',
            background: 'linear-gradient(180deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)',
          }} />

          {/* Signature + CVV area */}
          <div style={{
            position: 'absolute',
            top: '108px',
            left: '22px',
            right: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Signature strip */}
            <div style={{
              flex: 1,
              height: '40px',
              background: 'repeating-linear-gradient(90deg, #e8e0d0 0px, #e8e0d0 8px, #d4cabb 8px, #d4cabb 10px)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
            }}>
              <span style={{ fontFamily: 'cursive, serif', fontSize: '12px', color: '#555', opacity: 0.6 }}>Authorized signature</span>
            </div>

            {/* CVV box */}
            <div style={{
              width: '60px',
              height: '40px',
              background: 'white',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: cvvFocused ? '0 0 0 2px #6366f1, 0 0 12px rgba(99,102,241,0.4)' : 'none',
              transition: 'box-shadow 0.3s ease',
            }}>
              <span style={{ fontSize: '9px', color: '#888', marginBottom: '2px' }}>CVV</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', fontWeight: '700', color: '#111', letterSpacing: '0.1em' }}>
                {displayCvv}
              </span>
            </div>
          </div>

          {/* Bottom: network logo */}
          <div style={{ position: 'absolute', bottom: '18px', right: '22px', opacity: 0.7 }}>
            <NetworkLogo network={network} />
          </div>
        </div>
      </div>
    </div>
  )
}
