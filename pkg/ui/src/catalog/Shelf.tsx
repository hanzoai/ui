'use client'

/**
 * Shelf — a catalogue page: what an org has, and what it can add, one kind at a
 * time.
 *
 *   Customize
 *   What the agent brings to a run …
 *   ▢ Skills   ⌁ Connectors   ⧉ Plugins   ☺ Agents          the kinds, a tablist
 *   ─────────
 *   [ Yours | Discover ]                       [ + New skill ]
 *   [ Search skills…                                         ]
 *   (the cards — `Tiles` of `Tile`s, a `Featured` first)
 *
 * The kinds are a tab strip underlined at the chosen one: one tab stop, arrows
 * move the choice, Home/End jump. Yours/Discover is the package's one segmented
 * control (`Views`, from `@hanzo/ui/agents`), so it is not drawn twice. The
 * search and the Add are the shelf's; what they find and add is the host's.
 *
 * Presentational: the kind, the half and the query come in, every change goes
 * out, and the cards are `children`. On a phone the column takes the width, the
 * tabs drop their icons, and the grid stacks to one card a row.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Plus } from '@hanzogui/lucide-icons-2'
import { useRef, type ComponentProps, type ReactNode } from 'react'

import { Views, type View } from '../agents/Workspace'
import { Button } from '../backends/gui/button'
import { Input } from '../backends/gui/input'
import { RING } from '../backends/gui/press'
import { slot } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** The page's measure, px. Three 280px cards and their gaps, with room. */
const MEASURE = 1080

/** What a shelf shows by default: the org's own, and what it can add. */
const HALVES: readonly View[] = [
  { id: 'yours', label: 'Yours' },
  { id: 'discover', label: 'Discover' },
]

export interface ShelfProps extends Col {
  /** The page's title. */
  title: string
  /** One or two lines on what the page is for. */
  detail?: string
  /** The kinds, as tabs. An icon is a component, drawn at 15px. */
  tabs: readonly View[]
  /** The open kind's id. */
  tab: string
  onTab: (id: string) => void
  /** The halves of a kind. Yours and Discover unless given. */
  views?: readonly View[]
  /** The open half's id. */
  view: string
  onView: (id: string) => void
  /** The search's name and placeholder — "Search skills". */
  search: string
  query: string
  onQuery: (q: string) => void
  /** The Add action's words — "New skill". None, and there is no Add. */
  add?: string
  onAdd?: () => void
  /** The title's outline level. */
  level?: 1 | 2
  /** The cards. */
  children?: ReactNode
}

export function Shelf({
  title,
  detail,
  tabs,
  tab,
  onTab,
  views = HALVES,
  view,
  onView,
  search,
  query,
  onQuery,
  add,
  onAdd,
  level = 1,
  children,
  ...rest
}: ShelfProps) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const move = (e: { key?: string; preventDefault?: () => void }, index: number) => {
    const last = tabs.length - 1
    const to =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (to < 0) {
      // A tab is a button: Enter and Space choose it, which gui does not do for
      // a stack on its own.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault?.()
        onTab(tabs[index]!.id)
      }
      return
    }
    e.preventDefault?.()
    onTab(tabs[to]!.id)
    refs.current[to]?.focus()
  }

  return (
    <YStack
      {...slot('shelf')}
      flex={1}
      minH={0}
      overflow="scroll"
      px="$6"
      py="$6"
      $max-md={{ px: '$4', py: '$4' }}
      {...rest}
    >
      <YStack width="100%" maxW={MEASURE} mx="auto" gap="$4">
        <YStack gap="$1">
          <SizableText role="heading" aria-level={level} size="$6" color="$ink">
            {title}
          </SizableText>
          {detail ? (
            <SizableText size="$2" color="$soft">
              {detail}
            </SizableText>
          ) : null}
        </YStack>

        <XStack
          {...slot('shelf-tabs')}
          role="tablist"
          aria-label={title}
          gap="$4"
          borderBottomWidth={1}
          borderColor="$borderColor"
          $max-md={{ gap: '$3' }}
        >
          {tabs.map((t, index) => {
            const on = t.id === tab
            const Icon = t.icon
            return (
              <XStack
                key={t.id}
                ref={(el: unknown) => {
                  refs.current[index] = el as HTMLElement | null
                }}
                {...slot('shelf-tab')}
                role="tab"
                tabIndex={on ? 0 : -1}
                aria-selected={on}
                onPress={() => onTab(t.id)}
                onKeyDown={(e: { key?: string; preventDefault?: () => void }) => move(e, index)}
                items="center"
                gap="$1.5"
                pb="$2"
                mb={-1}
                cursor="pointer"
                borderBottomWidth={2}
                borderColor={on ? '$ink' : 'transparent'}
                hoverStyle={{ borderColor: on ? '$ink' : '$edge' }}
                focusVisibleStyle={RING}
              >
                {Icon ? (
                  <XStack opacity={on ? 1 : 0.6} aria-hidden $max-md={{ display: 'none' }}>
                    <Icon size={15} />
                  </XStack>
                ) : null}
                <SizableText size="$3" color={on ? '$ink' : '$soft'}>
                  {t.label}
                </SizableText>
              </XStack>
            )
          })}
        </XStack>

        <XStack items="center" gap="$2">
          <Views views={views} value={view} onChange={onView} label="Show" labels="all" />
          <XStack flex={1} />
          {add && onAdd ? (
            <Button size="sm" onPress={onAdd}>
              <Plus size={14} /> {add}
            </Button>
          ) : null}
        </XStack>
        <Input value={query} onChangeText={onQuery} placeholder={`${search}…`} aria-label={search} />

        {children}
      </YStack>
    </YStack>
  )
}
