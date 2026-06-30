/**
 * Registers our Gui config with the type system so component style props
 * (tokens, themes, shorthands) are typed. `GuiCustomConfig` is declared in
 * `@hanzogui/web` and re-exported across the Gui packages; augmenting it there
 * flows the types through every `@hanzo/gui` component.
 */
import type { Conf } from './gui.config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}
