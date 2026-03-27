import type { SizableStackProps } from '@hanzogui/stacks'
import type { SizeVariantSpreadFunction } from '@hanzogui/web'

export const getShapeSize: SizeVariantSpreadFunction<SizableStackProps> = (
  size,
  { tokens }
) => {
  const width = tokens.size[size] ?? size
  const height = tokens.size[size] ?? size
  return {
    width,
    height,
    minWidth: width,
    maxWidth: width,
    maxHeight: height,
    minHeight: height,
  }
}
