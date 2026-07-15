'use client'

/**
 * PostCard — one social post: channel, lifecycle, body, schedule time, a media
 * count, and injected edit/delete affordances. Pure (data + handlers via props);
 * composes ChannelBadge + the shared StatusTag. Extracted from Hanzo Social.
 */
import { Card, Text, XStack, YStack, Button } from '@hanzo/gui'
import { Pencil, Trash2 } from '@hanzogui/lucide-icons-2'
import { StatusTag } from '../StatusTag'
import { ChannelBadge, type Channel } from './ChannelBadge'

export type Post = {
  id: string
  content: string
  channel: Channel
  status: string
  /** unix seconds; 0/undefined = not scheduled */
  scheduleAt?: number
  media?: string[]
}

const fmt = (unix?: number) =>
  unix
    ? new Date(unix * 1000).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

export function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: Post
  onEdit?: (p: Post) => void
  onDelete?: (p: Post) => void
}) {
  const mediaCount = post.media?.length ?? 0
  return (
    <Card p="$3" gap="$2.5" borderWidth={1} borderColor="$borderColor" width="100%">
      <XStack items="center" justify="space-between" gap="$2">
        <XStack items="center" gap="$2">
          <ChannelBadge channel={post.channel} />
          <StatusTag status={post.status} />
        </XStack>
        <XStack gap="$1">
          {onEdit ? (
            <Button size="$2" chromeless icon={<Pencil size={15} />} onPress={() => onEdit(post)} />
          ) : null}
          {onDelete ? (
            <Button size="$2" chromeless icon={<Trash2 size={15} />} onPress={() => onDelete(post)} />
          ) : null}
        </XStack>
      </XStack>

      <Text fontSize="$3" color="$color12">
        {post.content}
      </Text>

      <XStack items="center" justify="space-between" gap="$2">
        {post.scheduleAt ? (
          <Text fontSize="$1" color="$color11">
            {fmt(post.scheduleAt)}
          </Text>
        ) : (
          <YStack />
        )}
        {mediaCount ? (
          <Text fontSize="$1" color="$color10">
            {mediaCount} media
          </Text>
        ) : null}
      </XStack>
    </Card>
  )
}
