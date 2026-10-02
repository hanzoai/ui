// The type registration this package compiles against: the same `defaultConfig`
// @hanzo/ui registers, so the shorthands (`p`, `rounded`, `bg`, `t`…) type here as
// they do in every host. A .d.ts is never emitted, so a host's own registration
// is the only one its build sees.
import type { createGui } from '@hanzo/gui'
import type { defaultConfig } from '@hanzogui/config/v5'

type Conf = ReturnType<typeof createGui<typeof defaultConfig>>

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
