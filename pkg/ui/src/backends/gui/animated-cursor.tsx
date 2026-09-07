'use client'

/**
 * AnimatedCursor — a custom pointer that follows the mouse, grows on hover,
 * shrinks on click, and can trail a fading string of dots behind it.
 *
 * It reads the document rather than any one element: a `mousemove` positions
 * the dot, `mouseover` walks `event.target` up through `closest()` against four
 * selector groups (text / interactive / grab / grabbing) to pick a shape, and
 * `mousedown`/`mouseup` drive the click scale. While it is live one stylesheet
 * rule hides the native cursor everywhere — the body alone is not enough, since
 * a button's own `cursor: pointer` and a field's I-beam would still show beside
 * the dot — and the rule goes with the component. `color` and `trailColor` take
 * a theme token (`$color`, the default) or any CSS colour, and the trail, unless
 * given its own, is the fill at a third of its strength. The frame carries
 * `zIndex`, so the dot stays above overlays. All of that is DOM-only, so it
 * renders nothing on native, on a touch device (`hideOnTouch`, the default)
 * or while `isVisible` is off, and does nothing before mount, keeping the
 * server render and the first client render identical.
 */
import { YStack, isWeb, useTheme } from '@hanzo/gui'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { sx } from '../../sx'
import { slot } from './slot'

export type AnimatedCursorBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

export type AnimatedCursorShape = 'default' | 'pointer' | 'text' | 'grab' | 'grabbing'

export type CursorPosition = { x: number; y: number }

export type CursorState = {
  position: CursorPosition
  isHovering: boolean
  isClicking: boolean
  cursorType: AnimatedCursorShape
}

export type AnimatedCursorProps = {
  /** Whether the cursor renders at all; off, the native cursor is untouched. */
  isVisible?: boolean
  /** Diameter of the dot, in px. */
  size?: number
  /** Fill of the dot: a theme token such as `$color`, or a CSS colour. */
  color?: string
  /** Fill of each trailing dot; by default the fill at a third of its strength. */
  trailColor?: string
  /** How long the dot and the ring take to settle, in ms. */
  animationDuration?: number
  /** Whether a fading trail of past positions renders behind the dot. */
  showTrail?: boolean
  /** How many past positions the trail keeps. */
  trailLength?: number
  /** `mix-blend-mode` for the dot, the trail and the hover ring. */
  blendMode?: AnimatedCursorBlendMode
  /** Scale the dot reaches while hovering an interactive element. */
  hoverScale?: number
  /** Render nothing on a device that reports touch support. */
  hideOnTouch?: boolean
  /** Class notation for the fixed frame. */
  className?: string
  /** How long the click scale takes to release, in ms. */
  clickAnimationDuration?: number
  /** Stacking context of the frame, and of the dot within it; the trail and ring sit just under. */
  zIndex?: number
}

const INTERACTIVE_SELECTORS = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
  '[data-cursor="pointer"]',
].join(', ')

const TEXT_SELECTORS = [
  'input[type="text"]',
  'input[type="email"]',
  'input[type="password"]',
  'input[type="search"]',
  'textarea',
  '[contenteditable="true"]',
  '[data-cursor="text"]',
].join(', ')

const GRAB_SELECTORS = '[data-cursor="grab"]'
const GRABBING_SELECTORS = '[data-cursor="grabbing"]'

const HIDE_NATIVE = '* { cursor: none !important }'

const touchCapable = () =>
  isWeb &&
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

/** A theme token (`$color`) as the CSS variable behind it; any other colour as written. */
const paint = (theme: ReturnType<typeof useTheme>, c: string) =>
  c.startsWith('$') ? String(theme[c.slice(1)]?.get('web') ?? c) : c

/**
 * The shape `closest()` finds for a mouseover target, or `default` for none.
 * Text fields are checked before the general interactive group, because a
 * text `<input>` and a `<textarea>` also match that group's bare `input` /
 * `textarea` entries and would otherwise never read as text.
 */
const shapeFor = (target: EventTarget | null): AnimatedCursorShape => {
  const el = target as HTMLElement | null
  if (!el?.closest) return 'default'
  if (el.closest(TEXT_SELECTORS)) return 'text'
  if (el.closest(INTERACTIVE_SELECTORS)) return 'pointer'
  if (el.closest(GRAB_SELECTORS)) return 'grab'
  if (el.closest(GRABBING_SELECTORS)) return 'grabbing'
  return 'default'
}

export function AnimatedCursor({
  isVisible = true,
  size = 20,
  color = '$color',
  trailColor,
  animationDuration = 200,
  showTrail = true,
  trailLength = 8,
  blendMode = 'normal',
  hoverScale = 1.5,
  hideOnTouch = true,
  className,
  clickAnimationDuration = 100,
  zIndex = 9999,
}: AnimatedCursorProps) {
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [state, setState] = useState<CursorState>({
    position: { x: 0, y: 0 },
    isHovering: false,
    isClicking: false,
    cursorType: 'default',
  })
  const [trail, setTrail] = useState<CursorPosition[]>([])
  const trailRef = useRef<CursorPosition[]>([])

  useEffect(() => {
    setMounted(true)
    setIsTouch(touchCapable())
  }, [])

  const live = mounted && isWeb && isVisible && !(hideOnTouch && isTouch)

  useEffect(() => {
    if (!live) return

    const onMove = (e: MouseEvent) => {
      const position = { x: e.clientX, y: e.clientY }
      setState((s) => ({ ...s, position }))
      const next = [...trailRef.current, position]
      trailRef.current = next.slice(Math.max(0, next.length - trailLength))
      setTrail(trailRef.current)
    }
    const onOver = (e: MouseEvent) => {
      const cursorType = shapeFor(e.target)
      setState((s) => ({ ...s, isHovering: cursorType !== 'default', cursorType }))
    }
    const onDown = () => setState((s) => ({ ...s, isClicking: true }))
    const onUp = () => setState((s) => ({ ...s, isClicking: false }))
    const onLeave = () => setState((s) => ({ ...s, isHovering: false, cursorType: 'default' }))

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)

    const hide = document.createElement('style')
    hide.textContent = HIDE_NATIVE
    document.head.appendChild(hide)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      hide.remove()
    }
  }, [live, trailLength])

  if (!live) return null

  const fill = paint(theme, color)
  const trailFill = trailColor ? paint(theme, trailColor) : `color-mix(in srgb, ${fill} 31%, transparent)`
  const hoverRingSize = size * hoverScale
  const dotScale = (state.isHovering ? hoverScale : 1) * (state.isClicking ? 0.8 : 1)
  const isText = state.cursorType === 'text'
  const isGrab = state.cursorType === 'grab' || state.cursorType === 'grabbing'

  return (
    <YStack
      {...slot('animated-cursor')}
      position="fixed"
      inset={0}
      style={{ zIndex }}
      pointerEvents="none"
      {...sx(className)}
    >
      {showTrail &&
        trail.map((point, i) => {
          const weight = (i + 1) / trail.length
          const style: CSSProperties = {
            position: 'absolute',
            left: point.x - size / 2,
            top: point.y - size / 2,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: trailFill,
            opacity: weight * 0.5,
            transform: `scale(${weight * 0.8})`,
            zIndex: zIndex - i - 1,
            mixBlendMode: blendMode,
          }
          return <YStack key={i} {...slot('animated-cursor-trail')} style={style} />
        })}

      <YStack
        {...slot('animated-cursor-dot')}
        data-shape={state.cursorType}
        style={{
          position: 'absolute',
          left: state.position.x - (isText ? 1 : size / 2),
          top: state.position.y - (isText ? 12 : size / 2),
          width: isText ? 2 : size,
          height: isText ? 24 : size,
          backgroundColor: fill,
          borderRadius: isText ? 0 : isGrab ? '6px' : '50%',
          transform: `scale(${dotScale})`,
          transitionProperty: 'transform',
          transitionDuration: `${state.isClicking ? clickAnimationDuration : animationDuration}ms`,
          transitionTimingFunction: 'ease-out',
          zIndex,
          mixBlendMode: blendMode,
        }}
      />

      {state.isHovering && !isText && (
        <YStack
          {...slot('animated-cursor-ring')}
          style={{
            position: 'absolute',
            left: state.position.x - hoverRingSize / 2,
            top: state.position.y - hoverRingSize / 2,
            width: hoverRingSize,
            height: hoverRingSize,
            borderRadius: '50%',
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: fill,
            opacity: 0.3,
            transitionProperty: 'all',
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: 'ease-out',
            zIndex: zIndex - 1,
            mixBlendMode: blendMode,
          }}
        />
      )}
    </YStack>
  )
}
