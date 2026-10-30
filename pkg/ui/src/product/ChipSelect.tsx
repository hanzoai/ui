'use client'

/**
 * ChipSelect — a small chip that opens a searchable list, UPWARD by default.
 *
 * The shape a composer's context row needs: `☁ Default` · `</> cloud` ·
 * `⑂ main`, each a chip, each a choice over a list too long to show whole.
 * The panel opens above the chip (a composer sits at the bottom of the pane),
 * the chosen row is pinned first with a check, the list scrolls, a footer can
 * explain what is missing, and the search sits at the BOTTOM — next to the chip
 * the reader just pressed, which is where their eyes already are.
 *
 * DATA IS A LOADER OR A LIST, NEVER AN API. `load(q, after)` answers one page at
 * a time and the component pages it: a debounced search starts over, reaching
 * the end of the list asks for the page after. Or `items` is the whole list and
 * the search is applied here. Nothing in this file knows what a repository is.
 *
 * The pieces with the rules in them — paging, pinning, the cursor — are pure and
 * live in `chipSelect.logic.ts`, tested without a DOM. Portalling, dismissal
 * and focus trapping are the package `Popover`'s, not reimplemented here.
 *
 * ARIA: the chip is a button that opens a listbox; the search field is the
 * combobox and owns the cursor through `aria-activedescendant`, so focus never
 * leaves the field while the arrow keys move through the rows. `aria-selected`
 * marks the chosen row. Closing returns focus to the chip.
 */
import { Input as GuiInput, ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronDown, Search } from '@hanzogui/lucide-icons-2'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui/popover'
import { RING } from '../backends/gui/press'
import { slot, tip } from '../backends/gui/slot'
import {
  frame,
  merge,
  move,
  narrow,
  near,
  pin,
  wants,
  type ChipItem,
  type ChipLoad,
  type Move,
} from './chipSelect.logic'

export type { ChipItem, ChipLoad, ChipPage } from './chipSelect.logic'

/** Where the panel prefers to open. It flips when that side has no room. */
export type ChipPlacement = 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end'

/** A secondary action on a row — "Add to project". See `ChipSelectProps.action`. */
export interface ChipAction<T extends ChipItem> {
  label: string
  onPress: (item: T) => void
  /** Rows the action applies to. Absent, every row. */
  when?: (item: T) => boolean
}

/** One view of the list, as a tab over it: a source, a kind. */
export interface ChipTab {
  id: string
  label: string
}

export interface ChipSelectProps<T extends ChipItem> {
  /** What the chip says — the current choice, short. Empty, the chip is its icon alone. */
  label: string
  /** Drawn before the label. */
  icon?: ReactNode
  /** What the chip chooses ("Repository"): its accessible name is `<name>: <label>`. */
  name: string
  /** The chosen item, pinned first with a check. */
  chosen?: T | null
  onChange: (item: T) => void
  /** Pages of rows. Takes precedence over `items`. */
  load?: ChipLoad<T>
  /** The whole list, searched here. */
  items?: readonly T[]
  /** With `items`: there are more rows than these. */
  more?: boolean
  /** With `items`: the reader reached the end — fetch and grow `items`. */
  onMore?: () => void
  /** With `items`: a fetch is in flight. */
  loading?: boolean
  /** With `items`: the last fetch failed, in a sentence. */
  error?: string | null
  /** Search debounce, ms. */
  delay?: number
  /** The search field's placeholder. */
  placeholder?: string
  /** No rows match. */
  empty?: ReactNode
  /** Under the list, above the search — what is missing and why. */
  footer?: ReactNode
  /** Above the list — a call to action that replaces a list that cannot load. */
  cta?: ReactNode
  /**
   * A second thing a row can do. Drawn on the row under the cursor or the
   * pointer; the pointer presses it, and the keyboard runs it with Ctrl/⌘+Enter
   * on the row under the cursor. It is a declared action rather than a slot of
   * arbitrary content on purpose: a listbox option may not CONTAIN a control
   * (axe `nested-interactive`), so the row keeps its option semantics and the
   * action rides on it.
   */
  action?: ChipAction<T>
  placement?: ChipPlacement
  /** Panel width, px. */
  width?: number
  /** The list's ceiling, px; past it the list scrolls. */
  height?: number
  disabled?: boolean
  /**
   * The plain look: no fill and no hairline, the label in the muted ink — for a
   * choice that sits in a row of words (a composer's model and effort) rather
   * than in a row of chips. Same panel, same keyboard.
   */
  quiet?: boolean
  /** With no label: the box the icon stands in, px. */
  box?: number
  /** Views of the list, as tabs between the search and the rows. The host filters by `tab`. */
  tabs?: readonly ChipTab[]
  tab?: string
  onTab?: (id: string) => void
  /** Open state, when the host owns it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** One row's height, px — a line of 13px type with room to breathe. */
const ROW_H = 24

/** The chip: 24px, a hairline, the raised fill. */
const CHIP_H = 24

/** A chip that is its icon alone: the composer's round controls' box. */
const BARE = 30

/**
 * The height of the row a chip stands in, px: the line of words under the
 * composer's frame. There a labelled chip is a WORD — its label in the full ink
 * at the 14px rung and a small chevron, no edge and no fill until a pointer
 * gives it the soft hover ground — so where a run goes and the model, the
 * effort and the mode read as one quiet line. Outside that row, the 24px chip.
 */
export const Pills = createContext<number | null>(null)

/** A word's own gutter, px: its ground under a pointer reaches this far past its letters. */
const WORD_GUTTER = 5


const MOVES = new Set<Move>(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'])

/** Text a keystroke types, or null for a key that types nothing. */
const typed = (e: { key?: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }) =>
  e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey ? e.key : null

interface Pages<T> {
  rows: T[]
  next: string | null
  loading: boolean
  error: string | null
}

/**
 * Pages of a loader, for one search at a time.
 *
 * Every request carries the search generation it was made for, and an answer
 * for any older generation is dropped — so a slow page for "clo" can never land
 * under the results for "cloud".
 */
function usePages<T extends ChipItem>(load: ChipLoad<T> | undefined, q: string, delay: number, on: boolean, view?: string) {
  const [state, setState] = useState<Pages<T>>({ rows: [], next: null, loading: false, error: null })
  const generation = useRef(0)
  const busy = useRef(false)
  // The loader is read at call time, not taken as a dependency: a host that
  // passes an inline function hands over a new one every render, and keying the
  // fetch on its identity would refetch on every render.
  const loader = useRef(load)
  loader.current = load
  const search = useRef(q)
  search.current = q

  const fetch = useCallback((after: string | null, gen: number) => {
    const read = loader.current
    if (!read) return
    busy.current = true
    setState((s) => ({ ...s, loading: true, error: null }))
    read(search.current, after).then(
      (page) => {
        if (gen !== generation.current) return
        busy.current = false
        setState((s) => ({
          rows: after ? merge(s.rows, page.items) : merge([], page.items),
          next: page.next ?? null,
          loading: false,
          error: null,
        }))
      },
      (err: unknown) => {
        if (gen !== generation.current) return
        busy.current = false
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error && err.message ? err.message : 'Could not load the list.',
        }))
      },
    )
  }, [])

  const live = Boolean(load)

  // A new search, or opening: start over after the debounce. The first page of
  // an empty search is asked for at once — there is nothing typed to wait for.
  useEffect(() => {
    if (!on || !live) return
    const gen = ++generation.current
    busy.current = false
    const wait = q.trim() ? delay : 0
    const timer = setTimeout(() => fetch(null, gen), wait)
    return () => clearTimeout(timer)
    // `view` is a tab: the host's loader reads it, so a new one starts over too.
  }, [on, live, q, delay, fetch, view])

  const more = useCallback(() => {
    if (busy.current || !state.next) return
    fetch(state.next, generation.current)
  }, [fetch, state.next])

  const retry = useCallback(() => fetch(null, ++generation.current), [fetch])

  return { ...state, more, retry }
}

export function ChipSelect<T extends ChipItem>({
  label,
  icon,
  name,
  chosen = null,
  onChange,
  load,
  items,
  more: hasMore = false,
  onMore,
  loading: loadingProp = false,
  error: errorProp = null,
  delay = 200,
  placeholder = 'Search…',
  empty = 'No matches.',
  footer,
  cta,
  action,
  placement = 'top-start',
  width = 320,
  height = 276,
  disabled = false,
  quiet = false,
  box = BARE,
  tabs,
  tab,
  onTab,
  open: openProp,
  onOpenChange,
}: ChipSelectProps<T>) {
  const bare = !label
  const row = useContext(Pills)
  const pill = row !== null && !bare && !quiet
  const [own, setOwn] = useState(false)
  const open = openProp ?? own
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwn(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )

  const [q, setQ] = useState('')
  const [at, setAt] = useState(-1)
  const chip = useRef<HTMLElement | null>(null)
  const field = useRef<HTMLInputElement | null>(null)
  const list = useRef<HTMLElement | null>(null)
  const id = useId()
  const listId = `${id}-list`
  const hintId = `${id}-hint`
  const optionId = (i: number) => `${id}-opt-${i}`

  const pages = usePages(load, q, delay, open, tab)

  // The search sits beside the chip it opened from: under the list when the
  // panel is above the chip, over it when it is below. The popover flips when
  // its side has no room, so which side it took is read off the page once it is
  // placed; until then, the side it was asked for.
  const [side, setSide] = useState<'top' | 'bottom' | null>(null)
  const up = (side ?? (placement.startsWith('top') ? 'top' : 'bottom')) === 'top'
  useEffect(() => {
    if (!open) {
      setSide(null)
      return
    }
    let frames = 0
    let frame = 0
    const read = () => {
      const panel = typeof document !== 'undefined' ? document.getElementById(listId) : null
      const anchor = chip.current?.getBoundingClientRect?.()
      if (panel && anchor) {
        const at = panel.getBoundingClientRect()
        if (at.height > 0) return setSide(at.top < anchor.top ? 'top' : 'bottom')
      }
      if (frames++ < 8) frame = requestAnimationFrame(read)
    }
    frame = requestAnimationFrame(read)
    return () => cancelAnimationFrame(frame)
    // listId is stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Sized once per open, from what is known then — see `frame`.
  const [tall, setTall] = useState(height)
  useEffect(() => {
    if (open)
      setTall(frame({ pending: Boolean(load) || loadingProp, count: (items?.length ?? 0) + (chosen ? 1 : 0), row: ROW_H, ceiling: height }))
    // Only at open: a panel that resized while open would leave its placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // What is drawn: the loader's rows as answered, or the given list narrowed
  // here — then the chosen row pinned on top while the search could match it.
  const rows = useMemo(() => {
    const base = load ? pages.rows : narrow(items ?? [], q)
    return pin(base, chosen, q)
  }, [load, pages.rows, items, q, chosen])

  // A panel below its chip hangs from it, so a paged list may follow its rows
  // (never fewer than three, never past the ceiling); one above is placed from
  // its size at open and keeps it.
  const listH = !up && load ? Math.min(height, Math.max(rows.length, 3) * ROW_H + 8) : tall

  const next = load ? pages.next : hasMore ? 'more' : null
  const loading = load ? pages.loading : loadingProp
  const error = load ? pages.error : errorProp
  const askMore = load ? pages.more : () => onMore?.()

  // Opening lands the cursor on the chosen row (pinned at 0) or the first one.
  useEffect(() => {
    if (open) setAt(rows.length ? 0 : -1)
    // Only on open, a new search or a new tab — never as rows page in under the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, q, tab])

  // A loader's first page arrives after the open: the cursor lands on its first
  // row then, or Enter would have nothing under it.
  useEffect(() => {
    if (open && at < 0 && rows.length) setAt(0)
  }, [open, at, rows.length])

  // A closed panel forgets its search, so the next open starts from the top.
  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  // Keep the row under the cursor in view as it moves.
  useEffect(() => {
    if (!open || at < 0) return
    const el = typeof document !== 'undefined' ? document.getElementById(optionId(at)) : null
    el?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, open])

  const close = useCallback(() => {
    setOpen(false)
    // Back to the chip the panel came from, so the keyboard is where it was.
    queueMicrotask(() => chip.current?.focus?.())
  }, [setOpen])

  const choose = useCallback(
    (item: T | undefined) => {
      if (!item || item.disabled) return
      onChange(item)
      close()
    },
    [onChange, close],
  )

  const onField = (e: any) => {
    const key = e?.key as string
    if (MOVES.has(key as Move)) {
      // Home and End belong to the caret while there is text to move through.
      if ((key === 'Home' || key === 'End') && q) return
      e.preventDefault?.()
      const to = move(key as Move, at, rows.length, (i) => Boolean(rows[i]?.disabled))
      setAt(to)
      if (wants({ next, loading, at: to, count: rows.length })) askMore()
      return
    }
    if (key === 'Enter') {
      e.preventDefault?.()
      const item = rows[at]
      if (!item) return
      if ((e.ctrlKey || e.metaKey) && action && (!action.when || action.when(item))) {
        action.onPress(item)
        close()
        return
      }
      choose(item)
      return
    }
    if (key === 'Escape') {
      e.preventDefault?.()
      close()
    }
  }

  const onChip = (e: any) => {
    if (disabled) return
    const key = e?.key as string
    if (key === 'Enter' || key === ' ' || key === 'ArrowUp' || key === 'ArrowDown') {
      e.preventDefault?.()
      setOpen(!open || key === 'ArrowUp' || key === 'ArrowDown')
      return
    }
    // Typing on the chip is typing into the search: open and carry the key.
    const ch = typed(e)
    if (ch && !open) {
      e.preventDefault?.()
      setOpen(true)
      setQ(ch)
    }
  }

  const onScroll = (e: any) => {
    const n = e?.nativeEvent
    const top = n?.contentOffset?.y ?? 0
    const box = n?.layoutMeasurement?.height ?? 0
    const content = n?.contentSize?.height ?? 0
    if (next && !loading && near(top, box, content)) askMore()
  }

  const shown = (item: T) => Boolean(action && (!action.when || action.when(item)))

  const search = (
    <XStack
      {...slot('chip-select-search')}
      {...(up ? { mt: '$1' } : { mb: '$1' })}
      height={26}
      px="$2"
      gap="$1.5"
      items="center"
      rounded="$2"
      borderWidth={1}
      borderColor="$rim"
      bg="$background"
      focusWithinStyle={{ borderColor: '$outlineColor' }}
    >
      <Search size={12} color="$soft" aria-hidden />
      <GuiInput
        ref={field as never}
        {...slot('chip-select-input')}
        unstyled
        flex={1}
        minW={0}
        height={24}
        p={0}
        borderWidth={0}
        bg="transparent"
        fontSize="$2"
        color="$ink"
        placeholderTextColor="$placeholderColor"
        placeholder={placeholder}
        value={q}
        onChangeText={setQ}
        role="combobox"
        aria-label={placeholder}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={at >= 0 && rows[at] ? optionId(at) : undefined}
        autoComplete="off"
        spellCheck={false}
        onKeyDown={onField}
      />
    </XStack>
  )

  // Views of the list, beside the search. A tab is a filter the host applies, so
  // the cursor and the search start over with it.
  const tabbar = tabs?.length ? (
    <XStack {...slot('chip-select-tabs')} role="tablist" aria-label={name} gap="$1" px="$1" {...(up ? { mt: '$1' } : { mb: '$1' })}>
      {tabs.map((v) => {
        const on = (tab ?? tabs[0]!.id) === v.id
        return (
          <XStack
            key={v.id}
            {...slot('chip-select-tab')}
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            height={22}
            px="$2"
            items="center"
            rounded="$2"
            cursor="pointer"
            bg={on ? '$raised' : 'transparent'}
            hoverStyle={{ bg: '$raised' }}
            focusVisibleStyle={RING}
            onPress={() => onTab?.(v.id)}
            onKeyDown={(e: any) => {
              if (e?.key !== 'Enter' && e?.key !== ' ') return
              e.preventDefault?.()
              onTab?.(v.id)
            }}
          >
            <SizableText size="$1" color={on ? '$ink' : '$soft'}>
              {v.label}
            </SizableText>
          </XStack>
        )
      })}
    </XStack>
  ) : null

  return (
    <Popover
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : close())}
      placement={placement}
      allowFlip
      stayInFrame
    >
      <PopoverTrigger asChild disabled={disabled}>
        <XStack
          ref={chip as never}
          {...slot('chip-select')}
          {...tip(name)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={bare ? name : `${name}: ${label}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-disabled={disabled || undefined}
          height={pill ? row : CHIP_H}
          rounded={pill ? 8 : '$2'}
          // A chip of its icon alone stands with the composer's round controls, round as they are.
          {...(bare ? { width: box, height: box, justify: 'center', rounded: 999 } : { px: pill ? WORD_GUTTER : '$2' })}
          gap={pill ? 4 : '$1.5'}
          items="center"
          shrink={0}
          borderWidth={quiet || pill ? 0 : 1}
          borderColor="$borderColor"
          bg={quiet || pill ? 'transparent' : '$raised'}
          cursor={disabled ? 'default' : 'pointer'}
          opacity={disabled ? 0.5 : 1}
          hoverStyle={disabled ? undefined : quiet || pill ? { bg: '$hover' } : { borderColor: '$rim' }}
          pressStyle={disabled ? undefined : { bg: '$hover' }}
          focusVisibleStyle={RING}
          // The chip is a small target by design; the hit area is not.
          hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          onKeyDown={onChip}
        >
          {icon ? (
            <XStack shrink={0} items="center" aria-hidden>
              {icon}
            </XStack>
          ) : null}
          {bare ? null : (
            <SizableText size={pill ? '$3' : '$2'} color={quiet ? '$quiet' : '$ink'} numberOfLines={1} maxW={200}>
              {label}
            </SizableText>
          )}
          {bare || quiet ? null : <ChevronDown size={12} color="$soft" aria-hidden />}
        </XStack>
      </PopoverTrigger>

      <PopoverContent
        {...slot('chip-select-panel')}
        sideOffset={8}
        width={width}
        maxW="92vw"
        p="$1"
        gap="$0"
        // Gui's popover content centres its children; a list and a field span
        // the panel.
        items="stretch"
        bg="$hover"
        borderColor="$rim"
        rounded="$3"
        elevation="$4"
        trapFocus
        onOpenAutoFocus={(e: Event) => {
          // The search field, not the first focusable thing in the panel — which
          // would be a footer link.
          e.preventDefault()
          field.current?.focus()
        }}
        onCloseAutoFocus={(e: Event) => {
          e.preventDefault()
          chip.current?.focus?.()
        }}
      >
        {cta ? (
          <YStack {...slot('chip-select-cta')} px="$2" py="$2">
            {cta}
          </YStack>
        ) : null}

        <ScrollView
          ref={list as never}
          height={listH}
          showsVerticalScrollIndicator
          scrollEventThrottle={64}
          onScroll={onScroll}
        >
          <YStack
            {...slot('chip-select-list')}
            id={listId}
            role="listbox"
            aria-label={name}
            gap="$0"
          >
            {rows.map((item, i) => {
              const on = i === at
              const picked = chosen?.id === item.id
              return (
                <XStack
                  key={item.id}
                  {...slot('chip-select-option')}
                  id={optionId(i)}
                  role="option"
                  aria-selected={picked}
                  aria-disabled={item.disabled || undefined}
                  aria-describedby={action && shown(item) ? hintId : undefined}
                  height={ROW_H}
                  px="$2"
                  gap="$2"
                  items="center"
                  rounded="$2"
                  cursor={item.disabled ? 'default' : 'pointer'}
                  opacity={item.disabled ? 0.5 : 1}
                  bg={on ? '$raised' : 'transparent'}
                  onHoverIn={() => setAt(i)}
                  onPress={() => choose(item)}
                >
                  {item.icon ? (
                    <XStack width={14} shrink={0} items="center" justify="center" aria-hidden>
                      {item.icon}
                    </XStack>
                  ) : null}
                  <SizableText size="$2" color="$ink" numberOfLines={1} flex={1} minW={0}>
                    {item.label}
                  </SizableText>
                  {item.hint ? (
                    <SizableText size="$1" color="$soft" numberOfLines={1} shrink={0}>
                      {item.hint}
                    </SizableText>
                  ) : null}
                  {action && on && shown(item) ? (
                    <XStack
                      {...slot('chip-select-action')}
                      aria-hidden
                      px="$1.5"
                      height={18}
                      items="center"
                      rounded="$2"
                      borderWidth={1}
                      borderColor="$rim"
                      shrink={0}
                      hoverStyle={{ bg: '$hover' }}
                      onPress={(e: any) => {
                        e?.stopPropagation?.()
                        action.onPress(item)
                        close()
                      }}
                    >
                      <SizableText size="$1" color="$quiet">
                        {action.label}
                      </SizableText>
                    </XStack>
                  ) : null}
                  {picked ? <Check size={14} color="$ink" aria-hidden /> : null}
                </XStack>
              )
            })}
          </YStack>

          {error ? (
            <XStack {...slot('chip-select-error')} px="$2" py="$1.5" gap="$2" items="center" role="alert">
              <SizableText size="$2" color="$bad" flex={1}>
                {error}
              </SizableText>
              {load ? (
                <SizableText
                  size="$2"
                  color="$ink"
                  textDecorationLine="underline"
                  cursor="pointer"
                  role="button"
                  tabIndex={0}
                  onPress={pages.retry}
                  onKeyDown={(e: any) => {
                    if (e?.key !== 'Enter' && e?.key !== ' ') return
                    e.preventDefault?.()
                    pages.retry()
                  }}
                >
                  Retry
                </SizableText>
              ) : null}
            </XStack>
          ) : loading ? (
            <XStack {...slot('chip-select-loading')} px="$2" height={ROW_H} items="center" role="status">
              <SizableText size="$2" color="$soft">
                {rows.length ? 'Loading more…' : 'Loading…'}
              </SizableText>
            </XStack>
          ) : rows.length === 0 ? (
            <XStack {...slot('chip-select-empty')} px="$2" py="$1.5" items="center" role="status">
              {typeof empty === 'string' ? (
                <SizableText size="$2" color="$soft">
                  {empty}
                </SizableText>
              ) : (
                empty
              )}
            </XStack>
          ) : null}
        </ScrollView>

        {action ? (
          <SizableText id={hintId} position="absolute" width={1} height={1} overflow="hidden" opacity={0}>
            {`Ctrl+Enter: ${action.label}`}
          </SizableText>
        ) : null}

        {footer ? (
          <YStack
            {...slot('chip-select-footer')}
            mx={-4}
            mt="$1"
            px="$3"
            py="$2"
            gap="$0.5"
            borderTopWidth={1}
            borderColor="$borderColor"
          >
            {footer}
          </YStack>
        ) : null}

        {/* One place in the tree whichever side the panel took, so the field keeps its focus when it flips; the header goes to the side of the chip. */}
        <YStack {...slot('chip-select-header')} flexDirection={up ? 'column-reverse' : 'column'} style={{ order: up ? 99 : -1 }}>
          {search}
          {tabbar}
        </YStack>
      </PopoverContent>
    </Popover>
  )
}
