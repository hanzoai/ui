'use client'

/**
 * DialogTemplate — the shape almost every dialog already is.
 *
 * The Dialog primitive gives you a box and the parts to fill it. Nearly every
 * dialog then fills them the same way: a title, an optional line of
 * explanation, a body, and a right-aligned row of buttons with cancel on the
 * left of confirm. Measured on a real surface, 31 call sites had written that
 * arrangement out by hand, which is 31 chances to order the buttons differently.
 *
 * So the arrangement is the component and the content is the props. The parts
 * stay exported for a dialog that genuinely is not this shape — a full-bleed
 * preview, a wizard — and reaching for them is the honest signal that you have
 * left the common case.
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogTemplate
 *       title="Delete agent"
 *       description="This removes every run recorded against it."
 *       confirm={{ label: 'Delete', tone: 'danger', onPress: remove }}
 *     />
 *   </Dialog>
 *
 * Cancel is rendered unless you turn it off, because a dialog you cannot back
 * out of is a trap; it closes the dialog on its own through `DialogClose`, so
 * the caller does not wire dismissal. `busy` disables both buttons rather than
 * only the confirm, so a slow request cannot be cancelled halfway into itself.
 */
import type { ComponentProps, ReactNode } from 'react'
import { Button, XStack, YStack } from '@hanzo/gui'

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../backends/gui/dialog'
import { PrimaryButton } from './PrimaryButton'

/** A dialog's action. `tone: 'danger'` is for the one that destroys something. */
export type DialogAction = {
  label: string
  onPress?: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export type DialogTemplateProps = Omit<ComponentProps<typeof DialogContent>, 'title'> & {
  title: ReactNode
  /** One line under the title. A paragraph belongs in `children`. */
  description?: ReactNode
  /** The body. Omit it for a plain confirm. */
  children?: ReactNode
  /** The affirmative action. Omit it for a dialog that only informs. */
  confirm?: DialogAction
  /** Overrides the cancel label. */
  cancelLabel?: string
  /** Drops cancel — only for a dialog with no way to get it wrong. */
  showCancel?: boolean
  /** Extra controls, left-aligned opposite the confirm pair. */
  leftActions?: ReactNode
  /** A request is in flight: both actions are disabled. */
  busy?: boolean
}

/**
 * The affirmative action. `PrimaryButton` is the console's one high-emphasis
 * button, so it draws the ordinary confirm; a destructive one takes the neutral
 * Button in the red theme instead, per that component's own rule that
 * destructive actions do not wear the primary fill. A delete should not be the
 * brightest thing on screen.
 */
function Confirm({ label, onPress, tone, disabled, busy }: DialogAction & { busy: boolean }) {
  const off = busy || disabled
  return tone === 'danger' ? (
    <Button theme="red" disabled={off} onPress={onPress}>
      {label}
    </Button>
  ) : (
    <PrimaryButton disabled={off} onPress={onPress}>
      {label}
    </PrimaryButton>
  )
}

export function DialogTemplate({
  title,
  description,
  children,
  confirm,
  cancelLabel = 'Cancel',
  showCancel = true,
  leftActions,
  busy = false,
  ...content
}: DialogTemplateProps) {
  const footer = showCancel || confirm || leftActions
  return (
    <DialogContent {...content}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>

      {children ? <YStack gap="$3">{children}</YStack> : null}

      {footer ? (
        <DialogFooter justify={leftActions ? 'space-between' : 'flex-end'}>
          {leftActions ? (
            <XStack gap="$2" items="center">
              {leftActions}
            </XStack>
          ) : null}
          <XStack gap="$2" items="center">
            {showCancel ? (
              <DialogClose asChild>
                <Button disabled={busy}>{cancelLabel}</Button>
              </DialogClose>
            ) : null}
            {confirm ? <Confirm {...confirm} busy={busy} /> : null}
          </XStack>
        </DialogFooter>
      ) : null}
    </DialogContent>
  )
}
