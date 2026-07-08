/**
 * Registers this package's @hanzo/gui config with the type system so the
 * shorthand style props (bg / px / py / items / justify / gap / rounded …) that
 * the components author against resolve to their concrete types DURING THIS
 * PACKAGE'S OWN COMPILATION.
 *
 * Because the resolution happens here, the emitted `.d.ts` (see
 * `tsconfig.build.json`) bakes in the concrete prop types — a consumer type-checks
 * against the compiled declarations and never has to re-declare this augmentation
 * (nor descend into our `.tsx` internals). Ambient + type-only; never emitted.
 *
 * `GuiCustomConfig` is the extension point declared by @hanzogui/web and re-declared
 * by @hanzogui/core; `InferGuiConfig<typeof defaultConfig>` (the return type of
 * `createGui(defaultConfig)`) is the exact config the components are written for.
 */
import type { createGui } from '@hanzo/gui'
import type { defaultConfig } from '@hanzogui/config/v5'

type Conf = ReturnType<typeof createGui<typeof defaultConfig>>

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
