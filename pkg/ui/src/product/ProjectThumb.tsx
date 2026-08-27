'use client'

/**
 * A picture of a site.
 *
 * THREE ANSWERS, TRIED IN ORDER, and the order is the whole design:
 *
 *  1. A CAPTURE — cloud screenshots the live site and serves the picture. Tried
 *     first because it is the only one that works for every site.
 *  2. THE LIVE SITE IN A FRAME — only while no capture exists, and only for a
 *     host that permits framing.
 *  3. A MONOGRAM — when neither can say anything true.
 *
 * Why the capture leads: a framed preview dies on any host sending
 * `X-Frame-Options: DENY` or `frame-ancestors 'none'`, and that refusal is
 * UNDETECTABLE from the embedder. The browser blocks it at the network layer,
 * so `onError` never fires, `onLoad` fires for the error document, `loaded`
 * flips, and the iframe's own white background is revealed — a grey box with a
 * torn-image glyph that stays forever, because nothing here can learn it
 * happened. A capture is taken by a browser VISITING the page, so no framing
 * policy applies to it.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import type { GuiElement } from '@hanzo/gui'
import { useEffect, useRef, useState, type ReactElement } from 'react'

/**
 * The viewport the framed site lays itself out against, before scaling. A
 * DESKTOP width, so the thumbnail shows the desktop layout.
 */
const LOGICAL_W = 1280

/** Hosts that are a sign-in, never a site worth picturing. */
const AUTH_HOSTS = new Set(['console.hanzo.ai', 'hanzo.id'])

export function canPreview(value?: string | null): boolean {
  if (!value) return false
  try {
    const host = new URL(value).hostname.toLowerCase()
    return ![...AUTH_HOSTS].some((auth) => host === auth || host.endsWith(`.${auth}`))
  } catch {
    return false
  }
}

export type ProjectThumbProps = {
  name: string
  /** The project whose capture to show. */
  slug?: string | null
  liveUrl?: string | null
  /**
   * Where the capture lives. Defaults to the same-origin cloud route, which is
   * right for a site served beside the API and wrong for a desktop webview —
   * so a caller that is not same-origin passes the absolute URL.
   */
  shotUrl?: (slug: string) => string
  /** Shown when there is no live URL and no capture. */
  fallback?: ReactElement
  /**
   * Box shape when the parent sets no height (cards 16/9, heroes 16/10).
   *
   * A RATIO, not a class name. As a Tailwind utility this named a shape and
   * delivered none: where the parent supplied a height it went unnoticed, and
   * where it did not, `height: 100%` resolved against an auto-height box and the
   * thumbnail collapsed to zero.
   */
  aspect?: number
}

const sameOrigin = (slug: string) => `/v1/projects/${encodeURIComponent(slug)}/shot`

export function ProjectThumb({
  name,
  slug,
  liveUrl,
  shotUrl = sameOrigin,
  fallback,
  aspect = 16 / 9,
}: ProjectThumbProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  /** No capture for this project — never deployed, or cloud has none yet. */
  const [noShot, setNoShot] = useState(false)
  const host = useRef<GuiElement>(null)
  const [box, setBox] = useState({ scale: 0.25, h: 720 })

  useEffect(() => {
    const el = host.current
    if (!el || !('scrollTo' in el) || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setBox({ scale: w / LOGICAL_W, h: (el.clientHeight * LOGICAL_W) / w })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showShot = Boolean(slug) && !noShot
  const showLive = !showShot && canPreview(liveUrl) && !failed

  /**
   * The monogram does two jobs: the honest no-preview state, AND the cover that
   * hides the iframe's white background until it paints — a dark product must
   * never flash a white card on load.
   */
  const placeholder = fallback ?? (
    <XStack
      height="100%"
      width="100%"
      items="center"
      justify="center"
      bg="$edge"
    >
      <Text fontSize="$11" fontWeight="500" color="$quiet">
        {(name || '?').charAt(0).toUpperCase()}
      </Text>
    </XStack>
  )

  return (
    <YStack
      ref={host}
      position="relative"
      height="100%"
      width="100%"
      aspectRatio={aspect}
      overflow="hidden"
      bg="$edge"
    >
      {showShot ? (
        <>
          <img
            src={shotUrl(slug as string)}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setNoShot(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              maxWidth: 'none',
              objectFit: 'cover',
              // A site's identity is in its header; centring a tall page shows
              // whatever happens to be in the middle of it.
              objectPosition: 'top',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 240ms ease',
            }}
          />
          {loaded ? null : (
            <YStack fullscreen>
              {placeholder}
            </YStack>
          )}
        </>
      ) : showLive ? (
        <>
          <iframe
            src={liveUrl as string}
            title={`${name} preview`}
            loading="lazy"
            tabIndex={-1}
            aria-hidden
            // `allow-same-origin` is REQUIRED, not a relaxation: without it the
            // frame gets an opaque origin and any site touching localStorage on
            // boot throws before first paint. The framed host is always a
            // DIFFERENT origin than the embedder, so restoring its own origin
            // gives it nothing it would not have when visited directly — it
            // still cannot script this page. Top-level navigation, forms,
            // popups and modals all stay denied.
            sandbox="allow-scripts allow-same-origin"
            scrolling="no"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: 0,
              top: 0,
              border: 0,
              background: '#fff',
              width: LOGICAL_W,
              // `max-width` CONSTRAINS the used width no matter what `width`
              // says, and this iframe sits under the usual responsive-media
              // reset (`:where(img,svg,video,canvas,iframe) { max-width: 100% }`)
              // — right for every picture on the page and wrong for this one
              // element, because here the width is not a layout size, it is the
              // VIEWPORT the framed site lays itself out against.
              //
              // Capped, it became the card's own width: the site inside saw
              // ~390px, rendered its PHONE layout, and the transform shrank that
              // to a strip. Every thumbnail was a real screenshot, correctly
              // scaled, of the wrong layout.
              maxWidth: 'none',
              height: box.h,
              transform: `scale(${box.scale})`,
              transformOrigin: 'top left',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 240ms ease',
            }}
          />
          {loaded ? null : (
            <YStack fullscreen>
              {placeholder}
            </YStack>
          )}
        </>
      ) : (
        placeholder
      )}
      {/* Click shield — the card owns every interaction. */}
      <YStack fullscreen />
    </YStack>
  )
}
