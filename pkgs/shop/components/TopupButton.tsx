'use client'

/**
 * TopupButton — drop-in trigger button for HanzoTopup.
 *
 * Usage:
 *   <TopupButton userId="user_123" token={iamToken} defaultAmount={50_00} />
 */

import React, { useState } from 'react'
import type { TopupConfig } from '../types'
import { HanzoTopup } from './HanzoTopup'

export interface TopupButtonProps extends Partial<TopupConfig> {
  /** Required: the user's account ID */
  userId: string

  /** Button label. Defaults to "Add Funds" */
  label?: string

  /** Additional inline style for the trigger button */
  buttonStyle?: React.CSSProperties

  /** Additional class name for the trigger button */
  className?: string
}

export function TopupButton({
  userId,
  token,
  baseUrl,
  squareAppId,
  squareLocationId,
  squareEnv,
  defaultAmount,
  currency,
  onSuccess,
  onError,
  label = 'Add Funds',
  buttonStyle,
  className,
}: TopupButtonProps) {
  const [open, setOpen] = useState(false)

  const config: TopupConfig = {
    userId,
    token,
    baseUrl,
    squareAppId,
    squareLocationId,
    squareEnv,
    defaultAmount,
    currency,
    onSuccess,
    onError,
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgb(250,250,250)',
          color: 'rgb(9,9,11)',
          fontSize: '14px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          ...buttonStyle,
        }}
      >
        {label}
      </button>

      <HanzoTopup
        config={config}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
