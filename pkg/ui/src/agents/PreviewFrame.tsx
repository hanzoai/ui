'use client'

/**
 * PreviewFrame — the running app, framed, beside the thing that builds it.
 *
 * Ported from build-v2 `components/editor/preview/index.tsx` (MIT, derived from
 * OSW Studio and DeepSite — see NOTICE). v2 streamed a document it wrote into
 * two `srcdoc` frames and swapped them as a build arrived. What a repository
 * builds is a DEPLOYED page at an address — a preview URL, a sandbox's dev
 * server, the live site — so this frames an address, and the builder's own
 * bytes never enter it.
 *
 * THE SANDBOX, token by token. The framed page is somebody's app: it has to
 * run to be previewed, and it must not be able to act on the page around it.
 *
 *   allow-scripts              it is an app; without script it is a picture.
 *   allow-forms                a sign-up form is part of what you are checking.
 *   allow-popups               its own links that open a tab still open one…
 *   allow-popups-to-escape-sandbox  …as an ordinary tab, not a crippled one.
 *   allow-same-origin          ONLY when the address is on ANOTHER origin than
 *                              this page. There it grants the app its OWN
 *                              origin — its cookies, its storage, its API —
 *                              and nothing of ours. On OUR origin the pair
 *                              `allow-scripts allow-same-origin` lets the
 *                              framed page reach up and remove its own sandbox,
 *                              so a same-origin address runs with no origin at
 *                              all (opaque) instead.
 *
 * Deliberately absent: `allow-top-navigation` (a preview that can move the
 * window it sits in is not a preview), `allow-modals`, `allow-downloads`,
 * `allow-pointer-lock`, and every `allow=` feature — no camera, microphone or
 * clipboard is granted to a page because it is being looked at.
 *
 * Only http(s) is framed. `javascript:`, `data:` and `blob:` addresses are
 * refused before they reach the attribute, and so is anything that fails to
 * parse — `web()` in `bridge.ts` is that check.
 *
 * THE BRIDGE IS OPT-IN. Element picking and the page's console arrive only if
 * the page ships the `script()` from `bridge.ts`, pinned to this origin; this
 * listens only to the frame's own window speaking from the frame's own origin,
 * and posts only to that origin. See `bridge.ts` for the protocol.
 */
import { SizableText, Spinner, XStack, YStack } from '@hanzo/gui'
import {
  type ComponentProps,
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { slot } from '../backends/gui/slot'
import { accept, type FrameCommand, type FrameEvent, web } from './bridge'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** A phone's width, px — the narrow preview. */
export const PHONE = 390

/** What the host can do to a mounted frame. */
export interface PreviewHandle {
  /** Load the address again. */
  reload(): void
  /** Say something to a page running the bridge. Dropped when there is none. */
  post(command: FrameCommand): void
}

export interface PreviewFrameProps extends Col {
  /** The address to frame. Anything but http(s) is refused. */
  src?: string | null
  /** The frame's accessible name. */
  title?: string
  /** Desktop fills the pane; mobile is a phone-wide column. */
  device?: 'desktop' | 'mobile'
  /** Drawn when there is no address — nothing deployed yet. */
  empty?: ReactNode
  /** A floating bar over the bottom of the frame — v2's edit toolbar. */
  toolbar?: ReactNode
  /** Messages from a page running the bridge. */
  onBridge?: (event: FrameEvent) => void
  /** Called once the frame has loaded. */
  onLoad?: () => void
  /**
   * The handle — `reload()` and `post()`. A plain prop (React 19), not
   * `forwardRef`: the wrapper's `Omit<Props, 'ref'>` collapses these props to
   * `any` against gui's index signature, and every caller loses their types.
   */
  ref?: Ref<PreviewHandle>
}

export function PreviewFrame({
  src,
  title = 'Preview',
  device = 'desktop',
  empty,
  toolbar,
  onBridge,
  onLoad,
  ref,
  ...rest
}: PreviewFrameProps) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  const here = typeof window === 'undefined' ? undefined : window.location.href
  const url = useMemo(() => web(src, here), [src, here])
  const foreign = Boolean(url && typeof window !== 'undefined' && url.origin !== window.location.origin)
  const sandbox = ['allow-scripts', 'allow-forms', 'allow-popups', 'allow-popups-to-escape-sandbox']
    .concat(foreign ? ['allow-same-origin'] : [])
    .join(' ')

  useEffect(() => setLoading(true), [url?.href, nonce])

  useImperativeHandle(
    ref,
    () => ({
      reload: () => setNonce((n) => n + 1),
      post: (command) => {
        if (!url || !foreign) return
        frame.current?.contentWindow?.postMessage(command, url.origin)
      },
    }),
    [url, foreign],
  )

  useEffect(() => {
    if (!onBridge || !url || !foreign) return
    const origin = url.origin
    const listen = (event: MessageEvent) => {
      const said = accept(event, frame.current, origin)
      if (said) onBridge(said)
    }
    window.addEventListener('message', listen)
    return () => window.removeEventListener('message', listen)
  }, [onBridge, url, foreign])

  if (!url) {
    return (
      <YStack
        {...slot('preview-frame')}
        flex={1}
        minH={0}
        items="center"
        justify="center"
        p="$6"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        bg="$sunken"
        {...rest}
      >
        {empty ?? (
          <YStack items="center" gap="$1.5" maxW={360}>
            <SizableText size="$4" fontWeight="600" color="$ink" text="center">
              {src ? 'This address cannot be previewed.' : 'Nothing deployed yet.'}
            </SizableText>
            <SizableText size="$2" color="$soft" text="center">
              {src ? 'Only http and https pages open here.' : 'Describe what to build and the running app appears here.'}
            </SizableText>
          </YStack>
        )}
      </YStack>
    )
  }

  const phone = device === 'mobile'
  return (
    <YStack
      {...slot('preview-frame')}
      data-device={device}
      position="relative"
      flex={1}
      minH={0}
      minW={0}
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$sunken"
      overflow="hidden"
      items="center"
      {...rest}
    >
      <YStack
        position="relative"
        flex={1}
        minH={0}
        width="100%"
        maxW={phone ? PHONE : '100%'}
        {...(phone ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '$borderColor' } : null)}
      >
        <iframe
          key={`${url.href}#${nonce}`}
          ref={frame}
          src={url.href}
          title={title}
          sandbox={sandbox}
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            setLoading(false)
            onLoad?.()
          }}
          style={{ display: 'block', width: '100%', height: '100%', border: 0, background: 'transparent' }}
        />
        {loading ? (
          <XStack
            position="absolute"
            t={0}
            r={0}
            b={0}
            l={0}
            items="center"
            justify="center"
            gap="$2"
            bg="$sunken"
            pointerEvents="none"
            aria-hidden
          >
            <Spinner size="small" maxW={16} maxH={16} />
            <SizableText size="$2" color="$soft">
              Loading preview…
            </SizableText>
          </XStack>
        ) : null}
      </YStack>
      {toolbar ? (
        <XStack
          {...slot('preview-toolbar')}
          position="absolute"
          b="$4"
          self="center"
          items="center"
          gap="$1"
          p="$1.5"
          rounded={999}
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          shadowColor="rgba(0,0,0,0.4)"
          shadowRadius={16}
          shadowOffset={{ width: 0, height: 6 }}
        >
          {toolbar}
        </XStack>
      ) : null}
    </YStack>
  )
}
