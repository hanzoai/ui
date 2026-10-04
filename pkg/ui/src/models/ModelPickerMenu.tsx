'use client'

/**
 * The open half of ModelPicker: the popover (a bottom sheet on a phone) and in
 * it the search, the virtualised list and the research note. It loads when a
 * picker is first pointed at, focused or opened, so a page that only shows the
 * chosen model carries the trigger alone.
 *
 * VIRTUALISED. Five hundred rows are drawn as the ~15 in view plus a margin:
 * every row is one height, so a scroll offset names the slice outright and
 * two spacers stand in for the rest. The cursor moves over the full list and
 * scrolls itself into view, so keyboard reach is the same as a full render.
 *
 * ARIA: the search field is the combobox and owns the cursor through
 * `aria-activedescendant`; the list is a listbox whose options carry
 * `aria-setsize` / `aria-posinset`, since most of them are not in the DOM.
 * Group headings are presentation: the option's own label names the group.
 */
import { Anchor, Input as GuiInput, ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { Check, Search } from '@hanzogui/lucide-icons-2'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactElement } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui/popover'
import { Sheet, SheetContent, SheetTitle } from '../backends/gui/sheet'
import { slot } from '../backends/gui/slot'
import { move, type Move } from '../product/chipSelect.logic'
import {
  CAPABILITY_NAMES,
  can,
  capabilitiesOf,
  formatCeiling,
  formatContext,
  formatSaving,
  groupLabel,
  isPaused,
  modelName,
  RESEARCH,
  savingOf,
  type Capability,
  type ModelCatalogEntry,
  type PauseSource,
} from './catalog'
import { modelCount, pickable, pickerRows, restable, revealTop, visibleRange, type PickerRow } from './picker.logic'

/** The list's ceiling in a popover, px. */
const LIST_H = 360
const PANEL_W = 360

const MOVES = new Set<Move>(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'])

interface ListProps {
  models: readonly ModelCatalogEntry[]
  value?: string
  onChange: (id: string) => void
  /** Closes the picker and hands the focus back to its trigger. */
  onClose: () => void
  scope?: Capability
  limits?: PauseSource | null
  loading: boolean
  error: string | null
  /** What it chooses: the listbox's name. */
  name: string
  /** A bottom sheet on a phone: rows sized for a thumb. */
  sheet: boolean
  /** Row height, px. */
  row: number
}

function List({ models, value, onChange, onClose, scope, limits, loading, error, name, sheet, row }: ListProps) {
  const [q, setQ] = useState('')
  const [at, setAt] = useState(-1)
  const [top, setTop] = useState(0)
  const [viewH, setViewH] = useState(LIST_H)
  const list = useRef<{ scrollTo?: (o: { y: number; animated?: boolean }) => void } | null>(null)
  const field = useRef<HTMLInputElement | null>(null)
  const id = useId()
  const listId = `${id}-list`
  const optionId = (i: number) => `${id}-opt-${i}`

  const rows = useMemo(() => pickerRows(models, q, scope), [models, q, scope])
  const total = useMemo(() => modelCount(rows), [rows])
  const research = useMemo(() => RESEARCH.filter((r) => rows.some((x) => x.kind === 'model' && x.model.id === r.id)), [rows])
  // Position among the models alone, for aria-posinset.
  const position = useMemo(() => {
    const pos: number[] = []
    let n = 0
    for (const r of rows) pos.push(r.kind === 'model' ? ++n : 0)
    return pos
  }, [rows])

  const scrollTo = useCallback((y: number) => {
    list.current?.scrollTo?.({ y, animated: false })
    setTop(y)
  }, [])

  // It mounts as the picker opens: from the top of an empty search, the cursor
  // on the chosen model — scrolled to the middle of the list — or the first one,
  // and the search field holding the focus.
  useEffect(() => {
    const all = pickerRows(models, '', scope)
    const chosen = all.findIndex((r) => r.kind === 'model' && r.model.id === value)
    const first = all.findIndex((_, i) => restable(all, i))
    const i = chosen >= 0 ? chosen : first
    setAt(i)
    const y = i >= 0 ? Math.max(0, i * row - viewH / 2 + row / 2) : 0
    field.current?.focus()
    // The list lays out with the panel; scroll once it is there.
    requestAnimationFrame(() => scrollTo(y))
    // Only on mount: the cursor is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A new search puts the cursor on its first match, at the top.
  const searched = useRef(false)
  useEffect(() => {
    if (!searched.current) {
      searched.current = true
      return
    }
    setAt(rows.findIndex((_, i) => restable(rows, i)))
    scrollTo(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const reveal = useCallback(
    (i: number) => {
      const y = revealTop(i, top, viewH, row)
      if (y !== null) scrollTo(y)
    },
    [top, viewH, row, scrollTo],
  )

  const choose = useCallback(
    (r: PickerRow | undefined) => {
      if (r?.kind !== 'model' || !pickable(r.model)) return
      onChange(r.model.id)
      onClose()
    },
    [onChange, onClose],
  )

  const onField = (e: { key?: string; preventDefault?: () => void }) => {
    const key = e.key as Move
    if (MOVES.has(key)) {
      if ((key === 'Home' || key === 'End') && q) return
      e.preventDefault?.()
      const to = move(key, at, rows.length, (i) => !restable(rows, i))
      setAt(to)
      if (to >= 0) reveal(to)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault?.()
      choose(rows[at])
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault?.()
      onClose()
    }
  }

  const range = visibleRange(top, viewH, row, rows.length)
  const shown = rows.slice(range.start, range.end)

  return (
    <YStack {...slot('model-picker-body')} flex={sheet ? 1 : undefined} minH={0} gap="$1">
      <XStack
        {...slot('model-picker-search')}
        height={sheet ? 40 : 32}
        px="$2"
        gap="$2"
        items="center"
        rounded="$2"
        borderWidth={1}
        borderColor="$rim"
        bg="$background"
        focusWithinStyle={{ borderColor: '$outlineColor' }}
      >
        <Search size={14} color="$soft" aria-hidden />
        <GuiInput
          ref={field as never}
          {...slot('model-picker-input')}
          unstyled
          flex={1}
          minW={0}
          height={sheet ? 38 : 30}
          p={0}
          borderWidth={0}
          bg="transparent"
          fontSize={sheet ? '$3' : '$2'}
          color="$ink"
          placeholderTextColor="$soft"
          placeholder="Search models"
          value={q}
          onChangeText={setQ}
          role="combobox"
          aria-label="Search models"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={at >= 0 && rows[at] ? optionId(at) : undefined}
          autoComplete="off"
          spellCheck={false}
          onKeyDown={onField}
        />
        <SizableText {...slot('model-picker-count')} size="$1" color="$soft" shrink={0} aria-live="polite">
          {loading && !models.length ? 'Loading' : `${total} ${total === 1 ? 'model' : 'models'}`}
        </SizableText>
      </XStack>

      {error ? (
        <XStack {...slot('model-picker-error')} px="$2" py="$1.5" role="alert">
          <SizableText size="$2" color="$bad">
            {error}
          </SizableText>
        </XStack>
      ) : null}

      <ScrollView
        ref={list as never}
        height={sheet ? undefined : Math.min(LIST_H, Math.max(row * 3, rows.length * row))}
        flex={sheet ? 1 : undefined}
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
        onScroll={(e: { nativeEvent?: { contentOffset?: { y?: number } } }) => setTop(e.nativeEvent?.contentOffset?.y ?? 0)}
        onLayout={(e: { nativeEvent?: { layout?: { height?: number } } }) => {
          const h = e.nativeEvent?.layout?.height
          if (h) setViewH(h)
        }}
      >
        <YStack {...slot('model-picker-list')} id={listId} role="listbox" aria-label={name} height={rows.length * row}>
          <YStack height={range.start * row} />
          {shown.map((r, k) => {
            const i = range.start + k
            if (r.kind === 'group') {
              return (
                <XStack
                  key={r.key}
                  {...slot('model-picker-group')}
                  role="presentation"
                  height={row}
                  px="$2"
                  gap="$2"
                  items="flex-end"
                  pb="$1.5"
                >
                  <SizableText size="$1" color="$soft" fontWeight="600" numberOfLines={1} flex={1}>
                    {r.label}
                  </SizableText>
                  <SizableText size="$1" color="$soft" fontVariant={['tabular-nums']}>
                    {r.count}
                  </SizableText>
                </XStack>
              )
            }
            const m = r.model
            const locked = !pickable(m)
            const paused = !locked && isPaused(m, limits)
            const picked = m.id === value
            const ctx = formatContext(m.context_window)
            const title = modelName(m)
            // A model that answers in something other than a conversation says
            // what it does, so an unscoped list is honest about each row.
            const kind = scope || can(m, 'chat') ? null : capabilitiesOf(m)[0]
            // A model sold against another says by how much, from the two list prices;
            // a router, the ceiling it bills up to.
            const saving = savingOf(m, models)
            const ceiling = formatCeiling(m)
            return (
              <XStack
                key={m.id}
                {...slot('model-picker-option')}
                id={optionId(i)}
                role="option"
                aria-selected={picked}
                aria-disabled={locked || undefined}
                aria-setsize={total}
                aria-posinset={position[i]}
                aria-label={`${title}, ${groupLabel(m)}${paused ? ', paused' : ''}${locked ? ', research preview' : ''}`}
                data-model={m.id}
                data-class={m.class}
                data-paused={paused || undefined}
                height={row}
                px="$2"
                gap="$2"
                items="center"
                rounded="$2"
                cursor={locked ? 'default' : 'pointer'}
                bg={i === at ? '$raised' : 'transparent'}
                onHoverIn={() => setAt(i)}
                onPress={() => choose(r)}
              >
                <Check size={14} color="$ink" shrink={0} opacity={picked ? 1 : 0} aria-hidden />
                <SizableText size={sheet ? '$3' : '$2'} color="$ink" opacity={locked ? 0.5 : 1} numberOfLines={1} flex={1} minW={0}>
                  {title}
                </SizableText>
                {m.class === 'premium' ? (
                  <SizableText size="$1" color="$soft" shrink={0} aria-hidden>
                    ✦
                  </SizableText>
                ) : null}
                {locked || paused || saving || ceiling || kind || ctx ? (
                  <SizableText size="$1" color="$soft" shrink={0} maxW="60%" numberOfLines={1} fontVariant={['tabular-nums']}>
                    {locked
                      ? 'Research preview'
                      : paused
                        ? 'Paused'
                        : saving
                          ? formatSaving(saving)
                          : ceiling
                            ? ceiling
                            : kind
                              ? CAPABILITY_NAMES[kind]
                              : ctx}
                  </SizableText>
                ) : null}
              </XStack>
            )
          })}
        </YStack>
        {rows.length === 0 && !error ? (
          <XStack {...slot('model-picker-empty')} px="$2" py="$2" role="status">
            <SizableText size="$2" color="$soft">
              {loading ? 'Loading models…' : q ? `No models match “${q}”.` : 'No models to choose from.'}
            </SizableText>
          </XStack>
        ) : null}
      </ScrollView>

      {research.length ? (
        <XStack {...slot('model-picker-research')} px="$2" py="$1.5" gap="$1.5" items="center" flexWrap="wrap">
          <SizableText size="$1" color="$soft">
            {research.map(modelName).join(', ')} {research.length === 1 ? 'is' : 'are'} in research preview.
          </SizableText>
          <Anchor href={research[0]!.request} target="_blank" rel="noopener noreferrer" size="$1" color="$ink" textDecorationLine="underline">
            Request access
          </Anchor>
        </XStack>
      ) : null}
    </YStack>
  )
}

export interface ModelPickerMenuProps extends ListProps {
  /** The picker's trigger, as ModelPicker draws it. */
  trigger: ReactElement
  open: boolean
  /** Opens it. Closing is `onClose`. */
  onOpen: () => void
  disabled: boolean
  /** The trigger's width: the popover is at least as wide. */
  width: number
  /** Where the focus goes back to once it closes. */
  focusTrigger: () => void
}

/** The trigger in its popover, or beside its sheet on a phone, and the list in it while open. */
export function ModelPickerMenu({ trigger, open, onOpen, disabled, width, focusTrigger, ...list }: ModelPickerMenuProps) {
  const body = open ? <List {...list} /> : null
  return (
    <>
      <Popover open={open && !list.sheet} onOpenChange={(v) => (v ? onOpen() : list.onClose())} placement="bottom-start" allowFlip stayInFrame>
        <PopoverTrigger asChild disabled={disabled}>
          {trigger}
        </PopoverTrigger>
        {list.sheet ? null : (
          <PopoverContent
            {...slot('model-picker-panel')}
            sideOffset={6}
            width={Math.max(width, PANEL_W)}
            maxW="92vw"
            p="$1.5"
            items="stretch"
            trapFocus
            onOpenAutoFocus={(e: Event) => e.preventDefault()}
            onCloseAutoFocus={(e: Event) => {
              e.preventDefault()
              focusTrigger()
            }}
          >
            {body}
          </PopoverContent>
        )}
      </Popover>
      {list.sheet ? (
        <Sheet open={open} onOpenChange={(v: boolean) => (v ? onOpen() : list.onClose())}>
          <SheetContent
            {...slot('model-picker-sheet')}
            side="bottom"
            height="85%"
            maxH="85%"
            p="$3"
            gap="$2"
            onOpenAutoFocus={(e: Event) => e.preventDefault()}
          >
            <SheetTitle size="$4">{list.name}</SheetTitle>
            {body}
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

export default ModelPickerMenu
