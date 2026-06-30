// Hanzogui config for @hanzo/data typechecking.
//
// The canonical v5 default config — the same shape Hanzo's admin SPAs use, so
// the shorthand style props (`bg`, `p`, `items`, `justify`, `rounded`, …) the
// field/table components use typecheck against the real Gui token unions.
// Consumers supply their own config + theme at runtime; this exists so the
// library type-checks standalone.

import { defaultConfig } from '@hanzogui/config/v5'
import { createHanzogui } from '@hanzo/gui'

export const config = createHanzogui(defaultConfig)

export default config

export type Conf = typeof config

declare module '@hanzo/gui' {
  interface HanzoguiCustomConfig extends Conf {}
}
