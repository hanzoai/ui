'use client'

/**
 * CommandMenu — the palette as a side-panel page (the record kit's command menu
 * frame, MIT, NOTICE): the search field IS the top bar, and the commands are
 * grouped rows under it.
 *
 *   const pane = useDetailPane()
 *   useCommandK(() => pane.open({ title: 'Command menu', bare: true, content: <CommandMenu groups={groups} /> }))
 *
 * Layout: the 48px pane bar holds a borderless 24px field ("Type anything…");
 * each group opens on a 32px header row (a 24px icon slot, the label in medium
 * ink, a hairline under it); rows are the record menu row — 32 high, a 16px
 * icon in its well, contextual text, keycaps for the command's shortcut ("G
 * then P"), a chevron when it opens a page — 2 apart, groups 12 apart. A query
 * that matches nothing says so in a 64px status line.
 *
 * The decisions are the palette's own (`command.logic`): `score` keeps and
 * ranks a row against the query, `step` moves the cursor. The view is drawn
 * here as the ARIA combobox it is — the field owns focus and names the active
 * option, the rows are options in grouped listboxes — so a screen reader hears
 * the row the arrows land on while the caret stays in the field.
 *
 * Keys, from the field: ArrowDown/ArrowUp move (wrapping), Enter runs the
 * active row, Escape clears a query (and on an empty one lets the pane close),
 * Backspace on an empty query goes back a page.
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Input, Text, XStack, YStack } from '@hanzo/gui'

import { score, step } from '../backends/gui/command.logic'
import { Shortcut, type ShortcutKeys } from '../backends/gui/shortcut'
import { slot } from '../backends/gui/slot'
import { touch } from '../backends/gui/gesture'
import { MenuRowContent } from './MenuRow'
import { PaneBar, PaneBody, usePane } from './DetailPane'

export type CommandMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  /** Dimmed text after the label: an object's name, a count. */
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
  icon?: ReactNode
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
  /** Escape on an empty query, outside a pane (inside one, the pane closes itself). */
  onClose?: () => void
  autoFocus?: boolean
}

/** The frame's measures (the record kit's command menu, MIT). */
export const COMMAND = { field: 24, header: 32, icon: 24, row: 32, rows: 2, groups: 12, empty: 64, margin: 48 } as const

type Key = { key: string; preventDefault: () => void; stopPropagation: () => void }

export function CommandMenu({
  groups,
  placeholder = 'Type anything…',
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
  // carries a scroll margin, so its header comes with it.
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current || !current || typeof document === 'undefined') return
    moved.current = false
    const el = document.getElementById(optionId(current.id))
    el?.scrollIntoView?.({ block: 'nearest' })
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
      if (query) {
        // Clearing the query is this key's whole job: it must not reach the pane.
        e.preventDefault()
        e.stopPropagation()
        setQuery('')
      } else if (!pane && onClose) {
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
    <YStack {...slot('command-menu')} flex={1} minH={0}>
      <PaneBar>
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
          height={COMMAND.field}
          px={0}
          borderWidth={0}
          rounded={0}
          bg="transparent"
          color="$ink"
          fontSize="$2"
          placeholder={placeholder}
          placeholderTextColor="$hush"
          value={query}
          onChangeText={(t: string) => {
            setQuery(t)
            setActive(undefined)
          }}
          onKeyDown={onKey as never}
          // The bar is the field; its caret is the focus, so the field draws no
          // ring of its own (inline, to outrank design's :focus-visible rule).
          style={{ outlineStyle: 'none' }}
        />
      </PaneBar>
      <PaneBody padded={false}>
        <YStack id={listId} {...slot('command-menu-list')} px="$2" pt="$2" pb="$2" gap={COMMAND.groups}>
          {shown.map((g) => {
            const head = `${base}-group-${g.id}`
            return (
              <YStack key={g.id} {...slot('command-menu-group')} gap={COMMAND.rows}>
                <XStack
                  id={head}
                  {...slot('command-menu-heading')}
                  height={COMMAND.header}
                  items="center"
                  gap="$1"
                  pl="$1"
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                >
                  <XStack width={COMMAND.icon} height={COMMAND.icon} items="center" justify="center" shrink={0}>
                    {g.icon}
                  </XStack>
                  <Text fontSize="$2" fontWeight="500" color="$ink" numberOfLines={1}>
                    {g.label}
                  </Text>
                </XStack>
                <YStack role="listbox" aria-labelledby={head} gap={COMMAND.rows}>
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
                        gap="$2"
                        px="$1"
                        minH={COMMAND.row}
                        rounded="$xs"
                        cursor={it.disabled ? 'default' : 'pointer'}
                        opacity={it.disabled ? 0.5 : 1}
                        bg={on ? '$hover' : 'transparent'}
                        hoverStyle={it.disabled ? undefined : { bg: '$hover' }}
                        {...touch(COMMAND.row, 44, 'y')}
                        onHoverIn={it.disabled ? undefined : () => setActive(it.id)}
                        onPress={it.disabled ? undefined : it.onSelect}
                        style={i === 0 ? { scrollMarginTop: COMMAND.margin } : undefined}
                      >
                        <MenuRowContent
                          label={it.label}
                          icon={it.icon}
                          iconContainer={it.icon != null}
                          contextual={it.contextual}
                          shortcut={it.shortcut ? <Shortcut keys={it.shortcut} /> : undefined}
                          submenu={it.submenu}
                          quiet
                        />
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
                <Text fontSize="$2" color="$hush">
                  {empty}
                </Text>
              ) : (
                empty
              )}
            </YStack>
          ) : null}
        </YStack>
      </PaneBody>
    </YStack>
  )
}
