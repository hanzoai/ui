'use client'

/**
 * Marquee3D — an endless ticker seen through a CSS perspective.
 *
 * A stage holds the tilt (`perspective` and `rotateX`/`rotateY`/`rotateZ`) and
 * a track inside it carries the items past, so a tilted row reads as a plane
 * receding into the page rather than a flat crawl. The loop is one keyframe:
 * `children` is laid out `repeat` times as a group, the group is rendered
 * twice back to back, and the animation slides the pair by exactly half its own
 * length, so the second copy lands where the first began and the seam never
 * shows. A reader hears the first copy once: every other is `aria-hidden`.
 * Duration is that length over `speed` (px/s), read off the rendered track,
 * so a long set of items moves at the same pace as a short one.
 *
 * Six looks (`variant`) fix their own surface and ink on every theme, except
 * `default`, which takes the host's. `size` sets height and type size together.
 * `Marquee3DPreset` bundles the five named looks; `Marquee3DFloating` bobs each
 * glyph of a text child on top of the scroll.
 *
 * The keyframes ride along as a hoisted `<style>`: React keys it by `href`, so
 * any number of marquees on a page emit it once, and a consumer that mounts none
 * of this package's stylesheets still gets a marquee that moves.
 */
import { glass } from '../../glass'
import { Text, XStack, YStack, styled, type GuiElement } from '@hanzo/gui'
import * as React from 'react'
import { ink } from './ink'
import { slot } from './slot'

export type Marquee3DVariant = 'default' | 'neon' | 'rainbow' | 'metallic' | 'fire' | 'glass'
export type Marquee3DSize = 'sm' | 'default' | 'lg' | 'xl' | '2xl' | '3xl'
export type Marquee3DDirection = 'left' | 'right' | 'up' | 'down'
export type Marquee3DPerspective = 'none' | 'sm' | 'default' | 'lg' | 'xl'

/** Frame height and type size per `size`, px. */
const HEIGHT: Record<Marquee3DSize, number> = { sm: 32, default: 48, lg: 64, xl: 80, '2xl': 96, '3xl': 128 }
const FONT: Record<Marquee3DSize, number> = { sm: 14, default: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 }

/** Viewing distance per `perspective`, px; 0 draws flat. */
const DEPTH: Record<Marquee3DPerspective, number> = { none: 0, sm: 500, default: 1000, lg: 1500, xl: 2000 }

/** A gradient painted through the glyphs. */
const clip = (backgroundImage: string): React.CSSProperties => ({
  backgroundImage,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
})

/**
 * The ink per variant. It sits on the item, the nearest stack to the glyphs,
 * and every child inherits it — a caller's own elements included — which is
 * why it is an inline style and not a property of the text primitive. Nearest,
 * because gui's stylesheet gives every stack the theme's weight, line height
 * and letter spacing; a stack between the ink and the glyph would reset them.
 */
const INK: Record<Marquee3DVariant, React.CSSProperties> = {
  default: {},
  neon: {
    color: '#22d3ee',
    filter: 'drop-shadow(0 0 10px currentColor)',
    animation: 'marquee-3d-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  rainbow: clip('linear-gradient(90deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)'),
  metallic: clip('linear-gradient(180deg, #e5e7eb, #9ca3af, #4b5563)'),
  fire: {
    ...clip('linear-gradient(0deg, #dc2626, #f97316, #facc15)'),
    filter: 'drop-shadow(0 0 20px #ff6600)',
  },
  glass: { color: 'rgba(255,255,255,0.9)', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' },
}

const Frame = styled(XStack, {
  name: 'Marquee3D',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  items: 'center',

  variants: {
    variant: {
      default: { bg: '$background', color: '$color' },
      neon: { bg: '#000000' },
      rainbow: { bg: '#000000' },
      metallic: { bg: '#0f172a' },
      fire: { bg: '#000000' },
      glass: {},
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

/** The host for a bare text child. Ink and size come down from the item. */
const Label = styled(Text, { name: 'Marquee3DText', color: 'inherit' })

/**
 * The pair of loops slides the doubled track by half of itself; `direction`
 * only ever flips their play direction. The hover rule and the reduced-motion
 * rule select on the slot markers, so nothing here needs a class.
 */
const KEYFRAMES = `
@keyframes marquee-3d-x { to { transform: translateX(-50%) } }
@keyframes marquee-3d-y { to { transform: translateY(-50%) } }
@keyframes marquee-3d-pulse { 50% { opacity: 0.5 } }
@keyframes marquee-3d-float { 50% { transform: translateY(var(--float)) rotateX(5deg) rotateY(2deg) } }
[data-slot="marquee-3d"][data-pause-hover]:hover [data-slot="marquee-3d-track"] { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) {
  [data-slot="marquee-3d-track"], [data-slot="marquee-3d-group"], [data-slot="marquee-3d-char"] { animation: none !important }
}
`

export type Marquee3DProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children' | 'style'> & {
  children: React.ReactNode
  variant?: Marquee3DVariant
  size?: Marquee3DSize
  direction?: Marquee3DDirection
  perspective?: Marquee3DPerspective
  /** Track travel, px/s. */
  speed?: number
  pauseOnHover?: boolean
  /** Run against `direction`. */
  reverse?: boolean
  /** How many times `children` is laid out per loop. */
  repeat?: number
  /** Lay `children` out as many times as it takes to cover the frame, whatever `repeat` says. */
  autoFill?: boolean
  /** Space between items, px — across the loop's seam too. */
  gap?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  /** Fade both ends of the frame. */
  gradient?: boolean
  gradientColor?: string
  /** Length of each fade, px. */
  gradientWidth?: number
  style?: React.CSSProperties
}

type Span = { stage: number; track: number; item: number }
const UNMEASURED: Span = { stage: 0, track: 0, item: 0 }

/** The DOM box behind a ref, if there is one; a native view has none. */
const box = (el: GuiElement | null) =>
  typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null

export const Marquee3D = React.forwardRef<GuiElement, Marquee3DProps>(
  (
    {
      variant = 'default',
      size = 'default',
      direction = 'left',
      perspective = 'default',
      children,
      speed = 50,
      pauseOnHover = false,
      reverse = false,
      repeat = 5,
      autoFill = false,
      gap = 0,
      rotateX = 0,
      rotateY = 0,
      rotateZ = 0,
      gradient = false,
      gradientColor = '#ffffff',
      gradientWidth = 200,
      style,
      ...props
    },
    ref,
  ) => {
    const vertical = direction === 'up' || direction === 'down'
    const flipped = direction === 'right' || direction === 'down'
    const Axis = vertical ? YStack : XStack

    const stageRef = React.useRef<GuiElement | null>(null)
    const trackRef = React.useRef<GuiElement | null>(null)
    const itemRef = React.useRef<GuiElement | null>(null)
    const [span, setSpan] = React.useState(UNMEASURED)

    // Half the track must cover the stage or the loop shows bare ground; one
    // more copy keeps that true while the last one is still partly in view.
    const count = autoFill && span.item > 0 ? Math.ceil(span.stage / (span.item + gap)) + 1 : repeat

    // Layout sizes, not bounding boxes: the stage is tilted, and a bounding box
    // reports the projection. Re-read whenever the track's length can change:
    // `count` and `size` move it from inside, the observer catches the rest.
    React.useEffect(() => {
      const along = (el: GuiElement | null) => {
        const b = box(el)
        return b ? (vertical ? b.offsetHeight : b.offsetWidth) : 0
      }
      const measure = () => {
        const next = { stage: along(stageRef.current), track: along(trackRef.current), item: along(itemRef.current) }
        setSpan((s) => (s.stage === next.stage && s.track === next.track && s.item === next.item ? s : next))
      }
      measure()
      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
      }
      const observer = new ResizeObserver(measure)
      for (const el of [stageRef.current, trackRef.current]) {
        const b = box(el)
        if (b) observer.observe(b)
      }
      return () => observer.disconnect()
    }, [vertical, children, count, size, gap])

    const duration = span.track > 0 ? span.track / 2 / speed : 20
    const play = flipped !== reverse ? 'reverse' : 'normal'

    const tilt = `${DEPTH[perspective] ? `perspective(${DEPTH[perspective]}px) ` : ''}rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    const mask =
      gradient &&
      `linear-gradient(${vertical ? 'to bottom' : 'to right'}, transparent, ${gradientColor} ${gradientWidth}px, ${gradientColor} calc(100% - ${gradientWidth}px), transparent)`

    // The trailing pad is the gap between the last item of one copy and the
    // first of the next, so the period is exactly half the track.
    const group = (hidden: boolean) => (
      <Axis
        {...slot('marquee-3d-group')}
        shrink={0}
        items="center"
        gap={gap}
        {...(vertical ? { pb: gap } : { pr: gap })}
      >
        {Array.from({ length: count }, (_, i) => (
          <Axis
            key={i}
            ref={i === 0 && !hidden ? itemRef : undefined}
            aria-hidden={hidden || i > 0 || undefined}
            {...slot('marquee-3d-item')}
            shrink={0}
            items="center"
            gap={gap}
            // The keyword, not a ratio: gui reads a bare number as px, and a
            // 1.2px line box stacks every glyph on one line.
            style={{ fontSize: FONT[size], fontWeight: 700, lineHeight: 'normal', whiteSpace: 'nowrap', ...INK[variant] }}
          >
            {ink(children, Label, { ...slot('marquee-3d-text') })}
          </Axis>
        ))}
      </Axis>
    )

    return (
      <Frame
        ref={ref}
        {...slot('marquee-3d')}
        data-variant={variant}
        data-direction={direction}
        data-pause-hover={pauseOnHover || undefined}
        variant={variant}
        {...(variant === 'glass' ? glass(2) : null)}
        height={HEIGHT[size]}
        style={{ ...(mask && { maskImage: mask, WebkitMaskImage: mask }), ...style }}
        {...(props as React.ComponentProps<typeof Frame>)}
      >
        <style href="marquee-3d" precedence="default">
          {KEYFRAMES}
        </style>
        <Axis
          ref={stageRef}
          {...slot('marquee-3d-stage')}
          width="100%"
          height="100%"
          items="center"
          style={{ transform: tilt }}
        >
          <Axis
            ref={trackRef}
            {...slot('marquee-3d-track')}
            shrink={0}
            // Longhands, so the play state is left to the hover rule: an
            // inline `animation` shorthand would set it too and outrank the sheet.
            style={{
              willChange: 'transform',
              animationName: `marquee-3d-${vertical ? 'y' : 'x'}`,
              animationDuration: `${duration}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDirection: play,
            }}
          >
            {group(false)}
            {group(true)}
          </Axis>
        </Axis>
      </Frame>
    )
  },
)
Marquee3D.displayName = 'Marquee3D'

type PresetProps = Omit<Marquee3DProps, 'variant' | 'size'>

/** The five named looks, each a `Marquee3D` pinned to a variant and size; every other prop stays open. */
export const Marquee3DPreset = {
  Hero: React.forwardRef<GuiElement, PresetProps>((props, ref) => (
    <Marquee3D ref={ref} variant="rainbow" size="3xl" speed={30} rotateX={-10} gradient {...props} />
  )),
  Neon: React.forwardRef<GuiElement, PresetProps>((props, ref) => (
    <Marquee3D ref={ref} variant="neon" size="xl" speed={40} rotateY={5} pauseOnHover {...props} />
  )),
  Metallic: React.forwardRef<GuiElement, PresetProps>((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="metallic"
      size="lg"
      speed={35}
      rotateX={-5}
      rotateY={2}
      gradient
      gradientColor="#c4c4c4"
      {...props}
    />
  )),
  Fire: React.forwardRef<GuiElement, PresetProps>((props, ref) => (
    <Marquee3D ref={ref} variant="fire" size="2xl" speed={60} rotateZ={1} gradient gradientColor="#ff6600" {...props} />
  )),
  Glass: React.forwardRef<GuiElement, PresetProps>((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="glass"
      size="lg"
      speed={25}
      rotateX={-8}
      pauseOnHover
      gradient
      gradientColor="rgba(255,255,255,0.9)"
      {...props}
    />
  )),
}
Marquee3DPreset.Hero.displayName = 'Marquee3DPreset.Hero'
Marquee3DPreset.Neon.displayName = 'Marquee3DPreset.Neon'
Marquee3DPreset.Metallic.displayName = 'Marquee3DPreset.Metallic'
Marquee3DPreset.Fire.displayName = 'Marquee3DPreset.Fire'
Marquee3DPreset.Glass.displayName = 'Marquee3DPreset.Glass'

export type Marquee3DFloatingProps = Marquee3DProps & {
  /** Peak lift of each glyph, px. */
  floatIntensity?: number
  /** Seconds per bob. */
  floatSpeed?: number
}

/**
 * A `Marquee3D` whose text child floats glyph by glyph: each runs the same bob,
 * offset by a tenth of a second per position, on top of the scroll. Any other
 * child passes through untouched.
 */
export const Marquee3DFloating = React.forwardRef<GuiElement, Marquee3DFloatingProps>(
  ({ children, floatIntensity = 10, floatSpeed = 3, ...props }, ref) => {
    const text = typeof children === 'string' ? children : ''
    return (
      <Marquee3D ref={ref} {...props}>
        {text ? (
          <Label {...slot('marquee-3d-text')} style={{ display: 'inline-flex', gap: 4 }}>
            {[...text].map((char, i) => (
              <Label
                key={i}
                {...slot('marquee-3d-char')}
                style={{
                  display: 'inline-block',
                  ['--float' as string]: `${-floatIntensity}px`,
                  animation: `marquee-3d-float ${floatSpeed}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </Label>
            ))}
          </Label>
        ) : (
          children
        )}
      </Marquee3D>
    )
  },
)
Marquee3DFloating.displayName = 'Marquee3DFloating'
