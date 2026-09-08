'use client'

/**
 * ParticlesBackground — a decorative field of drifting dots joined by fading
 * connection lines, painted on a fixed full-viewport canvas behind the page.
 *
 * A particle field with per-pair connection lines is the case a canvas exists
 * for: hundreds of dots and their pairwise distances redrawn every frame would
 * mean thousands of styled DOM nodes reflowing at 60fps. The imperative loop
 * lives entirely in one effect — init, animate, resize, pointer — the same
 * shape `AnimatedCursor` uses for its own document-level listeners, gated on
 * `isWeb` and a mount flag so the server render and the first client render
 * stay identical and native gets nothing to choke on.
 */
import { YStack, isWeb } from '@hanzo/gui'
import { useEffect, useRef, useState } from 'react'
import { sx } from '../../sx'
import { slot } from './slot'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

export type ParticlesBackgroundProps = {
  /** Class notation for the fixed frame. */
  className?: string
  /** Number of particles to render. */
  particleCount?: number
  /** Fill of each particle. */
  particleColor?: string
  /** Stroke of the lines joining nearby particles. */
  lineColor?: string
  /** Maximum radius of a particle, in px. */
  particleSize?: number
  /** Top speed of a particle's drift, in px per frame. */
  speed?: number
  /** Distance below which two particles are joined by a line. */
  connectionDistance?: number
  /** Overall opacity of the effect. */
  opacity?: number
  /** Whether particles are pushed away from the pointer. */
  enableMouseInteraction?: boolean
  /** Radius of the pointer's repulsion, in px. */
  mouseRadius?: number
}

export function ParticlesBackground({
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
}: ParticlesBackgroundProps) {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -Infinity, y: -Infinity })

  useEffect(() => setMounted(true), [])

  const live = mounted && isWeb

  useEffect(() => {
    if (!live) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

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

    let raf = requestAnimationFrame(function animate() {
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

      raf = requestAnimationFrame(animate)
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      if (enableMouseInteraction) canvas.removeEventListener('mousemove', onMove)
    }
  }, [
    live,
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

  if (!live) return null

  return (
    <YStack
      {...slot('particles-background')}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}
      {...sx(className)}
    >
      {/* eslint-disable-next-line jsx-a11y/no-canvas -- decorative, no fallback content applies */}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </YStack>
  )
}
