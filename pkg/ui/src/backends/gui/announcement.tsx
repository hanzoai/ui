'use client'

/**
 * Announcement — an inline strip for a short message, with an optional dismiss
 * button. Unlike Banner (an edge-anchored, role="alert" strip with a variant
 * ladder), an Announcement is a bordered box that sits wherever it is placed,
 * holds its own dismissed/visible state, and calls `onDismiss` once when the
 * close button is pressed.
 *
 * Surface and message share no variant — there is only one look — so this is a
 * styled frame and a styled text host. The message renders straight into that
 * host, the way Banner's does: a Text host already gives a string somewhere to
 * live on native, and a second one per string would carry its own type scale
 * over the host's.
 */
import { useState, type ComponentProps, type ReactNode } from 'react'
import { SizableText, XStack, styled } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import { slot } from './slot'
import { touch } from './gesture'
import { Button } from './button'

const CLOSE = 24

const AnnouncementFrame = styled(XStack, {
  name: 'Announcement',
  position: 'relative',
  items: 'center',
  gap: '$4',
  rounded: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$background',
  px: '$4',
  py: '$3',
})

const AnnouncementText = styled(SizableText, {
  name: 'AnnouncementText',
  render: 'div',
  flex: 1,
  size: '$2',
  color: '$ink',
})

export type AnnouncementProps = Omit<ComponentProps<typeof AnnouncementFrame>, 'children'> & {
  children: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

export function Announcement({
  children,
  dismissible = true,
  onDismiss,
  ...props
}: AnnouncementProps) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <AnnouncementFrame {...slot('announcement')} {...props}>
      <AnnouncementText {...slot('announcement-message')}>{children}</AnnouncementText>
      {dismissible ? (
        <Button
          {...slot('announcement-dismiss')}
          variant="ghost"
          size="icon"
          minH={CLOSE}
          minW={CLOSE}
          {...touch(CLOSE)}
          aria-label="Dismiss"
          onPress={dismiss}
        >
          <X size={16} />
        </Button>
      ) : null}
    </AnnouncementFrame>
  )
}
