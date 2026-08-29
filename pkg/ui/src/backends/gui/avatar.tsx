
/**
 * Avatar — circular image with a text fallback.
 *
 * @hanzogui/avatar owns the load/error state machine and the fallback delay, so
 * this only names the three parts and dresses them in tokens.
 */
import { Avatar as GuiAvatar, SizableText } from '@hanzo/gui'
import type { ComponentProps } from 'react'

const SIZE = 32

export type AvatarProps = ComponentProps<typeof GuiAvatar>
export type AvatarImageProps = ComponentProps<typeof GuiAvatar.Image>
export type AvatarFallbackProps = ComponentProps<typeof GuiAvatar.Fallback>

const Avatar = (props: AvatarProps) => (
  <GuiAvatar data-slot="avatar" circular size={SIZE} shrink={0} overflow="hidden" {...props} />
)

const AvatarImage = (props: AvatarImageProps) => (
  <GuiAvatar.Image data-slot="avatar-image" width="100%" height="100%" {...props} />
)

/** Bare text needs a Text host to render on native; elements pass through. */
const AvatarFallback = ({ children, ...props }: AvatarFallbackProps) => (
  <GuiAvatar.Fallback
    data-slot="avatar-fallback"
    bg="$edge"
    items="center"
    justify="center"
    {...props}
  >
    {typeof children === 'string' || typeof children === 'number' ? (
      <SizableText size="$2" color="$quiet">
        {children}
      </SizableText>
    ) : (
      children
    )}
  </GuiAvatar.Fallback>
)

export { Avatar, AvatarImage, AvatarFallback }
