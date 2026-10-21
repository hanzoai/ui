'use client'

/**
 * Tag — a coloured label: a select option's value, a kanban column, a status
 * word, a group header.
 *
 * The colour is DATA — the hue a person picked for the option — so it comes
 * from the data palette (@hanzo/tokens), never from the chrome ladder: soft is
 * the hue's step 3 under step 11 ink, solid swaps them onto the ground, outline
 * and ghost keep the ink alone. `transparent` is a label with no colour of its
 * own, and a colour this palette does not know reads as gray rather than as
 * nothing.
 *
 * The record kit's Tag (MIT, see NOTICE): 20px tall, 8px gutter,
 * 4px gap and radius, 13px text, a 14px start icon, a dashed outline for "no
 * value", string labels truncated with an overflow hint.
 */
import { SizableText, XStack } from '@hanzo/gui'
import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { hueOr, useTone, type DataHue } from './hue'
import { TruncatedText } from './truncated-text'
import { press, RING } from './press'
import { slot } from './slot'

export type TagColor = DataHue | 'transparent'

/**
 * One entry of a `Tags` row. The type shares the component's name, as the entry
 * shape did before the component existed: `import type { Tag }` keeps meaning
 * the entry, and `Tag` in JSX is the component.
 */
export type Tag = {
  id: string
  label: string
  /** A data hue: the entry is drawn as a coloured `Tag` rather than a badge. */
  color?: TagColor
}
export type TagVariant = 'soft' | 'solid' | 'outline' | 'ghost'

const HEIGHT = 20
const ICON = 14

export type TagProps = Omit<ComponentProps<typeof XStack>, 'children' | 'color'> & {
  /** One of the thirty data hues, or `transparent`. Anything else reads as gray. */
  color?: TagColor | (string & {})
  variant?: TagVariant
  weight?: 'regular' | 'medium'
  /** An icon before the label, drawn at 14px in the tag's ink unless it names its own. */
  startIcon?: ReactNode
  /** After the label: a remove button, a count. */
  endElement?: ReactNode
  /** One line with an ellipsis and an overflow hint (string children). Default true. */
  truncate?: boolean
  /** The outline variant's edge: `dashed` marks an empty value ("No value"). */
  borderStyle?: 'solid' | 'dashed'
  /** Makes the tag a button. */
  onPress?: () => void
  /** Makes the tag a link. */
  href?: string
  disabled?: boolean
  children?: ReactNode
}

/** The icon, at the tag's size and ink, where it names neither. */
const mark = (icon: ReactNode, color: string) => {
  if (!isValidElement(icon)) return icon
  const own = icon.props as { size?: unknown; color?: unknown }
  return cloneElement(icon as ReactElement<Record<string, unknown>>, {
    ...(own.size == null ? { size: ICON } : null),
    ...(own.color == null ? { color } : null),
  })
}

export function Tag({
  color = 'gray',
  variant = 'soft',
  weight = 'regular',
  startIcon,
  endElement,
  truncate = true,
  borderStyle = 'solid',
  onPress,
  href,
  disabled = false,
  children,
  style,
  ...props
}: TagProps) {
  const bare = color === 'transparent'
  const hue = hueOr(bare ? 'gray' : color)
  const { style: hueStyle, tone } = useTone(hue, [3, 11])
  const ink = bare ? '$aside' : variant === 'solid' ? '$background' : tone(11)
  const fill = bare || variant === 'outline' || variant === 'ghost' ? 'transparent' : variant === 'solid' ? tone(11) : tone(3)
  const text = { size: '$2', fontWeight: weight === 'medium' ? '500' : undefined, color: ink } as const
  const interactive = !disabled && (onPress != null || href != null)

  return (
    <XStack
      {...slot('tag')}
      data-color={bare ? 'transparent' : hue}
      data-variant={variant}
      {...(href != null ? { render: 'a', href } : onPress != null ? { ...press(disabled ? undefined : onPress) } : { render: 'span' })}
      {...(disabled ? { 'aria-disabled': true } : null)}
      display="inline-flex"
      self="flex-start"
      items="center"
      gap="$1"
      height={HEIGHT}
      px="$2"
      maxW="100%"
      minW={0}
      rounded="$xs"
      bg={fill}
      {...(variant === 'outline' ? { borderWidth: 1, borderColor: '$rim', borderStyle } : null)}
      overflow="hidden"
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? 'not-allowed' : interactive ? 'pointer' : undefined}
      {...(interactive ? { focusVisibleStyle: RING } : null)}
      style={{ ...hueStyle, ...(style as object) }}
      {...props}
    >
      {startIcon ? mark(startIcon, ink) : null}
      {typeof children === 'string' || typeof children === 'number' ? (
        truncate ? (
          <TruncatedText text={String(children)} {...text} />
        ) : (
          <SizableText {...text}>{children}</SizableText>
        )
      ) : (
        children
      )}
      {endElement ? (
        <XStack {...slot('tag-end')} shrink={0} items="center">
          {endElement}
        </XStack>
      ) : null}
    </XStack>
  )
}
