'use client'

/**
 * ChannelBadge — the ONE way a social network is marked (brand color + glyph +
 * optional label), on @hanzo/gui primitives so it renders on web, native, and
 * desktop. Data-free / host-agnostic. Extracted from Hanzo Social (social.hanzo.ai).
 */
import { Text, XStack, YStack } from '@hanzo/gui'

export type Channel =
  | 'x'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'threads'

const META: Record<Channel, { label: string; bg: string; fg: string; mark: string }> = {
  x: { label: 'X', bg: '#0f0f12', fg: '#e6e6ea', mark: '𝕏' },
  facebook: { label: 'Facebook', bg: '#1877f2', fg: '#ffffff', mark: 'f' },
  instagram: { label: 'Instagram', bg: '#e1306c', fg: '#ffffff', mark: 'IG' },
  linkedin: { label: 'LinkedIn', bg: '#0a66c2', fg: '#ffffff', mark: 'in' },
  tiktok: { label: 'TikTok', bg: '#111114', fg: '#25f4ee', mark: 'TT' },
  youtube: { label: 'YouTube', bg: '#ff0000', fg: '#ffffff', mark: '▶' },
  threads: { label: 'Threads', bg: '#111114', fg: '#e6e6ea', mark: '@' },
}

export function ChannelBadge({
  channel,
  showLabel = false,
  size = 22,
}: {
  channel: Channel
  showLabel?: boolean
  size?: number
}) {
  const m = META[channel] ?? META.x
  return (
    <XStack items="center" gap="$2">
      <YStack
        width={size}
        height={size}
        items="center"
        justify="center"
        rounded="$2"
        bg={m.bg as never}
      >
        <Text fontSize="$1" fontWeight="800" color={m.fg as never}>
          {m.mark}
        </Text>
      </YStack>
      {showLabel ? (
        <Text fontSize="$3" color="$color12">
          {m.label}
        </Text>
      ) : null}
    </XStack>
  )
}
