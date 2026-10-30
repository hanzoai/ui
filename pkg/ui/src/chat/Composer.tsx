'use client'

/**
 * Composer — the one composer every Hanzo surface draws: Chat, Dev, Studio, the
 * browser extension, a room, a reply, a run being steered. A surface hands it
 * slots and defaults and nothing else; the field, the keys, the controls and
 * their look are here once.
 *
 *   ╭──────────────────────────────────────╮
 *   │ the field                            │
 *   │                                      │
 *   │ +  carried…  children    ✦  🎙⌄  ◌  │   + menu, what the draft carries,
 *   ╰──────────────────────────────────────╯   commands, dictation, voice ⇄ send
 *     Project ⌄  chips…   usage  Model Effort Mode
 *
 * ONE SURFACE: a rounded rectangle a step above the ground it stands on
 * (`--composer-ground`), one even 1px edge all the way round and nothing inset
 * along its top. The edge brightens softly under a pointer and on focus. A
 * conversation nothing keeps (`forgetful`) is the same frame with no ground, its
 * edge dashed — the one cue, so nothing above the composer has to say it.
 *
 * ONE ROW of controls inside the frame's foot: ghosts on one centreline, one
 * glyph size, their ink lifting under a pointer. The last place is voice mode
 * while the draft is empty and send once it has words — send fades and grows in
 * there, so the row never shifts as the draft fills.
 *
 * UNDER THE FRAME, one quiet line of words at the frame's text edge: where a
 * run goes (the surface's pills) and its chips at the start; the host's usage,
 * the model, the effort and the mode at the end. It wraps on a phone.
 *
 * Above the frame: the surface's `head`, the `/` or `@` list, and the `note`.
 *
 * THE PERSON'S SETTING (@hanzo/appearance `useComposing`, Settings →
 * Appearance) decides which key sends and whether the chips, the model
 * selector and the mode are drawn, everywhere at once. An axis they left on
 * Auto takes the surface's `defaults`; the model is drawn until they turn it
 * off.
 *
 * Its paint is @hanzo/design's: `$` tokens and `--primary`, sized through
 * `--density` (the round controls are @hanzo/composer's `Control`), so text
 * size, density and accent change it with the rest of the product.
 *
 * Its own words are the reader's language (@hanzo/i18n `t`). A host's words —
 * its placeholder, a shelf's rows, a chip's label — are drawn as given.
 */
import { SizableText, useMedia, XStack, YStack } from '@hanzo/gui'
import { useComposing, type Composing } from '@hanzo/appearance'
import { Control } from '@hanzo/composer'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import { ArrowUp, AudioLines, Square, X } from '@hanzogui/lucide-icons-2'
import { Voice, type Machine } from '@hanzo/voice'
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'

import { Textarea } from '../backends/gui'
import { slot } from '../backends/gui/slot'
import { glass } from '../glass'
import type { PauseSource } from '../models/catalog'
import { Pills } from '../product/ChipSelect'
import { Dictation } from './Dictation'
import { Mention, trigger } from './Mention'
import { Palette, type Command } from './Palette'
import { Plus, type PlusProps, type Shelf } from './Plus'
import { ready, sends, type Mods } from './send'
import { GHOST, GLYPH, RING, STROKE } from './look'
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
export const measure = { width: 'calc(100% - 1.5rem)', maxW: `calc(${MEASURE} - 1.5rem)`, mx: 'auto' } as const

/** The round controls' box, px, and a phone's, a thumb's width kept small so the frame stays a slim bar: `+`, the mic, voice and send all take it, so they share one centreline. */
export const ROUND = 32
const TAP = 36

/** The space between two things in a row, px: one gap, so a row reads evenly set. */
const SPACE = 4

/** The frame's corner, px. */
const CORNER = 16

/** The frame's edge, px: one whole pixel, so it lands on the pixel grid at every ratio. */
const EDGE = 1

/** How far the controls stand in from the frame's edge, px. */
const INSET = 6

/** Where the words stand in from the frame's outer edge, px: the field's text, and the words of the row under it. */
const TEXT = 16

/** A word's own gutter under the frame, px, so its ground under a pointer reaches past its letters. */
const GUTTER = 5

/** The field at rest, px: two lines' room on a laptop, so the frame reads as a place to write; one on a phone. */
const REST = 52
const REST_PHONE = 40

/** How tall the field grows before it scrolls, px: ten lines on a laptop, six on a phone, where the keyboard has the rest. */
const CEILING = 240
const CEILING_PHONE = 160

/** The ink on a filled round: the accent's own foreground. */
const ON = 'var(--primary-foreground)'

/** What the draft carries, as a chip: a filled pill after `+` on a laptop; on a phone a pill in a row of its own above the field, round with a hairline and no fill, as tall as the controls, so the controls' row never wraps. */
const CARRIED = { height: 28, rounded: 999, bg: '$hover', paddingInlineStart: 10 } as const
const pill = (height: number) => ({ height, rounded: 999, borderWidth: 1, borderColor: '$borderColor', bg: 'transparent', paddingInlineStart: 12 }) as const

/** One of the two layers in the row's last place: shown, it is there; hidden, it fades and shrinks to 0.9 and takes no press. */
const layer = (shown: boolean) =>
  ({
    position: 'absolute',
    t: 0,
    l: 0,
    r: 0,
    b: 0,
    items: 'center',
    justify: 'center',
    transition: 'quickest',
    opacity: shown ? 1 : 0,
    scale: shown ? 1 : 0.9,
    pointerEvents: shown ? 'auto' : 'none',
    ...(shown ? null : { 'aria-hidden': true }),
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
  /** Ceiling for that growth, px. Past it the field scrolls. Unset, ten lines on a laptop and six on a phone. */
  maxHeight?: number
  /** The field's own props — a ref, a testid, a paste handler. */
  field?: FieldProps
  /** A word at the end of the tool row, before the controls: a status. */
  hint?: string
  /** Account usage and context, a word under the frame; null hides a host-provided control. */
  status?: ReactNode
  /** The tool row's start, after `+` and what the draft carries. */
  children?: ReactNode
  /** Above the frame, at its width: what the draft is sent with, a banner. */
  head?: ReactNode
  /** Under the frame, at the row's start, as words: where a run goes, which repository, which branch. */
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
  /** A spoken conversation (@hanzo/voice `useTalk`): the row's last place while the draft is empty. */
  talk?: Machine
  /** Above the frame, nearest it: the person's suggestions, at every width. */
  starters?: ReactNode
  /** Centred just above the frame: what every message is sent under. */
  note?: ReactNode
  /** At the reading column's width (`measure`), centred: the composer under a thread, so its edges are the text's. Absent, the width of what holds it. */
  column?: boolean
  /** A conversation nothing keeps (a private chat): the frame drops its ground and its drop and keeps its edge, dashed — the one cue, so nothing above the composer has to say it. */
  forgetful?: boolean
  /** A phone: every control is 36px and every word under the frame as tall, each row evenly set. Absent, the viewport decides. */
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

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy = false,
  disabled = false,
  ready: readyProp,
  placeholder,
  label,
  rows = 1,
  maxHeight,
  field,
  hint,
  status,
  children,
  head,
  pills,
  carried,
  plus,
  slash,
  at,
  commands,
  chips,
  mind,
  effort,
  limits,
  onUpgrade,
  mode,
  voice,
  language = null,
  onLanguage,
  talk,
  starters,
  note,
  column = false,
  forgetful = false,
  narrow: narrowProp,
  defaults,
  ...props
}: ComposerProps) {
  const { t } = useI18n()
  const inheritedStatus = useComposerStatus()
  const media = useMedia()
  const narrow = narrowProp ?? !media.sm
  const hit = narrow ? TAP : ROUND
  const lift = useLift()
  const chosen = useComposing()
  const rule = chosen.send ?? defaults?.send ?? 'enter'
  const showChips = chosen.chips ?? defaults?.chips ?? true
  const showModel = chosen.model ?? defaults?.model ?? true
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
      // The text stands `TEXT` in from the frame's outer edge, where the words under the frame stand.
      px={TEXT - EDGE - INSET}
      pt={6}
      pb={6}
      minH={narrow ? REST_PHONE : REST}
      maxH={maxHeight ?? (narrow ? CEILING_PHONE : CEILING)}
      bg="transparent"
      color="$ink"
      placeholderTextColor="$placeholderColor"
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

  // The row's last place: send (stop while a turn runs) once there is something
  // to send, voice mode while the draft is empty. Both stand in one box, so the
  // row never moves; the one that is not wanted fades and shrinks out.
  const sending = busy || lit
  const send = (
    <Control
      type="button"
      size={hit}
      fill
      rounded={999}
      {...slot('composer-send')}
      aria-label={t(busy ? 'Stop' : 'Send')}
      aria-disabled={!live || undefined}
      tabIndex={sending ? 0 : -1}
      pressStyle={{ scale: 0.92 }}
      focusVisibleStyle={RING}
      onClick={() => {
        if (!live) return
        if (busy) onStop?.()
        else onSend()
      }}
    >
      {busy ? <Square size={12} color={ON} fill={ON} /> : <ArrowUp size={GLYPH} strokeWidth={2} color={ON} />}
    </Control>
  )
  const last = (
    <XStack {...slot('composer-last')} position="relative" width={hit} height={hit} shrink={0}>
      {talk ? (
        <XStack {...layer(!sending)}>
          <Control asChild size={hit} rounded={999} {...GHOST} focusVisibleStyle={RING}>
            <Voice
              voice={talk}
              disabled={disabled || sending}
              data-slot="composer-talk"
              says={{ idle: t('Voice mode'), listening: t('In conversation — click to hang up'), speaking: t('Hanzo is speaking — talk to interrupt') }}
            >
              {() => <AudioLines size={GLYPH} strokeWidth={STROKE} color="currentColor" />}
            </Voice>
          </Control>
        </XStack>
      ) : null}
      <XStack {...layer(sending)}>{send}</XStack>
    </XStack>
  )

  const mention =
    listed && shelf && typed ? <Mention shelf={shelf} rows={listed} index={row} onPick={pick} skills={typed.char === '/'} /> : null

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
      <XStack
        render="button"
        aria-label={t('Remove {name}', { name: c.label })}
        onPress={c.onRemove}
        width={20}
        height={20}
        rounded={999}
        items="center"
        justify="center"
        hoverStyle={{ bg: '$raised' }}
        cursor="pointer"
      >
        <X size={12} color="$hint" />
      </XStack>
    </XStack>
  ))

  const shown = showChips && chips?.length ? chips : null
  const usage = status === undefined ? inheritedStatus : status
  const tuned = (showModel && mind) || effort || (showMode && mode)
  const word = narrow ? TAP : 28
  const under =
    pills || shown || usage || tuned ? (
      <XStack
        {...slot('composer-foot')}
        items="center"
        gap={2}
        flexWrap="wrap"
        rowGap={2}
        width="100%"
        // A word's letters stand where the field's do: TEXT in, less the word's own gutter.
        px={TEXT - GUTTER}
        style={FLOOR}
      >
        {pills ? (
          <XStack {...slot('composer-pills')} items="center" gap={2} flexWrap="wrap" rowGap={2}>
            <Pills.Provider value={word}>{pills}</Pills.Provider>
          </XStack>
        ) : null}
        {shown ? <Chips chips={shown} /> : null}
        {usage || tuned ? (
          <XStack items="center" gap={2} marginInlineStart="auto" shrink={0} flexWrap="wrap">
            {usage ? (
              <XStack {...slot('composer-status')} items="center">
                {usage}
              </XStack>
            ) : null}
            {tuned ? (
              <Tune mind={showModel ? mind : null} effort={effort} mode={showMode ? mode : null} onUpgrade={onUpgrade} limits={limits} disabled={disabled} />
            ) : null}
          </XStack>
        ) : null}
      </XStack>
    ) : null

  return (
    <YStack {...slot('composer-shell')} {...(column ? measure : { width: '100%' })} gap={8} {...(lift ? { mb: lift } : null)} {...props}>
      {above}
      <YStack
        {...slot('composer')}
        width="100%"
        rounded={CORNER}
        borderWidth={EDGE}
        {...glass(2)}
        p={INSET}
        gap={SPACE}
        cursor="text"
        {...(forgetful ? { 'data-forgetful': '' } : null)}
        // A press on the frame's own ground is a press in the field: the whole surface is the target.
        onPress={(e: any) => {
          if (e?.target === e?.currentTarget) (e.currentTarget as HTMLElement).querySelector<HTMLTextAreaElement>('[data-slot="composer-field"]')?.focus()
        }}
        style={FLOOR}
      >
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
              <SizableText size="$1" color="$soft" numberOfLines={1} paddingInlineEnd={4}>
                {hint}
              </SizableText>
            ) : null}
            {commands?.length ? <Palette commands={commands} open={palette} onOpenChange={setPalette} size={hit} disabled={disabled} /> : null}
            {voice ? <Dictation voice={voice} disabled={disabled} size={hit} language={language} {...(onLanguage ? { onLanguage } : {})} /> : null}
            {last}
          </XStack>
        </XStack>
      </YStack>
      {under}
    </YStack>
  )
}
