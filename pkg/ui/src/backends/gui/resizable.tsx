'use client'

/**
 * Resizable panel group — native to @hanzo/gui, no `react-resizable-panels`.
 *
 * The upstream package dropped `PanelGroup`/`PanelResizeHandle` in v4 (it now
 * exports `Group`/`Panel`/`Separator` and renamed `direction` → `orientation`),
 * so every consumer pinned to the old shape is unbuildable. Rather than pin a
 * dead version we own the primitive: it is ~200 lines of percentage arithmetic
 * over a flexbox, which is cheaper to keep than a dependency that renames its
 * public surface.
 *
 * Layout is PERCENTAGES, never pixels: a panel's share becomes its `flexGrow`
 * over a zero `flexBasis`, so the browser/RN layout engine handles container
 * resize for free (and rounding can never leave a gap). The only thing this
 * module owns is "where is the boundary" — pure functions (`defaultLayout`,
 * `resizeAt`) with the min/max/collapse clamping in ONE place.
 *
 * Cross-platform by construction: the group measures itself with `onLayout`
 * (gui implements it on web too), and the handle drives web with Pointer Events
 * + pointer capture and native with the responder system. Both prop sets are
 * typed on gui's stacks, and pointer capture is feature-detected, so nothing
 * here reaches for the DOM on expo. Keyboard resize is arrow keys (Shift for a
 * fine step). Touch target is the 4px handle plus a 20px hitSlop = 44px.
 */
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Separator, XStack, isWeb, type XStackProps } from '@hanzo/gui'
import { GripVertical } from '@hanzogui/lucide-icons-2'

export type ResizeDirection = 'horizontal' | 'vertical'

/** Everything the boundary math needs to know about a panel. */
export type PanelSpec = {
  id: string
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsible?: boolean
  collapsedSize?: number
  onResize?: (size: number) => void
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(n, hi))

/** Smallest percentage a panel may take — collapsible panels may go to `collapsedSize`. */
const floorOf = (s: PanelSpec) => (s.collapsible ? (s.collapsedSize ?? 0) : (s.minSize ?? 0))
const ceilOf = (s: PanelSpec) => s.maxSize ?? 100

/** Starting percentages: honour every `defaultSize`, split the remainder evenly, normalise to 100. PURE. */
export function defaultLayout(specs: PanelSpec[]): number[] {
  if (specs.length === 0) return []
  const claimed = specs.reduce((n, s) => n + (s.defaultSize ?? 0), 0)
  const free = specs.filter((s) => s.defaultSize == null).length
  const each = free > 0 ? Math.max(0, 100 - claimed) / free : 0
  const raw = specs.map((s) => s.defaultSize ?? each)
  const sum = raw.reduce((a, b) => a + b, 0)
  return sum > 0 ? raw.map((v) => (v / sum) * 100) : specs.map(() => 100 / specs.length)
}

/**
 * Move the boundary AFTER panel `i` by `delta` percent. Only the two adjacent
 * panels change, so their sum is invariant and the layout always totals 100.
 * Returns the original array when the move is fully clamped. PURE.
 */
export function resizeAt(sizes: number[], specs: PanelSpec[], i: number, delta: number): number[] {
  const a = sizes[i]
  const b = sizes[i + 1]
  const sa = specs[i]
  const sb = specs[i + 1]
  if (a == null || b == null || !sa || !sb) return sizes
  const pair = a + b
  const lo = Math.max(floorOf(sa), pair - ceilOf(sb))
  const hi = Math.min(ceilOf(sa), pair - floorOf(sb))
  if (lo > hi) return sizes
  const next = clamp(a + delta, lo, hi)
  if (next === a) return sizes
  const out = sizes.slice()
  out[i] = next
  out[i + 1] = pair - next
  return out
}

// ── Persisted layouts (autoSaveId) ────────────────────────────────────────────
// One blob per autoSaveId, keyed inside by the set of visible panels, so toggling
// a panel off and back on restores what that arrangement had. Read in an effect,
// never during render, so SSR markup matches the first client paint.

type Store = Record<string, number[]>

const webStorage = () =>
  (globalThis as { localStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void } })
    .localStorage

const storeKey = (id: string) => `hanzo.panels.${id}`

function loadStore(id?: string): Store {
  if (!id) return {}
  try {
    return JSON.parse(webStorage()?.getItem(storeKey(id)) ?? '{}') as Store
  } catch {
    return {}
  }
}

function saveStore(id: string | undefined, store: Store) {
  if (!id) return
  try {
    webStorage()?.setItem(storeKey(id), JSON.stringify(store))
  } catch {
    // No storage (native, private mode, quota) — layout is simply not persisted.
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

type GroupValue = {
  direction: ResizeDirection
  specs: PanelSpec[]
  sizes: number[]
  extent: { current: number }
  setLayout: (next: number[]) => void
}

const GroupContext = createContext<GroupValue | null>(null)
/** A panel's index, or for a handle the index of the panel it follows. */
const SlotContext = createContext(-1)

// ── Group ─────────────────────────────────────────────────────────────────────

export type ResizablePanelGroupProps = Omit<XStackProps, 'onLayout' | 'direction'> & {
  direction: ResizeDirection
  autoSaveId?: string
  onLayout?: (sizes: number[]) => void
  children?: ReactNode
}

export function ResizablePanelGroup({
  direction,
  autoSaveId,
  onLayout,
  children,
  ...rest
}: ResizablePanelGroupProps) {
  const axis = direction === 'horizontal'
  const extent = useRef(0)
  const [store, setStore] = useState<Store>({})

  const slots = useMemo(
    () => Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[],
    [children],
  )

  const specs = useMemo<PanelSpec[]>(
    () =>
      slots
        .filter((el) => el.type === ResizablePanel)
        .map((el, i) => {
          const p = el.props as ResizablePanelProps
          return {
            id: p.id ?? String(p.order ?? i),
            defaultSize: p.defaultSize,
            minSize: p.minSize,
            maxSize: p.maxSize,
            collapsible: p.collapsible,
            collapsedSize: p.collapsedSize,
            onResize: p.onResize,
          }
        }),
    [slots],
  )

  const key = specs.map((s) => s.id).join(',')
  const sizes = store[key] ?? defaultLayout(specs)

  useEffect(() => {
    setStore(loadStore(autoSaveId))
  }, [autoSaveId])

  const setLayout = useCallback(
    (next: number[]) => {
      const merged = { ...store, [key]: next }
      setStore(merged)
      saveStore(autoSaveId, merged)
      onLayout?.(next)
    },
    [autoSaveId, key, onLayout, store],
  )

  const prev = useRef<number[]>([])
  useEffect(() => {
    specs.forEach((s, i) => {
      if (sizes[i] != null && sizes[i] !== prev.current[i]) s.onResize?.(sizes[i])
    })
    prev.current = sizes
  }, [specs, sizes])

  const value = useMemo<GroupValue>(
    () => ({ direction, specs, sizes, extent, setLayout }),
    [direction, specs, sizes, setLayout],
  )

  let panel = -1
  return (
    <GroupContext.Provider value={value}>
      <XStack
        width="100%"
        height="100%"
        flexDirection={axis ? 'row' : 'column'}
        overflow="hidden"
        data-panel-group-direction={direction}
        onLayout={(e) => {
          extent.current = axis ? e.nativeEvent.layout.width : e.nativeEvent.layout.height
        }}
        {...rest}
      >
        {slots.map((el, i) => {
          if (el.type === ResizablePanel) panel++
          return (
            <SlotContext.Provider key={el.key ?? i} value={panel}>
              {el}
            </SlotContext.Provider>
          )
        })}
      </XStack>
    </GroupContext.Provider>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export type ResizablePanelProps = Omit<XStackProps, 'id' | 'onLayout'> & {
  id?: string
  order?: number
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsible?: boolean
  collapsedSize?: number
  onResize?: (size: number) => void
  children?: ReactNode
}

export function ResizablePanel({
  id,
  order,
  defaultSize,
  minSize,
  maxSize,
  collapsible,
  collapsedSize,
  onResize,
  children,
  ...rest
}: ResizablePanelProps) {
  const group = useContext(GroupContext)
  const index = useContext(SlotContext)
  const size = group?.sizes[index]

  return (
    <XStack
      flexDirection="column"
      overflow="hidden"
      flexBasis={0}
      grow={size ?? 1}
      shrink={1}
      {...rest}
    >
      {children}
    </XStack>
  )
}

// ── Handle ────────────────────────────────────────────────────────────────────

const THICKNESS = 4
/** 4px + 20px each side = a 44px target without inflating the visual divider. */
const HIT_SLOP = 20
const KEY_STEP = 5
const KEY_STEP_FINE = 1

/** Structural shape shared by a React pointer event and an RN responder event. */
type DragEvent = {
  clientX?: number
  clientY?: number
  pointerId?: number
  currentTarget?: unknown
  nativeEvent?: { pageX?: number; pageY?: number }
}

export type ResizableHandleProps = Omit<XStackProps, 'disabled' | 'onLayout'> & {
  withHandle?: boolean
  disabled?: boolean
}

export function ResizableHandle({ withHandle, disabled, ...rest }: ResizableHandleProps) {
  const group = useContext(GroupContext)
  const boundary = useContext(SlotContext)
  const [state, setState] = useState<'idle' | 'hover' | 'drag'>('idle')
  const start = useRef<{ pos: number; sizes: number[] } | null>(null)

  const axis = group?.direction !== 'vertical'
  const off = disabled || !group || boundary < 0 || boundary + 1 >= group.sizes.length

  const posOf = useCallback(
    (e: DragEvent) =>
      (axis ? (e.clientX ?? e.nativeEvent?.pageX) : (e.clientY ?? e.nativeEvent?.pageY)) ?? 0,
    [axis],
  )

  const begin = useCallback(
    (e: DragEvent) => {
      if (off || !group) return
      start.current = { pos: posOf(e), sizes: group.sizes }
      setState('drag')
      // Keeps the drag alive once the pointer leaves the 4px handle, without a
      // window listener. Absent on native, where the responder system owns it.
      const target = e.currentTarget as { setPointerCapture?: (id: number) => void } | undefined
      if (target?.setPointerCapture && e.pointerId != null) target.setPointerCapture(e.pointerId)
    },
    [group, off, posOf],
  )

  const move = useCallback(
    (e: DragEvent) => {
      const from = start.current
      if (!from || !group) return
      const px = group.extent.current
      if (px <= 0) return
      group.setLayout(resizeAt(from.sizes, group.specs, boundary, ((posOf(e) - from.pos) / px) * 100))
    },
    [boundary, group, posOf],
  )

  const end = useCallback(() => {
    start.current = null
    setState('idle')
  }, [])

  const nudge = useCallback(
    (e: { key: string; shiftKey?: boolean; preventDefault: () => void }) => {
      if (off || !group) return
      const dir = axis
        ? e.key === 'ArrowLeft'
          ? -1
          : e.key === 'ArrowRight'
            ? 1
            : 0
        : e.key === 'ArrowUp'
          ? -1
          : e.key === 'ArrowDown'
            ? 1
            : 0
      if (dir === 0) return
      e.preventDefault()
      group.setLayout(resizeAt(group.sizes, group.specs, boundary, dir * (e.shiftKey ? KEY_STEP_FINE : KEY_STEP)))
    },
    [axis, boundary, group, off],
  )

  const hover = useCallback((on: boolean) => setState((s) => (s === 'drag' ? s : on ? 'hover' : 'idle')), [])

  const gesture = isWeb
    ? {
        onPointerDown: begin,
        onPointerMove: move,
        onPointerUp: end,
        onPointerCancel: end,
        onKeyDown: nudge,
        onMouseEnter: () => hover(true),
        onMouseLeave: () => hover(false),
      }
    : {
        onStartShouldSetResponder: () => !off,
        onMoveShouldSetResponder: () => !off,
        onResponderTerminationRequest: () => false,
        onResponderGrant: begin,
        onResponderMove: move,
        onResponderRelease: end,
        onResponderTerminate: end,
      }

  return (
    <XStack
      position="relative"
      flexDirection={axis ? 'column' : 'row'}
      items="center"
      justify="center"
      shrink={0}
      width={axis ? THICKNESS : '100%'}
      height={axis ? '100%' : THICKNESS}
      hitSlop={HIT_SLOP}
      cursor={off ? 'default' : axis ? 'col-resize' : 'row-resize'}
      tabIndex={off ? -1 : 0}
      role="separator"
      aria-orientation={axis ? 'vertical' : 'horizontal'}
      data-panel-group-direction={group?.direction}
      data-resize-handle-state={state}
      {...gesture}
      {...rest}
    >
      <Separator vertical={axis} borderColor={state === 'idle' ? '$borderColor' : '$color8'} />
      {withHandle && (
        <XStack
          position="absolute"
          items="center"
          justify="center"
          width={12}
          height={20}
          rounded="$2"
          bg="$color5"
          borderWidth={1}
          borderColor="$borderColor"
          rotate={axis ? '0deg' : '90deg'}
        >
          <GripVertical size={10} />
        </XStack>
      )}
    </XStack>
  )
}
