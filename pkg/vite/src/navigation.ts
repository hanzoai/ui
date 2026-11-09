/**
 * The hooks a client component reads where it is with, and the one throw a
 * server component stops a page with.
 */
export { usePathname, useSearchParams, useRouter, type Router } from './here.js'

/** Marks a thrown `notFound()`, matched by digest so two copies of this module agree. */
export const MISSING = 'HANZO_NOT_FOUND'

/** Ends the page: the address is written as the site's not-found page instead. */
export function notFound(): never {
  throw Object.assign(new Error('not found'), { digest: MISSING })
}

export const missing = (e: unknown): boolean => typeof e === 'object' && e !== null && (e as { digest?: unknown }).digest === MISSING

/** A static export has no server to answer a redirect; a move is the edge's. */
export function redirect(to: string): never {
  throw new Error(`redirect(${JSON.stringify(to)}): a static page cannot redirect; state the move at the edge`)
}
