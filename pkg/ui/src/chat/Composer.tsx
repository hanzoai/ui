'use client'

/**
 * Composer — the one composer every Hanzo surface draws: Chat, Dev, Studio, a
 * room, a reply, a run being steered. A surface hands it slots and defaults and
 * nothing else; the field, the keys, the controls and their look are here once.
 *
 *   ┌ pills ───────────────────────────────┐   where a run goes, which repository
 *   │ the field                            │
 *   │ +  carried…  children     ✦  🎙  ⬆   │   + menu, what the draft carries,
 *   └──────────────────────────────────────┘   commands, dictation, send / stop
 *     chips…                 model effort mode
 *
 * Above the frame: the surface's `head`, the `/` or `@` list, and the `note`.
 * Under it, one row: the surface's chips, then the model, the effort and the mode.
 *
 * THE PERSON'S SETTING (@hanzo/appearance `useComposing`, Settings →
 * Appearance) decides which key sends and whether the chips, the model
 * selector and the mode are drawn, everywhere at once. An axis they left on
 * Auto takes the surface's `defaults`, and the model selector is off until
 * they turn it on.
 *
 * Its paint is @hanzo/design's: `$` tokens and `--primary`, sized through
 * `--density` (the round controls are @hanzo/composer's `Control`), so text
 * size, density and accent change it with the rest of the product.
 *
 * Its own words are the reader's language (@hanzo/i18n `t`). A host's words —
 * its placeholder, a shelf's rows, a chip's label — are drawn as given.
 */
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { useComposing, type Composing } from '@hanzo/appearance'
import { Control } from '@hanzo/composer'
import { SizableText, useMedia, XStack, YStack } from '@hanzo/gui'
import { phrase } from '@hanzo/i18n'
import { Voice, type Machine } from '@hanzo/voice'
import { ArrowUp, AudioLines, Square, X } from '@hanzogui/lucide-icons-2'

import { Textarea } from '../backends/gui'
import { slot } from '../backends/gui/slot'
import { glass } from '../glass'
import { useTranslate } from '../i18n/react'
import type { PauseSource } from '../models/catalog'
import { Pills } from '../product/ChipSelect'
import { Dial } from './Dial'
import { Dictation } from './Dictation'
import { Mention, trigger } from './Mention'
import { Palette, type Command } from './Palette'
import { Plus, type PlusProps, type Shelf } from './Plus'
import { RING } from './ring'
import { ready, sends, type Mods } from './send'
import { useComposerStatus } from './Status'
import { Chips, Tune, type Chip, type Mind, type Modes } from './Tune'

/** `onChange` is dropped: here it carries the draft, not a DOM change event. */
type Stack = Omit<ComponentProps<typeof YStack>, 'children' | 'onChange'>
type FieldProps = Omit<ComponentProps<typeof Textarea>, 'value' | 'onChangeText'>

/**
 * The resting placeholder. It addresses the person rather than the mechanism,
 * and as one constant it never re-announces when the model changes.
 */
export const ASK = phrase('Ask anything')

/** The reading measure: @hanzo/design's prose width, which Width (appearance) retunes. */
export const MEASURE = 'var(--container-prose, 48rem)'

/** The space between turns, px: one rhythm for every thread. */
export const GAP = 20

/** The composer's width under a thread: the measure less its 0.75rem gutters, centred, so its edges are the text's. */
export const measure = {
  width: 'calc(100% - 1.5rem)',
  maxW: `calc(${MEASURE} - 1.5rem)`,
  mx: 'auto',
} as const

/** The round controls' box, px, and a phone's, a thumb's width kept small so the frame is a slim glass bar: `+`, the effort, the mic, its chevron and send all take it, so they share one centreline. The pills stand as tall. */
export const ROUND = 32
const TAP = 36

/** The space between two things in a row of the frame, px: one gap, so a row reads evenly set. */
const SPACE = 4

/** The frame's corner, px: 12 on a laptop; on a phone the inset plus a control's radius, so the send's circle and the frame's corner are concentric. */
const CORNER = 12
const CORNER_PHONE = 24

/** How tall the field grows before it scrolls, px. */
const CEILING = 200

/** The ink on a filled round: the accent's own foreground. */
const ON = 'var(--primary-foreground)'

/** A round control with no ground of its own until it is pointed at. */
const QUIET = {
  bg: 'transparent',
  color: 'var(--foreground)',
  hoverStyle: { bg: '$hover' },
} as const

/** What the draft carries, as a chip: a filled tab after `+` on a laptop; on a phone a pill in a row of its own above the field, the pills' shape (round, a hairline, no fill) as tall as the controls, so the controls' row never wraps. */
const CARRIED = {
  height: 28,
  rounded: 8,
  bg: '$hover',
  paddingInlineStart: 8,
} as const
const pill = (height: number) =>
  ({
    height,
    rounded: 999,
    borderWidth: 1,
    borderColor: '$borderColor',
    bg: 'transparent',
    paddingInlineStart: 12,
  }) as const

/**
 * Under a coarse pointer @hanzo/design floors every button at `--tap-target`,
 * 44px, with !important. The composer's controls are its secondary chrome — the
 * field, the column's width, is the target (see @hanzo/composer `Control`) — and
 * each is sized on purpose, so inside the frame and the row under it the floor
 * is WCAG 2.5.8's 24px. Without it a phone draws every control, pill and chip
 * at 44: the slabs the 36px bar was set to replace.
 */
// inline-style: a custom property, which no gui prop carries.
const FLOOR = { '--tap-target': '24px' } as CSSProperties

/** One thing the draft carries, after `+`: a file, a skill that is on. */
export interface Carried {
  id: string
  label: string
  icon?: ReactNode
  onRemove: () => void
}

export interface ComposerProps extends Stack {
  value: string
  onChange: (value: string) => void
  /** The draft is submitted. Clearing `value` is the host's job. */
  onSend: () => void
  /** Called instead of `onSend` while `busy`. Absent, busy only disables send. */
  onStop?: () => void
  /** A turn is in flight: send becomes stop. */
  busy?: boolean
  disabled?: boolean
  /** Whether send is lit. Default: the draft has words. */
  ready?: boolean
  placeholder?: string
  /** The field's accessible name, independent of the placeholder. */
  label?: string
  /** Row floor for the field. It grows with the draft from here. */
  rows?: number
  /** Ceiling for that growth, px. Past it the field scrolls. */
  maxHeight?: number
  /** The field's own props — a ref, a testid, a paste handler. */
  field?: FieldProps
  /** A word at the end of the tool row, before the controls: a status. */
  hint?: string
  /** Account usage and context control; null hides a host-provided control. */
  status?: ReactNode
  /** The tool row's start, after `+` and what the draft carries. */
  children?: ReactNode
  /** Above the frame, at its width: what the draft is sent with, a banner. */
  head?: ReactNode
  /** The frame's first row: the surface's pills — where a run goes, which repository, which branch. */
  pills?: ReactNode
  /** What the draft carries, as chips after `+`. */
  carried?: readonly Carried[]
  /** The `+` menu. Absent, there is none. */
  plus?: PlusProps
  /** `/` lists these (the skills) above the frame. */
  slash?: Shelf
  /** `@` lists these (the plugins) above the frame. */
  at?: Shelf
  /** The commands ✦ and ⌘K open. */
  commands?: readonly Command[]
  /** Under the frame, at the row's start. Hidden where the person hid chips. */
  chips?: readonly Chip[]
  /** The model, drawn where the person turned the model selector on. Null where the next send names none (steering a run). */
  mind?: Mind | null
  /** The effort, one in force. Null where the next send takes none (steering a run). */
  effort?: Modes | null
  limits?: PauseSource | null
  /** A model the plan does not grant was chosen: the way to the plan that does. */
  onUpgrade?: (model: string) => void
  /** The mode, as the pill at the row's end. */
  mode?: Modes | null
  /** Dictation into the draft (@hanzo/voice `useVoice` + `useDictation`). */
  voice?: Machine
  /** The language dictation listens in, null for Auto, and how to change it. */
  language?: string | null
  onLanguage?: (id: string | null) => void
  /** A spoken conversation (@hanzo/voice `useTalk`): the round button while the draft is empty. */
  talk?: Machine
  /** Above the frame, nearest it: the person's suggestions, at every width. */
  starters?: ReactNode
  /** Centred just above the frame: what every message is sent under. */
  note?: ReactNode
  /** At the reading column's width (`measure`), centred: the composer under a thread, so its edges are the text's. Absent, the width of what holds it. */
  column?: boolean
  /** Drawn on a pane: the frame floats as a pane of its own. */
  framed?: boolean
  /** A phone: every control is 36px, the pills as tall, each row evenly set. Absent, the viewport decides. */
  narrow?: boolean
  /** This surface's answer where the person left an axis on Auto. */
  defaults?: Composing
}

/** Ctrl+U (⌘U) uploads, while a composer with an upload is on the page. */
export function useUpload(upload: (() => void) | undefined): void {
  const now = useRef(upload)
  now.current = upload
  useEffect(() => {
    if (!upload) return
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        now.current?.()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [Boolean(upload)]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** The modifier state off a keydown, web or native. */
const modsOf = (e: { nativeEvent?: Mods; key?: string } & Mods): Mods => ({
  shiftKey: e.shiftKey ?? e.nativeEvent?.shiftKey,
  altKey: e.altKey ?? e.nativeEvent?.altKey,
  metaKey: e.metaKey ?? e.nativeEvent?.metaKey,
  ctrlKey: e.ctrlKey ?? e.nativeEvent?.ctrlKey,
  isComposing: e.isComposing ?? e.nativeEvent?.isComposing,
  // Safari's only honest IME signal on this keydown.
  keyCode: e.keyCode ?? e.nativeEvent?.keyCode,
})

/**
 * How far the software keyboard covers the page, px: the layout viewport less the
 * visual one. A phone keyboard that does not shrink the layout leaves a fixed
 * composer under it; this is how far to lift it. Zero where the layout follows the
 * keyboard (the browser resized it) and wherever there is no keyboard.
 */
function useLift(): number {
  const [lift, setLift] = useState(0)
  useEffect(() => {
    const vv = typeof window === 'undefined' ? null : window.visualViewport
    if (!vv) return
    const read = () => {
      const covered = Math.round(window.innerHeight - vv.height - vv.offsetTop)
      // A bar of the browser's own coming and going is not a keyboard.
      setLift(covered > 100 ? covered : 0)
    }
    read()
    vv.addEventListener('resize', read)
    vv.addEventListener('scroll', read)
    return () => {
      vv.removeEventListener('resize', read)
      vv.removeEventListener('scroll', read)
    }
  }, [])
  return lift
}

export function Composer({ value, onChange, onSend, onStop, busy = false, disabled = false, ready: readyProp, placeholder, label, rows = 1, maxHeight = CEILING, field, hint, status, children, head, pills, carried, plus, slash, at, commands, chips, mind, effort, limits, onUpgrade, mode, voice, language = null, onLanguage, talk, starters, note, column = false, framed = false, narrow: narrowProp, defaults, ...props }: ComposerProps) {
  const t = useTranslate()
  const inheritedStatus = useComposerStatus()
  const media = useMedia()
  const narrow = narrowProp ?? !media.sm
  const hit = narrow ? TAP : ROUND
  const lift = useLift()
  const chosen = useComposing()
  const rule = chosen.send ?? defaults?.send ?? 'enter'
  const showChips = chosen.chips ?? defaults?.chips ?? true
  const showModel = chosen.model ?? defaults?.model ?? false
  const showMode = chosen.mode ?? defaults?.mode ?? true

  const lit = readyProp ?? ready(value)
  const live = busy ? Boolean(onStop) : lit && !disabled
  useUpload(plus?.upload)

  // `/` and `@`: the shelf the caret's word opens, filtered by what follows it.
  const [index, setIndex] = useState(0)
  const [closed, setClosed] = useState<string | null>(null)
  const typed = trigger(value)
  const shelf = typed ? (typed.char === '/' ? slash : at) : undefined
  const listed = shelf && typed && closed !== value ? shelf.rows.filter((r) => r.label.toLowerCase().includes(typed.query)).slice(0, 8) : null
  const row = Math.min(index, Math.max(0, (listed?.length ?? 1) - 1))
  useEffect(() => setIndex(0), [typed?.char, typed?.query])
  const pick = (id: string) => {
    if (!typed || !shelf) return
    onChange(value.slice(0, typed.at).trimEnd() + (typed.at > 0 ? ' ' : ''))
    shelf.pick(id)
  }

  const [palette, setPalette] = useState(false)

  const submit = () => {
    if (listed?.length) return pick(listed[row]!.id)
    if (live && !busy) onSend()
  }

  const keyed = (e: any) => {
    const key: string = e?.key ?? e?.nativeEvent?.key ?? ''
    const mods = modsOf(e ?? {})
    if (listed) {
      if (key === 'ArrowDown') {
        e.preventDefault?.()
        return setIndex((i) => Math.min(i + 1, listed.length - 1))
      }
      if (key === 'ArrowUp') {
        e.preventDefault?.()
        return setIndex((i) => Math.max(0, i - 1))
      }
      if (key === 'Escape') {
        e.preventDefault?.()
        return setClosed(value)
      }
    }
    if (commands?.length && (mods.metaKey || mods.ctrlKey) && key.toLowerCase() === 'k') {
      e.preventDefault?.()
      return setPalette(true)
    }
    if (!sends(key, mods, rule)) return
    e.preventDefault?.()
    submit()
  }

  const input = (
    <Textarea
      {...slot('composer-field')}
      rows={rows}
      placeholder={placeholder ?? t(ASK)}
      disabled={disabled}
      borderWidth={0}
      fontSize={16}
      lineHeight={24}
      px={8}
      pt={2}
      pb={0}
      minH={26}
      maxH={maxHeight}
      bg="transparent"
      aria-label={label ?? placeholder ?? t(ASK)}
      {...field}
      // After `field`: a caller's `onKeyDown` runs first and can claim the key,
      // but cannot replace the send rule and the IME guard.
      value={value}
      onChangeText={onChange}
      onKeyDown={(e: any) => {
        field?.onKeyDown?.(e)
        if (!e?.defaultPrevented) keyed(e)
      }}
    />
  )

  const round = (
    <Control
      type="button"
      size={hit}
      fill
      rounded={999}
      {...slot('composer-send')}
      aria-label={t(busy ? 'Stop' : 'Send')}
      aria-disabled={!live || undefined}
      opacity={live ? 1 : 0.4}
      focusVisibleStyle={RING}
      onClick={() => {
        if (!live) return
        if (busy) onStop?.()
        else onSend()
      }}
    >
      {busy ? <Square size={13} color={ON} fill={ON} /> : <ArrowUp size={16} strokeWidth={2.5} color={ON} />}
    </Control>
  )

  const mention = listed && shelf && typed ? <Mention shelf={shelf} rows={listed} index={row} onPick={pick} skills={typed.char === '/'} /> : null

  const above =
    starters || head || note || mention ? (
      <YStack {...slot('composer-head')} gap="$1.5">
        {starters}
        {head}
        {mention}
        {note ? (
          <SizableText {...slot('composer-note')} fontSize={12} color="$soft" text="center" self="center">
            {note}
          </SizableText>
        ) : null}
      </YStack>
    ) : null

  const things = (carried ?? []).map((c) => (
    <XStack key={c.id} {...slot('composer-carried')} items="center" gap={6} paddingInlineEnd={4} maxW={180} {...(narrow ? pill(hit) : CARRIED)}>
      {c.icon ? <XStack aria-hidden>{c.icon}</XStack> : null}
      <SizableText fontSize={13} color="$ink" numberOfLines={1} shrink={1}>
        {c.label}
      </SizableText>
      <XStack render="button" aria-label={t('Remove {name}', { name: c.label })} onPress={c.onRemove} width={20} height={20} rounded={narrow ? 999 : 6} items="center" justify="center" hoverStyle={{ bg: '$raised' }} cursor="pointer">
        <X size={12} color="$hint" />
      </XStack>
    </XStack>
  ))

  const shown = showChips && chips?.length ? chips : null
  const tuned = (showModel && mind) || (showMode && mode)
  const under =
    shown || tuned ? (
      <XStack {...slot('composer-foot')} items="center" gap={6} flexWrap="wrap" rowGap={4} width="100%" style={FLOOR}>
        {shown ? <Chips chips={shown} /> : null}
        {tuned ? <Tune mind={showModel ? mind : null} mode={showMode ? mode : null} onUpgrade={onUpgrade} limits={limits} /> : null}
      </XStack>
    ) : null

  return (
    <YStack {...slot('composer-shell')} {...(column ? measure : { width: '100%' })} gap={6} {...(lift ? { mb: lift } : null)} {...props}>
      {above}
      <YStack {...slot('composer')} width="100%" rounded={CORNER} borderWidth={1} {...glass(2)} p={6} pt={pills || (narrow && things.length) ? 6 : 10} gap={SPACE} $max-sm={{ rounded: CORNER_PHONE }} {...(framed ? { boxShadow: 'var(--shadow-sheet-1)' } : null)} style={FLOOR}>
        {pills ? (
          // The pills stand as tall as the controls (`Pills`), at the controls' edge, so the frame's rows share one rhythm.
          <XStack {...slot('composer-pills')} items="center" gap={SPACE} flexWrap="wrap" rowGap={SPACE}>
            <Pills.Provider value={hit}>{pills}</Pills.Provider>
          </XStack>
        ) : null}
        {narrow && things.length ? (
          <XStack {...slot('composer-carry')} items="center" gap={SPACE} flexWrap="wrap" rowGap={SPACE}>
            {things}
          </XStack>
        ) : null}
        {input}
        <XStack items="center" gap={SPACE}>
          <XStack {...slot('composer-start')} items="center" gap={SPACE} flex={1} minW={0} flexWrap="wrap">
            {plus ? <Plus {...plus} size={hit} disabled={disabled || plus.disabled} /> : null}
            {narrow ? null : things}
            {children}
          </XStack>
          <XStack {...slot('composer-end')} items="center" gap={SPACE} shrink={0}>
            {hint ? (
              <SizableText size="$1" color="$soft" numberOfLines={1}>
                {hint}
              </SizableText>
            ) : null}
            {status === undefined ? inheritedStatus : status}
            {effort ? <Dial effort={effort} size={hit} narrow={narrow} disabled={disabled} /> : null}
            {commands?.length ? <Palette commands={commands} open={palette} onOpenChange={setPalette} size={hit} disabled={disabled} /> : null}
            {voice ? <Dictation voice={voice} disabled={disabled} size={hit} gap={narrow ? SPACE : 0} language={language} {...(onLanguage ? { onLanguage } : {})} /> : null}
            {!busy && !lit && talk ? (
              // Voice mode is a plain mark on a laptop, as the mic is, and the filled round on a phone.
              <Control asChild size={hit} fill={narrow} rounded={999} {...(narrow ? null : QUIET)} focusVisibleStyle={RING}>
                <Voice
                  voice={talk}
                  disabled={disabled}
                  data-slot="composer-talk"
                  says={{
                    idle: t('Voice mode'),
                    listening: t('In conversation — click to hang up'),
                    speaking: t('Hanzo is speaking — talk to interrupt'),
                  }}
                >
                  {() => <AudioLines size={16} color={narrow ? ON : 'var(--foreground)'} />}
                </Voice>
              </Control>
            ) : (
              round
            )}
          </XStack>
        </XStack>
      </YStack>
      {under}
    </YStack>
  )
}
