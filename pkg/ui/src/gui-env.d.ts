/**
 * Ambient declarations for this package's own compilation. Type-only and never
 * emitted, so anything a consumer must also see lives in a `.ts` module instead,
 * as the config registration does in `gui-config.ts`.
 */

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

export {}
