'use client'

/**
 * Avatar — an image with an initial or an icon behind it.
 *
 * @hanzogui/avatar owns the load/error state machine and the fallback delay, so
 * this only names the three parts and dresses them in tokens.
 *
 * Two looks, one component. With no `size`, it is the account avatar every
 * Hanzo surface already draws: a 32px circle, its fallback on the edge rung.
 * With a `size` it is a RECORD avatar (the record kit's Avatar,
 * MIT, see NOTICE): xs 12 · sm 14 · md 16 · lg 24 · xl 40, square by default
 * (2px), rounded (4px) or a circle, and its initial drawn in the record's own
 * hue — the source kit's string hash over `colorSeed` (a record id, so a rename keeps
 * the colour) or `name`, the hue's step 12 on step 4 (soft) or on step 5 inside
 * a step 6 edge (outline). Given `src` or `name` directly it draws its own
 * image and fallback; given children it is the compound it always was.
 */
import { Avatar as GuiAvatar, SizableText } from '@hanzo/gui'
import { hueOf } from '@hanzo/tokens/data'
import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { useTone } from './hue'
import { press, RING } from './press'
import { slot } from './slot'

const SIZE = 32

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'square' | 'rounded' | 'circle'

/**
 * The record sizes: box, and the initial's rung. xs and sm sit on Hanzo's text
 * floor, 12px (design's --text-floor): the source kit draws 8 and 10px initials there,
 * which Hanzo does not render. The box clips, so the glyph never spills.
 */
const RECORD: Record<AvatarSize, { box: number; font: string }> = {
  xs: { box: 12, font: '$1' },
  sm: { box: 14, font: '$1' },
  md: { box: 16, font: '$1' },
  lg: { box: 24, font: '$2' },
  xl: { box: 40, font: '$4' },
}

const RADIUS: Record<AvatarShape, string> = { square: '$2xs', rounded: '$xs', circle: '$10' }

type GuiSize = ComponentProps<typeof GuiAvatar>['size']

export type AvatarProps = Omit<ComponentProps<typeof GuiAvatar>, 'size'> & {
  /**
   * A record size (xs…xl), or — as before the record sizes — any box gui's
   * Avatar takes (`size={64}`), which keeps the circular account look. Unset,
   * the 32px account avatar.
   */
  size?: AvatarSize | GuiSize
  /** Square (default for a record size), rounded, or circle (the default with no size). */
  shape?: AvatarShape
  /** The image. With `name`, the avatar draws its own image and fallback. */
  src?: string | null
  /** Whose avatar: its first character is the initial, and it seeds the colour. */
  name?: string | null
  /** What the colour is derived from, when it should outlive the name (a record id). */
  colorSeed?: string
  /** An icon in place of the initial; the avatar then takes its parent's ground. */
  icon?: ReactNode
  /** `outline` draws the hue's edge around a lighter fill. */
  variant?: 'soft' | 'outline'
  /** A ground-coloured halo that separates stacked avatars. */
  ring?: boolean
  /** Breathe while something about it is pending. */
  pulsing?: boolean
  /** Makes the avatar a button; it gains a halo under the pointer. */
  onPress?: () => void
  /** The image's accessible description. */
  alt?: string
}
export type AvatarImageProps = ComponentProps<typeof GuiAvatar.Image>
export type AvatarFallbackProps = ComponentProps<typeof GuiAvatar.Fallback>

/** The first character of the trimmed name, uppercased; `-` with none. */
export const initialOf = (name?: string | null): string => {
  const first = [...(name ?? '').trim()][0]
  return first ? first.toLocaleUpperCase() : '-'
}

const Avatar = ({
  size,
  shape,
  src,
  name,
  colorSeed,
  icon,
  variant = 'soft',
  ring = false,
  pulsing = false,
  onPress,
  alt,
  children,
  style,
  ...props
}: AvatarProps) => {
  const record = typeof size === 'string' && size in RECORD ? RECORD[size as AvatarSize] : null
  // A box gui's Avatar takes directly: the account look at that size.
  const box = record?.box ?? (size != null && !record ? size : SIZE)
  const corner = RADIUS[shape ?? (record ? 'square' : 'circle')]
  const seed = colorSeed ?? name ?? ''
  const { style: hueStyle, tone } = useTone(hueOf(seed), [4, 5, 6, 12])
  const own = children == null && (src != null || name != null || icon != null)
  const trimmed = (name ?? '').trim()

  const fallback = own ? (
    <AvatarFallback
      bg={icon ? 'transparent' : trimmed ? tone(variant === 'outline' ? 5 : 4) : '$hover'}
      {...(variant === 'outline' && trimmed && !icon ? { borderWidth: 1, borderColor: tone(6) } : null)}
      rounded={corner}
    >
      {icon ? (
        isValidElement(icon) && (icon.props as { size?: unknown }).size == null
          ? cloneElement(icon as ReactElement<Record<string, unknown>>, { size: box })
          : icon
      ) : (
        <SizableText
          fontSize={(record?.font ?? '$2') as '$1'}
          lineHeight={box}
          fontWeight="500"
          color={trimmed ? tone(12) : '$hint'}
          select="none"
        >
          {initialOf(name)}
        </SizableText>
      )}
    </AvatarFallback>
  ) : null

  return (
    <GuiAvatar
      data-slot="avatar"
      {...(record ? { 'data-size': size } : null)}
      {...(onPress ? press(onPress) : null)}
      circular={corner === '$10'}
      size={box as GuiSize}
      {...(record || shape ? { rounded: corner } : null)}
      shrink={0}
      overflow="hidden"
      {...(onPress ? { cursor: 'pointer', hoverStyle: { outlineColor: '$hover', outlineWidth: 4, outlineStyle: 'solid' }, focusVisibleStyle: RING } : null)}
      {...(pulsing ? { 'data-motion': 'pulse' } : null)}
      style={{
        ...(own && trimmed ? hueStyle : null),
        ...(ring ? { boxShadow: '0 0 0 1px var(--border), 0 0 0 3px var(--background)' } : null),
        ...(style as object),
      }}
      {...props}
    >
      {own && src ? <AvatarImage src={src} {...(alt ? { alt } : null)} /> : null}
      {fallback}
      {children}
    </GuiAvatar>
  )
}

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
