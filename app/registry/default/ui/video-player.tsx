"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Captions,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Slider } from "./slider"

// Types
export interface VideoSource {
  src: string
  type: string
  quality?: string
}

export interface SubtitleTrack {
  src: string
  label: string
  srcLang: string
  default?: boolean
}

export interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  sources: VideoSource[]
  poster?: string
  subtitles?: SubtitleTrack[]
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: "auto" | "metadata" | "none"
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

const videoPlayerVariants = cva(
  "relative bg-black rounded-lg overflow-hidden group",
  {
    variants: {
      size: {
        sm: "aspect-video max-w-md",
        md: "aspect-video max-w-2xl",
        lg: "aspect-video max-w-4xl",
        full: "w-full aspect-video",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface VideoPlayerVariantProps
  extends VariantProps<typeof videoPlayerVariants> {}

const VideoPlayer = React.forwardRef<
  HTMLDivElement,
  VideoPlayerProps & VideoPlayerVariantProps
>(
  (
    {
      className,
      size,
      sources,
      poster,
      subtitles = [],
      autoPlay = false,
      loop = false,
      muted = false,
      preload = "metadata",
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
    },
    ref
  ) => {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const progressRef = React.useRef<HTMLDivElement>(null)
    const controlsTimeoutRef = React.useRef<NodeJS.Timeout>()

    // State
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [volume, setVolume] = React.useState(1)
    const [isMuted, setIsMuted] = React.useState(muted)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [showControls, setShowControls] = React.useState(true)
    const [playbackSpeed, setPlaybackSpeed] = React.useState(1)
    const [currentQuality, setCurrentQuality] = React.useState(
      sources.find((s) => s.quality)?.quality || "auto"
    )
    const [showSubtitles, setShowSubtitles] = React.useState(false)
    const [isBuffering, setIsBuffering] = React.useState(false)
    const [isPictureInPicture, setIsPictureInPicture] = React.useState(false)

    // Playback speeds
    const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

    // Quality options
    const qualityOptions = React.useMemo(() => {
      const qualities = sources
        .filter((s) => s.quality)
        .map((s) => s.quality!)
        .filter((quality, index, arr) => arr.indexOf(quality) === index)
      return ["auto", ...qualities]
    }, [sources])

    // Format time helper
    const formatTime = (time: number) => {
      const hours = Math.floor(time / 3600)
      const minutes = Math.floor((time % 3600) / 60)
      const seconds = Math.floor(time % 60)

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    // Toggle play/pause
    const togglePlayPause = React.useCallback(() => {
      if (!videoRef.current) return

      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }, [isPlaying])

    // Seek to time
    const seekTo = React.useCallback((time: number) => {
      if (!videoRef.current) return
      videoRef.current.currentTime = time
    }, [])

    // Skip forward/backward
    const skip = React.useCallback(
      (seconds: number) => {
        if (!videoRef.current) return
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
        seekTo(newTime)
      },
      [currentTime, duration, seekTo]
    )

    // Toggle mute
    const toggleMute = React.useCallback(() => {
      if (!videoRef.current) return

      if (isMuted) {
        videoRef.current.volume = volume
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }, [isMuted, volume])

    // Change volume
    const changeVolume = React.useCallback(
      (newVolume: number) => {
        if (!videoRef.current) return

        const clampedVolume = Math.max(0, Math.min(1, newVolume))
        videoRef.current.volume = clampedVolume
        setVolume(clampedVolume)
        setIsMuted(clampedVolume === 0)
        onVolumeChange?.(clampedVolume)
      },
      [onVolumeChange]
    )

    // Toggle fullscreen
    const toggleFullscreen = React.useCallback(async () => {
      if (!containerRef.current) return

      try {
        if (!document.fullscreenElement) {
          await containerRef.current.requestFullscreen()
          setIsFullscreen(true)
        } else {
          await document.exitFullscreen()
          setIsFullscreen(false)
        }
      } catch (error) {
        console.error("Fullscreen error:", error)
      }
    }, [])

    // Toggle picture-in-picture
    const togglePictureInPicture = React.useCallback(async () => {
      if (!videoRef.current || disablePictureInPicture) return

      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        } else {
          await videoRef.current.requestPictureInPicture()
        }
      } catch (error) {
        console.error("Picture-in-picture error:", error)
      }
    }, [disablePictureInPicture])

    // Change playback speed
    const changePlaybackSpeed = React.useCallback(
      (speed: number) => {
        if (!videoRef.current) return

        videoRef.current.playbackRate = speed
        setPlaybackSpeed(speed)
        onSpeedChange?.(speed)
      },
      [onSpeedChange]
    )

    // Change quality
    const changeQuality = React.useCallback(
      (quality: string) => {
        if (!videoRef.current) return

        const currentTimeBeforeChange = videoRef.current.currentTime
        const wasPlaying = !videoRef.current.paused

        if (quality === "auto") {
          // Use first source for auto
          videoRef.current.src = sources[0].src
        } else {
          const qualitySource = sources.find((s) => s.quality === quality)
          if (qualitySource) {
            videoRef.current.src = qualitySource.src
          }
        }

        videoRef.current.addEventListener(
          "loadedmetadata",
          () => {
            videoRef.current!.currentTime = currentTimeBeforeChange
            if (wasPlaying) {
              videoRef.current!.play()
            }
          },
          { once: true }
        )

        setCurrentQuality(quality)
        onQualityChange?.(quality)
      },
      [sources, onQualityChange]
    )

    // Hide controls after timeout
    const hideControlsAfterTimeout = React.useCallback(() => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }, [isPlaying])

    // Show controls
    const showControlsTemporarily = React.useCallback(() => {
      setShowControls(true)
      hideControlsAfterTimeout()
    }, [hideControlsAfterTimeout])

    // Keyboard shortcuts
    React.useEffect(() => {
      if (disableKeyboard) return

      const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current?.contains(document.activeElement)) return

        switch (e.code) {
          case "Space":
            e.preventDefault()
            togglePlayPause()
            break
          case "KeyF":
            e.preventDefault()
            toggleFullscreen()
            break
          case "KeyM":
            e.preventDefault()
            toggleMute()
            break
          case "ArrowLeft":
            e.preventDefault()
            skip(-10)
            break
          case "ArrowRight":
            e.preventDefault()
            skip(10)
            break
          case "ArrowUp":
            e.preventDefault()
            changeVolume(volume + 0.1)
            break
          case "ArrowDown":
            e.preventDefault()
            changeVolume(volume - 0.1)
            break
          case "KeyC":
            e.preventDefault()
            setShowSubtitles(!showSubtitles)
            break
          case "KeyP":
            e.preventDefault()
            togglePictureInPicture()
            break
        }

        showControlsTemporarily()
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [
      disableKeyboard,
      togglePlayPause,
      toggleFullscreen,
      toggleMute,
      skip,
      changeVolume,
      volume,
      showSubtitles,
      togglePictureInPicture,
      showControlsTemporarily,
    ])

    // Video event handlers
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
        const currentTime = video.currentTime
        const duration = video.duration
        setCurrentTime(currentTime)
        setDuration(duration)
        onTimeUpdate?.(currentTime, duration)
      }

      const handleLoadedMetadata = () => {
        setDuration(video.duration)
        setIsBuffering(false)
      }

      const handleWaiting = () => {
        setIsBuffering(true)
      }

      const handleCanPlay = () => {
        setIsBuffering(false)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setShowControls(true)
        onEnded?.()
      }

      const handleVolumeChange = () => {
        setVolume(video.volume)
        setIsMuted(video.muted)
      }

      const handleEnterpictureinpicture = () => {
        setIsPictureInPicture(true)
      }

      const handleLeavepictureinpicture = () => {
        setIsPictureInPicture(false)
      }

      video.addEventListener("play", handlePlay)
      video.addEventListener("pause", handlePause)
      video.addEventListener("timeupdate", handleTimeUpdate)
      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("waiting", handleWaiting)
      video.addEventListener("canplay", handleCanPlay)
      video.addEventListener("ended", handleEnded)
      video.addEventListener("volumechange", handleVolumeChange)
      video.addEventListener(
        "enterpictureinpicture",
        handleEnterpictureinpicture
      )
      video.addEventListener(
        "leavepictureinpicture",
        handleLeavepictureinpicture
      )

      return () => {
        video.removeEventListener("play", handlePlay)
        video.removeEventListener("pause", handlePause)
        video.removeEventListener("timeupdate", handleTimeUpdate)
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("waiting", handleWaiting)
        video.removeEventListener("canplay", handleCanPlay)
        video.removeEventListener("ended", handleEnded)
        video.removeEventListener("volumechange", handleVolumeChange)
        video.removeEventListener(
          "enterpictureinpicture",
          handleEnterpictureinpicture
        )
        video.removeEventListener(
          "leavepictureinpicture",
          handleLeavepictureinpicture
        )
      }
    }, [onPlay, onPause, onTimeUpdate, onEnded, hideControlsAfterTimeout])

    // Fullscreen change handler
    React.useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement)
      }

      document.addEventListener("fullscreenchange", handleFullscreenChange)
      return () =>
        document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    // Mouse movement handler for controls
    React.useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const handleMouseMove = () => {
        showControlsTemporarily()
      }

      const handleMouseLeave = () => {
        if (isPlaying && controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false)
          }, 1000)
        }
      }

      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }, [isPlaying, showControlsTemporarily])

    return (
      <div
        ref={containerRef}
        className={cn(videoPlayerVariants({ size, className }))}
        tabIndex={0}
        {...props}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          preload={preload}
          playsInline
          onClick={togglePlayPause}
        >
          {sources.map((source, index) => (
            <source key={index} src={source.src} type={source.type} />
          ))}
          {subtitles.map((track, index) => (
            <track
              key={index}
              kind="subtitles"
              src={track.src}
              srcLang={track.srcLang}
              label={track.label}
              default={track.default || index === 0}
            />
          ))}
          Your browser does not support the video tag.
        </video>

        {/* Loading indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Controls */}
        {controls && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Progress bar */}
            <div className="absolute bottom-16 left-4 right-4">
              <div
                ref={progressRef}
                className="h-1 bg-white/30 rounded-full cursor-pointer group/progress"
                onClick={(e) => {
                  if (!progressRef.current) return
                  const rect = progressRef.current.getBoundingClientRect()
                  const percentage = (e.clientX - rect.left) / rect.width
                  seekTo(percentage * duration)
                }}
              >
                <div
                  className="h-full bg-primary rounded-full relative group-hover/progress:h-1.5 transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => skip(-10)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={([value]) => changeVolume(value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="text-white text-sm ml-4">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {subtitles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-white hover:bg-white/20",
                      showSubtitles && "bg-white/20"
                    )}
                    onClick={() => setShowSubtitles(!showSubtitles)}
                  >
                    <Captions className="h-4 w-4" />
                  </Button>
                )}

                {/* Speed selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-white hover:bg-white/20"
                    >
                      {playbackSpeed}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {playbackSpeeds.map((speed) => (
                      <DropdownMenuItem
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        className={cn(playbackSpeed === speed && "bg-accent")}
                      >
                        {speed}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Quality selector */}
                {qualityOptions.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {qualityOptions.map((quality) => (
                        <DropdownMenuItem
                          key={quality}
                          onClick={() => changeQuality(quality)}
                          className={cn(
                            currentQuality === quality && "bg-accent"
                          )}
                        >
                          {quality}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!disablePictureInPicture && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-white hover:bg-white/20",
                      isPictureInPicture && "bg-white/20"
                    )}
                    onClick={togglePictureInPicture}
                  >
                    <PictureInPicture className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

VideoPlayer.displayName = "VideoPlayer"

export { VideoPlayer, videoPlayerVariants }
