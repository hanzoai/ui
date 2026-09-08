'use client'

/**
 * Particles — an animated field of small drifting dots that draws a line
 * between any two that fall within `connectionDistance`, brighter the closer
 * they are, and nudges nearby dots away from the pointer. It fills its
 * nearest positioned ancestor (`position: absolute; inset: 0`) and never
 * intercepts a pointer event, so it sits behind ordinary content as a
 * backdrop.
 *
 * A particle field is a per-frame pixel loop, native to `<canvas>` on web —
 * that is the one piece @hanzo/gui has no primitive for, so this wraps the
 * platform element directly and renders nothing on native.
 */
import { isWeb } from '@hanzo/gui'
import { useEffect, useRef, type CSSProperties } from 'react'
import { slot } from './slot'

export type ParticlesProps = {
  /** CSS class names for the canvas frame. Since the frame is a raw `<canvas>`,
   *  not a gui component, this is forwarded as-is rather than through `sx`. */
  className?: string
  /** How many dots drift across the field. */
  particleCount?: number
  /** Fill of each dot, any CSS colour. */
  particleColor?: string
  /** Stroke of the lines drawn between near dots, any CSS colour. */
  lineColor?: string
  /** Upper bound of a dot's random radius, in px. */
  particleSize?: number
  /** Top speed of a dot's drift, in px per frame. */
  speed?: number
  /** Distance, in px, within which two dots are joined by a line. */
  connectionDistance?: number
  /** Overall alpha applied to dots and lines alike. */
  opacity?: number
  /** Whether nearby dots are pushed away from the pointer. */
  enableMouseInteraction?: boolean
  /** Radius, in px, within which the pointer pushes dots away. */
  mouseRadius?: number
}

type Particle = { x: number; y: number; vx: number; vy: number; size: number }

export function Particles({
  className,
  particleCount = 50,
  particleColor = 'rgba(255, 255, 255, 0.6)',
  lineColor = 'rgba(255, 255, 255, 0.2)',
  particleSize = 2,
  speed = 0.5,
  connectionDistance = 100,
  opacity = 1,
  enableMouseInteraction = true,
  mouseRadius = 150,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return

    const seed = (width: number, height: number) => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * particleSize + 1,
      }))
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      seed(canvas.width, canvas.height)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    resize()
    window.addEventListener('resize', resize)
    if (enableMouseInteraction) canvas.addEventListener('mousemove', onMove)

    // jsdom (the test DOM) implements neither `getContext('2d')` nor
    // `requestAnimationFrame` — both are feature-detected so the effect wires
    // up its listeners and cleans them up correctly even where the browser
    // pixel loop itself cannot run.
    const hasRaf = typeof requestAnimationFrame === 'function'
    let frame = 0

    const step = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const { width, height } = canvas
        const particles = particlesRef.current
        const { x: mouseX, y: mouseY } = mouseRef.current

        ctx.clearRect(0, 0, width, height)

        for (const p of particles) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > width) {
            p.vx *= -1
            p.x = Math.max(0, Math.min(width, p.x))
          }
          if (p.y < 0 || p.y > height) {
            p.vy *= -1
            p.y = Math.max(0, Math.min(height, p.y))
          }

          if (enableMouseInteraction) {
            const dx = mouseX - p.x
            const dy = mouseY - p.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < mouseRadius) {
              const force = (mouseRadius - distance) / mouseRadius
              const angle = Math.atan2(dy, dx)
              p.vx -= Math.cos(angle) * force * 0.2
              p.vy -= Math.sin(angle) * force * 0.2
            }
          }

          p.vx *= 0.99
          p.vy *= 0.99

          ctx.globalAlpha = opacity
          ctx.fillStyle = particleColor
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < connectionDistance) {
              ctx.globalAlpha = Math.max(0, 1 - distance / connectionDistance) * opacity
              ctx.strokeStyle = lineColor
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.stroke()
            }
          }
        }
      }
      if (hasRaf) frame = requestAnimationFrame(step)
    }

    if (hasRaf) frame = requestAnimationFrame(step)

    return () => {
      if (hasRaf) cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      if (enableMouseInteraction) canvas.removeEventListener('mousemove', onMove)
    }
  }, [
    particleCount,
    particleColor,
    lineColor,
    particleSize,
    speed,
    connectionDistance,
    opacity,
    enableMouseInteraction,
    mouseRadius,
  ])

  if (!isWeb) return null

  const style: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  }

  return <canvas ref={canvasRef} {...slot('particles')} className={className} style={style} />
}
