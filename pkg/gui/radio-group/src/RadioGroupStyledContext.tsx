import type { SizeTokens } from '@hanzogui/core'
import { createStyledContext } from '@hanzogui/core'

export const RadioGroupStyledContext = createStyledContext(
  {
    size: '$true' as SizeTokens,
    scaleIcon: 1,
  },
  'RadioGroup'
)
