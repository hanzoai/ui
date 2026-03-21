import type { SizeTokens } from '@hanzo/gui-core'
import { createStyledContext } from '@hanzo/gui-core'

export const RadioGroupStyledContext = createStyledContext(
  {
    size: '$true' as SizeTokens,
    scaleIcon: 1,
  },
  'RadioGroup'
)
