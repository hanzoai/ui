'use client'

/**
 * Media — a looping, muted video that can be left running.
 *
 * It holds its aspect ratio from the first byte, so nothing moves when the video
 * arrives, and it paints `poster` until it plays. A reader who asks the system
 * for reduced motion gets the poster and no video at all: the file is not
 * fetched, nothing loops. Without script the `<video>` autoplays as authored.
 *
 * `onPlay` fires once, the first time half of it is on screen.
 */
import { YStack } from '@hanzo/gui'
import { useEffect, useRef, useState } from 'react'

import { slot } from '../backends/gui/slot'
import { useSeen } from './seen'

export type MediaProps = {
  /** Each format the video is encoded in, best first: `{ src: '/demo.webm', type: 'video/webm' }`. */
  sources: readonly { src: string; type: string }[]
  poster: string
  /** What the video shows, for a reader who cannot see it. */
  label: string
  /** Width over height. The box is this shape before anything loads. */
  ratio?: number
  onPlay?: () => void
}

const Media = ({ sources, poster, label, ratio = 4 / 3, onPlay }: MediaProps) => {
  const box = useRef<HTMLDivElement>(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    if (typeof matchMedia === 'function') setStill(matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useSeen(box, onPlay)

  return (
    <YStack {...slot('media')} ref={box as never} width="100%" aspectRatio={ratio} overflow="hidden" bg="$panel">
      {still ? (
        <img src={poster} alt={label} style={FILL} />
      ) : (
        <video autoPlay muted loop playsInline preload="metadata" poster={poster} aria-label={label} style={FILL}>
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}
    </YStack>
  )
}

const FILL = { display: 'block', width: '100%', height: '100%', objectFit: 'cover' } as const

export { Media }
