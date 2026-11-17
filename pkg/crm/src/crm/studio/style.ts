import type React from 'react'

/** The studio's card box. */
export const cardBoxStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(12,12,15,0.75)',
  padding: 16,
}

/** The studio's text input. */
export const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(9,9,11,0.9)',
  padding: '8px 12px',
  fontSize: 13,
  color: '#f4f4f5',
  outline: 'none',
}

/** A field label. */
export const labelStyle: React.CSSProperties = { fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }
