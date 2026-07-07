// The @hanzo/gui v5 config this package is authored against. `createGui` with the
// shared `@hanzogui/config/v5` default enables the shorthand style props
// (bg/px/py/items/justify/rounded/…) the components use; `Conf` feeds the type
// augmentation in `gui.d.ts` so `tsc --noEmit` type-checks the shorthands exactly
// as the consuming app (console) does. Not shipped — dev/type-check only.
import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export default config

export type Conf = typeof config
