'use client'

/**
 * PostAgenda — the calendar view: every post carrying a time, ordered and grouped
 * by local day. Pure: posts and the open handler are injected. Extracted from
 * Hanzo Social (social.hanzo.ai).
 */
import { useMemo } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Calendar } from '@hanzogui/lucide-icons-2'
import { EmptyState } from '../EmptyState'
import { StatusTag } from '../StatusTag'
import { formatPostTime, postDayBucket, postPreview } from './format'
import type { Post } from './api'

export function PostAgenda({ posts, onOpen }: { posts: Post[]; onOpen: (p: Post) => void }) {
  const days = useMemo(() => {
    const timed = posts
      .filter((p) => (p.scheduleAt ?? 0) > 0)
      .sort((a, b) => (a.scheduleAt ?? 0) - (b.scheduleAt ?? 0))
    const groups: { label: string; items: Post[] }[] = []
    const index = new Map<string, number>()
    for (const p of timed) {
      const { key, label } = postDayBucket(p.scheduleAt ?? 0)
      let i = index.get(key)
      if (i === undefined) {
        i = groups.length
        index.set(key, i)
        groups.push({ label, items: [] })
      }
      groups[i].items.push(p)
    }
    return groups
  }, [posts])

  if (days.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nothing on the calendar"
        description="Scheduled and timed posts appear here, grouped by day. Compose a post and pick Schedule to plan ahead."
      />
    )
  }

  return (
    <YStack gap="$4">
      {days.map((d) => (
        <YStack key={d.label} gap="$2">
          <Text fontSize="$3" fontWeight="500" color="$color11">
            {d.label}
          </Text>
          {d.items.map((p) => (
            <XStack
              key={p.id}
              items="center"
              justify="space-between"
              gap="$3"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              px="$4"
              py="$3"
              cursor="pointer"
              hoverStyle={{ bg: '$color2' }}
              onPress={() => onOpen(p)}
            >
              <YStack gap="$1" flex={1}>
                <Text fontSize="$3">{postPreview(p.content)}</Text>
                <XStack gap="$2" items="center">
                  <Text fontSize="$1" color="$color10">
                    {p.channel}
                  </Text>
                  <Text fontSize="$1" color="$color10">
                    · {formatPostTime(p.scheduleAt ?? 0)}
                  </Text>
                </XStack>
              </YStack>
              <StatusTag status={p.status} />
            </XStack>
          ))}
        </YStack>
      ))}
    </YStack>
  )
}
