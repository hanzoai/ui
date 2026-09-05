'use client'

/**
 * ChunkGuard — window-level net that recovers from a stale-deploy chunk 404.
 * Renders nothing; mount it once near the shell root.
 *
 * Two catch surfaces, because a chunk 404 surfaces two ways:
 *  - CAPTURE-phase `error` on the failing `<script>`/`<link>` element — a
 *    resource load error does NOT bubble, so only a capture listener sees
 *    it. This fires on the RAW 404 during the initial deep-link load,
 *    before the loader even rejects — the earliest, most reliable signal.
 *  - `unhandledrejection` / bubbled `error` carrying a `ChunkLoadError` —
 *    the dynamic-import path.
 *
 * A render-time error boundary catches the same class at RENDER time; this
 * complements it for the async/resource paths a boundary never sees. See
 * `chunkGuard.logic.ts` for the pure decisions this wires up.
 */
import { useEffect } from 'react'

import { isBuildAssetError, isChunkLoadError, shouldReloadForChunk, CHUNK_RELOAD_AT_KEY } from './chunkGuard.logic'

export type ChunkGuardProps = {
  /** Path fragment identifying a build asset URL. Default `/_next/static/`
   *  (Next.js); pass the bundler's own prefix on another host. */
  assetPathPrefix?: string
}

export function ChunkGuard({ assetPathPrefix }: ChunkGuardProps = {}) {
  useEffect(() => {
    // Reload at most once per window, so a skew that trips several
    // detectors at once reloads ONCE — never a reload loop.
    const recover = () => {
      try {
        const raw = window.sessionStorage.getItem(CHUNK_RELOAD_AT_KEY)
        const last = raw ? Number(raw) : null
        if (!shouldReloadForChunk(Date.now(), last)) return
        window.sessionStorage.setItem(CHUNK_RELOAD_AT_KEY, String(Date.now()))
        window.location.reload()
      } catch {
        /* sessionStorage blocked (private mode) — let a render boundary show its card */
      }
    }

    const onError = (e: ErrorEvent) => {
      if (isBuildAssetError(e.target, assetPathPrefix) || isChunkLoadError(e.error ?? e.message)) recover()
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkLoadError(e.reason)) recover()
    }

    // `capture: true` so the non-bubbling resource-load error on a 404'd
    // chunk element reaches us.
    window.addEventListener('error', onError, true)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [assetPathPrefix])

  return null
}
