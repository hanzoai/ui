'use client'

/**
 * AnimatedLogo — the ONE animated brand logo across every Hanzo surface.
 *
 * On mount the full wordmark shows ("Hanzo {surface}", e.g. "Hanzo Cloud"), then
 * collapses INTO just the brand mark; hover or keyboard-focus expands it back to
 * the full name. This is the shared brand-identity primitive — the behavior that
 * ships on hanzo.ai and cloud.hanzo.ai, made one component, white-label aware.
 *
 *   <AnimatedLogo surface="Cloud" />                    // Hanzo Cloud → H
 *   <AnimatedLogo surface="Studio" />                   // Hanzo Studio → H
 *   <AnimatedLogo surface="Cloud" brand={LUX} />        // Lux Cloud → Lux mark
 *
 * Presentational + host-agnostic (plain React + inline SVG, no @hanzo/gui, no
 * framer): drops into any surface — the Tamagui console, the Next marketing site,
 * a desktop shell. Theme-aware (the mark is `currentColor`), and accessible: the
 * accessible name is always the full "Hanzo {surface}" regardless of the visual
 * collapse, and `prefers-reduced-motion` yields a static mark with no animation.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { HANZO, type BrandIdentity } from './brand'
import {
  DEFAULT_DURATION_MS,
  DEFAULT_GAP,
  DEFAULT_INTRO_MS,
  HOUSE_EASE,
  isExpanded,
  wordmarkStyle,
  wordmarkText,
} from './animatedLogo.logic'

export interface AnimatedLogoProps {
  /** Surface word after the brand ("AI", "Cloud", "Studio", "Chat", "App", "Console", "Team"). */
  surface?: string
  /** Brand identity — mark + name + home. Defaults to Hanzo. */
  brand?: BrandIdentity
  /** Mark size in px (square). Default 22. */
  size?: number
  /** Gap in px between the mark and the wordmark when expanded. Default 8. */
  gap?: number
  /** Hold in ms before the wordmark auto-collapses on mount. 0 disables the intro
   *  (starts collapsed). Default 1500. */
  introMs?: number
  /** Collapse/expand duration in ms. Default 360 (echoes the mark's fold-in). */
  durationMs?: number
  /** Easing curve. Default the Hanzo house expo-out. */
  easing?: string
  /** Link target. Defaults to the brand's home. */
  href?: string
  onClick?: React.MouseEventHandler
  /** Root element/component (e.g. a router `Link`). Default `'a'`. */
  component?: React.ElementType
  className?: string
  style?: React.CSSProperties
  /** Override the accessible name (default is the full "Hanzo {surface}"). */
  'aria-label'?: string
}

/** SSR-safe prefers-reduced-motion. Starts false (server), corrects on mount. */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduce(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduce
}

export function AnimatedLogo({
  surface,
  brand = HANZO,
  size = 22,
  gap = DEFAULT_GAP,
  introMs = DEFAULT_INTRO_MS,
  durationMs = DEFAULT_DURATION_MS,
  easing = HOUSE_EASE,
  href,
  onClick,
  component,
  className,
  style,
  'aria-label': ariaLabel,
}: AnimatedLogoProps) {
  const reduce = usePrefersReducedMotion()
  const label = ariaLabel ?? wordmarkText(brand.name, surface)

  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  // Show the full wordmark on first paint (name shows on load), then collapse.
  const [introShowing, setIntroShowing] = useState(introMs > 0)
  const [naturalWidth, setNaturalWidth] = useState<number | undefined>(undefined)
  const wordRef = useRef<HTMLSpanElement>(null)

  // Mount intro: hold the name, then tuck it into the mark. Reduced motion skips
  // the timeline entirely (static mark), so there is no animation.
  useEffect(() => {
    if (introMs <= 0) return
    if (reduce) {
      setIntroShowing(false)
      return
    }
    const t = setTimeout(() => setIntroShowing(false), introMs)
    return () => clearTimeout(t)
  }, [introMs, reduce])

  // Measure the wordmark's natural width so it can animate to/from an exact px
  // width (auto is not animatable). `scrollWidth` reports the full content width
  // in every state (the wrapper is overflow-hidden + nowrap). Re-measure when the
  // text changes and once the webfont has settled.
  useLayoutEffect(() => {
    const el = wordRef.current
    if (!el) return
    const measure = () => setNaturalWidth(el.scrollWidth)
    measure()
    const fonts = (typeof document !== 'undefined' && (document as Document).fonts) || null
    if (fonts?.ready) fonts.ready.then(measure).catch(() => {})
  }, [brand.name, surface])

  const expanded = isExpanded({ hovered, focused, introShowing })
  const ws = wordmarkStyle({ expanded, naturalWidth, gap, durationMs, easing, reduce })

  const Root = component ?? 'a'
  const isAnchor = Root === 'a'

  return (
    <Root
      {...(isAnchor ? { href: href ?? brand.href ?? '/' } : { href: href ?? brand.href })}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={brand.viewBox}
        aria-hidden="true"
        focusable="false"
        fill={brand.fullColor ? undefined : 'currentColor'}
        style={{ display: 'block', flexShrink: 0 }}
        // `content` is a build-time-trusted constant (see ./brand), never user input.
        dangerouslySetInnerHTML={{ __html: brand.content }}
      />
      <span
        ref={wordRef}
        aria-hidden="true"
        style={{
          display: 'inline-block',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          width: ws.width,
          opacity: ws.opacity,
          marginLeft: ws.marginLeft,
          transition: ws.transition,
        }}
      >
        {label}
      </span>
    </Root>
  )
}
