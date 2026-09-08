'use client'

/**
 * Tags — a wrapping row of removable labels, built on `Badge`.
 *
 * Each entry is a plain `{ id, label }`; passing `onRemove` grows the badge a
 * close button that reports which entry was pressed. The list carries no
 * state of its own — whether an entry actually leaves is the caller's call,
 * same contract as `Banner`'s `onClose`.
 */
import { XStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'
import { Badge, type BadgeVariant } from './badge'
import { slot } from './slot'
import { touch } from './gesture'

export type Tag = {
  id: string
  label: string
}

export type TagsProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  tags: Tag[]
  onRemove?: (id: string) => void
  variant?: BadgeVariant | null
}

const REMOVE = 16

export function Tags({ tags, onRemove, variant = 'default', ...props }: TagsProps) {
  return (
    <XStack {...slot('tags')} flexWrap="wrap" gap="$2" {...props}>
      {tags.map((tag) => (
        <Badge key={tag.id} variant={variant}>
          {tag.label}
          {onRemove ? (
            <XStack
              {...slot('tags-remove')}
              render="button"
              {...({ type: 'button' } as object)}
              rounded="$10"
              items="center"
              justify="center"
              cursor="pointer"
              opacity={0.7}
              hoverStyle={{ opacity: 1, bg: '$hover' }}
              {...touch(REMOVE)}
              aria-label={`Remove ${tag.label}`}
              onPress={() => onRemove(tag.id)}
            >
              <X size={12} />
            </XStack>
          ) : null}
        </Badge>
      ))}
    </XStack>
  )
}
