'use client'

/**
 * PostCard — one social post: channel, lifecycle, body, schedule time, a media
 * count, and injected edit/delete affordances. Pure (data + handlers via props);
 * composes ChannelBadge + the shared StatusTag. Extracted from Hanzo Social.
 */
import { Card, Text, XStack, YStack, Button } from '@hanzo/gui'
import { Pencil, Trash2 } from '@hanzogui/lucide-icons-2'
import { StatusTag } from '../StatusTag'
import { ChannelBadge } from './ChannelBadge'
import { formatPostTime } from './format'
// The post shape is the BACKEND's (./api, normalized off /v1/social). This file used
// to declare a second, near-identical `Post` — exactly the drift this package exists
// to stop.
import type { Post } from './api'

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
            <Button size="$2" chromeless icon={<Pencil size={16} />} onPress={() => onEdit(post)} />
          ) : null}
          {onDelete ? (
            <Button size="$2" chromeless icon={<Trash2 size={16} />} onPress={() => onDelete(post)} />
          ) : null}
        </XStack>
      </XStack>

      <Text fontSize="$3" color="$color12">
        {post.content}
      </Text>

      <XStack items="center" justify="space-between" gap="$2">
        {post.scheduleAt ? (
          <Text fontSize="$1" color="$color11">
            {formatPostTime(post.scheduleAt)}
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
