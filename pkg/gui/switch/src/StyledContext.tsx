import type { SizeTokens } from '@hanzo/gui-core'
import { createStyledContext } from '@hanzo/gui-core'

export const SwitchStyledContext = createStyledContext<{
  active?: boolean
  disabled?: boolean
  frameWidth?: number
  size?: SizeTokens
  unstyled?: boolean
}>({
  active: false,
  disabled: false,
  frameWidth: undefined,
  size: undefined,
  unstyled: process.env.HANZO_GUI_HEADLESS === '1',
})
