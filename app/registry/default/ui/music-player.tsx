"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"
import { ScrollArea } from "./scroll-area"
import { Slider } from "./slider"

export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  src: string
  artwork?: string
}

interface MusicPlayerProps {
  tracks: Track[]
  className?: string
  autoPlay?: boolean
  showWaveform?: boolean
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function MusicPlayer({
  tracks,
  className,
  autoPlay = false,
  showWaveform = true,
}: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(0.7)
  const [isMuted, setIsMuted] = React.useState(false)
  const [isRepeat, setIsRepeat] = React.useState(false)
  const [isShuffle, setIsShuffle] = React.useState(false)
  const [showPlaylist, setShowPlaylist] = React.useState(false)
  const [waveformData, setWaveformData] = React.useState<number[]>([])

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const animationRef = React.useRef<number>()

  const currentTrack = tracks[currentTrackIndex]

  // Initialize audio element
  React.useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    audio.volume = volume

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      if (showWaveform) {
        generateWaveform()
      }
    }

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        handleNext()
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.pause()
      audio.src = ""
    }
  }, [])

  // Update audio source when track changes
  React.useEffect(() => {
    if (!audioRef.current || !currentTrack) return

    audioRef.current.src = currentTrack.src
    setCurrentTime(0)

    if (isPlaying || autoPlay) {
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }, [currentTrackIndex, currentTrack])

  // Update volume
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Generate waveform data
  const generateWaveform = () => {
    const bars = 64
    const data = []
    for (let i = 0; i < bars; i++) {
      data.push(Math.random() * 0.7 + 0.3)
    }
    setWaveformData(data)
  }

  // Animate waveform
  React.useEffect(() => {
    if (!showWaveform || !canvasRef.current || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = canvas.width / waveformData.length
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "hsl(var(--primary))")
      gradient.addColorStop(1, "hsl(var(--primary) / 0.3)")

      waveformData.forEach((height, i) => {
        const x = i * barWidth
        const barHeight =
          height *
          canvas.height *
          (0.5 + Math.sin(Date.now() * 0.001 + i * 0.2) * 0.5)

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight)
      })

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, waveformData, showWaveform])

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const handleNext = () => {
    if (isShuffle) {
      const nextIndex = Math.floor(Math.random() * tracks.length)
      setCurrentTrackIndex(nextIndex)
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
    }
  }

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index)
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border bg-background p-4 shadow-lg",
        className
      )}
    >
      {/* Album Art and Track Info */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
          {currentTrack?.artwork ? (
            <img
              src={currentTrack.artwork}
              alt={`${currentTrack.title} artwork`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ListMusic className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold">{currentTrack?.title || "No track"}</h3>
          <p className="text-sm text-muted-foreground">
            {currentTrack?.artist || "Unknown artist"}
          </p>
          {currentTrack?.album && (
            <p className="text-xs text-muted-foreground">
              {currentTrack.album}
            </p>
          )}
        </div>
      </div>

      {/* Waveform Visualization */}
      {showWaveform && (
        <div className="mb-4 h-16 w-full overflow-hidden rounded bg-muted/30">
          <canvas
            ref={canvasRef}
            width={640}
            height={64}
            className="h-full w-full"
          />
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4 space-y-1">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsShuffle(!isShuffle)}
          className={cn(isShuffle && "text-primary")}
        >
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePrevious}>
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button size="icon" onClick={handlePlayPause} className="h-10 w-10">
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <SkipForward className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsRepeat(!isRepeat)}
          className={cn(isRepeat && "text-primary")}
        >
          <Repeat className="h-4 w-4" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleMute}>
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-24"
        />
      </div>

      {/* Playlist */}
      <Collapsible open={showPlaylist} onOpenChange={setShowPlaylist}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              Playlist ({tracks.length} tracks)
            </span>
            {showPlaylist ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <ScrollArea className="h-48 w-full rounded-md border">
            <div className="p-2">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent",
                    currentTrackIndex === index && "bg-accent"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    {currentTrackIndex === index && isPlaying ? (
                      <div className="flex items-center gap-0.5">
                        <span className="h-3 w-0.5 animate-pulse bg-primary" />
                        <span className="h-4 w-0.5 animate-pulse bg-primary animation-delay-150" />
                        <span className="h-2 w-0.5 animate-pulse bg-primary animation-delay-300" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {track.artist}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(track.duration)}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
