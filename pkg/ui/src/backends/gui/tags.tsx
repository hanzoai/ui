'use client'

/**
 * Tags — a wrapping row of removable labels, built on `Badge`, or on `Tag` for
 * an entry that carries a data hue (the record kit's select-option tags, MIT, see
 * NOTICE) — so a list of coloured options and a list of plain labels are one
 * component, and an entry without a colour renders exactly as before.
 *
 * Each entry is a plain `{ id, label }`; passing `onRemove` grows the badge a
 * close button that reports which entry was pressed. The list carries no
 * state of its own — whether an entry actually leaves is the caller's call,
 * same contract as `Banner`'s `onClose`.
 */
import { XStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Badge, type BadgeVariant } from './badge'
import { Tag as Coloured, type Tag } from './tag'
import { slot } from './slot'
import { touch } from './gesture'

export type { Tag }

export type TagsProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  tags: Tag[]
  onRemove?: (id: string) => void
  variant?: BadgeVariant | null
}

const REMOVE = 16

export function Tags({ tags, onRemove, variant = 'default', ...props }: TagsProps) {
  const { t } = useI18n()
  return (
    <XStack {...slot('tags')} flexWrap="wrap" gap="$2" {...props}>
      {tags.map((tag) => {
        const remove = onRemove ? (
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
              aria-label={t('Remove {name}', { name: tag.label })}
              onPress={() => onRemove(tag.id)}
            >
              <X size={12} />
            </XStack>
          ) : null
        return tag.color ? (
          <Coloured key={tag.id} color={tag.color} endElement={remove}>
            {tag.label}
          </Coloured>
        ) : (
          <Badge key={tag.id} variant={variant}>
            {tag.label}
            {remove}
          </Badge>
        )
      })}
    </XStack>
  )
}
