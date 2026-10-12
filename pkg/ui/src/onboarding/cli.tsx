'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy } from '@hanzogui/lucide-icons-2'
import { Button } from '../backends/gui/button'
import { Paragraph, SizableText, XStack, YStack } from '../backends/gui/layout'
import { Spinner } from '../backends/gui/spinner'
import { COMMANDS, copy, message, readLinks, usePhone, useComputer, type Read } from './launch'
import { Page } from './frame'
import { Primary } from './screens'
import type { Track } from './hooks'

/** One command: its number and name, the command itself on its own wrapped line, and a Copy a thumb can hit. */
function Command({ n, label, run, onCopied }: { n: number; label: string; run: string; onCopied: () => void }) {
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const press = async () => {
    if (!(await copy(run))) return
    onCopied()
    setDone(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDone(false), 1800)
  }
  return (
    <YStack gap="$1.5">
      <SizableText size="$1" color="$quiet">{`${n}. ${label}`}</SizableText>
      <XStack items="center" gap="$2" borderWidth={1} borderColor="$borderColor" bg="$panel" rounded="$4" pl="$3" pr="$1">
        <code style={{ flex: 1, minWidth: 0, padding: '12px 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14, lineHeight: '20px', overflowWrap: 'anywhere' }}>{run}</code>
        <Button type="button" variant="ghost" size="icon-lg" aria-label={done ? 'Copied' : `Copy: ${run}`} onClick={press}>
          {done ? <Check size={18} /> : <Copy size={18} />}
        </Button>
      </XStack>
    </YStack>
  )
}

export interface CliSetupProps {
  /** How the registry is read: `readLinks(api)` where the browser holds the bearer, else the host's own client. */
  read: Read
  track?: Track
  /** A computer signed in. */
  onHost?: (host: string) => void
}

/**
 * The commands and the wait, without a page around them. On a computer: two commands with a Copy each. On a
 * phone: one button that sends them to the computer (the share sheet, else a copied message), with the commands
 * under it for anyone who is at a terminal anyway. `onHost` fires when `hanzo` has registered a computer.
 */
export function CliSetup({ read, track, onHost }: CliSetupProps) {
  const phone = usePhone()
  const host = useComputer(read)
  const [sent, setSent] = useState<string | null>(null)
  const viewed = useRef(false)
  useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    track?.('cli_viewed', { phone })
  }, [phone, track])
  useEffect(() => {
    if (!host) return
    track?.('cli_connected', {})
    onHost?.(host)
    // Once, when the computer appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host])

  const send = useCallback(async () => {
    track?.('cli_sent', {})
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Set up the Hanzo CLI', text: message() })
        setSent('Sent. Open it on your computer.')
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    setSent((await copy(message())) ? 'Copied. Paste it into a message to yourself.' : 'Could not copy. Open hanzo.ai/cli on your computer.')
  }, [track])

  const rows = COMMANDS.map((c, i) => <Command key={c.key} n={i + 1} label={c.label} run={c.run} onCopied={() => track?.('cli_copied', { step: c.key })} />)

  return (
    <YStack gap="$4" width="100%">
      {host ? (
        <Paragraph size="$3" color="$ink" text="center" role="status" m={0}>{`Signed in on ${host}.`}</Paragraph>
      ) : phone ? (
        <>
          <Primary onClick={() => void send()}>Send these commands to my computer</Primary>
          {sent ? <Paragraph size="$2" color="$quiet" text="center" role="status" m={0}>{sent}</Paragraph> : null}
          <details>
            <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>Show the commands</summary>
            <YStack gap="$3" pt="$2">{rows}</YStack>
          </details>
        </>
      ) : (
        <YStack gap="$3">
          {rows}
        </YStack>
      )}
      {host ? null : (
        <XStack gap="$2" items="center" justify="center" role="status">
          <Spinner size={16} />
          <SizableText size="$2" color="$quiet">Waiting for you to sign in…</SizableText>
        </XStack>
      )}
    </YStack>
  )
}

export interface CliProps {
  site?: string
  api: string
  track?: Track
  progress?: { at: number; of: number }
  /** The computer is signed in, or the person is done waiting: go on to the next step. */
  onDone: () => void
  /** Go on without the CLI: the chat and an API key are next. */
  onSkip: () => void
}

/**
 * "Set up the Hanzo CLI": install, then `hanzo`, as a first-run page. It moves on by itself a moment after
 * `hanzo` has registered a computer, and "Skip for now" is always there: the API key and the chat are the
 * other way in.
 */
export function Cli({ site = 'Hanzo', api, track, progress, onDone, onSkip }: CliProps) {
  const phone = usePhone()
  const read = useMemo(() => readLinks(api), [api])
  const [host, setHost] = useState<string | null>(null)
  useEffect(() => {
    if (!host) return
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
    // Once, when the computer appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host])
  return (
    <Page
      site={site}
      title="Set up the Hanzo CLI"
      lede={phone ? 'It runs on your computer. Send yourself the two commands and run them on it.' : 'Two commands, run on your computer. The second signs you in through your browser, links Hanzo Tabs and starts your coding agent.'}
      width={440}
      progress={progress}
      foot={
        <Button
          type="button"
          variant="link"
          size="sm"
          px={0}
          minH={0}
          $touchable={{ py: 14, my: -14 }}
          onClick={() => {
            track?.('cli_skipped', {})
            onSkip()
          }}
        >
          Skip for now: use chat or an API key
        </Button>
      }
    >
      <CliSetup read={read} track={track} onHost={setHost} />
      {host ? <Primary onClick={onDone}>Continue</Primary> : null}
    </Page>
  )
}
