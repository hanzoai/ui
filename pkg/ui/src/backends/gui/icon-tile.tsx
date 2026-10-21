'use client'

/**
 * IconTile — a 16px icon on a tinted square: an object's mark in the navigation,
 * a command, a settings area, a workflow node.
 *
 * The tint is the object's data hue — step 4 under a step 10 glyph — so People
 * and Companies keep the colours a person gave them. The icon is decorative;
 * the row beside it carries the name.
 *
 * The record kit's TintedIconTile (MIT, see NOTICE).
 */
import { XStack } from '@hanzo/gui'
import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { data } from '@hanzo/tokens/data'
import { hueOr, useTone, type DataHue } from './hue'
import { slot } from './slot'

const BOX = 16

/** A hue's tile pair — fill and glyph — for a row that wants the same two without the tile. */
export const tileTones = (hue: DataHue) => ({ fill: data(hue, 4), glyph: data(hue, 10) })

export type IconTileProps = Omit<ComponentProps<typeof XStack>, 'children' | 'color'> & {
  /** A 16px icon. Given no colour, it takes the glyph step. */
  icon: ReactNode
  /** A data hue; anything else, or none, is gray. */
  color?: DataHue | (string & {}) | null
}

export function IconTile({ icon, color, style, ...props }: IconTileProps) {
  const hue = hueOr(color)
  const { style: hueStyle, tone } = useTone(hue, [4, 10])
  const glyph =
    isValidElement(icon) && (icon.props as { color?: unknown }).color == null
      ? cloneElement(icon as ReactElement<Record<string, unknown>>, {
          color: tone(10),
          ...((icon.props as { size?: unknown }).size == null ? { size: BOX } : null),
        })
      : icon
  return (
    <XStack
      {...slot('icon-tile')}
      data-color={hue}
      aria-hidden
      width={BOX}
      height={BOX}
      shrink={0}
      rounded="$xs"
      items="center"
      justify="center"
      bg={tone(4)}
      style={{ ...hueStyle, ...(style as object) }}
      {...props}
    >
      {glyph}
    </XStack>
  )
}
