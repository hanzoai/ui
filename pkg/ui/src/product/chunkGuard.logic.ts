/**
 * Pure decisions for `ChunkGuard`, kept apart from the window listeners so
 * they are unit-tested without a browser.
 *
 * On a rolling deploy, an open tab (or a fresh deep-link landing on a new
 * replica) can request a hashed chunk that no longer exists. The 404 falls
 * through to the app-shell HTML, so the browser throws `ChunkLoadError` /
 * "Unexpected token '<'" trying to parse HTML as JS — a blank,
 * unrecoverable screen. In a PRODUCTION build, user code never throws
 * "Unexpected token '<'" at runtime (that is a build-time syntax error), so
 * at runtime it is a chunk skew — recover, don't crash.
 */

/** The sessionStorage key a recovery reload is bounded by, so a skew that
 *  trips the guard more than once in a burst reloads at most once. */
export const CHUNK_RELOAD_AT_KEY = 'hz.chunkReloadAt'

/** True for a webpack/Next dynamic chunk (JS or CSS) load failure, including
 *  the stale-deploy case where a 404'd chunk URL is parsed as JS. */
export function isChunkLoadError(e: unknown): boolean {
  if (!e) return false
  const name = typeof e === 'object' && e !== null && 'name' in e ? String((e as { name?: unknown }).name) : ''
  const msg = e instanceof Error ? e.message : String(e)
  return (
    name === 'ChunkLoadError' ||
    /ChunkLoadError/i.test(msg) ||
    /Loading (?:CSS )?chunk [\w./-]+ failed/i.test(msg) ||
    /(?:Failed to fetch|error loading|Importing a module script failed).*dynamically imported module/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    // Stale chunk URL served the HTML shell → parsed as JS.
    /Unexpected token '<'|expected expression, got '<'|Unexpected token <|<!DOCTYPE/i.test(msg)
  )
}

/** True for a failed resource load whose element targets a build asset
 *  (a script or stylesheet under `pathPrefix`, default `/_next/static/`). */
export function isBuildAssetError(target: EventTarget | null, pathPrefix = '/_next/static/'): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as Partial<HTMLScriptElement & HTMLLinkElement>
  const url = el.src || el.href
  return typeof url === 'string' && url.includes(pathPrefix)
}

/** Reload at most once per `windowMs` to recover from a chunk skew.
 *  `lastReloadAt` is the epoch-ms of the last recovery reload (null when
 *  there has been none); true means a fresh reload is safe. */
export function shouldReloadForChunk(now: number, lastReloadAt: number | null, windowMs = 15_000): boolean {
  if (lastReloadAt == null || !Number.isFinite(lastReloadAt)) return true
  return now - lastReloadAt >= windowMs
}
