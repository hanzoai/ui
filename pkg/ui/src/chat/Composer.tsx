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
import { ArrowUp, ChevronDown, CornerDownLeft, Square } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'

import { Button, Textarea } from '../backends/gui'
import { slot, tip } from '../backends/gui/slot'
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
 * The one-line frame: 40px outside, so the field inside is 38 — a 20px line
 * with 9px above and below it. The frame is the target, not the glyph, which
 * is why the send control can be a 28px mark inside a row a thumb already hits.
 */
const LINE = 40
const LINE_FIELD = LINE - 2
const LINE_PAD = (LINE_FIELD - 20) / 2

/** The inline send mark: a glyph in the field's own row, never a filled slab. */
const MARK = 28

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
  /**
   * Drawn ABOVE the frame — the row of context a draft is sent with (where it
   * runs, which repository, which branch). Outside the frame on purpose: it
   * says what the draft is about, and the field says what it is.
   */
  head?: ReactNode
  /**
   * Drawn UNDER the frame — attach, voice, mode at its start and the model at
   * its end, as the host arranges them. Unlike `children`, which lives inside
   * the frame beside the send control.
   */
  foot?: ReactNode
  /**
   * One line: the field and the send control share a single row inside the
   * frame, and the send control is a glyph at the field's end — Enter's own
   * mark while idle, Stop while busy. `children` and `hint` join that row
   * before it. Unset, the frame is the stacked field-over-toolbar it has
   * always been.
   */
  inline?: boolean
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
  head,
  foot,
  inline = false,
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

  const input = (
    <Textarea
      {...slot('composer-field')}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      borderWidth={0}
      {...(inline
        ? {
            flex: 1,
            minW: 0,
            minH: LINE_FIELD,
            px: 0,
            pt: LINE_PAD,
            pb: LINE_PAD,
            bg: 'transparent',
          }
        : { minH: FLOOR })}
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
  )

  const said = hint ? (
    <SizableText size="$1" color="$soft">
      {hint}
    </SizableText>
  ) : null

  const frame = inline ? (
    <XStack
      {...slot('composer')}
      width="100%"
      items="center"
      rounded="$3"
      borderWidth={1}
      borderColor="$rim"
      bg="$hover"
      pl="$3"
      pr="$1.5"
      gap="$1.5"
      {...props}
    >
      {input}
      {children}
      {said}
      {send ?? (
        <XStack
          {...slot('composer-send')}
          {...tip(busy ? 'Stop' : 'Send')}
          role="button"
          tabIndex={busy ? (onStop ? 0 : -1) : sendable ? 0 : -1}
          aria-label={busy ? 'Stop' : 'Send'}
          aria-disabled={busy ? !onStop : !sendable}
          width={MARK}
          height={MARK}
          shrink={0}
          rounded="$2"
          items="center"
          justify="center"
          cursor={(busy ? onStop : sendable) ? 'pointer' : 'default'}
          opacity={(busy ? onStop : sendable) ? 1 : 0.6}
          hoverStyle={{ bg: '$raised' }}
          onPress={() => (busy ? onStop?.() : sendable ? onSend() : undefined)}
          onKeyDown={(e: any) => {
            if (e?.key !== 'Enter' && e?.key !== ' ') return
            e.preventDefault?.()
            if (busy) onStop?.()
            else if (sendable) onSend()
          }}
        >
          {busy ? <Square size={12} color="$soft" /> : <CornerDownLeft size={14} color="$soft" />}
        </XStack>
      )}
    </XStack>
  ) : (
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
      {input}
      <XStack items="center" gap={PAD}>
        {children}
        <XStack flex={1} />
        {said}
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

  // With nothing above or below it the composer IS the frame, exactly as it
  // was before either existed — no wrapper, so every caller's tree is unchanged.
  if (!head && !foot) return frame

  return (
    <YStack {...slot('composer-shell')} width="100%" gap="$2.5">
      {head ? (
        <XStack {...slot('composer-head')} items="center" gap="$1.5" flexWrap="wrap">
          {head}
        </XStack>
      ) : null}
      {frame}
      {foot ? (
        <XStack {...slot('composer-foot')} items="center" gap="$2" px="$1.5" mt={-4}>
          {foot}
        </XStack>
      ) : null}
    </YStack>
  )
}

type Row = Omit<ComponentProps<typeof XStack>, 'children'>

export interface ComposerToolProps extends Row {
  /** The control's name — what a screen reader says and the tooltip shows. */
  label: string
  icon?: ReactNode
  /** Words drawn after the icon — a mode, a model. Absent, the tool is icon-only. */
  text?: string
  /** A trailing caret: this opens a menu. */
  caret?: boolean
  onPress?: () => void
  disabled?: boolean
}

/**
 * ComposerTool — one quiet control in a composer's `foot` or `head`: attach,
 * voice, a mode, the model. 24px tall, muted until pointed at, and a real
 * button to the keyboard. Its name is `label` whether or not it shows words,
 * because an icon-only control is the whole navigation for someone who cannot
 * see the icon.
 */
export function ComposerTool({
  label,
  icon,
  text,
  caret = false,
  onPress,
  disabled = false,
  ...rest
}: ComposerToolProps) {
  return (
    <XStack
      {...slot('composer-tool')}
      {...tip(label)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-haspopup={caret ? 'menu' : undefined}
      height={24}
      px={text ? '$1.5' : '$1'}
      gap="$1"
      items="center"
      rounded="$2"
      shrink={0}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={disabled ? undefined : { bg: '$hover' }}
      focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
      hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
      onPress={disabled ? undefined : onPress}
      onKeyDown={(e: any) => {
        if (disabled || (e?.key !== 'Enter' && e?.key !== ' ')) return
        e.preventDefault?.()
        onPress?.()
      }}
      {...rest}
    >
      {icon ? (
        <XStack aria-hidden items="center">
          {icon}
        </XStack>
      ) : null}
      {text ? (
        <SizableText size="$2" color="$quiet" numberOfLines={1}>
          {text}
        </SizableText>
      ) : null}
      {caret ? <ChevronDown size={12} color="$soft" aria-hidden /> : null}
    </XStack>
  )
}
