'use client'

/**
 * CommandMenu — the palette: a field over grouped rows, on ONE surface.
 *
 *   <DialogContent p={0} showCloseButton={false}>
 *     <CommandMenu groups={groups} onClose={close} />
 *   </DialogContent>
 *
 * It paints no ground of its own, so the field and the list stand on whatever
 * holds them, a dialog or a pane, and one hairline parts them. The field has
 * no box and no ring: the surface is the focus context and the caret is the
 * focus. At its end a quiet `esc` says how to leave and closes on a press (a
 * phone, with no Escape key, reads Cancel).
 *
 * One grid, so the eye reads straight down: the field's glyph and every row's
 * icon stand in one 16px column, and the field's text, every group's heading
 * and every row's label start on one edge after it (`COMMAND.text`). Icons are
 * bare and muted; the active row is a subtle fill; a row's shortcut is keycaps
 * (not on a phone, which has no keys) and a row that opens a page ends in a
 * chevron. Rows are 36 high, 44 on a
 * phone. The list is as tall as its rows, so a short answer is a short palette,
 * up to whatever bounds the holder, and scrolls past that.
 *
 * The decisions are the palette's own (`command.logic`): `score` keeps a row
 * against the query, `step` moves the cursor. It is drawn as the ARIA combobox
 * it is — the field owns focus and names the active option, the rows are
 * options in grouped listboxes — so a screen reader hears the row the arrows
 * land on while the caret stays in the field.
 *
 * Keys, from the field: ArrowDown/ArrowUp move (wrapping), Enter runs the
 * active row, Escape closes (in a pane the pane closes itself), Backspace on an
 * empty query goes back a page.
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Input, ScrollView, Text, XStack, YStack } from '@hanzo/gui'
import { ChevronRight, Search } from '@hanzogui/lucide-icons-2'

import { score, step } from '../backends/gui/command.logic'
import { Kbd } from '../backends/gui/kbd'
import { Shortcut, type ShortcutKeys } from '../backends/gui/shortcut'
import { slot } from '../backends/gui/slot'
import { usePane } from './DetailPane'
import { mirror } from '../backends/gui/dir'

export type CommandMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  /** Dimmed text after the label: where it lives, a count. */
  contextual?: string
  /** More words the query matches it by. */
  keywords?: string[]
  /** The keys that run it outside the menu, drawn as keycaps: `['Mod', 'K']`, or `[['G'], ['P']]` for G then P. */
  shortcut?: ShortcutKeys
  /** It opens a page rather than acting: a chevron at its end. */
  submenu?: boolean
  disabled?: boolean
  onSelect: () => void
}

export type CommandMenuGroup = {
  id: string
  label: string
  items: CommandMenuItem[]
}

export type CommandMenuProps = {
  groups: CommandMenuGroup[]
  placeholder?: string
  /** What a query that matches nothing says. */
  empty?: ReactNode
  /** The listbox's accessible name. */
  label?: string
  /** The query, controlled; uncontrolled when absent. */
  query?: string
  onQueryChange?: (query: string) => void
  /** Backspace on an empty query. Default: the pane's `back`, when there is a page under this one. */
  onBack?: () => void
  /** Escape, or a press on `esc`, outside a pane (inside one, the pane closes itself). */
  onClose?: () => void
  autoFocus?: boolean
}

/**
 * The grid. `pad` is the list's inset, `inset` a row's own; the icon column
 * sits at `pad + inset` from the edge and the text at `text`, the field's and
 * the headings' as much as the rows'.
 */
export const COMMAND = { bar: 52, pad: 8, inset: 8, icon: 16, gap: 12, header: 28, row: 36, phone: 44, empty: 64 } as const
const TEXT = COMMAND.inset + COMMAND.icon + COMMAND.gap

type Key = { key: string; preventDefault: () => void; stopPropagation: () => void }

export function CommandMenu({
  groups,
  placeholder = 'Search or jump to…',
  empty = 'No results found',
  label = 'Commands',
  query: controlled,
  onQueryChange,
  onBack,
  onClose,
  autoFocus = true,
}: CommandMenuProps) {
  const pane = usePane()
  const base = useId()
  const [own, setOwn] = useState('')
  const query = controlled ?? own
  const setQuery = (q: string) => {
    if (controlled === undefined) setOwn(q)
    onQueryChange?.(q)
  }
  const close = pane ? pane.close : onClose

  // The rows that survive the query, grouped, in source order.
  const shown = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) => score(it.label, query, [...(it.keywords ?? []), ...(it.contextual ? [it.contextual] : [])]) > 0,
          ),
        }))
        .filter((g) => g.items.length > 0),
    [groups, query],
  )
  const reachable = useMemo(() => shown.flatMap((g) => g.items.filter((it) => !it.disabled)), [shown])
  const [active, setActive] = useState<string | undefined>(undefined)
  const current = reachable.find((it) => it.id === active) ?? reachable[0]
  const optionId = (id: string) => `${base}-option-${id}`
  const listId = `${base}-list`

  // A cursor the arrows moved is brought into view; the first row of a group
  // carries a scroll margin, so its heading comes with it.
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current || !current || typeof document === 'undefined') return
    moved.current = false
    document.getElementById(optionId(current.id))?.scrollIntoView?.({ block: 'nearest' })
  })

  const field = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (!autoFocus) return
    const t = setTimeout(() => field.current?.focus?.(), 0)
    return () => clearTimeout(t)
  }, [autoFocus])

  const onKey = (e: Key) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const at = current ? reachable.indexOf(current) : -1
      const next = reachable[step(reachable.length, at, e.key === 'ArrowDown' ? 1 : -1, true)]
      if (next) {
        moved.current = true
        setActive(next.id)
      }
    } else if (e.key === 'Enter') {
      if (!current) return
      e.preventDefault()
      current.onSelect()
    } else if (e.key === 'Escape') {
      if (!pane && onClose) {
        e.preventDefault()
        onClose()
      }
    } else if (e.key === 'Backspace' && !query) {
      const back = onBack ?? (pane && pane.depth > 1 ? pane.back : undefined)
      if (back) {
        e.preventDefault()
        back()
      }
    }
  }

  return (
    <YStack {...slot('command-menu')} shrink={1} minH={0}>
      <XStack
        {...slot('command-menu-bar')}
        height={COMMAND.bar}
        shrink={0}
        items="center"
        gap={COMMAND.gap}
        px={COMMAND.pad + COMMAND.inset}
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <Search size={COMMAND.icon} color="$hint" aria-hidden />
        <Input
          ref={field as never}
          {...slot('command-menu-input')}
          {...({
            role: 'combobox',
            'aria-expanded': true,
            'aria-controls': listId,
            'aria-autocomplete': 'list',
            'aria-activedescendant': current ? optionId(current.id) : undefined,
            'aria-label': label,
          } as object)}
          flex={1}
          minW={0}
          height={COMMAND.bar - 2}
          px={0}
          borderWidth={0}
          rounded={0}
          bg="transparent"
          // The surface is the focus context: no ring, no edge, no hover fill.
          outlineWidth={0}
          hoverStyle={{ bg: 'transparent' }}
          focusStyle={{ outlineWidth: 0 }}
          focusVisibleStyle={{ outlineWidth: 0 }}
          color="$ink"
          fontSize="$4"
          // 16px on a phone, so the browser does not zoom to the field.
          $max-md={{ fontSize: 16 }}
          placeholder={placeholder}
          placeholderTextColor="$hint"
          value={query}
          onChangeText={(t: string) => {
            setQuery(t)
            setActive(undefined)
          }}
          onKeyDown={onKey as never}
        />
        {close ? (
          <XStack render="button" aria-label="Close" onPress={close} shrink={0} items="center" justify="center" cursor="pointer" opacity={0.7} hoverStyle={{ opacity: 1 }}>
            {/* A phone has no Escape key: it says Cancel. */}
            <XStack $max-md={{ display: 'none' }}>
              <Kbd>esc</Kbd>
            </XStack>
            <Text display="none" $max-md={{ display: 'flex' }} fontSize="$4" color="$ink">
              Cancel
            </Text>
          </XStack>
        ) : null}
      </XStack>
      <ScrollView {...slot('command-menu-scroll')} shrink={1} minH={0} style={{ overscrollBehavior: 'contain' } as never}>
        <YStack id={listId} {...slot('command-menu-list')} p={COMMAND.pad} gap={COMMAND.pad}>
          {shown.map((g) => {
            const head = `${base}-group-${g.id}`
            return (
              <YStack key={g.id} {...slot('command-menu-group')}>
                <XStack id={head} {...slot('command-menu-heading')} height={COMMAND.header} items="center" paddingInlineStart={TEXT}>
                  <Text fontSize="$1" fontWeight="500" color="$hint" numberOfLines={1}>
                    {g.label}
                  </Text>
                </XStack>
                <YStack role="listbox" aria-labelledby={head}>
                  {g.items.map((it, i) => {
                    const on = current?.id === it.id
                    return (
                      <XStack
                        key={it.id}
                        id={optionId(it.id)}
                        {...slot('command-menu-item')}
                        {...({ role: 'option', 'aria-selected': on, 'aria-disabled': it.disabled || undefined } as object)}
                        data-active={on ? '' : undefined}
                        items="center"
                        gap={COMMAND.gap}
                        px={COMMAND.inset}
                        minH={COMMAND.row}
                        $max-md={{ minH: COMMAND.phone }}
                        rounded="$3"
                        cursor={it.disabled ? 'default' : 'pointer'}
                        opacity={it.disabled ? 0.5 : 1}
                        bg={on ? '$hover' : 'transparent'}
                        onHoverIn={it.disabled ? undefined : () => setActive(it.id)}
                        onPress={it.disabled ? undefined : it.onSelect}
                        style={i === 0 ? { scrollMarginTop: COMMAND.header + COMMAND.pad } : undefined}
                      >
                        <XStack width={COMMAND.icon} shrink={0} items="center" justify="center" opacity={0.6} aria-hidden>
                          {it.icon}
                        </XStack>
                        <Text flex={1} minW={0} fontSize="$3" color="$ink" numberOfLines={1}>
                          {it.label}
                          {it.contextual ? (
                            <Text fontSize="$3" color="$hint" paddingInlineStart={8}>
                              {it.contextual}
                            </Text>
                          ) : null}
                        </Text>
                        {it.shortcut ? (
                          <XStack $max-md={{ display: 'none' }}>
                            <Shortcut keys={it.shortcut} />
                          </XStack>
                        ) : null}
                        {it.submenu ? <ChevronRight {...mirror} size={14} color="$hint" /> : null}
                      </XStack>
                    )
                  })}
                </YStack>
              </YStack>
            )
          })}
          {shown.length === 0 ? (
            <YStack {...slot('command-menu-empty')} role="status" aria-live="polite" height={COMMAND.empty} items="center" justify="center">
              {typeof empty === 'string' ? (
                <Text fontSize="$3" color="$hint">
                  {empty}
                </Text>
              ) : (
                empty
              )}
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
