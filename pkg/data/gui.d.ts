/**
 * Registers our Gui config with the type system so shorthand style props
 * (tokens, themes, bg/px/py/items/justify etc.) type-check exactly as they do in
 * the consuming app. GuiCustomConfig is declared in @hanzogui/web and flows
 * through @hanzo/gui. Dev/type-check only — never shipped.
 */
import type { Conf } from './gui.config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
