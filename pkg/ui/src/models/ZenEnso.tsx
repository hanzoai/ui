'use client'

import type { CSSProperties } from 'react'

interface ZenEnsoProps {
  size?: number
  color?: string
  animate?: boolean
  loop?: boolean
  /** If true, renders as a loading spinner variant */
  asLoader?: boolean
  className?: string
}

/**
 * ZenEnso — Animated Enso circle logo for Zen LM.
 * Renders a brush-stroke circle that draws itself, then fills.
 * Uses pure CSS animations — no JS animation library needed.
 */
export function ZenEnso({
  size = 64,
  color = '#A855F7',
  animate = true,
  loop = false,
  asLoader = false,
  className = '',
}: ZenEnsoProps) {
  const uid = Math.random().toString(36).slice(2, 7)

  const strokeDur = loop ? '1.35s' : '1.25s'
  const fillDur = loop ? '0.60s' : '0.55s'
  const iterCount = loop ? 'infinite' : '1'

  const loaderStyle: CSSProperties = asLoader
    ? { animation: `zenEnsoSpin-${uid} 1.2s linear infinite` }
    : {}

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="Zen LM"
    >
      <style>{`
        @keyframes zenEnsoDraw-${uid} {
          to { stroke-dashoffset: 0; }
        }
        @keyframes zenEnsoFill-${uid} {
          0%   { opacity: 0; transform: scale(0.92); filter: blur(6px); }
          60%  { opacity: 1; transform: scale(1.02); filter: blur(1px); }
          100% { opacity: 1; transform: scale(1.00); filter: blur(0px); }
        }
        @keyframes zenEnsoCut-${uid} {
          to { opacity: 1; }
        }
        @keyframes zenEnsoSpin-${uid} {
          to { transform: rotate(360deg); }
        }
        .zen-enso-stroke-${uid} {
          stroke-dasharray: 1200;
          stroke-dashoffset: ${animate ? '1200' : '0'};
          animation: ${animate ? `zenEnsoDraw-${uid} ${strokeDur} cubic-bezier(.2,.9,.25,1) ${iterCount} forwards` : 'none'};
        }
        .zen-enso-fill-${uid} {
          opacity: ${animate ? '0' : '1'};
          transform-origin: 256px 256px;
          transform: scale(${animate ? '0.92' : '1'});
          animation: ${animate ? `zenEnsoFill-${uid} ${fillDur} cubic-bezier(.2,.9,.2,1) ${iterCount} forwards` : 'none'};
          animation-delay: ${animate ? '1.05s' : '0s'};
        }
        .zen-enso-cut-${uid} {
          opacity: ${animate ? '0' : '1'};
          animation: ${animate ? `zenEnsoCut-${uid} 0.01s linear ${iterCount} forwards` : 'none'};
          animation-delay: ${animate ? '1.05s' : '0s'};
        }
      `}</style>
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={loaderStyle}
      >
        {/* Filled circle — revealed after stroke completes */}
        <circle
          className={`zen-enso-fill-${uid}`}
          cx="256"
          cy="256"
          r="172"
          fill={color}
        />
        {/* Brush stroke that draws itself */}
        <path
          className={`zen-enso-stroke-${uid}`}
          d="M256 74 C154 74 78 160 78 258 C78 352 150 432 250 438 C345 444 434 374 438 276 C441 210 406 150 348 118 C305 94 280 86 256 74"
          stroke={color}
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cut notch — gap that makes it an enso, not a solid ring */}
        <path
          className={`zen-enso-cut-${uid}`}
          d="M410 148 C392 126 366 106 340 94"
          stroke="currentColor"
          strokeWidth="34"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export default ZenEnso
