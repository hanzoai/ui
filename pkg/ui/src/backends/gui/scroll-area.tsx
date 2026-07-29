"use client"

/**
 * ScrollArea — the cross-platform (web + native + desktop) scroll surface.
 *
 * Scrolling itself is the platform's: @hanzogui/scroll-view's `ScrollView` (a
 * styled react-native `ScrollView`), so momentum, keyboard, wheel, and
 * accessibility come from the host and are never reimplemented. What this adds is
 * the ONE custom scrollbar — the platform indicator is suppressed and `ScrollBar`
 * draws it from the scroll metrics the viewport reports, so a thumb looks and
 * drags identically on Chrome, iOS, and Tauri.
 *
 * One area scrolls one axis (`horizontal` picks it), so there is exactly one bar
 * and never a dead one: `ScrollArea` renders `<ScrollBar orientation={axis} />`
 * and a bar for the other axis has nothing to scroll and renders nothing.
 */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  ScrollView,
  XStack,
  YStack,
  type GetRef,
  type GuiElement,
  type YStackProps,
} from "@hanzo/gui"

import { slot } from "./slot"
import { drag, dragPos, touch } from "./gesture"

/** Bar thickness, and the thumb's minimum length — both in px. */
const BAR = 10
/** Minimum touch target. The thumb is `BAR` thin, so `touch()` makes up the rest. */
const TOUCH = 44

export type ScrollAreaType = "auto" | "always" | "scroll" | "hover"
type Axis = "vertical" | "horizontal"

/** What the viewport reports about one axis, in px. */
type Track = { offset: number; viewport: number; content: number }
const ZERO: Track = { offset: 0, viewport: 0, content: 0 }

type ScrollAreaCtx = {
  axis: Axis
  track: Track
  type: ScrollAreaType
  /** Scrolling or hovered — what `scroll` and `hover` reveal on. */
  active: boolean
  rtl: boolean
  scrollBy: (delta: number) => void
}

const Ctx = /* @__PURE__ */ createContext<ScrollAreaCtx | null>(null)

const clamp = (n: number, max: number) => (n < 0 ? 0 : n > max ? max : n)

export type ScrollBarProps = Omit<YStackProps, "children"> & {
  orientation?: Axis
}

const ScrollBar = /* @__PURE__ */ forwardRef<GuiElement, ScrollBarProps>(
  function ScrollBar({ orientation = "vertical", ...props }, ref) {
    const ctx = useContext(Ctx)
    const [len, setLen] = useState(0)
    const from = useRef<number | null>(null)

    if (!ctx || ctx.axis !== orientation) return null

    const vertical = orientation === "vertical"
    const { content, viewport, offset } = ctx.track
    const scrollable = content - viewport
    const overflow = scrollable > 1
    const shown =
      ctx.type === "always"
        ? true
        : !overflow
          ? false
          : ctx.type === "auto"
            ? true
            : ctx.active

    const thumb = Math.max(TOUCH, len * (viewport / Math.max(content, 1)))
    const range = Math.max(len - thumb, 0)
    const at = overflow ? range * clamp(offset / scrollable, 1) : 0

    const gesture = drag({
      begin: (e) => {
        from.current = dragPos(e, !vertical)
      },
      move: (e) => {
        const start = from.current
        if (start === null || range === 0) return
        const now = dragPos(e, !vertical)
        from.current = now
        ctx.scrollBy(((now - start) * scrollable) / range)
      },
      end: () => {
        from.current = null
      },
    })

    return (
      <XStack
        ref={ref}
        {...slot("scroll-area-scrollbar")}
        position="absolute"
        {...(vertical
          ? {
              t: 0,
              b: 0,
              ...(ctx.rtl ? { l: 0 } : { r: 0 }),
              width: BAR,
              flexDirection: "column" as const,
            }
          : { l: 0, r: 0, b: 0, height: BAR, flexDirection: "row" as const })}
        p={1}
        opacity={shown ? 1 : 0}
        pointerEvents={shown ? "auto" : "none"}
        onLayout={(e) =>
          setLen(
            vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width
          )
        }
        {...props}
      >
        <YStack
          {...slot("scroll-area-thumb")}
          bg="$borderColor"
          rounded={BAR}
          {...touch(BAR, TOUCH, vertical ? "x" : "y")}
          {...(vertical
            ? { width: "100%" as const, height: thumb, y: at }
            : { height: "100%" as const, width: thumb, x: at })}
          {...gesture}
        />
      </XStack>
    )
  }
)

export type ScrollAreaProps = Omit<YStackProps, "children"> & {
  /** When the bar shows: on overflow, always, while scrolling, or on hover. */
  type?: ScrollAreaType
  /** ms the bar lingers after scrolling/hover stops (`scroll` and `hover`). */
  scrollHideDelay?: number
  dir?: "ltr" | "rtl"
  /** Scroll the x axis instead of the y axis (react-native ScrollView semantics). */
  horizontal?: boolean
  children?: ReactNode
}

const ScrollArea = /* @__PURE__ */ forwardRef<GuiElement, ScrollAreaProps>(
  function ScrollArea(
    {
      type = "hover",
      scrollHideDelay = 600,
      dir,
      horizontal = false,
      children,
      ...props
    },
    ref
  ) {
    const viewport = useRef<GetRef<typeof ScrollView>>(null)
    const live = useRef<Track>(ZERO)
    const [track, setTrack] = useState<Track>(ZERO)
    const [active, setActive] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const axis: Axis = horizontal ? "horizontal" : "vertical"

    const put = useCallback((patch: Partial<Track>) => {
      const next = { ...live.current, ...patch }
      live.current = next
      setTrack(next)
    }, [])

    const clear = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
    }

    const hold = () => {
      clear()
      setActive(true)
    }

    /** Show now, then fade after the delay — the shared reveal for scroll + hover. */
    const wake = useCallback(() => {
      setActive(true)
      clear()
      timer.current = setTimeout(() => setActive(false), scrollHideDelay)
    }, [scrollHideDelay])

    useEffect(() => clear, [])

    const scrollBy = useCallback(
      (delta: number) => {
        const t = live.current
        const next = clamp(
          t.offset + delta,
          Math.max(t.content - t.viewport, 0)
        )
        put({ offset: next })
        viewport.current?.scrollTo(
          horizontal
            ? { x: next, y: 0, animated: false }
            : { x: 0, y: next, animated: false }
        )
      },
      [horizontal, put]
    )

    return (
      <YStack
        ref={ref}
        {...slot("scroll-area")}
        position="relative"
        overflow="hidden"
        onMouseEnter={type === "hover" ? hold : undefined}
        onMouseLeave={type === "hover" ? wake : undefined}
        {...props}
      >
        <ScrollView
          ref={viewport}
          {...slot("scroll-area-viewport")}
          flex={1}
          width="100%"
          height="100%"
          horizontal={horizontal}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onLayout={(e) =>
            put({
              viewport: horizontal
                ? e.nativeEvent.layout.width
                : e.nativeEvent.layout.height,
            })
          }
          onContentSizeChange={(w, h) => put({ content: horizontal ? w : h })}
          onScroll={(e) => {
            const { contentOffset } = e.nativeEvent
            put({ offset: horizontal ? contentOffset.x : contentOffset.y })
            wake()
          }}
        >
          {children}
        </ScrollView>
        <Ctx.Provider
          value={{ axis, track, type, active, rtl: dir === "rtl", scrollBy }}
        >
          <ScrollBar orientation={axis} />
        </Ctx.Provider>
      </YStack>
    )
  }
)

export { ScrollArea, ScrollBar }
