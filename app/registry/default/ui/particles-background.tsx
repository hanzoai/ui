"use client"

import React, { useCallback, useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

interface ParticlesBackgroundProps {
  className?: string
  particleCount?: number
  particleColor?: string
  lineColor?: string
  particleSize?: number
  speed?: number
  connectionDistance?: number
  opacity?: number
  enableMouseInteraction?: boolean
  mouseRadius?: number
}

export function ParticlesBackground({
  className,
  particleCount = 50,
  particleColor = "rgba(255, 255, 255, 0.6)",
  lineColor = "rgba(255, 255, 255, 0.2)",
  particleSize = 2,
  speed = 0.5,
  connectionDistance = 100,
  opacity = 1,
  enableMouseInteraction = true,
  mouseRadius = 150,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>()

  const initializeParticles = useCallback(
    (width: number, height: number) => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * particleSize + 1,
      }))
    },
    [particleCount, speed, particleSize]
  )

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.globalAlpha = opacity
      ctx.fillStyle = particleColor
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    },
    [particleColor, opacity]
  )

  const drawConnection = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p1: Particle,
      p2: Particle,
      distance: number
    ) => {
      const alpha = Math.max(0, 1 - distance / connectionDistance)
      ctx.globalAlpha = alpha * opacity
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    },
    [lineColor, connectionDistance, opacity]
  )

  const updateParticle = useCallback(
    (
      particle: Particle,
      width: number,
      height: number,
      mouseX: number,
      mouseY: number
    ) => {
      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Bounce off edges
      if (particle.x < 0 || particle.x > width) {
        particle.vx *= -1
        particle.x = Math.max(0, Math.min(width, particle.x))
      }
      if (particle.y < 0 || particle.y > height) {
        particle.vy *= -1
        particle.y = Math.max(0, Math.min(height, particle.y))
      }

      // Mouse interaction
      if (enableMouseInteraction) {
        const dx = mouseX - particle.x
        const dy = mouseY - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius
          const angle = Math.atan2(dy, dx)
          particle.vx -= Math.cos(angle) * force * 0.2
          particle.vy -= Math.sin(angle) * force * 0.2
        }
      }

      // Damping to prevent excessive speeds
      particle.vx *= 0.99
      particle.vy *= 0.99
    },
    [enableMouseInteraction, mouseRadius]
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    const particles = particlesRef.current
    const { x: mouseX, y: mouseY } = mouseRef.current

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Update and draw particles
    particles.forEach((particle) => {
      updateParticle(particle, width, height, mouseX, mouseY)
      drawParticle(ctx, particle)
    })

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < connectionDistance) {
          drawConnection(ctx, particles[i], particles[j], distance)
        }
      }
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [updateParticle, drawParticle, drawConnection, connectionDistance])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }, [])

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    initializeParticles(canvas.width, canvas.height)
  }, [initializeParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set initial canvas size
    handleResize()

    // Start animation
    rafRef.current = requestAnimationFrame(animate)

    // Event listeners
    window.addEventListener("resize", handleResize)
    if (enableMouseInteraction) {
      canvas.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      window.removeEventListener("resize", handleResize)
      if (enableMouseInteraction) {
        canvas.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [animate, handleResize, handleMouseMove, enableMouseInteraction])

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 pointer-events-none", className)}
      style={{ zIndex: -1 }}
    />
  )
}

ParticlesBackground.displayName = "ParticlesBackground"
