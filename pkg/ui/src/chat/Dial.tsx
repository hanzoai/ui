'use client'

/**
 * The effort, as ONE small icon button — a gauge with the level in a tiny pip —
 * the same in Chat and Dev, in the composer's end row beside the mic.
 *
 *   press         opens a compact list of the levels, the one in force checked
 *   drag          press the icon and move along the row: each step of the finger
 *                 is a level (`STEP` px), snapped to the surface's own list, with a
 *                 small label above the icon naming the level while it is held
 *   ← ↓ / → ↑     the arrows move one level, in the reading direction
 *   Enter, Space  opens the list
 *
 * The list is the surface's (`Modes`): a chat offers six levels, a coding run four.
 * The pointer events are the page's own — nothing is captured past the press.
 */
import { SizableText, XStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { Gauge } from '@hanzogui/lucide-icons-2'
import { useRef, useState } from 'react'

import { Popover, PopoverAnchor, PopoverContent } from '../backends/gui'
import { RING } from './ring'
import { Choices, type Modes } from './Tune'

/** How far the finger travels for one level, px. */
const STEP = 22

/** The pip: the level in a letter or two, so the icon says where it stands without a word. */
const PIP: Record<string, string> = { auto: 'A', low: 'L', medium: 'M', high: 'H', xhigh: 'XH', max: 'MAX' }

const pip = (id: string, label: string): string => PIP[id] ?? label.slice(0, 1).toUpperCase()

export function Dial({ effort, size = 36, disabled = false }: { effort: Modes; size?: number; disabled?: boolean }) {
  const { t, dir } = useI18n()
  const [open, setOpen] = useState(false)
  // The level under the finger while it is held, as a place in the list.
  const [held, setHeld] = useState<number | null>(null)
  const press = useRef<{ x: number; at: number; moved: boolean } | null>(null)
  const index = Math.max(0, effort.items.findIndex((e) => e.id === effort.value))
  const now = effort.items[index] ?? effort.items[0]!
  const shown = held === null ? now : (effort.items[held] ?? now)
  const flip = dir === 'rtl' ? -1 : 1

  const clamp = (i: number) => Math.max(0, Math.min(effort.items.length - 1, i))
  const go = (i: number) => {
    const next = effort.items[clamp(i)]
    if (next && next.id !== effort.value) effort.set(next.id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} allowFlip placement="top-end">
      <PopoverAnchor asChild>
        <XStack position="relative" shrink={0} data-slot="dial">
          <XStack
            render="button"
            data-slot="dial-button"
            aria-label={t('Effort: {level}', { level: t(now.label) })}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            width={size}
            height={size}
            rounded={999}
            items="center"
            justify="center"
            shrink={0}
            position="relative"
            cursor={disabled ? 'default' : 'ew-resize'}
            opacity={disabled ? 0.5 : 1}
            bg={open || held !== null ? '$hover' : 'transparent'}
            hoverStyle={disabled ? undefined : { bg: '$hover' }}
            focusVisibleStyle={RING}
            // inline-style: the page must not scroll or select under a drag along the icon.
            style={{ touchAction: 'none', userSelect: 'none' }}
            onPointerDown={(e: any) => {
              if (disabled) return
              press.current = { x: e.clientX, at: index, moved: false }
              e.currentTarget?.setPointerCapture?.(e.pointerId)
            }}
            onPointerMove={(e: any) => {
              const p = press.current
              if (!p) return
              const dx = (e.clientX - p.x) * flip
              if (Math.abs(dx) > 4) p.moved = true
              if (p.moved) setHeld(clamp(p.at + Math.round(dx / STEP)))
            }}
            onPointerUp={(e: any) => {
              const p = press.current
              press.current = null
              e.currentTarget?.releasePointerCapture?.(e.pointerId)
              if (!p) return
              if (p.moved) {
                go(held ?? p.at)
                setHeld(null)
              } else setOpen((o) => !o)
            }}
            onPointerCancel={() => {
              press.current = null
              setHeld(null)
            }}
            onKeyDown={(e: any) => {
              if (disabled) return
              const key = e?.key as string
              const step = key === 'ArrowRight' || key === 'ArrowUp' ? flip : key === 'ArrowLeft' || key === 'ArrowDown' ? -flip : 0
              if (step) {
                e.preventDefault?.()
                go(index + step)
              } else if (key === 'Enter' || key === ' ') {
                e.preventDefault?.()
                setOpen((o) => !o)
              }
            }}
          >
            <Gauge size={18} color="var(--foreground)" aria-hidden />
            <SizableText
              data-slot="dial-pip"
              aria-hidden
              position="absolute"
              b={3}
              insetInlineEnd={2}
              fontSize={9}
              lineHeight={10}
              fontWeight="700"
              color="$ink"
              px={2}
              rounded={4}
              bg="$background"
            >
              {pip(shown.id, t(shown.label))}
            </SizableText>
          </XStack>
          {held !== null ? (
            <XStack
              data-slot="dial-tip"
              role="status"
              position="absolute"
              b={size + 6}
              self="center"
              px={8}
              py={3}
              rounded={6}
              bg="$ink"
              pointerEvents="none"
              style={{ whiteSpace: 'nowrap' }}
            >
              <SizableText fontSize={12} color="$background">
                {t(shown.label)}
              </SizableText>
            </XStack>
          ) : null}
        </XStack>
      </PopoverAnchor>
      <PopoverContent solid p={6} width={288} maxW="calc(100vw - 24px)">
        <Choices
          title={t('Effort')}
          items={effort.items}
          value={effort.value}
          onPick={(id) => {
            effort.set(id)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
