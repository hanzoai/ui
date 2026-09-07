'use client'

/**
 * DesktopWindow — a macOS-style floating panel: a title bar with traffic-light
 * controls (close/minimize/maximize), a draggable title bar, a resizable
 * bottom-right corner, and a double-click (or the maximize button) to fill the
 * viewport and restore.
 *
 * Dragging and resizing both run on `drag()` from `./gesture` — the one
 * pointer/responder contract this backend already uses for the color picker's
 * saturation field and hue bar. Position and size are plain numeric state; the
 * frame's box is set through `style` because it is a live pixel rectangle, not
 * a themed surface — everything else on the frame (background, border, radius,
 * shadow) is a token read through `variant`.
 */
import { SizableText, XStack, YStack, createStyledContext, styled, type GuiElement } from '@hanzo/gui'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { drag, dragPos, touch, type DragEvent } from './gesture'
import { slot } from './slot'

export type DesktopWindowType = 'default' | 'dark' | 'light' | 'transparent'

const TITLE_BAR_H = 40
const CONTROL = 12
const RESIZE_HANDLE = 16

const box = (el: GuiElement | null) =>
  typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null

const WindowContext = /* @__PURE__ */ createStyledContext<{ windowType: DesktopWindowType }>({
  windowType: 'default',
})

const Frame = styled(YStack, {
  name: 'DesktopWindow',
  context: WindowContext,
  borderWidth: 1,
  rounded: '$5',
  overflow: 'hidden',
  shadowColor: '$shadowColor',
  shadowRadius: 24,

  variants: {
    windowType: {
      default: { bg: '$panel', borderColor: '$borderColor' },
      dark: { bg: '$color1', borderColor: '$borderColor' },
      light: { bg: '$color12', borderColor: '$borderColor' },
      transparent: { bg: '$panel', borderColor: '$borderColor', opacity: 0.92 },
    },
  } as const,

  defaultVariants: { windowType: 'default' },
})

const TitleText = styled(SizableText, {
  name: 'DesktopWindowTitleText',
  context: WindowContext,
  size: '$2',
  fontWeight: '600',

  variants: {
    windowType: {
      default: { color: '$ink' },
      dark: { color: '$white1' },
      light: { color: '$color1' },
      transparent: { color: '$ink' },
    },
  } as const,
})

/** One traffic-light dot: close (red), minimize (yellow) or maximize (green). */
const Light = styled(XStack, {
  name: 'DesktopWindowLight',
  width: CONTROL,
  height: CONTROL,
  rounded: 999,
  items: 'center',
  justify: 'center',
  cursor: 'pointer',

  variants: {
    tone: {
      close: { bg: '$red9', hoverStyle: { bg: '$red10' } },
      minimize: { bg: '$yellow9', hoverStyle: { bg: '$yellow10' } },
      maximize: { bg: '$green9', hoverStyle: { bg: '$green10' } },
    },
  } as const,
})

export type DesktopWindowControlsProps = {
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isMaximized?: boolean
}

/** The three traffic-light dots on their own, for a title bar built by hand. */
export function DesktopWindowControls({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
}: DesktopWindowControlsProps) {
  return (
    <XStack {...slot('desktop-window-controls')} items="center" gap="$2">
      <Light
        {...slot('desktop-window-close')}
        tone="close"
        onPress={onClose}
        {...touch(CONTROL, 44, 'both')}
        aria-label="Close window"
        role="button"
      />
      <Light
        {...slot('desktop-window-minimize')}
        tone="minimize"
        onPress={onMinimize}
        {...touch(CONTROL, 44, 'both')}
        aria-label="Minimize window"
        role="button"
      />
      <Light
        {...slot('desktop-window-maximize')}
        tone="maximize"
        onPress={onMaximize}
        {...touch(CONTROL, 44, 'both')}
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        role="button"
      />
    </XStack>
  )
}

export type DesktopWindowProps = {
  /** Text shown in the title bar. */
  title: string
  icon?: ReactNode
  children?: ReactNode
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  /** Fires on pointer-down anywhere on the frame — wire it to bring-to-front. */
  onFocus?: () => void
  initialPosition?: { x: number; y: number }
  initialSize?: { width: number; height: number }
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  /** Style variant — the frame's background, border and title-text color. */
  windowType?: DesktopWindowType
  /** Drag the corner to resize. Defaults to on. */
  resizable?: boolean
  /** Drag the title bar to move. Defaults to on. */
  draggable?: boolean
  /** Hide the three traffic-light dots. */
  hideControls?: boolean
  zIndex?: number
}

/**
 * A macOS-style window: `title` names it, `onClose`/`onMinimize`/`onMaximize`
 * wire the traffic lights, `initialPosition`/`initialSize` place it, and
 * `windowType` picks its surface. Position and size stay in this component —
 * a caller that needs several windows keeps one of these per window and an
 * `onFocus` that raises its `zIndex`.
 */
export function DesktopWindow({
  title,
  icon,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  initialPosition,
  initialSize,
  minWidth = 200,
  minHeight = 150,
  maxWidth,
  maxHeight,
  windowType = 'default',
  resizable = true,
  draggable = true,
  hideControls = false,
  zIndex = 1000,
}: DesktopWindowProps) {
  const frameRef = useRef<GuiElement | null>(null)
  const [position, setPosition] = useState(() => initialPosition ?? { x: 100, y: 100 })
  const [size, setSize] = useState(() => initialSize ?? { width: 800, height: 600 })
  const [isMaximized, setIsMaximized] = useState(false)
  const restoreRef = useRef<{ position: typeof position; size: typeof size } | null>(null)
  const lastPointer = useRef({ x: 0, y: 0 })
  const startSize = useRef(size)

  const titleId = `desktop-window-title-${title.replace(/\s+/g, '-').toLowerCase()}`

  const handleMaximize = useCallback(() => {
    setIsMaximized((was) => {
      if (was) {
        if (restoreRef.current) {
          setPosition(restoreRef.current.position)
          setSize(restoreRef.current.size)
        }
        return false
      }
      restoreRef.current = { position, size }
      setPosition({ x: 0, y: 0 })
      setSize({
        width: typeof window !== 'undefined' ? window.innerWidth : size.width,
        height: typeof window !== 'undefined' ? window.innerHeight : size.height,
      })
      return true
    })
    onMaximize?.()
  }, [position, size, onMaximize])

  const beginDrag = useCallback((e: DragEvent) => {
    lastPointer.current = { x: dragPos(e, true), y: dragPos(e, false) }
  }, [])

  const moveDrag = useCallback((e: DragEvent) => {
    const x = dragPos(e, true)
    const y = dragPos(e, false)
    const dx = x - lastPointer.current.x
    const dy = y - lastPointer.current.y
    lastPointer.current = { x, y }
    setPosition((p) => ({ x: p.x + dx, y: p.y + dy }))
  }, [])

  const dragGesture = drag({
    begin: beginDrag,
    move: moveDrag,
    end: () => {},
    enabled: draggable && !isMaximized,
  })

  const beginResize = useCallback((e: DragEvent) => {
    lastPointer.current = { x: dragPos(e, true), y: dragPos(e, false) }
    startSize.current = size
  }, [size])

  const moveResize = useCallback(
    (e: DragEvent) => {
      const x = dragPos(e, true)
      const y = dragPos(e, false)
      const dx = x - lastPointer.current.x
      const dy = y - lastPointer.current.y
      const width = Math.max(minWidth, Math.min(startSize.current.width + dx, maxWidth ?? Infinity))
      const height = Math.max(minHeight, Math.min(startSize.current.height + dy, maxHeight ?? Infinity))
      setSize({ width, height })
    },
    [minWidth, minHeight, maxWidth, maxHeight],
  )

  const resizeGesture = drag({
    begin: beginResize,
    move: moveResize,
    end: () => {},
    enabled: resizable && !isMaximized,
  })

  // Escape closes the window, same as a real one — only while it has focus.
  useEffect(() => {
    const el = box(frameRef.current)
    if (!el) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <Frame
      ref={frameRef}
      {...slot('desktop-window')}
      windowType={windowType}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      onPointerDown={onFocus}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
        minWidth,
        minHeight,
        maxWidth: isMaximized ? undefined : maxWidth,
        maxHeight: isMaximized ? undefined : maxHeight,
        zIndex,
      }}
    >
      <XStack
        {...slot('desktop-window-title-bar')}
        height={TITLE_BAR_H}
        px="$3"
        items="center"
        justify="space-between"
        borderBottomWidth={1}
        borderColor="$borderColor"
        cursor={draggable && !isMaximized ? 'grab' : 'default'}
        onDoubleClick={handleMaximize}
        {...dragGesture}
      >
        {hideControls ? (
          <XStack width={CONTROL * 3 + 16} />
        ) : (
          <DesktopWindowControls
            onClose={onClose}
            onMinimize={onMinimize}
            onMaximize={handleMaximize}
            isMaximized={isMaximized}
          />
        )}
        <XStack items="center" gap="$2" flex={1} justify="center">
          {icon}
          <TitleText id={titleId} windowType={windowType} numberOfLines={1}>
            {title}
          </TitleText>
        </XStack>
        <XStack width={CONTROL * 3 + 16} />
      </XStack>

      <YStack {...slot('desktop-window-content')} flex={1} overflow="scroll">
        {children}
      </YStack>

      {resizable && !isMaximized ? (
        <XStack
          {...slot('desktop-window-resize-handle')}
          position="absolute"
          b={0}
          r={0}
          width={RESIZE_HANDLE}
          height={RESIZE_HANDLE}
          cursor="se-resize"
          {...resizeGesture}
        />
      ) : null}
    </Frame>
  )
}
