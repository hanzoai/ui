'use client'

/**
 * Attachments — what the next turn is about, shown before it is sent.
 *
 * Ported from build-v2 `components/editor/ask-ai/{selected-files,
 * selected-html-element}.tsx` (MIT, derived from OSW Studio and DeepSite — see
 * NOTICE). v2 drew a file mention and a picked element as two different chips
 * in two files; they are one fact — "this turn is about THAT" — so they are
 * one row of chips, each a kind, a label and a way to take it back.
 *
 * Every label is TEXT: a picked element's tag and selector come from a page
 * somebody else wrote, and a file's path from their repository.
 */
import { SizableText, XStack } from '@hanzo/gui'
import { FileText, MousePointerClick, Paperclip, X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'

import { slot } from '../backends/gui/slot'

type Row = Omit<ComponentProps<typeof XStack>, 'children'>

/** One thing the next turn is about. */
export interface Attachment {
  id: string
  /** A repo file, a picked element, an uploaded file. */
  kind: 'file' | 'element' | 'upload'
  /** What the chip says: a path, `<button> .cta`, a file name. */
  label: string
}

const ICON = { file: FileText, element: MousePointerClick, upload: Paperclip } as const

export interface AttachmentsProps extends Row {
  items: readonly Attachment[]
  /** Omit and the chips cannot be removed. */
  onRemove?: (id: string) => void
}

export function Attachments({ items, onRemove, ...rest }: AttachmentsProps) {
  if (items.length === 0) return null
  return (
    <XStack
      {...slot('attachments')}
      render="ul"
      aria-label="Attached to the next message"
      flexWrap="wrap"
      gap="$1.5"
      m={0}
      p={0}
      style={{ listStyle: 'none' }}
      {...rest}
    >
      {items.map((item) => {
        const Icon = ICON[item.kind]
        return (
          <XStack
            key={item.id}
            render="li"
            items="center"
            gap="$1.5"
            minH={24}
            pl="$2"
            pr={onRemove ? '$1' : '$2'}
            rounded="$3"
            borderWidth={1}
            borderColor="$borderColor"
            bg="$panel"
            maxW="100%"
          >
            <Icon size={12} opacity={0.7} />
            <SizableText size="$1" color="$quiet" numberOfLines={1} maxW={220}>
              {item.label}
            </SizableText>
            {onRemove ? (
              <XStack
                render="button"
                {...({ type: 'button', title: `Remove ${item.label}` } as object)}
                aria-label={`Remove ${item.label}`}
                onPress={() => onRemove(item.id)}
                width={20}
                height={20}
                rounded="$2"
                items="center"
                justify="center"
                bg="transparent"
                borderWidth={0}
                cursor="pointer"
                hoverStyle={{ bg: '$raised' }}
                focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$rim' }}
              >
                <X size={11} />
              </XStack>
            ) : null}
          </XStack>
        )
      })}
    </XStack>
  )
}
