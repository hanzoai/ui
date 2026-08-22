'use client'

/**
 * ViewToggle — the list / calendar segmented control over a post collection.
 * Pure: the current view and the change handler are injected. Extracted from
 * Hanzo Social (social.hanzo.ai).
 */
import { Text, XStack } from '@hanzo/gui'
import { Calendar, List } from '@hanzogui/lucide-icons-2'
import type { IconLike } from '../color'

export type PostView = 'list' | 'calendar'

const OPTIONS: { id: PostView; label: string; icon: IconLike }[] = [
  { id: 'list', label: 'List', icon: List },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
]

export function ViewToggle({
  view,
  onChange,
}: {
  view: PostView
  onChange: (v: PostView) => void
}) {
  return (
    <XStack borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
      {OPTIONS.map((o) => {
        const Icon = o.icon
        const active = view === o.id
        return (
          <XStack
            key={o.id}
            items="center"
            gap="$2"
            px="$3"
            py="$2"
            cursor="pointer"
            bg={active ? '$edge' : 'transparent'}
            hoverStyle={{ bg: active ? '$edge' : '$panel' }}
            onPress={() => onChange(o.id)}
          >
            <Icon size={14} />
            <Text fontSize="$2" fontWeight={active ? '500' : '400'}>
              {o.label}
            </Text>
          </XStack>
        )
      })}
    </XStack>
  )
}
