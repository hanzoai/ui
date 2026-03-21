import type { SizeTokens } from '@hanzo/gui-core'
import { createStyledContext } from '@hanzo/gui-core'

export const CheckboxStyledContext = createStyledContext<{
  size: SizeTokens
  scaleIcon: number
  unstyled?: boolean
  active?: boolean
  disabled?: boolean
}>({
  size: '$true' as SizeTokens,
  scaleIcon: 1,
  unstyled: process.env.HANZO_GUI_HEADLESS === '1',
  active: false,
  disabled: false,
})
