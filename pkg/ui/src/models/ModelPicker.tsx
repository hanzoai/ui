'use client'

/**
 * ModelPicker — the one model picker every Hanzo surface uses: hanzo.ai chat
 * and dev, and every playground tab in the console.
 *
 * It lists the whole catalog `GET /v1/models` answers, grouped — Hanzo's own
 * families first (Enso, Zen, Kai, Zoo), then every maker by name — with a
 * search over id, name, maker and description. `scope` narrows it to what a
 * surface can run (an embeddings tab offers embedding models).
 *
 * Every listed model can be picked. One the payer's plan has paused, by class
 * or by itself (`limits`), says "Paused" and still picks: the gateway answers
 * it with the policy's refusal or from Enso, and the host shows that. Only a
 * research preview, which nothing can call yet, is listed and never picked.
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
 *
 * On a phone it is a bottom sheet with rows sized for a thumb; elsewhere a
 * popover. Styling is gui props and tokens only.
 */
import { Anchor, Input as GuiInput, ScrollView, SizableText, XStack, YStack, useMedia } from '@hanzo/gui'
import { Check, ChevronsUpDown, Search } from '@hanzogui/lucide-icons-2'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui/popover'
import { RING } from '../backends/gui/press'
import { Sheet, SheetContent, SheetTitle } from '../backends/gui/sheet'
import { slot } from '../backends/gui/slot'
import { move, type Move } from '../product/chipSelect.logic'
import {
  CAPABILITY_NAMES,
  can,
  capabilitiesOf,
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

/** Row height, px: a line of 13px type on a pointer, a thumb's reach on a phone. */
const ROW = 32
const ROW_TOUCH = 44
/** The list's ceiling in a popover, px. */
const LIST_H = 360
const PANEL_W = 360

const MOVES = new Set<Move>(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'])

export interface ModelPickerProps {
  /** The catalog, as `parseModels` reads `GET /v1/models`. */
  models: readonly ModelCatalogEntry[]
  value?: string
  onChange: (id: string) => void
  /** Offer only the models that do this. Absent, every model. */
  scope?: Capability
  /** The payer's plan usage (`useLimits().limits`): a paused model says so. */
  limits?: PauseSource | null
  /** The catalog is still being read. */
  loading?: boolean
  /** The catalog could not be read, in a sentence. */
  error?: string | null
  disabled?: boolean
  /** The plain look, for a picker in a row of words (a composer): no fill, no hairline. */
  quiet?: boolean
  size?: 'sm' | 'md'
  placeholder?: string
  /** What it chooses, for its accessible name. */
  name?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ModelPicker({
  models,
  value,
  onChange,
  scope,
  limits,
  loading = false,
  error = null,
  disabled = false,
  quiet = false,
  size = 'md',
  placeholder = 'Choose a model',
  name = 'Model',
  open: openProp,
  onOpenChange,
}: ModelPickerProps) {
  const [own, setOwn] = useState(false)
  const open = openProp ?? own
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwn(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )

  const media = useMedia()
  const sheet = !media.sm
  const row = sheet ? ROW_TOUCH : ROW

  const [q, setQ] = useState('')
  const [at, setAt] = useState(-1)
  const [top, setTop] = useState(0)
  const [viewH, setViewH] = useState(LIST_H)
  const [triggerW, setTriggerW] = useState(0)
  const list = useRef<{ scrollTo?: (o: { y: number; animated?: boolean }) => void } | null>(null)
  const field = useRef<HTMLInputElement | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
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

  const selected = value ? models.find((m) => m.id === value) : undefined
  const label = selected ? modelName(selected) : value || placeholder

  const scrollTo = useCallback((y: number) => {
    list.current?.scrollTo?.({ y, animated: false })
    setTop(y)
  }, [])

  // Opening starts from the top of an empty search, the cursor on the chosen
  // model — scrolled to the middle of the list — or the first one.
  useEffect(() => {
    if (!open) {
      setQ('')
      return
    }
    const all = pickerRows(models, '', scope)
    const chosen = all.findIndex((r) => r.kind === 'model' && r.model.id === value)
    const first = all.findIndex((_, i) => restable(all, i))
    const i = chosen >= 0 ? chosen : first
    setAt(i)
    const y = i >= 0 ? Math.max(0, i * row - viewH / 2 + row / 2) : 0
    // The list mounts with the panel; scroll once it is there.
    requestAnimationFrame(() => scrollTo(y))
    // Only on open: the cursor is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // A new search puts the cursor on its first match, at the top.
  useEffect(() => {
    if (!open) return
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

  const close = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => trigger.current?.focus?.())
  }, [setOpen])

  const choose = useCallback(
    (r: PickerRow | undefined) => {
      if (r?.kind !== 'model' || !pickable(r.model)) return
      onChange(r.model.id)
      close()
    },
    [onChange, close],
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
      close()
    }
  }

  const range = visibleRange(top, viewH, row, rows.length)
  const shown = rows.slice(range.start, range.end)

  const body = (
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
          aria-expanded={open}
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
            // A model sold against another says by how much, from the two list prices.
            const saving = savingOf(m, models)
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
                {locked || paused || saving || kind || ctx ? (
                  <SizableText size="$1" color="$soft" shrink={0} fontVariant={['tabular-nums']}>
                    {locked
                      ? 'Research preview'
                      : paused
                        ? 'Paused'
                        : saving
                          ? formatSaving(saving)
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

  const small = size === 'sm'
  const button = (
    <XStack
      ref={trigger as never}
      {...slot('model-picker')}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${name}: ${label}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-disabled={disabled || undefined}
      height={small ? 28 : 36}
      px={small ? '$2' : '$3'}
      gap="$2"
      items="center"
      maxW="100%"
      rounded="$3"
      borderWidth={quiet ? 0 : 1}
      borderColor="$borderColor"
      bg={quiet ? 'transparent' : '$background'}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={disabled ? undefined : quiet ? { bg: '$hover' } : { borderColor: '$rim' }}
      pressStyle={disabled ? undefined : { bg: '$hover' }}
      focusVisibleStyle={RING}
      onLayout={(e: { nativeEvent?: { layout?: { width?: number } } }) => setTriggerW(e.nativeEvent?.layout?.width ?? 0)}
      onPress={sheet && !disabled ? () => setOpen(true) : undefined}
      onKeyDown={(e: { key?: string; preventDefault?: () => void }) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault?.()
          setOpen(true)
        }
      }}
    >
      <SizableText size={small ? '$1' : '$2'} color={quiet ? '$quiet' : '$ink'} numberOfLines={1} shrink={1} minW={0}>
        {label}
      </SizableText>
      {selected && !quiet ? (
        <SizableText size={small ? '$1' : '$2'} color="$soft" numberOfLines={1} shrink={2} minW={0}>
          {groupLabel(selected)}
        </SizableText>
      ) : null}
      <ChevronsUpDown size={small ? 12 : 14} color="$soft" shrink={0} aria-hidden />
    </XStack>
  )

  return (
    <>
      <Popover open={open && !sheet} onOpenChange={(v) => (v ? setOpen(true) : close())} placement="bottom-start" allowFlip stayInFrame>
        <PopoverTrigger asChild disabled={disabled}>
          {button}
        </PopoverTrigger>
        {sheet ? null : (
          <PopoverContent
            {...slot('model-picker-panel')}
            sideOffset={6}
            width={Math.max(triggerW, PANEL_W)}
            maxW="92vw"
            p="$1.5"
            items="stretch"
            trapFocus
            onOpenAutoFocus={(e: Event) => {
              e.preventDefault()
              field.current?.focus()
            }}
            onCloseAutoFocus={(e: Event) => {
              e.preventDefault()
              trigger.current?.focus?.()
            }}
          >
            {body}
          </PopoverContent>
        )}
      </Popover>
      {sheet ? (
        <Sheet open={open} onOpenChange={(v: boolean) => (v ? setOpen(true) : close())}>
          <SheetContent
            {...slot('model-picker-sheet')}
            side="bottom"
            height="85%"
            maxH="85%"
            p="$3"
            gap="$2"
            onOpenAutoFocus={(e: Event) => {
              e.preventDefault()
              field.current?.focus()
            }}
          >
            <SheetTitle size="$4">{name}</SheetTitle>
            {body}
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

export default ModelPicker
