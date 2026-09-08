'use client'

/**
 * MediaPlayer — a `<video>` with a full transport: play/pause, seek, skip,
 * volume, captions, speed, quality, picture-in-picture and fullscreen.
 *
 * The `<video>` element is the platform primitive — there is no reimplementing
 * decode or buffering in userland — wrapped in a `@hanzo/gui` frame that supplies
 * layout, theming and the overlay chrome. The transport itself is plain state
 * plus the DOM media/fullscreen/PiP APIs the element already exposes.
 *
 * Progress and volume are both the existing `Slider`, not a hand-rolled bar —
 * one control, two uses, so a caller learns its keyboard and touch behaviour
 * once. Speed and quality are the existing `DropdownMenu` for the same reason.
 */
import * as React from 'react'
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import {
  Captions,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
} from '@hanzogui/lucide-icons-2'

import { Button } from './button'
import { Slider } from './slider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Spinner } from './spinner'
import { slot } from './slot'

export type MediaSource = {
  src: string
  type: string
  quality?: string
}

export type MediaSubtitleTrack = {
  src: string
  label: string
  srcLang: string
  default?: boolean
}

export type MediaPlayerSize = 'sm' | 'md' | 'lg' | 'full'

const MAX_WIDTH: Record<Exclude<MediaPlayerSize, 'full'>, number> = {
  sm: 448,
  md: 672,
  lg: 896,
}

const SKIP_SECONDS = 10
const HIDE_AFTER_MS = 3000
const HIDE_ON_LEAVE_MS = 1000
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const Frame = styled(YStack, {
  name: 'MediaPlayer',
  position: 'relative',
  width: '100%',
  aspectRatio: 16 / 9,
  bg: '#000000',
  rounded: '$4',
  overflow: 'hidden',

  variants: {
    size: {
      sm: { maxWidth: MAX_WIDTH.sm },
      md: { maxWidth: MAX_WIDTH.md },
      lg: { maxWidth: MAX_WIDTH.lg },
      full: {},
    },
  } as const,

  defaultVariants: { size: 'md' },
})

/** mm:ss, or h:mm:ss once the clip runs past an hour. */
const formatTime = (time: number) => {
  if (!Number.isFinite(time)) return '0:00'
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const overlayButton = {
  variant: 'ghost',
  size: 'icon-sm',
  color: 'white',
  hoverStyle: { bg: 'rgba(255,255,255,0.2)' },
} as const

export type MediaPlayerProps = Omit<
  React.ComponentPropsWithoutRef<typeof Frame>,
  'onPlay' | 'onPause' | 'onEnded' | 'children'
> & {
  sources: MediaSource[]
  poster?: string
  subtitles?: MediaSubtitleTrack[]
  size?: MediaPlayerSize
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'auto' | 'metadata' | 'none'
  controls?: boolean
  disableKeyboard?: boolean
  disablePictureInPicture?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onVolumeChange?: (volume: number) => void
  onQualityChange?: (quality: string) => void
  onSpeedChange?: (speed: number) => void
}

export function MediaPlayer({
  sources,
  poster,
  subtitles = [],
  size = 'md',
  autoPlay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
  controls = true,
  disableKeyboard = false,
  disablePictureInPicture = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onQualityChange,
  onSpeedChange,
  ...props
}: MediaPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(1)
  const [isMuted, setIsMuted] = React.useState(muted)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showControls, setShowControls] = React.useState(true)
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1)
  const [currentQuality, setCurrentQuality] = React.useState(
    sources.find((s) => s.quality)?.quality ?? 'auto',
  )
  const [showSubtitles, setShowSubtitles] = React.useState(false)
  const [isBuffering, setIsBuffering] = React.useState(false)
  const [isPictureInPicture, setIsPictureInPicture] = React.useState(false)

  const qualityOptions = React.useMemo(() => {
    const seen = new Set<string>()
    for (const s of sources) if (s.quality) seen.add(s.quality)
    return ['auto', ...seen]
  }, [sources])

  const togglePlayPause = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) video.pause()
    else void video.play()
  }, [isPlaying])

  const seekTo = React.useCallback((time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time
  }, [])

  const skip = React.useCallback(
    (seconds: number) => {
      seekTo(Math.max(0, Math.min(duration, currentTime + seconds)))
    },
    [currentTime, duration, seekTo],
  )

  const toggleMute = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const changeVolume = React.useCallback(
    (next: number) => {
      const video = videoRef.current
      if (!video) return
      const clamped = Math.max(0, Math.min(1, next))
      video.volume = clamped
      setVolume(clamped)
      setIsMuted(clamped === 0)
      onVolumeChange?.(clamped)
    },
    [onVolumeChange],
  )

  const toggleFullscreen = React.useCallback(async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Fullscreen can be refused by the browser (no gesture, disabled by
      // policy) — the button simply has no effect, nothing to recover.
    }
  }, [])

  const togglePictureInPicture = React.useCallback(async () => {
    const video = videoRef.current
    if (!video || disablePictureInPicture) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else await video.requestPictureInPicture()
    } catch {
      // Same as fullscreen: an unsupported browser or a refused request just
      // leaves picture-in-picture off.
    }
  }, [disablePictureInPicture])

  const changePlaybackSpeed = React.useCallback(
    (speed: number) => {
      const video = videoRef.current
      if (!video) return
      video.playbackRate = speed
      setPlaybackSpeed(speed)
      onSpeedChange?.(speed)
    },
    [onSpeedChange],
  )

  const changeQuality = React.useCallback(
    (quality: string) => {
      const video = videoRef.current
      if (!video) return
      const at = video.currentTime
      const wasPlaying = !video.paused
      const next = quality === 'auto' ? sources[0]?.src : sources.find((s) => s.quality === quality)?.src
      if (next) video.src = next
      video.addEventListener(
        'loadedmetadata',
        () => {
          video.currentTime = at
          if (wasPlaying) void video.play()
        },
        { once: true },
      )
      setCurrentQuality(quality)
      onQualityChange?.(quality)
    },
    [sources, onQualityChange],
  )

  const hideControlsAfterTimeout = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setIsPlaying((playing) => {
        if (playing) setShowControls(false)
        return playing
      })
    }, HIDE_AFTER_MS)
  }, [])

  const showControlsTemporarily = React.useCallback(() => {
    setShowControls(true)
    hideControlsAfterTimeout()
  }, [hideControlsAfterTimeout])

  // Keyboard shortcuts, active only while focus is inside this player.
  React.useEffect(() => {
    if (disableKeyboard) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlayPause()
          break
        case 'KeyF':
          e.preventDefault()
          void toggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-SKIP_SECONDS)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(SKIP_SECONDS)
          break
        case 'ArrowUp':
          e.preventDefault()
          changeVolume(volume + 0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          changeVolume(volume - 0.1)
          break
        case 'KeyC':
          e.preventDefault()
          setShowSubtitles((v) => !v)
          break
        case 'KeyP':
          e.preventDefault()
          void togglePictureInPicture()
          break
      }
      showControlsTemporarily()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    disableKeyboard,
    togglePlayPause,
    toggleFullscreen,
    toggleMute,
    skip,
    changeVolume,
    volume,
    togglePictureInPicture,
    showControlsTemporarily,
  ])

  // Media element events.
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      setIsPlaying(true)
      setIsBuffering(false)
      onPlay?.()
      hideControlsAfterTimeout()
    }
    const handlePause = () => {
      setIsPlaying(false)
      setIsBuffering(false)
      onPause?.()
      setShowControls(true)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setDuration(video.duration)
      onTimeUpdate?.(video.currentTime, video.duration)
    }
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsBuffering(false)
    }
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setShowControls(true)
      onEnded?.()
    }
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const handleEnter = () => setIsPictureInPicture(true)
    const handleLeave = () => setIsPictureInPicture(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('enterpictureinpicture', handleEnter)
    video.addEventListener('leavepictureinpicture', handleLeave)
    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('enterpictureinpicture', handleEnter)
      video.removeEventListener('leavepictureinpicture', handleLeave)
    }
  }, [onPlay, onPause, onTimeUpdate, onEnded, hideControlsAfterTimeout])

  React.useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleMouseMove = () => showControlsTemporarily()
    const handleMouseLeave = () => {
      if (!isPlaying || !hideTimer.current) return
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setShowControls(false), HIDE_ON_LEAVE_MS)
    }
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isPlaying, showControlsTemporarily])

  return (
    <Frame ref={containerRef as never} size={size} tabIndex={0} {...slot('media-player')} {...props}>
      <video
        ref={videoRef}
        data-slot="media-player-video"
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        preload={preload}
        playsInline
        onClick={togglePlayPause}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
        {subtitles.map((track, index) => (
          <track
            key={track.src}
            kind="subtitles"
            src={track.src}
            srcLang={track.srcLang}
            label={track.label}
            default={track.default ?? index === 0}
          />
        ))}
        Your browser does not support the video tag.
      </video>

      {isBuffering && (
        <YStack
          {...slot('media-player-buffering')}
          position="absolute"
          l={0}
          r={0}
          t={0}
          b={0}
          items="center"
          justify="center"
          bg="rgba(0,0,0,0.5)"
          pointerEvents="none"
        >
          <Spinner size={32} color="white" />
        </YStack>
      )}

      {controls && (
        <YStack
          {...slot('media-player-controls')}
          position="absolute"
          l={0}
          r={0}
          b={0}
          t={0}
          justify="flex-end"
          bg="rgba(0,0,0,0.55)"
          opacity={showControls ? 1 : 0}
          pointerEvents={showControls ? 'auto' : 'none'}
          style={{ transition: 'opacity 200ms ease' }}
        >
          <XStack px="$4" pb="$2">
            <Slider
              aria-label="Seek"
              value={[duration > 0 ? currentTime : 0]}
              max={duration || 1}
              step={0.1}
              onValueChange={([value]) => seekTo(value)}
            />
          </XStack>

          <XStack px="$4" pb="$3" items="center" justify="space-between" gap="$2">
            <XStack items="center" gap="$2">
              <Button {...overlayButton} aria-label="Rewind 10 seconds" onClick={() => skip(-SKIP_SECONDS)}>
                <RotateCcw size={16} />
              </Button>

              <Button
                {...overlayButton}
                size="icon"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>

              <Button {...overlayButton} aria-label="Forward 10 seconds" onClick={() => skip(SKIP_SECONDS)}>
                <SkipForward size={16} />
              </Button>

              <Button {...overlayButton} aria-label={isMuted ? 'Unmute' : 'Mute'} onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>

              <XStack width={80}>
                <Slider
                  aria-label="Volume"
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => changeVolume(value)}
                />
              </XStack>

              <SizableText color="white" fontSize="$1" ml="$2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </SizableText>
            </XStack>

            <XStack items="center" gap="$1">
              {subtitles.length > 0 && (
                <Button
                  {...overlayButton}
                  aria-label="Toggle captions"
                  bg={showSubtitles ? 'rgba(255,255,255,0.2)' : undefined}
                  onClick={() => setShowSubtitles((v) => !v)}
                >
                  <Captions size={16} />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button {...overlayButton} size="sm" aria-label="Playback speed">
                    {playbackSpeed}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SPEEDS.map((speed) => (
                    <DropdownMenuItem key={speed} onSelect={() => changePlaybackSpeed(speed)}>
                      {speed}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {qualityOptions.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button {...overlayButton} aria-label="Quality">
                      <Settings size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {qualityOptions.map((quality) => (
                      <DropdownMenuItem key={quality} onSelect={() => changeQuality(quality)}>
                        {quality}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!disablePictureInPicture && (
                <Button
                  {...overlayButton}
                  aria-label="Picture in picture"
                  bg={isPictureInPicture ? 'rgba(255,255,255,0.2)' : undefined}
                  onClick={() => void togglePictureInPicture()}
                >
                  <PictureInPicture size={16} />
                </Button>
              )}

              <Button
                {...overlayButton}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
            </XStack>
          </XStack>
        </YStack>
      )}
    </Frame>
  )
}
