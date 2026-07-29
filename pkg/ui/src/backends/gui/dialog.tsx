'use client'

/**
 * Dialog — modal surface, flattened from @hanzogui/dialog's compound parts.
 *
 * `DialogContent` mounts its OWN portal + overlay (so callers never wrap it) and
 * re-applies the trigger's resolved theme inside the portal via `PortalTheme` —
 * gui portals re-root the subtree, so React theme context does not flow.
 */
import { Dialog as GuiDialog, XStack, YStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { slot } from './slot'
import { touch } from './gesture'

const PAD = 24

const Dialog = (p: ComponentProps<typeof GuiDialog>) => <GuiDialog modal {...p} />
const DialogTrigger: typeof GuiDialog.Trigger = GuiDialog.Trigger
const DialogPortal: typeof GuiDialog.Portal = GuiDialog.Portal
const DialogClose: typeof GuiDialog.Close = GuiDialog.Close

export type DialogOverlayProps = ComponentProps<typeof GuiDialog.Overlay>

const DialogOverlay = (props: DialogOverlayProps) => (
  <GuiDialog.Overlay
    {...slot('dialog-overlay')}
    bg="rgba(0,0,0,0.5)"
    opacity={0.5}
    {...props}
  />
)

export type DialogContentProps = ComponentProps<typeof GuiDialog.Content> & {
  showCloseButton?: boolean
}

const DialogContent = ({ showCloseButton = true, children, ...props }: DialogContentProps) => {
  const themeName = useThemeName()
  return (
    <GuiDialog.Portal>
      <PortalTheme name={themeName}>
        <DialogOverlay />
        <GuiDialog.Content
          {...slot('dialog-content')}
          bg="$background"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$5"
          p={PAD}
          gap="$4"
          width="100%"
          maxW={512}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <GuiDialog.Close asChild>
              <XStack
                {...slot('dialog-close')}
                position="absolute"
                t={16}
                r={16}
                cursor="pointer"
                opacity={0.7}
                hoverStyle={{ opacity: 1 }}
                {...touch(16)}
                aria-label="Close"
              >
                <X size={16} />
              </XStack>
            </GuiDialog.Close>
          ) : null}
        </GuiDialog.Content>
      </PortalTheme>
    </GuiDialog.Portal>
  )
}

export type DialogSectionProps = ComponentProps<typeof YStack> & { children?: ReactNode }

const DialogHeader = (props: DialogSectionProps) => (
  <YStack {...slot('dialog-header')} gap="$2" {...props} />
)

const DialogFooter = (props: ComponentProps<typeof XStack>) => (
  <XStack {...slot('dialog-footer')} gap="$2" justify="flex-end" items="center" {...props} />
)

const DialogTitle = (props: ComponentProps<typeof GuiDialog.Title>) => (
  <GuiDialog.Title {...slot('dialog-title')} size="$5" fontWeight="600" {...props} />
)

const DialogDescription = (props: ComponentProps<typeof GuiDialog.Description>) => (
  <GuiDialog.Description {...slot('dialog-description')} size="$2" color="$color11" {...props} />
)

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
