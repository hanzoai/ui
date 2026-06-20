'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  Maximize,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import { cn } from '../src/utils'

// Types
export interface YouTubePipPlayerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onPlay' | 'onPause'> {
  /** YouTube video ID or array of IDs for rotation */
  videoId: string | string[]
  /** Auto-rotate videos every N seconds (default: 30) */
  rotationInterval?: number
  /** Enable scroll-based PIP mode */
  enablePip?: boolean
  /** Initial muted state (default: true) */
  defaultMuted?: boolean
  /** Show live indicator */
  showLiveIndicator?: boolean
  /** Enable TV-style visual effects */
  enableTvEffects?: boolean
  /** PIP position (default: bottom-right) */
  pipPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Callbacks */
  onPlay?: () => void
  onPause?: () => void
  onPipEnter?: () => void
  onPipExit?: () => void
  onMuteChange?: (muted: boolean) => void
}

const pipPositionStyles = {
  'bottom-right': { defaultX: (w: number, pipW: number) => w - pipW - 24, defaultY: (h: number, pipH: number) => h - pipH - 24 },
  'bottom-left': { defaultX: () => 24, defaultY: (h: number, pipH: number) => h - pipH - 24 },
  'top-right': { defaultX: (w: number, pipW: number) => w - pipW - 24, defaultY: () => 24 },
  'top-left': { defaultX: () => 24, defaultY: () => 24 },
}

const youtubePipPlayerVariants = cva(
  'relative bg-black rounded-[30px] overflow-hidden',
  {
    variants: {
      size: {
        sm: 'aspect-video max-w-md',
        md: 'aspect-video max-w-2xl',
        lg: 'aspect-video max-w-4xl',
        full: 'w-full aspect-video',
        hero: 'w-full max-h-[calc(100vh-160px)]',
      },
    },
    defaultVariants: {
      size: 'hero',
    },
  }
)

export interface YouTubePipPlayerVariantProps
  extends VariantProps<typeof youtubePipPlayerVariants> {}

const YouTubePipPlayer = React.forwardRef<
  HTMLDivElement,
  YouTubePipPlayerProps & YouTubePipPlayerVariantProps
>(
  (
    {
      className,
      size,
      videoId,
      rotationInterval = 30000,
      enablePip = true,
      defaultMuted = true,
      showLiveIndicator = true,
      enableTvEffects = true,
      pipPosition = 'bottom-right',
      onPlay,
      onPause,
      onPipEnter,
      onPipExit,
      onMuteChange,
      ...props
    },
    ref
  ) => {
    // Normalize videoIds to array
    const videoIds = React.useMemo(
      () => (Array.isArray(videoId) ? videoId : [videoId]),
      [videoId]
    )

    // State
    const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0)
    const [isMuted, setIsMuted] = React.useState(defaultMuted)
    const [isPip, setIsPip] = React.useState(false)
    const [showPip, setShowPip] = React.useState(true)
    const [pipSize, setPipSize] = React.useState<'normal' | 'double' | 'fullscreen'>('normal')
    const [isMobile, setIsMobile] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isPipHovered, setIsPipHovered] = React.useState(false)
    const [showStatic, setShowStatic] = React.useState(false)

    // Dragging state
    const [pipPos, setPipPos] = React.useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const [hasDragged, setHasDragged] = React.useState(false)

    // Refs
    const containerRef = React.useRef<HTMLDivElement>(null)
    const pipContainerRef = React.useRef<HTMLDivElement>(null)

    // Constants
    const PIP_WIDTH_BASE = 384
    const PIP_MARGIN = 24

    // Calculate current PIP width
    const getCurrentPipWidth = React.useCallback(() => {
      return pipSize === 'double' ? PIP_WIDTH_BASE * 2 : PIP_WIDTH_BASE
    }, [pipSize])

    // Get YouTube embed URL
    const getYouTubeEmbedUrl = React.useCallback(
      (forPip = false) => {
        const currentId = videoIds[currentVideoIndex]
        const muteParam = forPip && isPip ? (isMuted ? '1' : '0') : (isMuted ? '1' : '0')
        return `https://www.youtube.com/embed/${currentId}?autoplay=1&mute=${muteParam}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`
      },
      [videoIds, currentVideoIndex, isMuted, isPip]
    )

    // Mobile detection
    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Video rotation
    React.useEffect(() => {
      if (videoIds.length <= 1) return
      const interval = setInterval(() => {
        setCurrentVideoIndex((prev) => (prev + 1) % videoIds.length)
      }, rotationInterval)
      return () => clearInterval(interval)
    }, [videoIds.length, rotationInterval])

    // TV static effect
    React.useEffect(() => {
      if (!enableTvEffects) return
      const interval = setInterval(() => {
        setShowStatic(true)
        setTimeout(() => setShowStatic(false), 200)
      }, 30000)
      return () => clearInterval(interval)
    }, [enableTvEffects])

    // Scroll-based PIP activation
    React.useEffect(() => {
      if (!enablePip) return

      const handleScroll = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const shouldShowPip = rect.bottom < 100
        const wasInPip = isPip

        setIsPip(shouldShowPip)

        if (shouldShowPip !== wasInPip) {
          if (shouldShowPip) {
            onPipEnter?.()
          } else {
            onPipExit?.()
          }
        }
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }, [enablePip, isPip, onPipEnter, onPipExit])

    // Initialize PIP position
    React.useEffect(() => {
      if (typeof window === 'undefined') return
      const pipWidth = getCurrentPipWidth()
      const pipHeight = pipWidth * 9 / 16
      const pos = pipPositionStyles[pipPosition]
      setPipPos({
        x: pos.defaultX(window.innerWidth, pipWidth),
        y: pos.defaultY(window.innerHeight, pipHeight),
      })
    }, [getCurrentPipWidth, pipPosition])

    // Update position when size changes
    React.useEffect(() => {
      if (pipSize === 'fullscreen' || typeof window === 'undefined') return
      const pipWidth = getCurrentPipWidth()
      const pipHeight = pipWidth * 9 / 16
      const pos = pipPositionStyles[pipPosition]
      setPipPos({
        x: pos.defaultX(window.innerWidth, pipWidth),
        y: pos.defaultY(window.innerHeight, pipHeight),
      })
    }, [pipSize, getCurrentPipWidth, pipPosition])

    // Dragging handlers
    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      if (pipSize === 'fullscreen') return
      setIsDragging(true)
      setHasDragged(false)
      setDragStart({
        x: e.clientX - pipPos.x,
        y: e.clientY - pipPos.y,
      })
    }, [pipSize, pipPos])

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      if (!isDragging || pipSize === 'fullscreen') return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      const distanceMoved = Math.sqrt(Math.pow(newX - pipPos.x, 2) + Math.pow(newY - pipPos.y, 2))
      if (distanceMoved > 5) setHasDragged(true)

      const pipWidth = getCurrentPipWidth()
      const maxX = window.innerWidth - pipWidth - PIP_MARGIN
      const maxY = window.innerHeight - (pipWidth * 9 / 16) - PIP_MARGIN

      setPipPos({
        x: Math.max(PIP_MARGIN, Math.min(newX, maxX)),
        y: Math.max(PIP_MARGIN, Math.min(newY, maxY)),
      })
    }, [isDragging, pipSize, dragStart, pipPos, getCurrentPipWidth])

    const handleMouseUp = React.useCallback(() => {
      if (isDragging && hasDragged) {
        // Snap to corner
        const pipWidth = getCurrentPipWidth()
        const pipHeight = pipWidth * 9 / 16
        const pos = pipPositionStyles[pipPosition]
        setPipPos({
          x: pos.defaultX(window.innerWidth, pipWidth),
          y: pos.defaultY(window.innerHeight, pipHeight),
        })
      }
      setIsDragging(false)
      setHasDragged(false)
    }, [isDragging, hasDragged, getCurrentPipWidth, pipPosition])

    // Mouse event listeners for dragging
    React.useEffect(() => {
      if (!isDragging) return
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // Toggle mute
    const toggleMute = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      const newMuted = !isMuted
      setIsMuted(newMuted)
      onMuteChange?.(newMuted)
    }, [isMuted, onMuteChange])

    // Cycle PIP size
    const cyclePipSize = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setPipSize((prev) => {
        if (prev === 'normal') return 'double'
        if (prev === 'double') return 'fullscreen'
        return 'normal'
      })
    }, [])

    // Close PIP
    const closePip = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setShowPip(false)
    }, [])

    // Request fullscreen for hero video
    const requestFullscreen = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      if (!containerRef.current) return
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }, [])

    return (
      <>
        {/* Hero Video Container */}
        <div
          ref={containerRef}
          className={cn(
            youtubePipPlayerVariants({ size }),
            'group transition-all duration-500',
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...props}
        >
          {/* TV Effects - Glow */}
          {enableTvEffects && (
            <>
              <div className="absolute -inset-24 bg-gradient-radial from-white/40 via-white/20 to-transparent blur-[100px] opacity-80 pointer-events-none" />
              <div className="absolute -inset-12 bg-gradient-radial from-white/30 via-white/15 to-transparent blur-[60px] opacity-70 pointer-events-none" />
              <div className="absolute -inset-2 rounded-[30px] bg-gradient-to-r from-white/80 via-white/60 to-white/80 opacity-100 blur-2xl animate-pulse pointer-events-none" />
              <div className="absolute inset-0 rounded-[30px] border-2 border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.5)] pointer-events-none" />
            </>
          )}

          {/* Inner frame glass effect */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div
              className="absolute inset-0 rounded-[30px] border-2 border-white/10 bg-gradient-to-b from-white/5 to-transparent"
              style={{
                boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.1), inset 0 -2px 20px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Cinematic Vignette */}
          {enableTvEffects && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 120px 60px rgba(0,0,0,0.8)' }}
            />
          )}

          {/* Static Effect */}
          {showStatic && enableTvEffects && (
            <div className="absolute inset-0 z-40 pointer-events-none">
              <div className="h-full w-full bg-white/3 animate-pulse" />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
              />
            </div>
          )}

          {/* YouTube Video */}
          <iframe
            className="absolute inset-0 w-full h-full"
            src={getYouTubeEmbedUrl()}
            title="Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Film Grain */}
          {enableTvEffects && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-10">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
                }}
              />
            </div>
          )}

          {/* Controls - Fade in on hover */}
          <div
            className={cn(
              'absolute bottom-6 left-6 flex items-center gap-3 z-30 transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <button
              onClick={toggleMute}
              className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black transition-all duration-300 border border-white/10"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
              <span className="text-xs text-white/90 font-medium tracking-wider uppercase">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>

            <button
              onClick={requestFullscreen}
              className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black transition-all duration-300 border border-white/10"
            >
              <Maximize className="h-4 w-4 text-white" />
              <span className="text-xs text-white/90 font-medium tracking-wider uppercase">Fullscreen</span>
            </button>
          </div>

          {/* Live Indicator */}
          {showLiveIndicator && (
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-30">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              <span className="text-xs text-white/90 font-medium tracking-widest uppercase">Live</span>
            </div>
          )}
        </div>

        {/* PIP Window */}
        {enablePip && isPip && showPip && !isMobile && (
          <div
            ref={pipContainerRef}
            className={cn(
              'fixed z-50 transition-all ease-out group',
              pipSize === 'fullscreen'
                ? 'inset-0 bg-black/98 backdrop-blur-xl duration-500'
                : isDragging
                ? 'duration-75'
                : 'duration-300',
              isDragging
                ? 'cursor-grabbing scale-105 shadow-2xl'
                : pipSize === 'fullscreen'
                ? ''
                : 'cursor-grab hover:scale-105'
            )}
            style={
              pipSize !== 'fullscreen'
                ? {
                    left: `${pipPos.x}px`,
                    top: `${pipPos.y}px`,
                    filter: isDragging ? 'brightness(1.1) drop-shadow(0 20px 40px rgba(0,0,0,0.5))' : 'brightness(1)',
                  }
                : {}
            }
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsPipHovered(true)}
            onMouseLeave={() => setIsPipHovered(false)}
          >
            <div
              className={cn(
                'relative bg-black overflow-hidden transition-all duration-500',
                pipSize === 'fullscreen'
                  ? 'w-full h-full'
                  : pipSize === 'double'
                  ? 'aspect-video rounded-2xl'
                  : 'w-96 aspect-video rounded-2xl'
              )}
              style={pipSize === 'double' ? { width: '768px' } : {}}
            >
              {/* PIP TV Effects */}
              {enableTvEffects && pipSize !== 'fullscreen' && (
                <>
                  <div className="absolute -inset-12 rounded-full bg-gradient-radial from-white/30 via-white/10 to-transparent blur-3xl opacity-60 pointer-events-none" />
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-white/40 via-white/20 to-white/40 opacity-75 blur-xl animate-pulse pointer-events-none" />
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div
                      className="absolute inset-0 rounded-2xl border-2 border-white/10 bg-gradient-to-b from-white/5 to-transparent"
                      style={{
                        boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.1), inset 0 -2px 20px rgba(0,0,0,0.5)',
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-10 opacity-10">
                    <div
                      className="h-full w-full animate-scan"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                      }}
                    />
                  </div>
                </>
              )}

              {/* PIP YouTube Video */}
              <div className="absolute inset-0 overflow-hidden">
                <iframe
                  className={cn(
                    'absolute top-0 left-0 w-full h-full object-cover',
                    pipSize !== 'fullscreen' && 'rounded-2xl'
                  )}
                  style={{ aspectRatio: '16 / 9', pointerEvents: 'none' }}
                  src={getYouTubeEmbedUrl(true)}
                  title="Video PiP"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="absolute inset-0 z-5" />
              </div>

              {/* PIP Controls */}
              <div
                className={cn(
                  'absolute flex items-center gap-2 z-30 transition-opacity duration-300',
                  pipSize === 'fullscreen' ? 'bottom-10 right-10' : 'bottom-3 right-3',
                  isPipHovered ? 'opacity-100' : 'opacity-0'
                )}
              >
                <button
                  onClick={toggleMute}
                  className="relative p-2.5 bg-black/90 backdrop-blur-md rounded-full hover:bg-black transition-all duration-300 shadow-lg hover:scale-110 border border-white/10"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
                </button>

                <button
                  onClick={cyclePipSize}
                  className="relative p-2.5 bg-black/90 backdrop-blur-md rounded-full hover:bg-black transition-all duration-300 shadow-lg hover:scale-110 border border-white/10"
                  title={pipSize === 'fullscreen' ? 'Normal Size' : pipSize === 'double' ? 'Fullscreen' : 'Double Size'}
                >
                  {pipSize === 'fullscreen' ? (
                    <Minimize2 className="h-4 w-4 text-white" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-white" />
                  )}
                </button>

                <button
                  onClick={closePip}
                  className="relative p-2.5 bg-black/90 backdrop-blur-md rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg hover:scale-110 border border-white/10"
                  title="Close"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* PIP Live Indicator */}
              {showLiveIndicator && pipSize !== 'fullscreen' && (
                <div className="absolute top-3 right-3 z-20">
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                    <span className="text-[10px] text-white/80 font-medium tracking-widest uppercase">Live</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }
)

YouTubePipPlayer.displayName = 'YouTubePipPlayer'

export { YouTubePipPlayer, youtubePipPlayerVariants }
export default YouTubePipPlayer
