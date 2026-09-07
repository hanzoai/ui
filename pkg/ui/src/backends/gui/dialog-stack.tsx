'use client'

/**
 * DialogStack — a pile of panels offset diagonally, front one on top.
 *
 * Each dialog is an absolutely positioned card inside a relatively positioned
 * frame; index alone decides both its offset (`translate(index*10, index*10)`)
 * and its stacking (`zIndex: index`), so the last item in `dialogs` reads as the
 * top of the pile. A panel closes through its own corner button, which reports
 * the closed id back through `onClose` — nothing here removes an item from the
 * list, the caller owns that.
 */
import { XStack, YStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from './button'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

const OFFSET = 10
const CLOSE = 24

export type DialogStackItem = {
  id: string
  title: ReactNode
  content: ReactNode
}

export type DialogStackProps = ComponentProps<typeof YStack> & {
  dialogs: DialogStackItem[]
  onClose?: (id: string) => void
}

export function DialogStack({ dialogs, onClose, children, ...props }: DialogStackProps) {
  return (
    <YStack {...slot('dialog-stack')} position="relative" {...props}>
      {dialogs.map((dialog, index) => (
        <YStack
          key={dialog.id}
          {...slot('dialog-stack-item')}
          data-index={index}
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          rounded="$5"
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          p="$6"
          gap="$4"
          transform={[{ translateX: index * OFFSET }, { translateY: index * OFFSET }]}
          style={{ zIndex: index }}
        >
          <XStack items="center" justify="space-between">
            {ink(dialog.title, undefined, { fontSize: '$5', fontWeight: '600' })}
            <Button
              {...slot('dialog-stack-close')}
              variant="ghost"
              size="icon"
              minH={CLOSE}
              minW={CLOSE}
              {...touch(CLOSE)}
              aria-label="Close"
              onPress={() => onClose?.(dialog.id)}
            >
              <X size={16} />
            </Button>
          </XStack>
          <YStack>{ink(dialog.content)}</YStack>
        </YStack>
      ))}
      {children}
    </YStack>
  )
}
