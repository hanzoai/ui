import type { SizeTokens } from '@hanzogui/core'
import { createStyledContext } from '@hanzogui/core'

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
