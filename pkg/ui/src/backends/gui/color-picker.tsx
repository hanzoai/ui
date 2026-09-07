'use client'

/**
 * ColorPicker — a swatch button that opens a hue/saturation panel and a hex
 * field, and reports every change as a `#rrggbb` string.
 *
 * The panel is two custom drag surfaces (saturation-value square, hue bar)
 * built on `drag()` from `./gesture` — the one pointer/responder contract this
 * backend already uses for the resize handle and the scroll thumb — plus this
 * backend's own `Popover` and `Input`. No color-math dependency exists in the
 * workspace, so HSV/RGB/hex conversion is the ~30 lines below rather than a
 * new package.
 */
import { SizableText, XStack, YStack, type GuiElement } from '@hanzo/gui'
import { useCallback, useMemo, useRef, useState, type ComponentProps } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { Input } from './input'
import { drag, touch, type DragEvent } from './gesture'
import { slot } from './slot'

type Rgb = { r: number; g: number; b: number }
type Hsv = { h: number; s: number; v: number }

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** `#rgb`, `#rrggbb`, or bare (no `#`) — anything else is not a color. */
const hexToRgb = (hex: string): Rgb | null => {
  const s = hex.trim().replace(/^#/, '')
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  if (!/^[0-9a-f]{6}$/i.test(full)) return null
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

const rgbToHex = ({ r, g, b }: Rgb) =>
  '#' + [r, g, b].map((c) => Math.round(clamp01(c / 255) * 255).toString(16).padStart(2, '0')).join('')

const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [rp, gp, bp] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 }
}

const DEFAULT = '#3b82f6'
const SIZE = 200
const HUE_H = 16
const THUMB = 14

/** The DOM box behind a ref, if there is one; a native view has none. */
const box = (el: GuiElement | null) =>
  typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null

/** Position on a rect, 0..1 both axes, from whichever client coordinate the platform sent. */
const pointOn = (el: HTMLElement, e: DragEvent) => {
  const rect = el.getBoundingClientRect()
  const x = (e.clientX ?? e.nativeEvent?.pageX ?? rect.left) - rect.left
  const y = (e.clientY ?? e.nativeEvent?.pageY ?? rect.top) - rect.top
  return { x: clamp01(rect.width ? x / rect.width : 0), y: clamp01(rect.height ? y / rect.height : 0) }
}

/** The 2D saturation (x) / value (y) square for the current hue. */
const SaturationField = ({
  hue,
  s,
  v,
  onChange,
  disabled,
}: {
  hue: number
  s: number
  v: number
  onChange: (s: number, v: number) => void
  disabled?: boolean
}) => {
  const ref = useRef<GuiElement | null>(null)
  const set = useCallback(
    (e: DragEvent) => {
      const el = box(ref.current)
      if (!el) return
      const { x, y } = pointOn(el, e)
      onChange(x, 1 - y)
    },
    [onChange],
  )
  const gesture = drag({ begin: set, move: set, end: () => {}, enabled: !disabled })
  return (
    <XStack
      ref={ref}
      {...slot('color-picker-saturation')}
      position="relative"
      width="100%"
      height={SIZE}
      rounded="$2"
      overflow="hidden"
      cursor={disabled ? 'default' : 'crosshair'}
      style={{
        backgroundColor: rgbToHex(hsvToRgb({ h: hue, s: 1, v: 1 })),
        backgroundImage:
          'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
      }}
      {...gesture}
    >
      <XStack
        {...slot('color-picker-saturation-thumb')}
        position="absolute"
        width={THUMB}
        height={THUMB}
        rounded={999}
        borderWidth={2}
        style={{
          left: `${s * 100}%`,
          top: `${(1 - v) * 100}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,.4)',
          backgroundColor: rgbToHex(hsvToRgb({ h: hue, s, v })),
          borderColor: 'white',
        }}
        pointerEvents="none"
      />
    </XStack>
  )
}

/** The hue bar, 0..360, laid out as one horizontal drag strip. */
const HueField = ({
  hue,
  onChange,
  disabled,
}: {
  hue: number
  onChange: (hue: number) => void
  disabled?: boolean
}) => {
  const ref = useRef<GuiElement | null>(null)
  const set = useCallback(
    (e: DragEvent) => {
      const el = box(ref.current)
      if (!el) return
      const { x } = pointOn(el, e)
      onChange(x * 360)
    },
    [onChange],
  )
  const gesture = drag({ begin: set, move: set, end: () => {}, enabled: !disabled })
  return (
    <XStack
      ref={ref}
      {...slot('color-picker-hue')}
      position="relative"
      width="100%"
      height={HUE_H}
      rounded={999}
      overflow="hidden"
      cursor={disabled ? 'default' : 'pointer'}
      style={{
        backgroundImage:
          'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
      }}
      {...touch(HUE_H, 44, 'y')}
      {...gesture}
    >
      <XStack
        {...slot('color-picker-hue-thumb')}
        position="absolute"
        width={HUE_H}
        height={HUE_H}
        rounded={999}
        borderWidth={2}
        style={{
          left: `${(hue / 360) * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,.4)',
          backgroundColor: rgbToHex(hsvToRgb({ h: hue, s: 1, v: 1 })),
          borderColor: 'white',
        }}
        pointerEvents="none"
      />
    </XStack>
  )
}

export type ColorPickerProps = Omit<ComponentProps<typeof XStack>, 'onChange' | 'children'> & {
  /** Initial color, as any 3- or 6-digit hex string. The picker owns state from here on. */
  value?: string
  /** Fires on every change, hue drag, saturation drag and hex edit alike, as `#rrggbb`. */
  onChange?: (color: string) => void
  disabled?: boolean
  /** Swatches shown under the fields for one-click picks. */
  presets?: string[]
}

const ColorPicker = ({ value = DEFAULT, onChange, disabled = false, presets, ...props }: ColorPickerProps) => {
  const [hex, setHex] = useState(value)
  const [hexDraft, setHexDraft] = useState(value)
  const hsv = useMemo(() => rgbToHsv(hexToRgb(hex) ?? hexToRgb(DEFAULT)!), [hex])

  const commit = useCallback(
    (next: string) => {
      setHex(next)
      setHexDraft(next)
      onChange?.(next)
    },
    [onChange],
  )

  const setHsv = useCallback(
    (patch: Partial<Hsv>) => commit(rgbToHex(hsvToRgb({ ...hsv, ...patch }))),
    [commit, hsv],
  )

  const editHex = useCallback(
    (raw: string) => {
      setHexDraft(raw)
      if (hexToRgb(raw)) commit(raw.startsWith('#') ? raw : `#${raw}`)
    },
    [commit],
  )

  return (
    <XStack {...slot('color-picker')} items="center" gap="$2" opacity={disabled ? 0.5 : 1} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled} justify="flex-start" width={220}>
            <XStack width="100%" items="center" gap="$2">
              <XStack
                {...slot('color-picker-swatch')}
                width={16}
                height={16}
                rounded="$1"
                borderWidth={1}
                borderColor="$borderColor"
                style={{ backgroundColor: hex }}
              />
              <SizableText flex={1} numberOfLines={1} fontFamily="$mono" size="$2">
                {hex}
              </SizableText>
            </XStack>
          </Button>
        </PopoverTrigger>
        <PopoverContent width={SIZE + 24}>
          <YStack gap="$3">
            <SaturationField
              hue={hsv.h}
              s={hsv.s}
              v={hsv.v}
              disabled={disabled}
              onChange={(s, v) => setHsv({ s, v })}
            />
            <HueField hue={hsv.h} disabled={disabled} onChange={(h) => setHsv({ h })} />
            <Input
              {...slot('color-picker-hex-input')}
              value={hexDraft}
              onChangeText={editHex}
              placeholder="#000000"
              disabled={disabled}
              fontFamily="$mono"
              fontSize="$2"
            />
            {presets?.length ? (
              <XStack {...slot('color-picker-presets')} flexWrap="wrap" gap="$2">
                {presets.map((preset) => (
                  <XStack
                    key={preset}
                    {...slot('color-picker-preset')}
                    width={22}
                    height={22}
                    rounded="$1"
                    borderWidth={1}
                    borderColor="$borderColor"
                    style={{ backgroundColor: preset }}
                    cursor="pointer"
                    aria-label={preset}
                    onPress={() => !disabled && commit(preset)}
                    {...touch(22)}
                  />
                ))}
              </XStack>
            ) : null}
          </YStack>
        </PopoverContent>
      </Popover>
    </XStack>
  )
}

export { ColorPicker }
