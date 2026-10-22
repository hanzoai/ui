'use client'

/**
 * Dialog — modal surface, flattened from @hanzogui/dialog's compound parts.
 *
 * `DialogContent` mounts its OWN portal + overlay (so callers never wrap it) and
 * re-applies the trigger's resolved theme inside the portal via `PortalTheme` —
 * gui portals re-root the subtree, so React theme context does not flow.
 *
 * `size` is the record dialog (the record kit's Dialog, MIT, NOTICE): sm 300, compact
 * 360, md 400, lg the larger of 400 and 53% of the viewport, xl 1200 (at most
 * 800 tall), fullscreen. A sized dialog is a frame of three sections — Header
 * (24 all round, title and description centred), Body (24 at the sides and
 * foot) and Footer (actions to the end, 8 apart, pinned to the bottom) — on an
 * 8px corner with the floating shadow instead of an edge, over a 72% scrim. With
 * no `size` the dialog is the 512-wide panel every surface has. AlertDialog wears
 * the same frame (`frame`, `scrim`, `Sized`).
 */
import { Dialog as GuiDialog, XStack, YStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { slot } from './slot'
import { touch } from './gesture'

const PAD = 24

export type DialogSize = 'sm' | 'compact' | 'md' | 'lg' | 'xl' | 'fullscreen'

const WIDTH: Record<DialogSize, number | string> = {
  sm: 300,
  compact: 360,
  md: 400,
  lg: 'max(400px, 53vw)',
  xl: 1200,
  fullscreen: '100vw',
}

/** The sized frame both dialogs wear: the width, the corner, the floating shadow, no edge, no inset of its own. */
export const frame = (size: DialogSize) =>
  ({
    width: WIDTH[size] as never,
    maxW: size === 'fullscreen' ? '100vw' : 'calc(100vw - 32px)',
    maxH: size === 'fullscreen' ? '100vh' : size === 'xl' ? 'min(800px, calc(100vh - 32px))' : 'calc(100vh - 32px)',
    ...(size === 'fullscreen' ? { height: '100vh' as never } : null),
    rounded: size === 'fullscreen' ? 0 : '$3',
    borderWidth: 0,
    p: 0,
    gap: 0,
    style: size === 'fullscreen' ? undefined : { boxShadow: 'var(--shadow-floating, 0 24px 60px -16px rgb(0 0 0 / .75))' },
  }) as const

/** The scrim under a sized dialog: black at 72%, opaque layer. */
export const scrim = { bg: 'rgba(0,0,0,0.72)', opacity: 1 } as const

/** The size a dialog's sections are drawn for; `null` for the unsized panel. */
export const Sized = /* @__PURE__ */ createContext<DialogSize | null>(null)

const Dialog = (p: ComponentProps<typeof GuiDialog>) => <GuiDialog modal {...p} />
const DialogTrigger: typeof GuiDialog.Trigger = GuiDialog.Trigger
const DialogPortal: typeof GuiDialog.Portal = GuiDialog.Portal
const DialogClose: typeof GuiDialog.Close = GuiDialog.Close

/* gui's own props for the overlay, plus the two things it demonstrably takes and
 * does not report. `overlay` exists so a caller can say which surface dims which,
 * and stacking is the whole of that question — but `ComponentProps` of the
 * compound member lists `opacity` and `bg` while omitting `zIndex`, so the one
 * prop the feature was built for did not type. A `data-*` marker is the same
 * story: it reaches the element (that is how `data-slot` gets there) and is
 * absent from the type. Both are measured in dialog.test.tsx, which reads the
 * COMPUTED z-index off a mounted overlay. */
export type DialogOverlayProps = ComponentProps<typeof GuiDialog.Overlay> & {
  zIndex?: number
} & { [attr: `data-${string}`]: string | undefined }

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
  /**
   * The overlay's own props. Content owns the overlay — that is what lets a
   * caller mount Content alone — but owning it is not the same as hiding it,
   * and with no way through, the dim, the stacking and the click target were
   * unreachable from outside. A consumer stacking dialogs (a preview opened
   * from a dialog) has no way to say which one dims which.
   *
   * Absent, nothing changes: the default overlay renders exactly as before.
   */
  overlay?: DialogOverlayProps
  /** The record dialog's sizes; absent, the 512-wide panel. */
  size?: DialogSize
}

const DialogContent = ({
  showCloseButton = true,
  overlay,
  size,
  children,
  ...props
}: DialogContentProps) => {
  const themeName = useThemeName()
  return (
    <GuiDialog.Portal>
      <PortalTheme name={themeName}>
        <DialogOverlay {...(size ? scrim : null)} {...overlay} />
        <GuiDialog.Content
          {...slot('dialog-content')}
          {...(size ? { 'data-size': size } : null)}
          bg="$background"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$5"
          p={PAD}
          gap="$4"
          width="100%"
          maxW={512}
          {...(size ? frame(size) : null)}
          {...props}
        >
          <Sized.Provider value={size ?? null}>{children}</Sized.Provider>
          {showCloseButton ? (
            <GuiDialog.Close asChild>
              <XStack
                {...slot('dialog-close')}
                // Before `position`: on web `touch` writes `position: relative`
                // to host its hit-area overlay, and placed after the pin it drew
                // the ✕ in flow at the content's bottom-left. An absolute box
                // hosts that overlay just as well.
                {...touch(16)}
                position="absolute"
                t={16}
                insetInlineEnd={16}
                cursor="pointer"
                opacity={0.7}
                hoverStyle={{ opacity: 1 }}
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

/** The three sections of a sized frame, as the source kit pads them. */
export const section = {
  header: { p: PAD, gap: '$2', items: 'center' },
  body: { px: PAD, pb: PAD },
  footer: { px: PAD, pb: PAD, mt: 'auto', flexWrap: 'wrap', gap: '$2' },
  title: { size: '$4', fontWeight: '600', textAlign: 'center' },
  description: { size: '$2', lineHeight: 20, textAlign: 'center', color: '$aside' },
} as const

const DialogHeader = (props: DialogSectionProps) => {
  const sized = useContext(Sized)
  return <YStack {...slot('dialog-header')} gap="$2" {...(sized ? section.header : null)} {...props} />
}

/** A sized dialog's middle: what the dialog is for, inset at the sides and foot. */
const DialogBody = (props: DialogSectionProps) => (
  <YStack {...slot('dialog-body')} {...section.body} {...props} />
)

const DialogFooter = (props: ComponentProps<typeof XStack>) => {
  const sized = useContext(Sized)
  return <XStack {...slot('dialog-footer')} gap="$2" justify="flex-end" items="center" {...(sized ? section.footer : null)} {...props} />
}

const DialogTitle = (props: ComponentProps<typeof GuiDialog.Title>) => {
  const sized = useContext(Sized)
  return <GuiDialog.Title {...slot('dialog-title')} size="$5" fontWeight="600" {...(sized ? section.title : null)} {...props} />
}

const DialogDescription = (props: ComponentProps<typeof GuiDialog.Description>) => {
  const sized = useContext(Sized)
  return <GuiDialog.Description {...slot('dialog-description')} size="$2" color="$quiet" {...(sized ? section.description : null)} {...props} />
}

export {
  Dialog,
  DialogBody,
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
