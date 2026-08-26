'use client'

import * as React from 'react'

import { VideoPlayer } from '../backends/gui/video'
import { Box } from '../box'
import { cn } from '../core/cn'
import type { Dimensions, TShirtSize } from '../types'
import type { VideoBlock } from './def'
import { type BlockComponentProps, fit, sx } from './spec'

/**
 * A video sized against the VIEWPORT.
 *
 * `sizing` asks for a fraction of the window (`{ vh: 60 }`, or
 * `{ mobile: { vw: 70 } }`), and the window is not known on a server. So the
 * first paint is the POSTER, drawn at exactly the box the video will occupy —
 * computed in css units, which the browser can resolve without javascript. The
 * player replaces it once the real measurement arrives.
 *
 * That ordering is the point: sizing the poster from a measured window would
 * mean rendering nothing at all server-side, and the page would jump by the
 * height of a video the moment it hydrated.
 */
export const VideoBlockComponent = ({
  block,
  className,
  agent,
  usePoster = false,
  size = 'md',
  constrainTo,
}: BlockComponentProps & {
  usePoster?: boolean
  size?: TShirtSize
  constrainTo?: Dimensions
}) => {
  const [win, setWin] = React.useState<Dimensions | undefined>(undefined)

  React.useEffect(() => {
    const measure = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    measure()
    // Only a desktop window is worth tracking: a phone "resize" is mostly the
    // url bar sliding away, which would re-lay-out the video for nothing.
    if (agent !== 'desktop') return
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [agent])

  if (block.blockType !== 'video') return <>video block required</>
  const b = block as VideoBlock
  const ratio = b.dim.md.w / b.dim.md.h

  const player = (dim: Dimensions) => (
    <VideoPlayer
      {...sx(cn('mx-auto', className))}
      sources={b.sources ?? []}
      width={dim.w}
      height={dim.h}
      {...b.videoProps}
    />
  )

  /** The poster at the exact box the video will fill, in css the server can emit. */
  const poster = (width: string, height: string) => (
    <Box
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        width,
        height,
        backgroundImage: `url(${b.poster})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )

  const vw = (b.sizing as { mobile?: { vw?: number } } | undefined)?.mobile?.vw
  const vh = (b.sizing as { vh?: number } | undefined)?.vh

  if (agent === 'phone' && vw) {
    if (!win) return poster(`${vw}vw`, `calc(${vw}vw / ${ratio})`)
    const w = (vw / 100) * win.w
    return player({ w, h: w / ratio })
  }

  if (vh) {
    if (!win) return poster(`calc(${vh}vh * ${ratio})`, `${vh}vh`)
    const h = (vh / 100) * win.h
    return player({ w: h * ratio, h })
  }

  const chosen = b.dim[size] ?? b.dim.md
  const dim = constrainTo ? fit(chosen, constrainTo) : chosen

  return usePoster ? (
    <Box
      tag="img"
      src={b.poster}
      alt=""
      width={dim.w}
      height={dim.h}
      className={className}
    />
  ) : (
    player(dim)
  )
}

export default VideoBlockComponent
