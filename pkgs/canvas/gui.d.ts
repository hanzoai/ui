/**
 * Registers our Gui config with the type system so component style props
 * (tokens, themes, shorthands) are typed. `GuiCustomConfig` is declared in
 * `@hanzogui/web` and re-exported across the Gui packages; augmenting it there
 * flows the types through every `@hanzo/gui` component.
 */
import type { Conf } from "./gui.config"

declare module "@hanzogui/web" {
  interface GuiCustomConfig extends Conf {}
}

// `@hanzogui/core` re-declares the same extension point, and the components are
// re-exported through it — so augmenting only `web` leaves every style prop
// untyped here and tsc rejects the whole shorthand vocabulary, `bg` and `p`
// included, as if the config had no shorthands at all. Both declarations are
// required; pkg/ui and pkgs/dashboard already carry the pair.
declare module "@hanzogui/core" {
  interface GuiCustomConfig extends Conf {}
}
