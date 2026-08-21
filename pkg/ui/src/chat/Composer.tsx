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
 *
 * Two keys are deliberately absent, because the surfaces do not agree that they
 * exist. ESCAPE is bound in none of the three main composers — only in chat's
 * two SUB-composers, where it dismisses the thing they float over
 * (`SelectionAsk.tsx:85`, `EditMessage.tsx:124`), which is the host's concern
 * and not the field's. ARROWUP recalls the last turn in exactly one composer,
 * chat's (`useHandleKeyUp.ts:117`), and it does it by finding
 * `document.getElementById('edit-' + parentMessageId)` and clicking it — it is
 * a binding to their edit-in-place, not a general history recall, and there is
 * nothing here for it to reach. Adding either would be inventing an interaction
 * and then asking three surfaces to adopt it.
 *
 * Growth is `Textarea`'s and it is LINE-DRIVEN, not DOM-measured: the row count
 * follows the newlines in the value, which is what lets web, native and desktop
 * grow identically. The tradeoff is real and worth knowing before you adopt —
 * a draft that soft-wraps without ever containing a `\n` does not raise the row
 * count, so a long unbroken paragraph scrolls inside the floor instead of
 * growing the field. Fixing that means measuring `scrollHeight`, which is the
 * DOM-only path the five hand-rolled composers each took and the reason none of
 * them runs on native. It is a `Textarea` decision, not a chat one.
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
 * How tall the field may grow before it scrolls, px.
 *
 * 200 is the number three independent composers reached — hanzo.app `/chat`
 * (`page.tsx:184`, `Math.min(el.scrollHeight, 200)`), hanzo/chat's
 * `AnswerComposer.tsx:134`, and the extension's `answer/Composer.tsx:81`
 * (`maxH={200}`). The two that differ are both fitting a NARROWER frame — the
 * extension's in-page overlay caps at 110 (`content-script.ts:1340`) and its
 * sidebar at 120 — and the one that differs upward, chat's main composer at
 * `max-h-[45vh]`, is the full-page surface. So 200 is the default and the
 * ceiling is a prop.
 *
 * Uncapped is not an option: the field would grow with the draft until a long
 * paste owned the viewport and pushed the thread it belongs to off screen.
 * Nothing capped it here before.
 */
const CEILING = 200

/**
 * Floor for the field, px.
 *
 * `Textarea` is a form control and stands 64px tall by default, which is right
 * for a message body in a form and wrong for a composer: it is three lines of
 * chrome before anything is typed. Every surface sets its own — 44 in chat
 * (`ChatForm.tsx:334`) and in the app builder (`COMPOSER_MIN_H`), 48 in the app
 * `/chat`. 44 is both the mode and this package's touch-target floor, so the
 * one-line composer is exactly as tall as the smallest thing you are allowed to
 * tap.
 */
const FLOOR = 44

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
  /** Ceiling for that growth, px. Past it the field scrolls instead. */
  maxHeight?: number
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
  maxHeight = CEILING,
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
        minH={FLOOR}
        maxH={maxHeight}
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
