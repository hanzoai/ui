'use client'

/**
 * AspectRatio — a box that holds a width-to-height ratio.
 *
 * `aspectRatio` is a first-class layout property of the gui/Yoga box model, so
 * there is nothing to compute and no padding-bottom trick: the ratio is the
 * style. That is why this is the whole component on web, native and desktop.
 */
import { YStack, type YStackProps } from '@hanzo/gui'

export interface AspectRatioProps extends YStackProps {
  /** Width divided by height. Square by default. */
  ratio?: number
}

const AspectRatio = ({ ratio = 1, ...props }: AspectRatioProps) => (
  <YStack data-slot="aspect-ratio" width="100%" aspectRatio={ratio} {...props} />
)

export { AspectRatio }
