'use client'

/**
 * ColorSample — the swatch for a data hue: a select option's colour button, a
 * chart series, the picker's own presets.
 *
 * The hue's step 3 inside a 1px step 11 edge, so the swatch shows the same pair
 * a tag in that colour does. `color` paints an explicit fill instead (a colour
 * that is not in the palette), keeping the edge.
 *
 * The record kit's ColorSample (MIT, see NOTICE): a 12×16 capsule,
 * or a 16px circle.
 */
import { XStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { hueOr, useTone, type DataHue } from './hue'
import { slot } from './slot'

export type ColorSampleProps = Omit<ComponentProps<typeof XStack>, 'color'> & {
  /** A data hue; anything else is gray. */
  colorName?: DataHue | (string & {})
  /** An explicit fill, over the hue's. */
  color?: string
  variant?: 'default' | 'circle'
}

export function ColorSample({ colorName, color, variant = 'default', style, ...props }: ColorSampleProps) {
  const hue = hueOr(colorName)
  const { style: hueStyle, tone } = useTone(hue, [3, 11])
  return (
    <XStack
      {...slot('color-sample')}
      data-color={hue}
      width={variant === 'circle' ? 16 : 12}
      height={16}
      shrink={0}
      rounded="$10"
      borderWidth={1}
      borderColor={tone(11)}
      bg={tone(3)}
      style={{ ...hueStyle, ...(color ? { backgroundColor: color } : null), ...(style as object) }}
      {...props}
    />
  )
}
