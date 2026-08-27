'use client'

/**
 * Video.
 *
 * `VideoPlayer` is a `<video>` that takes its sources as an array, because a
 * block describes them that way and every caller was otherwise writing the same
 * `<source>` map.
 *
 * `YouTubeEmbed` shows the poster first and mounts the iframe on click. That is
 * not a nicety: an embed loads ~1MB and sets cookies on sight, so a page with
 * several of them pays for all of them before anyone watches one. The
 * `-nocookie` host is the same trade — YouTube's own domain for embeds that
 * defers its cookie until playback starts.
 */
import * as React from 'react'
import { Box } from '../../box'

export type VideoPlayerProps = Omit<React.ComponentPropsWithoutRef<'video'>, 'src'> & {
  sources: string[]
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ sources, ...rest }, ref) => (
    <video ref={ref} {...rest}>
      {sources.map((src, i) => (
        <source key={i} src={src} />
      ))}
    </video>
  ),
)
VideoPlayer.displayName = 'VideoPlayer'

/** YouTube's own play mark, drawn rather than imported so this pulls no icon set. */
const Play = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size * 0.7}
    viewBox="0 0 68 48"
    role="img"
    aria-hidden
    style={{ transition: 'transform .15s ease' }}
  >
    <path
      d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.6a8.6 8.6 0 0 0-6 6A89.7 89.7 0 0 0 0 24a89.7 89.7 0 0 0 1.5 16.3 8.6 8.6 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.6a8.6 8.6 0 0 0 6-6A89.7 89.7 0 0 0 68 24a89.7 89.7 0 0 0-1.5-16.3z"
      fill="#f00"
    />
    <path d="M27 34V14l18 10-18 10z" fill="#fff" />
  </svg>
)

export type YouTubeEmbedProps = {
  youtubeID: string
  width: number
  height: number
  buttonSize?: number
  /** Start offset, e.g. `'5s'`. */
  timeAt?: string
  title?: string
  caption?: string
  className?: string
}

export const YouTubeEmbed = ({
  youtubeID,
  width,
  height,
  buttonSize = 100,
  timeAt,
  title,
  caption,
  className,
}: YouTubeEmbedProps) => {
  const [playing, setPlaying] = React.useState(false)

  if (playing) {
    // autoplay is honoured because the iframe mounts inside a click.
    const q = `${timeAt ? `?t=${timeAt}&` : '?'}rel=0&autoplay=1`
    return (
      <Box className={className}>
        <iframe
          width={width}
          height={height}
          src={`https://www.youtube-nocookie.com/embed/${youtubeID}${q}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'YouTube video'}
          style={{ aspectRatio: '16 / 9', width: '100%', height: '100%', border: 0, padding: 0 }}
        />
      </Box>
    )
  }

  return (
    <Box className={className}>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={title ? `Play ${title}` : 'Play video'}
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          width: '100%',
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <img
          src={`https://img.youtube.com/vi/${youtubeID}/maxresdefault.jpg`}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'grid',
            placeItems: 'center',
            opacity: 0.9,
          }}
        >
          <Play size={buttonSize} />
        </span>
        {caption && (
          <p
            className="hz-prose"
            style={{
              position: 'absolute',
              left: '50%',
              top: 20,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            {caption}
          </p>
        )}
      </button>
    </Box>
  )
}
