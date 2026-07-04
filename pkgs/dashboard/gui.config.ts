// Gui config for @hanzo/dashboard typechecking.
//
// The canonical v5 default config — the same shape Hanzo's admin SPAs use, so
// the shorthand style props (`bg`, `p`, `items`, `justify`, `rounded`, …) the
// dashboard components use typecheck against the real Gui token unions.
// Consumers supply their own config + theme at runtime; this exists so the
// library type-checks standalone. The config-type registration lives in
// `gui.d.ts` (augmenting `@hanzogui/web`), matching the @hanzo/data pattern.

import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export default config

export type Conf = typeof config
