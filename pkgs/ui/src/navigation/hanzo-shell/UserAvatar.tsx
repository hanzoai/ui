'use client'

import React, { useState, useMemo } from 'react'
import { BeamAvatar } from './BeamAvatar'

export interface UserAvatarProps {
  /** Direct image URL (uploaded photo) */
  src?: string
  /** Email for Gravatar lookup */
  email?: string
  /** Name for generative fallback seed */
  name?: string
  /** Size in px */
  size?: number
  /** Custom colors for generative avatar */
  colors?: string[]
  className?: string
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function useGravatarUrl(email?: string, size?: number): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useMemo(() => {
    if (!email) {
      setUrl(null)
      return
    }
    const trimmed = email.trim().toLowerCase()
    sha256(trimmed).then((hash) => {
      setUrl(`https://www.gravatar.com/avatar/${hash}?s=${size || 80}&d=404`)
    })
  }, [email, size])

  return url
}

export function UserAvatar({
  src,
  email,
  name,
  size = 40,
  colors,
  className,
}: UserAvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const [gravatarFailed, setGravatarFailed] = useState(false)
  const gravatarUrl = useGravatarUrl(email, size * 2)

  const imgClass = `rounded-full object-cover ${className || ''}`
  const style = { width: size, height: size }

  // Tier 1: uploaded/provided photo
  if (src && !photoFailed) {
    return (
      <img
        src={src}
        alt={name || email || 'avatar'}
        className={imgClass}
        style={style}
        onError={() => setPhotoFailed(true)}
      />
    )
  }

  // Tier 2: Gravatar
  if (gravatarUrl && !gravatarFailed) {
    return (
      <img
        src={gravatarUrl}
        alt={name || email || 'avatar'}
        className={imgClass}
        style={style}
        onError={() => setGravatarFailed(true)}
      />
    )
  }

  // Tier 3: generative beam avatar
  const seed = name || email || 'user'
  return (
    <BeamAvatar
      name={seed}
      size={size}
      colors={colors}
      className={className}
    />
  )
}
