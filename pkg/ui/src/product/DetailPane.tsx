'use client'

/**
 * DetailPane — the ONE reusable right-side pane for viewing or editing the
 * details of an item. A product does NOT build its own pane: it writes a
 * DESCRIPTOR (`{ title, subtitle?, icon?, content, footer? }`) and calls
 * `useDetailPane().open(descriptor)`. The pane slides out from the right
 * (full-screen on mobile) via `SlideOver`, so every "open item detail" looks
 * and behaves identically (DRY).
 *
 * Rendered ONCE near the shell root; any module — a row, a list item, a
 * pinned form — opens the same pane. Interactive content closes itself with
 * `useDetailPane().close()`.
 *
 * The last descriptor stays mounted through the close transition, so the exit
 * animates with its content (no flash of empty pane). Opening a new
 * descriptor replaces it.
 *
 * A pane is a STACK of pages. `open` starts a new stack, `push` lays a page on
 * top (a relation opened from a record, a step of a flow), `back` takes it off;
 * the top bar shows a back button while there is a page under the current one.
 *
 * Two modes, chosen by the shell:
 *
 *   overlay  (default) the SlideOver above the page, with its scrim — the
 *            console's contract, unchanged.
 *   docked   a column in the layout row beside the page content: no scrim, the
 *            content narrows. 400 wide, resizable 320–600 from its leading edge
 *            by the kit's one resizer (Grip), the width kept per person
 *            (useSpan). The width animates 0 ↔ W while the page inside keeps the
 *            target width, so it never reflows mid-slide. Below lg it is the
 *            overlay again, full screen.
 *
 * A docked pane — or any pane under `<Density value="compact">` — draws the
 * record frame (the record kit's side panel, MIT, NOTICE): a 48px top bar on the
 * panel ground (back · icon + title · page actions · expand · close), a body
 * that scrolls without chaining, and a footer on the panel ground with its
 * actions at the end. An overlay pane at regular density keeps the header it
 * always had. A page that draws itself (`bare`, a command menu, a search)
 * composes the same frame from `PaneBar`, `PaneBody` and `PaneFoot`.
 *
 * Escape closes a docked pane while focus is inside it (the overlay's
 * SlideOver already does); ⌘/Ctrl+Enter runs the page's `onExpand`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Button as GuiButton, ScrollView, Text, XStack, YStack, useMedia } from '@hanzo/gui'
import { ChevronLeft, Maximize2, X } from '@hanzogui/lucide-icons-2'

import { SlideOver } from './SlideOver'
import { asColor, type IconLike } from './color'
import { Button, type ButtonProps } from '../backends/gui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../backends/gui/tooltip'
import { Grip } from '../backends/gui/grip'
import { useSpan } from '../backends/gui/span'
import { useDensity } from '../backends/gui/density'
import { slot } from '../backends/gui/slot'
import { mirror } from '../backends/gui/dir'

export type DetailDescriptor = {
  /** Pane title (the item's name). */
  title: ReactNode
  /** Optional secondary line under the title (type, id, status…). */
  subtitle?: ReactNode
  /** Optional title icon, tinted with `iconColor`. */
  icon?: IconLike
  iconColor?: string
  /** Desktop pane width (px), overlay mode. Mobile is always full-screen. Default 460 (400 in the record frame). */
  size?: number
  /** The body — the detail view or edit form for the item. */
  content: ReactNode
  /** Optional sticky footer (primary actions), pinned below the scroll body. */
  footer?: ReactNode
  /** The page's own actions, in the top bar before expand and close (record frame). */
  actions?: ReactNode
  /** Opens the page on the main surface: shows the expand button and binds ⌘/Ctrl+Enter. */
  onExpand?: () => void
  /** The expand button's tooltip. Default "Open". */
  expandLabel?: string
  /** The page draws its own frame from `PaneBar` / `PaneBody` / `PaneFoot` (a command menu, a search). */
  bare?: boolean
}

export type DetailPaneApi = {
  /** A new stack, holding this page. */
  open: (descriptor: DetailDescriptor) => void
  /** This page over the current one. Opens the pane when it is shut. */
  push: (descriptor: DetailDescriptor) => void
  /** Off the top: the page under it shows. On the last page, the pane closes. */
  back: () => void
  close: () => void
  isOpen: boolean
  /** How many pages the stack holds; a back button shows while it is more than one. */
  depth: number
}

const Ctx = /* @__PURE__ */ createContext<DetailPaneApi | null>(null)
/** The page being drawn, for the bar a bare page composes. */
const PageCtx = /* @__PURE__ */ createContext<DetailDescriptor | null>(null)

/** The pane this sits in, or null outside one — for a page that adapts to being in a pane. */
export const usePane = (): DetailPaneApi | null => useContext(Ctx)

export function useDetailPane(): DetailPaneApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDetailPane must be used within <DetailPane>')
  return ctx
}

export type DetailPaneProps = {
  children: ReactNode
  /** z-index for stacking — a pane opened over another overlay passes a
   *  higher value. Left to `SlideOver`'s own default otherwise. */
  zIndex?: number
  /** `overlay` (default) floats above the page; `docked` is a column in the layout beside it. */
  mode?: 'overlay' | 'docked'
  /** Where a docked pane keeps the width a person chose (localStorage key). */
  store?: string
}

/** The record frame's measures (the record kit's side panel, MIT). */
export const PANE = { w: 400, min: 320, max: 600, bar: 48, icon: 16 } as const

export function DetailPane({ children, zIndex, mode = 'overlay', store = 'hanzo.pane' }: DetailPaneProps) {
  // One state, so every transition is one pure update: whether it is open, and
  // the pages it holds (kept through a close, so the exit animates with them).
  const [state, setState] = useState<{ open: boolean; stack: DetailDescriptor[] }>({ open: false, stack: [] })
  const { open: isOpen, stack } = state
  const density = useDensity()
  const media = useMedia()
  const docked = mode === 'docked' && !!media.lg
  const record = mode === 'docked' || density === 'compact'

  const open = useCallback((descriptor: DetailDescriptor) => setState({ open: true, stack: [descriptor] }), [])
  const push = useCallback(
    (descriptor: DetailDescriptor) =>
      setState((s) => ({ open: true, stack: s.open ? [...s.stack, descriptor] : [descriptor] })),
    [],
  )
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])
  const back = useCallback(
    () => setState((s) => (s.stack.length > 1 ? { ...s, stack: s.stack.slice(0, -1) } : { ...s, open: false })),
    [],
  )

  const depth = isOpen ? stack.length : 0
  const api = useMemo<DetailPaneApi>(
    () => ({ open, push, back, close, isOpen, depth }),
    [open, push, back, close, isOpen, depth],
  )
  const desc = stack[stack.length - 1] ?? null
  const title = typeof desc?.title === 'string' ? desc.title : 'Details'

  const page = desc ? (
    <PageCtx.Provider value={desc}>
      {record || desc.bare ? <RecordPage desc={desc} /> : <SheetPage desc={desc} close={close} />}
    </PageCtx.Provider>
  ) : null

  if (docked)
    return (
      <Ctx.Provider value={api}>
        <XStack {...slot('detail-pane-row')} flex={1} minW={0} minH={0} self="stretch">
          <YStack flex={1} minW={0} minH={0}>
            {children}
          </YStack>
          <Dock open={isOpen} title={title} store={store} onClose={close} onExpand={desc?.onExpand}>
            {page}
          </Dock>
        </XStack>
      </Ctx.Provider>
    )

  return (
    <Ctx.Provider value={api}>
      {children}
      <SlideOver
        open={isOpen}
        onClose={close}
        side="end"
        size={desc?.size ?? (record ? PANE.w : 460)}
        ariaLabel={title}
        zIndex={zIndex}
      >
        {record && desc ? (
          <YStack flex={1} minH={0} bg="$background" onKeyDown={expandKey(desc.onExpand) as never}>
            {page}
          </YStack>
        ) : (
          page
        )}
      </SlideOver>
    </Ctx.Provider>
  )
}

/** ⌘/Ctrl+Enter runs `onExpand`, from anywhere inside the pane. */
const expandKey = (onExpand?: () => void) => (e: { key?: string; metaKey?: boolean; ctrlKey?: boolean; preventDefault?: () => void }) => {
  if (!onExpand || e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return
  e.preventDefault?.()
  onExpand()
}

/**
 * The docked column. The OUTER box is what animates and what the Grip measures
 * (its width is the pane's); the INNER box holds the target width throughout, so
 * the page slides in already laid out.
 */
function Dock({
  open,
  title,
  store,
  onClose,
  onExpand,
  children,
}: {
  open: boolean
  title: string
  store: string
  onClose: () => void
  onExpand?: () => void
  children: ReactNode
}) {
  const span = useSpan(store, PANE.w, PANE.min, PANE.max)
  const node = useRef<HTMLElement | null>(null)
  const opener = useRef<Element | null>(null)

  // Focus moves in when the pane opens and back to what opened it when it shuts:
  // a docked pane is not modal, but a keyboard has to be able to reach it.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    opener.current = document.activeElement
    const t = window.setTimeout(() => node.current?.focus?.(), 0)
    return () => {
      window.clearTimeout(t)
      const back = opener.current
      if (back instanceof HTMLElement && node.current?.contains(document.activeElement)) back.focus()
    }
  }, [open])

  return (
    <YStack
      ref={((el: unknown) => {
        span.ref(el)
        node.current = el instanceof HTMLElement ? el : null
      }) as never}
      {...slot('detail-pane')}
      data-mode="docked"
      data-open={open ? '' : undefined}
      role="complementary"
      aria-label={title}
      aria-hidden={!open}
      {...(!open ? ({ inert: true } as object) : null)}
      tabIndex={-1}
      position="relative"
      shrink={0}
      self="stretch"
      overflow="hidden"
      outlineWidth={0}
      onKeyDown={((e: { key?: string; defaultPrevented?: boolean; metaKey?: boolean; ctrlKey?: boolean; preventDefault?: () => void }) => {
        if (e.key === 'Escape' && !e.defaultPrevented) {
          e.preventDefault?.()
          onClose()
          return
        }
        expandKey(onExpand)(e)
      }) as never}
      style={{
        ...span.style,
        width: open ? 'var(--span)' : 0,
        transition: 'width var(--duration-base, 300ms) var(--ease-out, ease)',
      }}
    >
      <YStack
        width="var(--span)"
        flex={1}
        minH={0}
        bg="$background"
        borderInlineStartWidth={1}
        borderColor="$borderColor"
      >
        {children}
      </YStack>
      {open ? (
        <Grip
          side="end"
          span={span.span}
          floor={PANE.min}
          ceil={PANE.max}
          reset={PANE.w}
          bar="edge"
          label="Resize side panel"
          onSpan={span.move}
          onKeep={span.keep}
          onShut={onClose}
        />
      ) : null}
    </YStack>
  )
}

/** The record frame of one page: the bar, the scrolling body, the footer. */
function RecordPage({ desc }: { desc: DetailDescriptor }) {
  if (desc.bare) return <>{desc.content}</>
  const Icon = desc.icon
  return (
    <>
      <PaneBar actions={desc.actions}>
        {Icon ? <Icon size={PANE.icon} color={desc.iconColor ? asColor(desc.iconColor) : '$aside'} /> : null}
        <Text fontSize="$2" fontWeight="500" color="$ink" numberOfLines={1} shrink={1} minW={0}>
          {desc.title}
        </Text>
        {desc.subtitle !== undefined ? (
          <Text fontSize="$2" color="$hint" numberOfLines={1} shrink={1} minW={0}>
            {desc.subtitle}
          </Text>
        ) : null}
      </PaneBar>
      <PaneBody>{desc.content}</PaneBody>
      {desc.footer !== undefined ? <PaneFoot>{desc.footer}</PaneFoot> : null}
    </>
  )
}

/** The overlay sheet's own page, as it always was: the 56px header and the body. */
function SheetPage({ desc, close }: { desc: DetailDescriptor; close: () => void }) {
  const Icon = desc.icon
  const pane = useContext(Ctx)
  return (
    <>
      {/* Bare-mode layout: fixed header · scroll body · optional sticky footer. */}
      <XStack items="center" gap="$2.5" px="$4" height={56} borderBottomWidth={1} borderColor="$borderColor">
        {pane && pane.depth > 1 ? (
          <GuiButton size="$2" chromeless icon={<ChevronLeft {...mirror} size={18} />} onPress={pane.back} aria-label="Back" />
        ) : null}
        {Icon ? <Icon size={18} color={desc.iconColor ? asColor(desc.iconColor) : undefined} /> : null}
        <YStack flex={1} minW={0}>
          <Text fontSize="$5" fontWeight="700" color="$color12" numberOfLines={1}>
            {desc.title}
          </Text>
          {desc.subtitle !== undefined ? (
            <Text fontSize="$2" color="$color10" numberOfLines={1}>
              {desc.subtitle}
            </Text>
          ) : null}
        </YStack>
        <GuiButton size="$2" chromeless icon={<X size={18} />} onPress={close} aria-label="Close" />
      </XStack>

      <ScrollView flex={1} minH={0}>
        <YStack p="$4" gap="$3">
          {desc.content}
        </YStack>
      </ScrollView>

      {desc.footer !== undefined ? (
        <XStack px="$4" py="$3" gap="$2" borderTopWidth={1} borderColor="$borderColor" bg="$color1">
          {desc.footer}
        </XStack>
      ) : null}
    </>
  )
}

export type PaneBarProps = {
  /** The leading cluster after the back button: an icon and a title, or a search field. */
  children?: ReactNode
  /** The page's own actions, before expand and close. */
  actions?: ReactNode
}

/**
 * The record frame's top bar: 48 high on the panel ground, a hairline under
 * it, 8 in from each side, its two clusters 16 apart and their parts 4 apart.
 * Inside a pane it adds back (while there is a page under this one), expand
 * (when the page can open on the main surface) and close; outside one it is the
 * bar alone.
 */
export function PaneBar({ children, actions }: PaneBarProps) {
  const pane = useContext(Ctx)
  const page = useContext(PageCtx)
  const expand = page?.onExpand
  return (
    <XStack
      {...slot('pane-bar')}
      height={PANE.bar}
      shrink={0}
      items="center"
      justify="space-between"
      gap="$4"
      px="$2"
      bg="$panel"
      borderBottomWidth={1}
      borderColor="$borderColor"
    >
      <XStack flex={1} minW={0} items="center" gap="$1">
        {pane && pane.depth > 1 ? (
          <Tool tip="Back" onPress={pane.back}>
            <ChevronLeft {...mirror} />
          </Tool>
        ) : null}
        {children}
      </XStack>
      <XStack shrink={0} items="center" gap="$1">
        {actions}
        {expand ? (
          <Tool tip={page?.expandLabel ?? 'Open'} onPress={expand}>
            <Maximize2 />
          </Tool>
        ) : null}
        {pane ? (
          <Tool tip="Close side panel" onPress={pane.close}>
            <X />
          </Tool>
        ) : null}
      </XStack>
    </XStack>
  )
}

/**
 * The bar's quiet 24px icon button, named by its tooltip. The tooltip's trigger
 * IS the button (`asChild`): wrapped in a box, the trigger's `aria-expanded`
 * lands on a div, which axe refuses (`aria-allowed-attr`), and a button may
 * carry it.
 */
function Tool({ tip, children, ...props }: Omit<ButtonProps, 'tooltip'> & { tip: string }) {
  return (
    <Tooltip delay={1000} placement="bottom">
      <TooltipTrigger asChild>
        <Button size="icon-xs" variant="ghost" emphasis="subtle" aria-label={tip} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/** The record frame's body: it takes what the bar and footer leave, and scrolls without chaining to the page. */
export function PaneBody({ children, padded = true }: { children?: ReactNode; padded?: boolean }) {
  return (
    <ScrollView {...slot('pane-body')} flex={1} minH={0} style={{ overscrollBehavior: 'contain' } as never}>
      <YStack {...(padded ? { p: '$2' as const } : null)} gap="$2">
        {children}
      </YStack>
    </ScrollView>
  )
}

/** The record frame's footer: the panel ground, a hairline above, its actions at the end, 8 apart. */
export function PaneFoot({ children }: { children?: ReactNode }) {
  return (
    <XStack
      {...slot('pane-foot')}
      shrink={0}
      items="center"
      justify="flex-end"
      gap="$2"
      px="$3"
      py="$2"
      bg="$panel"
      borderTopWidth={1}
      borderColor="$borderColor"
    >
      {children}
    </XStack>
  )
}
