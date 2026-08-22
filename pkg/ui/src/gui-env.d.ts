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

type Base = ReturnType<typeof createGui<typeof defaultConfig>>

/**
 * The registration is derived from `defaultConfig`, NOT from this package's own
 * `config`, and it has to stay that way: `gui-config.ts` imports @hanzo/gui,
 * whose types read this augmentation, so pointing at the real config closes a
 * cycle and every style prop collapses to `any`.
 *
 * The cost is that anything gui-config ADDS is invisible here. `fonts.mono` is
 * such an addition — `defaultConfig` ships `body` and `heading` only — so
 * `fontFamily="$mono"` failed to type even though the token now exists at
 * runtime. Declaring it on the type keeps the two in step without the cycle.
 * Anything else added to `fonts` in gui-config.ts belongs in this intersection.
 */
/**
 * The twelve names gui-config gives the ramp, declared here for the same reason
 * `fonts.mono` is: this registration is derived from `defaultConfig`, so
 * anything our config ADDS is invisible to the type system until it is stated.
 *
 * Leaving them out is not a lint-level problem — `pnpm build` typechecks, the
 * publish job runs the build, and 308 errors across 75 files kept five versions
 * off npmjs while every test stayed green, because vitest does not typecheck.
 */
type Alias = Record<
  | 'sunken' | 'panel' | 'hover' | 'edge' | 'raised' | 'rim'
  | 'bound' | 'dim' | 'faint' | 'soft' | 'quiet' | 'ink',
  Base['themes']['dark']['color12']
>

type Conf = Omit<Base, 'fonts' | 'themes'> & {
  fonts: Base['fonts'] & { mono: Base['fonts']['body'] }
  themes: { [K in keyof Base['themes']]: Base['themes'][K] & Alias }
}

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}

/** `<Hanzo>` imports the generated stylesheet so no app has to. tsc needs to be
 *  told a `.css` specifier is a module; the emit is the import itself, which is
 *  what makes bundlers pull the file in. */
declare module '*.css' {}

/** The one build-time constant this package reads. Declared narrowly instead of
 *  pulling `@types/node` into a browser library's type surface — every bundler
 *  substitutes it, and `<Hanzo>`'s stylesheet check is stripped from production
 *  by that substitution. */
declare global {
  const process: { env: { NODE_ENV?: string } }
}
