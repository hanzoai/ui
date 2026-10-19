'use client'

/**
 * Shortcut — a keyboard shortcut as keycaps, named for the platform it is read
 * on, and spoken as one phrase.
 *
 * A shortcut is one combination (`['Mod', 'K']`) or a sequence of them
 * (`[['G'], ['P']]`, "G then P"). Key names translate per platform: `Mod` and
 * `CommandOrControl` are ⌘ on a Mac and Ctrl elsewhere, `Alt` is ⌥ on a Mac,
 * Enter is ⏎, arrows and Escape take their glyphs. The whole thing is one image
 * to assistive technology, labelled in words ("Command + K", "G then P"), and
 * the caps inside it are hidden — a screen reader hears the shortcut once, not
 * a list of symbols.
 *
 * The platform is read through `useSyncExternalStore` with a server answer of
 * "other", so a server render and the first client render agree and a Mac
 * swaps Ctrl for ⌘ right after hydration rather than mismatching it.
 *
 * Re-expressed from twenty-ui's Shortcut and formatShortcut (MIT, see NOTICE):
 * keys, text and button variants, a `desktop` visibility that hides it under a
 * coarse pointer, keys 4px apart in a combination.
 */
import { SizableText, XStack } from '@hanzo/gui'
import { useSyncExternalStore, type ComponentProps } from 'react'
import { Kbd } from './kbd'
import { slot } from './slot'

export type ShortcutPlatform = 'mac' | 'other'
/** One combination, or a sequence of combinations pressed one after another. */
export type ShortcutKeys = readonly string[] | readonly (readonly string[])[]

type Name = { glyph: string; word: string }

/** Every key name the two platforms spell differently, by its lowercase alias. */
const KEYS = (platform: ShortcutPlatform): Record<string, Name> => {
  const mac = platform === 'mac'
  const mod = mac ? { glyph: '⌘', word: 'Command' } : { glyph: 'Ctrl', word: 'Control' }
  return {
    mod,
    commandorcontrol: mod,
    cmdorctrl: mod,
    command: { glyph: '⌘', word: 'Command' },
    cmd: { glyph: '⌘', word: 'Command' },
    meta: { glyph: '⌘', word: 'Command' },
    control: mac ? { glyph: '⌃', word: 'Control' } : { glyph: 'Ctrl', word: 'Control' },
    ctrl: mac ? { glyph: '⌃', word: 'Control' } : { glyph: 'Ctrl', word: 'Control' },
    alt: mac ? { glyph: '⌥', word: 'Option' } : { glyph: 'Alt', word: 'Alt' },
    option: mac ? { glyph: '⌥', word: 'Option' } : { glyph: 'Alt', word: 'Alt' },
    shift: { glyph: '⇧', word: 'Shift' },
    enter: { glyph: '⏎', word: 'Enter' },
    return: { glyph: '⏎', word: 'Enter' },
    backspace: { glyph: '⌫', word: 'Backspace' },
    delete: { glyph: '⌦', word: 'Delete' },
    escape: { glyph: 'esc', word: 'Escape' },
    esc: { glyph: 'esc', word: 'Escape' },
    tab: { glyph: '⇥', word: 'Tab' },
    space: { glyph: 'Space', word: 'Space' },
    arrowup: { glyph: '↑', word: 'Up arrow' },
    arrowdown: { glyph: '↓', word: 'Down arrow' },
    arrowleft: { glyph: '←', word: 'Left arrow' },
    arrowright: { glyph: '→', word: 'Right arrow' },
    up: { glyph: '↑', word: 'Up arrow' },
    down: { glyph: '↓', word: 'Down arrow' },
    left: { glyph: '←', word: 'Left arrow' },
    right: { glyph: '→', word: 'Right arrow' },
  }
}

/** A key's glyph and word on `platform`; a plain key is itself, a letter uppercased. */
export const keyName = (key: string, platform: ShortcutPlatform): Name => {
  const known = KEYS(platform)[key.toLowerCase()]
  if (known) return known
  const label = key.length === 1 ? key.toUpperCase() : key
  return { glyph: label, word: label }
}

/** `keys` as a list of combinations, whichever shape it was given in. */
export const combinations = (keys: ShortcutKeys): string[][] =>
  keys.length > 0 && Array.isArray(keys[0]) ? (keys as string[][]).map((c) => [...c]) : [[...(keys as string[])]]

export type FormatOptions = {
  platform?: ShortcutPlatform
  /** Between combinations of a sequence. Default "then". */
  sequenceJoinLabel?: string
  /** Between the keys of one combination. Default none on a Mac, a space elsewhere. */
  combinationSeparator?: string
}

/** The shortcut as text, without rendering: "⌘K", "Ctrl K", "G then P". */
export function formatShortcut(keys: ShortcutKeys, options: FormatOptions = {}): string {
  const platform = options.platform ?? detect()
  const join = options.combinationSeparator ?? (platform === 'mac' ? '' : ' ')
  return combinations(keys)
    .map((c) => c.map((k) => keyName(k, platform).glyph).join(join))
    .join(` ${options.sequenceJoinLabel ?? 'then'} `)
}

/** The shortcut in words, for assistive technology: "Command + K", "G then P". */
export function speakShortcut(keys: ShortcutKeys, platform: ShortcutPlatform, then = 'then'): string {
  return combinations(keys)
    .map((c) => c.map((k) => keyName(k, platform).word).join(' + '))
    .join(` ${then} `)
}

/** macOS and iOS read as a Mac; anything else, or no navigator, does not. */
function detect(): ShortcutPlatform {
  if (typeof navigator === 'undefined') return 'other'
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const p = nav.userAgentData?.platform ?? nav.platform ?? nav.userAgent ?? ''
  return /mac|iphone|ipad|ipod/i.test(p) ? 'mac' : 'other'
}

const never = () => () => {}

export type ShortcutProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  keys: ShortcutKeys
  /** Default: the platform the page is read on. */
  platform?: ShortcutPlatform
  /** `keys` draws keycaps; `text` plain text in the surrounding type; `button` the quiet hint inside a Button. */
  variant?: 'keys' | 'text' | 'button'
  /** `desktop` hides it under a coarse pointer, where there is no keyboard to press it on. */
  visibility?: 'always' | 'desktop'
  sequenceJoinLabel?: string
  combinationSeparator?: string
}

export function Shortcut({
  keys,
  platform,
  variant = 'keys',
  visibility = 'always',
  sequenceJoinLabel = 'then',
  combinationSeparator,
  ...props
}: ShortcutProps) {
  const detected = useSyncExternalStore(never, detect, () => 'other' as ShortcutPlatform)
  const on = platform ?? detected
  const label = speakShortcut(keys, on, sequenceJoinLabel)
  const hidden = visibility === 'desktop' ? { $touchable: { display: 'none' as const } } : null
  const frame = {
    ...slot('shortcut'),
    'data-variant': variant,
    role: 'img' as const,
    'aria-label': label,
    display: 'inline-flex' as const,
    items: 'center' as const,
    ...hidden,
  }

  if (variant === 'text' || variant === 'button') {
    const text = formatShortcut(keys, { platform: on, sequenceJoinLabel, combinationSeparator })
    return (
      <XStack
        {...frame}
        {...(variant === 'button' ? { gap: 6, ml: '$1', opacity: 0.5 } : null)}
        {...props}
      >
        {variant === 'button' ? (
          <XStack aria-hidden width={1} height={8} opacity={0.4} style={{ backgroundColor: 'currentColor' }} />
        ) : null}
        <SizableText aria-hidden size="$2" {...(variant === 'button' ? { fontWeight: '500' } : null)}>
          {text}
        </SizableText>
      </XStack>
    )
  }

  const combos = combinations(keys)
  return (
    <XStack {...frame} gap="$1" {...props}>
      {combos.map((combo, i) => (
        <XStack key={i} aria-hidden display="inline-flex" items="center" gap="$1">
          {i > 0 ? (
            <SizableText size="$1" color="$soft">
              {sequenceJoinLabel}
            </SizableText>
          ) : null}
          {combo.map((k, j) => (
            <Kbd key={j} variant="cap">
              {keyName(k, on).glyph}
            </Kbd>
          ))}
        </XStack>
      ))}
    </XStack>
  )
}
