'use client'

/**
 * Feedback — copy a reply, and say whether it was good.
 *
 * Ported from build-v2 `components/editor/ask-ai/chat-thread.tsx` (MIT, derived
 * from OSW Studio and DeepSite — see NOTICE). It goes in `Message`'s `actions`
 * slot, which is where chat already puts a turn's row of controls; v2 drew the
 * same three buttons under every settled turn.
 *
 * The verdict is a toggle: pressing the chosen thumb again takes it back. Where
 * it goes — an analytics event, a reward signal — is the host's `onVerdict`.
 */
import { XStack } from '@hanzo/gui'
import { Check, Copy, ThumbsDown, ThumbsUp } from '@hanzogui/lucide-icons-2'
import { type ComponentProps, useEffect, useRef, useState } from 'react'

import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'

type Row = Omit<ComponentProps<typeof XStack>, 'children'>

export type Verdict = 'up' | 'down' | null

export interface FeedbackProps extends Row {
  /** What Copy puts on the clipboard. Omit and there is no Copy. */
  text?: string
  /** Controlled verdict. Omit to let the row hold its own. */
  verdict?: Verdict
  onVerdict?: (verdict: Verdict) => void
}

export function Feedback({ text, verdict, onVerdict, ...rest }: FeedbackProps) {
  const [held, setHeld] = useState<Verdict>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])
  const current = verdict === undefined ? held : verdict

  const judge = (next: 'up' | 'down') => {
    const settled = current === next ? null : next
    setHeld(settled)
    onVerdict?.(settled)
  }

  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      /* a browser that refuses the clipboard leaves the button as it was */
    }
  }

  const icon = { variant: 'ghost', size: 'icon-sm', minHeight: 28, minWidth: 28, type: 'button' } as const
  return (
    <XStack {...slot('feedback')} items="center" gap={2} {...rest}>
      {text ? (
        <Button {...icon} aria-label={copied ? 'Copied' : 'Copy reply'} title={copied ? 'Copied' : 'Copy'} onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </Button>
      ) : null}
      <Button
        {...icon}
        aria-label="Good result"
        title="Good result"
        aria-pressed={current === 'up'}
        bg={current === 'up' ? '$raised' : 'transparent'}
        onClick={() => judge('up')}
      >
        <ThumbsUp size={13} />
      </Button>
      <Button
        {...icon}
        aria-label="Bad result"
        title="Bad result"
        aria-pressed={current === 'down'}
        bg={current === 'down' ? '$raised' : 'transparent'}
        onClick={() => judge('down')}
      >
        <ThumbsDown size={13} />
      </Button>
    </XStack>
  )
}
