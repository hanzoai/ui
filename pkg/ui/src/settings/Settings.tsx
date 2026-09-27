'use client'

/**
 * Settings — a settings page: every section listed by group, and the chosen one
 * in a readable column.
 *
 *   Settings          │  General
 *   Settings          │  ─────────────────────────
 *    General  ◀       │  (the section, as `children`, 760px at most)
 *    Account          │
 *   Code              │
 *    Environments     │
 *
 * From `md` up the sections are a 220px column on the left, grouped under quiet
 * labels, the current one marked `aria-current="page"`. Below `md` that column
 * is gone and the same sections are a row of chips over the content — every
 * section one press away on a phone, with no drawer to open first.
 *
 * Presentational: which section is open comes in as `active`, a choice goes out
 * through `onPick`, and the section itself is the host's `children` — the page
 * never learns what a section holds. A section is its own address in the host,
 * so it can be linked to and survives a reload.
 *
 * The section's own parts — heading, groups, bordered lists, fields, the quiet
 * lines — are in `./Section`, so every section reads as one page.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { useId, type ComponentProps, type ReactNode } from 'react'

import { press, RING } from '../backends/gui/press'
import { slot } from '../backends/gui/slot'

type Row = Omit<ComponentProps<typeof XStack>, 'children'>

/** The nav column's width, px. */
const NAV = 220

/** The content column's measure, px — a form reads badly any wider. */
const MEASURE = 760

/** One section of the page, as the nav lists it. */
export interface Entry {
  id: string
  label: string
  /** The group it is listed under. */
  group: string
}

export interface SettingsProps<E extends Entry = Entry> extends Row {
  /** Every section, in the order the page lists them. */
  entries: readonly E[]
  /** The groups, in order. Omitted, they are the entries' own, in first-seen order. */
  groups?: readonly string[]
  /** The open section's id. */
  active: E['id']
  onPick: (id: E['id']) => void
  /** The page's name — the nav's heading and its landmark name. */
  title?: string
  /** The open section. */
  children?: ReactNode
}

export function Settings<E extends Entry>({
  entries,
  groups,
  active,
  onPick,
  title = 'Settings',
  children,
  ...rest
}: SettingsProps<E>) {
  const id = useId()
  const order = groups ?? [...new Set(entries.map((e) => e.group))]

  return (
    <XStack {...slot('settings')} flex={1} minH={0} minW={0} {...rest}>
      <YStack
        {...slot('settings-nav')}
        role="navigation"
        aria-label={title}
        width={NAV}
        shrink={0}
        borderRightWidth={1}
        borderColor="$borderColor"
        px="$2"
        py="$4"
        gap="$4"
        overflow="scroll"
        $max-md={{ display: 'none' }}
      >
        <SizableText size="$4" color="$ink" px="$2">
          {title}
        </SizableText>
        {order.map((g, i) => {
          const list = entries.filter((e) => e.group === g)
          if (!list.length) return null
          const head = `${id}-group-${i}`
          return (
            <YStack key={g} gap="$0.5">
              <SizableText id={head} size="$1" color="$soft" px="$2" pb="$1">
                {g}
              </SizableText>
              <YStack role="list" aria-labelledby={head} gap="$0.5">
                {list.map((e) => {
                  const on = e.id === active
                  return (
                    <YStack key={e.id} role="listitem">
                      <XStack
                        {...slot('settings-entry')}
                        {...press(() => onPick(e.id))}
                        aria-current={on ? 'page' : undefined}
                        px="$2"
                        py="$1.5"
                        rounded="$2"
                        cursor="pointer"
                        bg={on ? '$hover' : 'transparent'}
                        hoverStyle={{ bg: '$hover' }}
                        focusVisibleStyle={RING}
                      >
                        <SizableText size="$2" color={on ? '$ink' : '$soft'} numberOfLines={1}>
                          {e.label}
                        </SizableText>
                      </XStack>
                    </YStack>
                  )
                })}
              </YStack>
            </YStack>
          )
        })}
      </YStack>

      <YStack flex={1} minW={0} minH={0} overflow="scroll">
        <XStack
          {...slot('settings-chips')}
          role="navigation"
          aria-label={title}
          flexWrap="wrap"
          gap="$1.5"
          px="$4"
          pt="$3"
          $md={{ display: 'none' }}
        >
          {entries.map((e) => {
            const on = e.id === active
            return (
              <XStack
                key={e.id}
                {...slot('settings-chip')}
                {...press(() => onPick(e.id))}
                aria-current={on ? 'page' : undefined}
                px="$2.5"
                py="$1"
                rounded="$10"
                cursor="pointer"
                borderWidth={1}
                borderColor={on ? '$ink' : '$borderColor'}
                hoverStyle={{ bg: '$hover' }}
                focusVisibleStyle={RING}
              >
                <SizableText size="$1" color={on ? '$ink' : '$soft'}>
                  {e.label}
                </SizableText>
              </XStack>
            )
          })}
        </XStack>
        <YStack {...slot('settings-body')} width="100%" maxW={MEASURE} self="center" px="$5" py="$6">
          {children}
        </YStack>
      </YStack>
    </XStack>
  )
}
