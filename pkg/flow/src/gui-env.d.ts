// Type-only Gui config registration for standalone @hanzo/flow compilation.
// Matches pkg/composer/src/gui-env.d.ts: a .d.ts is never emitted into dist/,
// so every host's own GuiCustomConfig registration stays authoritative.
import type { createGui } from "@hanzo/gui"
import type { defaultConfig } from "@hanzogui/config/v5"

type Conf = ReturnType<typeof createGui<typeof defaultConfig>>

declare module "@hanzogui/web" {
  interface GuiCustomConfig extends Conf {}
}

declare module "@hanzogui/core" {
  interface GuiCustomConfig extends Conf {}
}
