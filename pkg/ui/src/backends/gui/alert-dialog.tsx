
/**
 * AlertDialog — the modal that INTERRUPTS. It is not a Dialog with different
 * words in it: `role="alertdialog"`, focus opens on Cancel rather than on the
 * panel, and a click outside is refused — the only ways out are Escape and the
 * dialog's own two buttons. All of that is @hanzogui/alert-dialog's; this file
 * flattens its compound parts into the shadcn names and dresses them in the
 * Hanzo tokens, exactly as `dialog.tsx` does for the ordinary modal.
 *
 * `AlertDialogContent` mounts its OWN portal + overlay (so callers never wrap
 * it) and re-applies the trigger's resolved theme inside the portal via
 * `PortalTheme` — gui portals re-root the subtree, so React theme context does
 * not flow.
 *
 * RENAME, unavoidable, and only on the two buttons: shadcn dresses Action and
 * Cancel by pasting a `buttonVariants({ variant })` string into the class name.
 * Here they ARE the `Button`, with gui's close part as its host, so the variant
 * is a PROP:
 *
 *     <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
 *
 * A leftover `buttonVariants(...)` string handed to the class name still
 * type-checks and still lands on the element — it just no longer paints. gui
 * injects its stylesheet at runtime, after the bundled CSS, so a utility class
 * colliding with a gui style prop loses the tie silently. There is one button
 * component in this package and this is it; a second variant table living in a
 * class string is how the two drift.
 *
 * Defaults follow @hanzo/ui's Button, not shadcn's: `primary` is the loud
 * variant here (`default` is deliberately the quiet one), so the confirming
 * button is `primary` and Cancel is `outline`.
 */
import { AlertDialog as GuiAlertDialog, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { PortalTheme, useThemeName } from '../../product/menu/portal-theme'
import { Button, type ButtonProps } from './button'
import { slot } from './slot'

/** The same panel padding the ordinary modal uses — one modal geometry. */
const PAD = 24

export type AlertDialogProps = ComponentProps<typeof GuiAlertDialog>

const AlertDialog = (p: AlertDialogProps) => <GuiAlertDialog {...p} />
const AlertDialogTrigger: typeof GuiAlertDialog.Trigger = GuiAlertDialog.Trigger
const AlertDialogPortal: typeof GuiAlertDialog.Portal = GuiAlertDialog.Portal

export type AlertDialogOverlayProps = ComponentProps<typeof GuiAlertDialog.Overlay>

const AlertDialogOverlay = (props: AlertDialogOverlayProps) => (
  <GuiAlertDialog.Overlay
    {...slot('alert-dialog-overlay')}
    bg="rgba(0,0,0,0.5)"
    opacity={0.5}
    {...props}
  />
)

export type AlertDialogContentProps = ComponentProps<typeof GuiAlertDialog.Content>

const AlertDialogContent = ({ children, ...props }: AlertDialogContentProps) => {
  const themeName = useThemeName()
  return (
    <GuiAlertDialog.Portal>
      <PortalTheme name={themeName}>
        <AlertDialogOverlay />
        <GuiAlertDialog.Content
          {...slot('alert-dialog-content')}
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
        </GuiAlertDialog.Content>
      </PortalTheme>
    </GuiAlertDialog.Portal>
  )
}

export type AlertDialogSectionProps = ComponentProps<typeof YStack> & { children?: ReactNode }

const AlertDialogHeader = (props: AlertDialogSectionProps) => (
  <YStack {...slot('alert-dialog-header')} gap="$2" {...props} />
)

const AlertDialogFooter = (props: ComponentProps<typeof XStack>) => (
  <XStack {...slot('alert-dialog-footer')} gap="$2" justify="flex-end" items="center" {...props} />
)

const AlertDialogTitle = (props: ComponentProps<typeof GuiAlertDialog.Title>) => (
  <GuiAlertDialog.Title {...slot('alert-dialog-title')} size="$5" fontWeight="600" {...props} />
)

const AlertDialogDescription = (props: ComponentProps<typeof GuiAlertDialog.Description>) => (
  <GuiAlertDialog.Description
    {...slot('alert-dialog-description')}
    size="$2"
    color="$quiet"
    {...props}
  />
)

/**
 * Both buttons are the one `Button` with gui's close part as its HOST — the
 * `Button asChild` direction, the same one `Button`-as-link already takes, and
 * the direction matters:
 *
 *  - `<Action asChild><Button/></Action>` (the obvious way round) also merges
 *    into one element, but the element it keeps is Button's frame, which is a
 *    `<div role="button" tabindex="0">`. Measured: a click still works and
 *    ENTER DOES NOTHING. A decision you can only confirm with a mouse is not a
 *    decision every user can make.
 *  - This way round, `Button`'s `render` hands the tag to gui's `DialogClose`,
 *    which is a real `<button>` — so Enter and Space activate it, the close
 *    handler composes onto the caller's `onPress`, and Cancel's ref (the one
 *    the content focuses when it opens) still reaches the DOM node.
 *
 * `aria-label` is cleared on purpose. gui's `DialogClose` hardcodes
 * `aria-label="Dialog Close"`, which OVERRIDES the button's own text — every
 * choice in the dialog would be announced "Dialog Close, button", including
 * the destructive one. These buttons are named by what they say.
 *
 * `type="button"` because gui's close part renders a bare `<button>`, and a
 * bare button inside a form is a SUBMIT button: confirming a destructive action
 * would also post the form behind the modal.
 */
const AlertDialogAction = ({ children, ...props }: ButtonProps) => (
  <Button {...slot('alert-dialog-action')} variant="primary" type="button" {...props} asChild>
    <GuiAlertDialog.Action aria-label={undefined}>{children}</GuiAlertDialog.Action>
  </Button>
)

const AlertDialogCancel = ({ children, ...props }: ButtonProps) => (
  <Button {...slot('alert-dialog-cancel')} variant="outline" type="button" {...props} asChild>
    <GuiAlertDialog.Cancel aria-label={undefined}>{children}</GuiAlertDialog.Cancel>
  </Button>
)

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
