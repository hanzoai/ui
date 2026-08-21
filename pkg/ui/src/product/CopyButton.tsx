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
import { type ComponentProps, useEffect, useRef, useState, type ReactNode } from 'react'
import { Text, XStack } from '@hanzo/gui'
import { Check, Copy } from '@hanzogui/lucide-icons-2'

import { tip } from '../backends/gui/slot'
import { useEmit } from './instrument'

/** How long the control shows its confirmation, in ms. */
const CONFIRM = 2000

export interface CopyButtonProps {
  /** The text placed on the clipboard. */
  value: string
  /**
   * Visible text beside the glyph — "Copy key", "Copy address". Omit for the
   * bare square the icon form has always been.
   *
   * There is no second prop and no variant to pick, because the two forms differ
   * in exactly one thing: whether the label is drawn. A control standing alone —
   * under a minted key, beside a wire instruction — has no neighbours to explain
   * it, and an unlabeled glyph there is a guess; inside a code header or a table
   * row the label is noise. Passing the text is what asks for it.
   */
  children?: ReactNode
  /** The tooltip and the accessible name. Defaults to the visible text, else "Copy". */
  label?: string
  /** Edge of the glyph's square. Default 24. */
  size?: number
  /** Names the copied thing in analytics ("api-key", "address"). Never the value. */
  id?: string
  /**
   * Everything else the control's box accepts — a class, a style, an opacity.
   *
   * A copy control is very often HOVER-REVEALED: hanzo/chat's sit at
   * `opacity-0` until the turn is hovered, so a closed prop list meant adopting
   * this one made them permanently visible on every message, which is the whole
   * reason a surface keeps writing its own.
   */
  props?: Omit<ComponentProps<typeof XStack>, 'children' | 'role' | 'onPress'>
}

export function CopyButton({ value, children, label, size = 24, id, props }: CopyButtonProps) {
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

  const name = label ?? (typeof children === 'string' ? children : 'Copy')
  const glyph = Math.round(size * 0.58)

  return (
    <XStack
      // The label form is a pill that sizes to its text; the icon form is the
      // square it has always been. `height` is shared so a labeled control lines
      // up with an unlabeled one in the same row.
      width={children == null ? size : undefined}
      height={size}
      px={children == null ? undefined : '$2'}
      gap={children == null ? undefined : '$1.5'}
      items="center"
      justify="center"
      rounded="$2"
      cursor="pointer"
      opacity={0.7}
      onPress={copy}
      role="button"
      tabIndex={0}
      aria-label={copied ? 'Copied' : name}
      {...tip(copied ? 'Copied' : name)}
      hoverStyle={{ bg: '$color4', opacity: 1 }}
      pressStyle={{ bg: '$color5' }}
      {...props}
    >
      {copied ? <Check size={glyph} /> : <Copy size={glyph} />}
      {children == null ? null : (
        // The word carries the confirmation too. A tick alone, at 14px, beside
        // text that did not change is the smallest possible way to say the thing
        // the control exists to say.
        <Text fontSize="$2" color="$color12" numberOfLines={1}>
          {copied ? 'Copied' : children}
        </Text>
      )}
    </XStack>
  )
}
