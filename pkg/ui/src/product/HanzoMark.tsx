'use client'

/**
 * The Hanzo "H" mark — the canonical brand glyph (same geometry as app/icon.svg).
 *
 * Rendered as inline SVG with `fill: currentColor`, so it inherits the
 * surrounding text color and adapts to the dark/light theme with no per-theme
 * asset. ONE source for the mark across the chrome (sidebar + header).
 */
export function HanzoMark({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 67 67"
      role="img"
      aria-label="Hanzo"
      fill={color}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M22.21 67V44.6369H0V67H22.21Z" />
      <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
      <path d="M22.21 0H0V22.3184H22.21V0Z" />
      <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
      <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
    </svg>
  )
}
