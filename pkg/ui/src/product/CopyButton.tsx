'use client'

/**
 * CopyButton — copy with a confirmation tick.
 *
 * The tick is the point. A control that looks identical before and after leaves
 * the reader unsure whether it fired, and the usual response is to press it
 * again. Reverts after `CONFIRM`, and clears its timer on unmount so it cannot
 * set state on a component that is gone.
 *
 * It lived inside `chat/Code.tsx` and was reachable only as `@hanzo/ui/chat`.
 * Nobody looks in a chat module for a copy button, so every surface wrote its
 * own — an API key here, a deposit address there, a referral link, a wire
 * instruction — each with its own confirmation window, or none. Copying text is
 * not a chat idea; it belongs to the product layer, and `Code` now imports it
 * from here rather than owning it.
 */
import { useEffect, useRef, useState } from 'react'
import { XStack } from '@hanzo/gui'
import { Check, Copy } from '@hanzogui/lucide-icons-2'

import { tip } from '../backends/gui/slot'
import { useEmit } from './instrument'

/** How long the control shows its confirmation, in ms. */
const CONFIRM = 2000

export interface CopyButtonProps {
  /** The text placed on the clipboard. */
  value: string
  /** Resting label — the tooltip and the accessible name. */
  label?: string
  /** Edge of the square hit area. Default 24. */
  size?: number
  /** Names the copied thing in analytics ("api-key", "address"). Never the value. */
  id?: string
}

export function CopyButton({ value, label = 'Copy', size = 24, id }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const track = useEmit()

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = () => {
    // Optional-chained rather than assumed: `navigator.clipboard` is undefined
    // in insecure contexts and absent entirely on native, and these components
    // are meant to run on both.
    navigator?.clipboard
      ?.writeText(value)
      .then(() => {
        // The LENGTH, never the text — a copied value is a password as often as
        // it is a URL.
        track({ component: 'CopyButton', action: 'click', id, value: value.length })
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), CONFIRM)
      })
      .catch(() => {
        // A refused clipboard needs no toast — the missing tick already says it,
        // and an error dialog for a failed copy is louder than the failure.
        track({ component: 'CopyButton', action: 'error', id })
      })
  }

  return (
    <XStack
      width={size}
      height={size}
      items="center"
      justify="center"
      rounded="$2"
      cursor="pointer"
      opacity={0.7}
      onPress={copy}
      role="button"
      tabIndex={0}
      aria-label={copied ? 'Copied' : label}
      {...tip(copied ? 'Copied' : label)}
      hoverStyle={{ bg: '$color4', opacity: 1 }}
      pressStyle={{ bg: '$color5' }}
    >
      {copied ? <Check size={Math.round(size * 0.58)} /> : <Copy size={Math.round(size * 0.58)} />}
    </XStack>
  )
}
