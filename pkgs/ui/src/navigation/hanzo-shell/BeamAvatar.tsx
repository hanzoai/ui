'use client'

import React from 'react'

const COLORS = ['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']

function hashStr(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getUnit(hash: number, range: number, index: number): number {
  const val = hash % (range * (index + 1))
  return val % range
}

function getBoolean(hash: number, index: number): boolean {
  return getUnit(hash, 2, index) === 0
}

function getRandomColor(hash: number, index: number, colors: string[]): string {
  return colors[getUnit(hash, colors.length, index)]
}

function getContrast(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 128 ? '#000' : '#fff'
}

export interface BeamAvatarProps {
  name: string
  size?: number
  colors?: string[]
  className?: string
  square?: boolean
}

export function BeamAvatar({
  name,
  size = 40,
  colors = COLORS,
  className,
  square = false,
}: BeamAvatarProps) {
  const hash = hashStr(name)
  const wrapperColor = getRandomColor(hash, 0, colors)
  const faceColor = getContrast(wrapperColor)
  const isOpen = getBoolean(hash, 2)
  const mouthSpread = getUnit(hash, 3, 7)
  const eyeSpread = getUnit(hash, 5, 8)
  const faceRotate = getUnit(hash, 10, 9)
  const faceTranslateX = faceRotate > 6 ? faceRotate - 10 : faceRotate
  const faceTranslateY = getUnit(hash, 5, 10) > 3 ? getUnit(hash, 5, 10) - 5 : getUnit(hash, 5, 10)

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={square ? undefined : { borderRadius: '50%' }}
    >
      <mask id={`beam-${hash}`} maskUnits="userSpaceOnUse" x={0} y={0} width={36} height={36}>
        <rect width={36} height={36} rx={square ? undefined : 72} fill="#fff" />
      </mask>
      <g mask={`url(#beam-${hash})`}>
        <rect width={36} height={36} fill={wrapperColor} />
        <rect
          x={0}
          y={0}
          width={36}
          height={36}
          transform={`translate(${faceTranslateX} ${faceTranslateY}) rotate(${faceRotate} 18 18)`}
          fill={getRandomColor(hash, 1, colors)}
          rx={6}
        />
        <g
          transform={`translate(${faceTranslateX} ${faceTranslateY}) rotate(${faceRotate} 18 18)`}
        >
          {/* Mouth */}
          {isOpen ? (
            <path
              d={`M15 ${19 + mouthSpread}c2 1 4 1 6 0`}
              stroke={faceColor}
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <path
              d={`M13 ${19 + mouthSpread}a1 .75 0 0 0 10 0`}
              fill={faceColor}
            />
          )}
          {/* Eyes */}
          <rect
            x={14 - eyeSpread}
            y={14}
            width={1.5}
            height={2}
            rx={1}
            fill={faceColor}
          />
          <rect
            x={20 + eyeSpread}
            y={14}
            width={1.5}
            height={2}
            rx={1}
            fill={faceColor}
          />
        </g>
      </g>
    </svg>
  )
}
