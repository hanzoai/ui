'use client'
import React from 'react'
import Spline from '@splinetool/react-spline'
import type { SPEApplication } from '@splinetool/runtime'

import { cn } from '../../util'

export interface SplinePlayerProps {
  scene: string
  className?: string
  style?: React.CSSProperties
  onLoad?: (spline: SPEApplication) => void
}

/**
 * Spline 3D player component
 * Requires: npm install @splinetool/react-spline
 */
const SplinePlayer: React.FC<SplinePlayerProps> = ({
  scene,
  className,
  style,
  onLoad
}) => {
  return (
    <Spline
      scene={scene}
      className={cn('pointer-events-none', className)}
      style={style}
      onLoad={onLoad}
    />
  )
}

export default SplinePlayer
