'use client'

/**
 * `/` and `@` in the draft: the word the caret ends on opens a shelf — the
 * skills for `/`, the plugins for `@` — in a list just above the frame, filtered
 * by what follows the mark. The composer owns which row is lit and the keys that
 * move it, so no surface carries that state.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'

import { useTranslate } from '../i18n/react'
import type { Shelf } from './Plus'

/** The `/` or `@` the caret ends on, and the words typed after it. */
export function trigger(value: string): { char: '/' | '@'; query: string; at: number } | null {
  const m = /(^|\s)([/@])([^\s/@]*)$/.exec(value)
  return m
    ? {
        char: m[2] as '/' | '@',
        query: m[3]!.toLowerCase(),
        at: m.index + m[1]!.length,
      }
    : null
}

/** The list a mark opens, above the frame. */
export function Mention({ shelf, rows, index, onPick, skills }: { shelf: Shelf; rows: Shelf['rows']; index: number; onPick: (id: string) => void; skills: boolean }) {
  const t = useTranslate()
  const tag = t(skills ? 'Skill' : 'Plugin')
  return (
    <YStack role={'listbox' as never} aria-label={t(skills ? 'Skills' : 'Plugins')} data-slot="mention" width="100%" maxH={240} overflowY="auto" overflowX="hidden" p={6} rounded={12} borderWidth={1} borderColor="$borderColor" bg="$background" $max-sm={{ rounded: 22 }}>
      {rows.length ? (
        rows.map((r, i) => (
          <XStack key={r.id} role="option" aria-selected={i === index} onPress={() => onPick(r.id)} items="center" gap={10} px={8} height={36} rounded={8} bg={i === index ? '$hover' : 'transparent'} hoverStyle={{ bg: '$hover' }} cursor="pointer" $max-sm={{ height: 46 }}>
            {r.icon ? (
              <XStack width={16} items="center" justify="center" aria-hidden>
                {r.icon}
              </XStack>
            ) : null}
            {/* An option, not a button: the field moves the cursor, so the row takes no focus and keeps its words at its start. */}
            <SizableText fontSize={15} color="$ink" numberOfLines={1} flex={1} style={{ textAlign: 'start' }}>
              {r.label}
            </SizableText>
            <SizableText fontSize={13} color="$hint">
              {r.on ? t('On') : tag}
            </SizableText>
          </XStack>
        ))
      ) : (
        <SizableText fontSize={14} color="$hint" px={8} py={8}>
          {t(shelf.loading ? 'Reading…' : 'Nothing matches')}
        </SizableText>
      )}
    </YStack>
  )
}
