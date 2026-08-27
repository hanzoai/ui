'use client'

/**
 * Screen — watching a run while it works.
 *
 * Some runs have something to look at: a sandbox serving an interactive page, a
 * headful browser a person can watch over VNC. Most have nothing, and this
 * component's first job is to say which it is, honestly — a viewer that draws a
 * black rectangle for a run with no screen has told the reader the run is
 * broken.
 *
 * THE CREDENTIAL NEVER OUTLIVES THE VIEW. A watchable surface is authorized by
 * a short-lived TICKET the caller mints per view; this component asks for one
 * when it mounts, embeds the page the ticket names, and asks for another if the
 * viewer stays past its life. It does NOT take a URL with a long-lived token in
 * it, and there is no prop to pass one — an embed URL ends up in browser
 * history, in a screenshot, and in whatever the parent frame can read.
 *
 * The mint is a PROP, not an import, because who may watch is the surface's
 * question and the answer lives in `@hanzo/ai` on one deployment and behind a
 * BFF on another. This file owns the frame, the states and the refresh.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** What a mint answers with: where to look, and for how long. */
export interface Ticket {
  /** The page to embed. Already carries whatever the grant put in it. */
  url: string
  /** Seconds until it stops working. Absent, the view is not refreshed. */
  expiresIn?: number
}

/** How a run's screen is served, for the label a viewer reads. */
export type ScreenKind = 'sandbox' | 'browser'

const NAMES: Record<ScreenKind, string> = {
  sandbox: 'sandbox',
  browser: 'browser',
}

export interface ScreenProps extends Col {
  /** The run being watched. Changing it re-mints. */
  sessionId: string
  /**
   * What this run has to look at. `null` means nothing does — the honest empty
   * state, and the common case. The caller decides; this component never guesses
   * from a session's shape.
   */
  kind?: ScreenKind | null
  /**
   * Mint a view. Called on mount, on `sessionId` change, and shortly before the
   * previous ticket expires. Throwing renders the failure with a retry.
   */
  mint?: (sessionId: string) => Promise<Ticket>
  /** Shown when `kind` is null. */
  empty?: ReactNode
  title?: string
}

type State =
  | { phase: 'idle' }
  | { phase: 'minting' }
  | { phase: 'watching'; url: string }
  | { phase: 'failed'; message: string }

/** Re-mint at 80% of a ticket's life — early enough that the frame never blinks. */
const EARLY = 0.8

export function Screen({ sessionId, kind, mint, empty, title, ...rest }: ScreenProps) {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const live = useRef(true)

  const open = useCallback(async () => {
    if (!mint || !kind) return
    setState({ phase: 'minting' })
    try {
      const ticket = await mint(sessionId)
      if (!live.current) return
      setState({ phase: 'watching', url: ticket.url })
      if (ticket.expiresIn && ticket.expiresIn > 0) {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => void open(), ticket.expiresIn * 1000 * EARLY)
      }
    } catch (err) {
      if (!live.current) return
      setState({
        phase: 'failed',
        message: err instanceof Error ? err.message : 'Could not open this screen.',
      })
    }
  }, [mint, kind, sessionId])

  useEffect(() => {
    live.current = true
    void open()
    return () => {
      live.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [open])

  if (!kind) {
    return (
      <Frame title={title} {...rest}>
        {empty ?? (
          <SizableText size="$2" color="$soft">
            This run has no screen.
          </SizableText>
        )}
      </Frame>
    )
  }

  if (!mint) {
    return (
      <Frame title={title} {...rest}>
        <SizableText size="$2" color="$soft">
          Watching is not wired up on this surface.
        </SizableText>
      </Frame>
    )
  }

  if (state.phase === 'failed') {
    return (
      <Frame title={title} {...rest}>
        <YStack gap="$2" items="center">
          <SizableText size="$2" color="$soft">
            {state.message}
          </SizableText>
          <SizableText
            size="$2"
            color="$color"
            cursor="pointer"
            role="button"
            tabIndex={0}
            onPress={() => void open()}
          >
            Try again
          </SizableText>
        </YStack>
      </Frame>
    )
  }

  if (state.phase !== 'watching') {
    return (
      <Frame title={title} {...rest}>
        <SizableText size="$2" color="$soft">
          Opening the {NAMES[kind]}…
        </SizableText>
      </Frame>
    )
  }

  return (
    <YStack {...slot('screen')} flex={1} minH={0} bg="$panel" rounded="$4" overflow="hidden" {...rest}>
      {title ? <Caption>{title}</Caption> : null}
      {/*
        A plain element, not a gui primitive: this is an embed and there is no
        cross-platform version of one. `sandbox` withholds everything the page
        does not need — it may run its own scripts and talk to its own origin,
        and it may not navigate this window or reach this document.
      */}
      <iframe
        src={state.url}
        title={title ?? `Live ${NAMES[kind]}`}
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        allow="clipboard-read; clipboard-write"
        style={{ border: 0, width: '100%', height: '100%', flex: 1, display: 'block' }}
      />
    </YStack>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <XStack px="$3" py="$2" borderBottomWidth={1} borderColor="$borderColor">
      <SizableText size="$1" color="$soft" numberOfLines={1}>
        {children}
      </SizableText>
    </XStack>
  )
}

function Frame({ title, children, ...rest }: Col & { title?: string; children: ReactNode }) {
  return (
    <YStack {...slot('screen')} flex={1} minH={0} bg="$panel" rounded="$4" overflow="hidden" {...rest}>
      {title ? <Caption>{title}</Caption> : null}
      <YStack flex={1} items="center" justify="center" p="$4">
        {children}
      </YStack>
    </YStack>
  )
}
