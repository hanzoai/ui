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
 * Escape and ArrowUp are not bound. Dismissal belongs to whatever the composer
 * floats inside, and history recall needs a turn store this has no view of.
 *
 * Growth is `Textarea`'s and follows the content, so a wrapped paragraph raises
 * the field. `rows` is the floor, `maxHeight` the ceiling.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { ArrowUp, Square } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'

import { Button, Textarea } from '../backends/gui'
import { slot } from '../backends/gui/slot'
import { ready, sends, type Mods } from './send'

/** `onChange` is dropped: here it carries the draft, not a DOM change event. */
type Stack = Omit<ComponentProps<typeof YStack>, 'children' | 'onChange'>
type FieldProps = Omit<ComponentProps<typeof Textarea>, 'value' | 'onChangeText'>

const PAD = 8
const MIN_ROWS = 1

/** How tall the field may grow before it scrolls, px. Uncapped, a long paste
 *  pushes the thread off screen; narrower frames pass their own. */
const CEILING = 200

/** Floor for the field, px. `Textarea` defaults to 64, which is three lines of
 *  chrome before anything is typed. 44 is the touch-target floor. */
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

export interface ComposerProps extends Stack {
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
  /**
   * The accessible name of the field, independent of `placeholder`.
   *
   * A placeholder that rotates renames the control on every tick and gets the
   * field re-announced mid-sentence. The name is stable; the placeholder is
   * decoration.
   */
  label?: string
  /** The field's own props — a ref, a testid, focus handlers, a paste handler. */
  field?: FieldProps
  /** Replaces the send control. `children` is the START of the footer row, so a
   *  second commit mode has nowhere else to go. */
  send?: ReactNode
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
  label,
  field,
  send,
  ...props
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
      {...props}
    >
      <Textarea
        {...slot('composer-field')}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        borderWidth={0}
        minH={FLOOR}
        maxH={maxHeight}
        aria-label={label ?? placeholder}
        {...field}
        // After `field`: spread over, a caller's `onKeyDown` would replace the
        // Enter rule and the IME guard. Theirs runs first and can claim the key.
        value={value}
        onChangeText={onChange}
        onKeyDown={(e: any) => {
          field?.onKeyDown?.(e)
          if (!e?.defaultPrevented) keyed(e)
        }}
      />
      <XStack items="center" gap={PAD}>
        {children}
        <XStack flex={1} />
        {hint ? (
          <SizableText size="$1" color="$color10">
            {hint}
          </SizableText>
        ) : null}
        {send ?? (
          <Button
            {...slot('composer-send')}
            size="sm"
            disabled={busy ? !onStop : !sendable}
            onPress={busy ? onStop : onSend}
            aria-label={busy ? 'Stop' : 'Send'}
          >
            {busy ? <Square size={14} /> : <ArrowUp size={16} />}
          </Button>
        )}
      </XStack>
    </YStack>
  )
}
