'use client'

/**
 * Dictation: the mic, and beside it a chevron that opens its menu — the
 * microphones this browser has, the chosen one's live level, and the language
 * dictation listens in (Auto is the browser's own).
 *
 * The chosen microphone is this browser's (a device id means nothing on
 * another), kept in localStorage and handed to @hanzo/voice (`choose`), so
 * every capture opens it; unchosen, the system's own input. The meter listens
 * only while the menu is open, and only where the person has already let the
 * page use a microphone: opening a menu never asks for permission.
 *
 * Its words are the reader's language (@hanzo/i18n `t`); a microphone's name
 * is the device's and a language's is its own, drawn as given.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronDown, Mic as MicIcon } from '@hanzogui/lucide-icons-2'
import { Control } from '@hanzo/composer'
import { useI18n } from '@hanzo/i18n/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../backends/gui'
import { choose, Voice, type Machine } from '@hanzo/voice'
import { useEffect, useRef, useState } from 'react'

import { LANGUAGES } from './languages'
import { GHOST, GLYPH, RING, STROKE } from './look'

const KEY = 'hanzo.mic'

function kept(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function keep(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(KEY, id)
    else window.localStorage.removeItem(KEY)
  } catch {
    // Kept for the page: `choose` holds it.
  }
  choose(id)
}

// The page's choice reaches every capture from the first one.
if (typeof window !== 'undefined') choose(kept())


/** The microphones this browser lists; labels only once the page may use one. */
function useInputs(open: boolean): { inputs: MediaDeviceInfo[]; allowed: boolean; using: string } {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([])
  const [allowed, setAllowed] = useState(false)
  const [using, setUsing] = useState('')
  useEffect(() => {
    if (!open || typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return
    let live = true
    void navigator.mediaDevices.enumerateDevices().then((all) => {
      if (!live) return
      const mics = all.filter((d) => d.kind === 'audioinput' && d.deviceId !== 'default' && d.deviceId !== 'communications')
      setInputs(mics)
      // The system's own input: the group the browser's "default" entry belongs to, else the first.
      setUsing(all.find((d) => d.kind === 'audioinput' && d.deviceId === 'default')?.groupId || mics[0]?.groupId || '')
      setAllowed(mics.some((d) => d.label))
    })
    return () => {
      live = false
    }
  }, [open])
  return { inputs, allowed, using }
}

/** The chosen microphone's level while the menu is open, drawn without re-rendering. */
function Meter({ device, on }: { device: string | null; on: boolean }) {
  // The level grows from the line's start: the right edge in a right-to-left language.
  const { dir } = useI18n()
  const bar = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!on) return
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let frame = 0
    let live = true
    void navigator.mediaDevices
      .getUserMedia({ audio: device ? { deviceId: { exact: device } } : true })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop())
        stream = s
        ctx = new AudioContext()
        const tap = ctx.createAnalyser()
        tap.fftSize = 512
        ctx.createMediaStreamSource(s).connect(tap)
        const buf = new Uint8Array(tap.fftSize)
        const draw = () => {
          tap.getByteTimeDomainData(buf)
          let peak = 0
          for (const v of buf) peak = Math.max(peak, Math.abs(v - 128))
          if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, (peak / 128) * 2.5)})`
          frame = requestAnimationFrame(draw)
        }
        draw()
      })
      .catch(() => {})
    return () => {
      live = false
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
      void ctx?.close()
    }
  }, [device, on])
  return (
    <XStack items="center" gap={10} px={8} py={8} data-slot="mic-meter" aria-hidden>
      <MicIcon size={14} color="$hint" />
      <YStack flex={1} height={4} rounded={2} bg="$hover" overflow="hidden">
        <YStack
          ref={bar as never}
          height={4}
          width="100%"
          bg="$ink"
          // Empty at rest; the level is written per frame onto the node's transform, so no class is minted per value.
          scaleX={0}
          transformOrigin={dir === 'rtl' ? 'right' : 'left'}
        />
      </YStack>
    </XStack>
  )
}

export interface DictationProps {
  voice: Machine
  disabled?: boolean
  /** The box of each half, px: the composer's control size (32 on a laptop, 36 on a phone). */
  size?: number
  /** The language dictation listens in, or null for Auto (the browser's own). */
  language?: string | null
  onLanguage?: (id: string | null) => void
}

/** The mic and its chevron, one control on the composer's row: the mic round, the chevron half its width against it. */
export function Dictation({ voice, disabled = false, size = 36, language = null, onLanguage }: DictationProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  // The Language list, drawn only while open (see Plus.tsx).
  const [lang, setLang] = useState(false)
  const { inputs, allowed, using } = useInputs(open)
  const [device, setDevice] = useState<string | null>(() => (typeof window === 'undefined' ? null : kept()))
  const spoken = LANGUAGES.find((l) => l.id === language)
  // Two controls on one row, each its own box and its own focus ring: no frame around the pair.
  return (
    <XStack data-slot="dictation" items="center" shrink={0}>
      <Control asChild size={size} {...GHOST} focusVisibleStyle={RING}>
        <Voice voice={voice} disabled={disabled} says={{ idle: t('Dictate'), listening: t('Dictating — click to stop') }}>
          {(state) => <MicIcon size={GLYPH} strokeWidth={STROKE} color="currentColor" fill={state === 'idle' ? 'none' : 'currentColor'} />}
        </Voice>
      </Control>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <XStack
            render="button"
            aria-label={t('Dictation settings')}
            data-slot="dictation-menu"
            // The mic's own chevron: half its width, the pair one control.
            width={size / 2}
            height={size}
            items="center"
            justify="center"
            rounded={999}
            cursor="pointer"
            {...GHOST}
            {...(open ? { bg: '$hover', color: '$ink' } : null)}
            focusVisibleStyle={RING}
          >
            {/* The small mark of a menu: a whole-pixel size, its line a touch heavier so it reads at 1x. */}
            <ChevronDown size={14} strokeWidth={2.25} color="currentColor" />
          </XStack>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" minW={200} data-slot="dictation-panel">
          <Meter device={device} on={open && allowed} />
          {inputs.length === 0 ? (
            <DropdownMenuLabel>
              <SizableText fontSize={14} color="$hint">
                {t('No devices found')}
              </SizableText>
            </DropdownMenuLabel>
          ) : (
            inputs.map((d, i) => {
              const on = device ? d.deviceId === device : d.groupId === using
              return (
                <DropdownMenuItem
                  key={d.deviceId || i}
                  preventCloseOnSelect
                  onSelect={() => {
                    setDevice(d.deviceId)
                    keep(d.deviceId)
                  }}
                >
                  <XStack flex={1} items="center" gap={8}>
                    <SizableText fontSize={14} color="$ink" numberOfLines={1} flex={1}>
                      {d.label || t('Microphone {n}', { n: i + 1 })}
                    </SizableText>
                    {on ? <Check size={14} color="var(--primary)" aria-hidden /> : null}
                  </XStack>
                </DropdownMenuItem>
              )
            })
          )}
          {onLanguage ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>
                <SizableText fontSize={13} color="$hint">
                  {t('Dictation settings')}
                </SizableText>
              </DropdownMenuLabel>
              <DropdownMenuSub open={lang} onOpenChange={setLang}>
                <DropdownMenuSubTrigger data-slot="dictation-language" onPress={() => setLang(true)}>
                  <XStack flex={1} items="center" gap={8}>
                    <SizableText fontSize={14} color="$ink" flex={1}>
                      {t('Language')}
                    </SizableText>
                    <SizableText fontSize={14} color="$hint">
                      {spoken?.label ?? t('Auto')}
                    </SizableText>
                  </XStack>
                </DropdownMenuSubTrigger>
                {lang ? (
                <DropdownMenuSubContent minW={160} pointerEvents="auto">
                  {[{ id: '', label: t('Auto') }, ...LANGUAGES].map((l) => (
                    <DropdownMenuItem key={l.id || 'auto'} onSelect={() => onLanguage(l.id || null)}>
                      <XStack flex={1} items="center" gap={8}>
                        <SizableText fontSize={14} color="$ink" flex={1}>
                          {l.label}
                        </SizableText>
                        {(language ?? '') === l.id ? <Check size={14} color="var(--primary)" aria-hidden /> : null}
                      </XStack>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
                ) : null}
              </DropdownMenuSub>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </XStack>
  )
}
