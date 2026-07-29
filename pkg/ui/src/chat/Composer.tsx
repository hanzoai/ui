'use client'

/**
 * Composer — the one chat input for every Hanzo surface.
 *
 * Presentational and controlled: it owns no draft, no transport and no model
 * state. `children` is the toolbar slot, which is where a surface puts its
 * `ModelSelector`, attachment control or mode chips — that keeps the shell the
 * same everywhere while the affordances stay per-surface.
 *
 * The send control is the same button in both states: it submits, and while a
 * turn is in flight it stops. Two buttons in one place was the thing every
 * surface got subtly different.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { ArrowUp, Square } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'

import { Button, Textarea } from '../backends/gui'
import { slot } from '../backends/gui/slot'
import { ready, sends, type Mods } from './send'

const PAD = 8
const MIN_ROWS = 1

/**
 * The resting placeholder.
 *
 * "Ask anything", not "Send a message" and not "Message <model>". It addresses
 * the person rather than describing the mechanism, and being one constant string
 * it never has to be recomputed or re-announced when the model or endpoint
 * changes — which is what a model-named placeholder forces a surface to do.
 */
export const ASK = 'Ask anything'

export interface ComposerProps {
  value: string
  onChange: (value: string) => void
  /** Called when the draft is submitted. Clearing `value` is the host's job. */
  onSend: () => void
  /** Called instead of `onSend` while `busy`. Omit to disable stopping. */
  onStop?: () => void
  /** A turn is in flight: the send control becomes stop. */
  busy?: boolean
  disabled?: boolean
  placeholder?: string
  /** Row floor for the field. It grows with the draft from here. */
  rows?: number
  /** Toolbar slot, rendered at the start of the footer row. */
  children?: ReactNode
  /** Hint shown at the end of the footer row. */
  hint?: string
}

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy = false,
  disabled = false,
  placeholder = ASK,
  rows = MIN_ROWS,
  children,
  hint,
}: ComposerProps) {
  const sendable = ready(value, busy, disabled)

  const keyed = (e: { nativeEvent?: Mods & { key?: string }; key?: string } & Mods) => {
    const key = e.key ?? e.nativeEvent?.key ?? ''
    const mods: Mods = {
      shiftKey: e.shiftKey ?? e.nativeEvent?.shiftKey,
      altKey: e.altKey ?? e.nativeEvent?.altKey,
      metaKey: e.metaKey ?? e.nativeEvent?.metaKey,
      ctrlKey: e.ctrlKey ?? e.nativeEvent?.ctrlKey,
      isComposing: e.isComposing ?? e.nativeEvent?.isComposing,
      // Safari's only honest IME signal on this keydown. Dropping it here would
      // put the mid-candidate submit straight back, whatever `sends` checks.
      keyCode: e.keyCode ?? e.nativeEvent?.keyCode,
    }
    if (!sends(key, mods)) return
    ;(e as { preventDefault?: () => void }).preventDefault?.()
    if (sendable) onSend()
  }

  return (
    <YStack
      {...slot('composer')}
      width="100%"
      rounded="$5"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$background"
      p={PAD}
      gap={PAD}
    >
      <Textarea
        {...slot('composer-field')}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChangeText={onChange}
        onKeyDown={keyed}
        borderWidth={0}
        aria-label={placeholder}
      />
      <XStack items="center" gap={PAD}>
        {children}
        <XStack flex={1} />
        {hint ? (
          <SizableText size="$1" color="$color10">
            {hint}
          </SizableText>
        ) : null}
        <Button
          {...slot('composer-send')}
          size="sm"
          disabled={busy ? !onStop : !sendable}
          onPress={busy ? onStop : onSend}
          aria-label={busy ? 'Stop' : 'Send'}
        >
          {busy ? <Square size={14} /> : <ArrowUp size={16} />}
        </Button>
      </XStack>
    </YStack>
  )
}
