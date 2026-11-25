'use client'

/**
 * ModelPicker — the one model picker every Hanzo surface uses: hanzo.ai chat
 * and dev, and every playground tab in the console.
 *
 * It lists the whole catalog `GET /v1/models` answers, grouped — Hanzo's own
 * families first (Enso, Zen, Kai, Zoo), then every maker by name — with a
 * search over id, name, maker and description. `scope` narrows it to what a
 * surface can run (an embeddings tab offers embedding models).
 *
 * Every listed model can be picked, except those that cannot do the job: an
 * agent's list (`scope` 'agent') puts what cannot run one, with its few words
 * of why, in a shut group at the end. The comparison vendor's models (Jev) are
 * in no list. One the payer's plan has paused, by class
 * or by itself (`limits`), says "Paused" and still picks: the gateway answers
 * it with the policy's refusal or from Enso, and the host shows that. Only a
 * research preview, which nothing can call yet, is listed and never picked.
 *
 * LAZY. The trigger is all a page carries until the picker is pointed at,
 * focused or opened: the popover or sheet, the search, the virtualised list and
 * its rows (`ModelPickerMenu`) load then, in their own chunk.
 *
 * On a phone it is a bottom sheet with rows sized for a thumb; elsewhere a
 * popover. Styling is gui props and tokens only.
 */
import { SizableText, Text, XStack, YStack, useMedia } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { ChevronsUpDown } from '@hanzogui/lucide-icons-2'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

import { RING } from '../backends/gui/press'
import { slot } from '../backends/gui/slot'
import { groupLabel, modelName, type Capability, type ModelCatalogEntry, type PauseSource } from './catalog'
import type { ModelPickerMenu as Menu } from './ModelPickerMenu'

/** The open half, once loaded: every picker on the page shares it. */
let menu: typeof Menu | null = null
let pending: Promise<typeof Menu> | null = null
const load = (): Promise<typeof Menu> =>
  (pending ??= import('./ModelPickerMenu').then((m) => (menu = m.ModelPickerMenu)))

/** Row height, px: two compact lines (title + access, capabilities · context · cost) on a pointer, thumb-sized on a phone. */
const ROW = 48
const ROW_TOUCH = 56
const STRONG = 'var(--border-strong)' as const
export interface ModelPickerProps {
  /** The catalog, as `parseModels` reads `GET /v1/models`. */
  models: readonly ModelCatalogEntry[]
  value?: string
  onChange: (id: string) => void
  /** Offer only the models that do this. Absent, every model. */
  scope?: Capability
  /** The payer's plan usage (`useLimits().limits`): a paused model says so. */
  limits?: PauseSource | null
  /** The catalog is still being read. */
  loading?: boolean
  /** The catalog could not be read, in a sentence. */
  error?: string | null
  disabled?: boolean
  /** A word, for a picker in a row of words (under a composer): the name in the full ink at the 14px rung, no fill, no hairline, no mark; a phone's thumb height. */
  quiet?: boolean
  /** Stack the micro-label (`name`) cleanly above (or beside on narrow screens) the active model value. */
  stacked?: boolean
  /** With `stacked`: the model is the house default, so only the micro-label (`name`) is drawn; the model is the checked row in the list. */
  bare?: boolean
  size?: 'sm' | 'md'
  /** Absent, "Choose a model" in the reader's language. */
  placeholder?: string
  /** What it chooses, for its accessible name; absent, "Model" in the reader's language. */
  name?: string
  /** The accessible name whole, in the reader's language, where `name: model` is not how they say it. */
  describe?: string
  /** Whether the payer's plan may send a model: one it may not says Upgrade, and choosing it calls `onUpgrade`. */
  granted?: (id: string) => boolean
  onUpgrade?: (id: string) => void
  /**
   * Whether the payer's prepaid balance can pay for another maker's model, from the
   * billing API. Another maker's models are paid from the balance on any plan, so with
   * this a plan never makes one an upgrade: one not funded says Top up, and choosing it
   * calls `onTopUp`. Absent, they follow `granted` as before.
   */
  funded?: (id: string) => boolean
  /** The balance as the billing API states it, shown with a Top up link under the list. */
  balance?: string
  /** The way to top the balance up; given the model that was chosen, if one was. */
  onTopUp?: (id?: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ModelPicker({
  models,
  value,
  onChange,
  scope,
  limits,
  loading = false,
  error = null,
  disabled = false,
  quiet = false,
  stacked = false,
  bare = false,
  size = 'md',
  placeholder,
  name: named,
  describe,
  granted,
  onUpgrade,
  funded,
  balance,
  onTopUp,
  open: openProp,
  onOpenChange,
}: ModelPickerProps) {
  const { t } = useI18n()
  const name = named ?? t('Model')
  const [own, setOwn] = useState(false)
  const open = openProp ?? own
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwn(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )

  const media = useMedia()
  const sheet = !media.sm
  const row = sheet ? ROW_TOUCH : ROW
  const [triggerW, setTriggerW] = useState(0)
  const trigger = useRef<HTMLElement | null>(null)

  const selected = value ? models.find((m) => m.id === value) : undefined
  const label = selected ? modelName(selected) : value ? modelName({ id: value }) : (placeholder ?? t('Choose a model'))

  const close = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => trigger.current?.focus?.())
  }, [setOpen])

  // The open half arrives on first pointing, focus or open; until then the
  // trigger stands alone, drawn the same.
  const [Live, setLive] = useState<typeof Menu | null>(() => menu)
  const want = useCallback(() => {
    if (Live) return
    void load().then((m) => setLive(() => m))
  }, [Live])
  useEffect(() => {
    if (open) want()
  }, [open, want])
  // The trigger is drawn again inside the popover once it arrives; one that
  // held the focus keeps it. Its removal blurs it with nowhere to go, which is
  // not the reader leaving.
  const focused = useRef(false)
  useEffect(() => {
    if (Live && focused.current) trigger.current?.focus?.()
  }, [Live])

  const small = size === 'sm'
  useEffect(() => {
    const el = trigger.current
    if (!el) return
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().width)
      setTriggerW((prev) => (prev === next ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [Live, stacked, quiet, small])

  const popoverWidth =
    typeof window !== 'undefined' && window.innerWidth > 24
      ? Math.min(triggerW, window.innerWidth - 24)
      : triggerW

  const button = (
    <XStack
      ref={trigger as never}
      {...slot('model-picker')}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={describe ?? t('{name}: {model}', { name, model: label })}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-disabled={disabled || undefined}
      height={stacked || sheet ? undefined : quiet ? 28 : small ? 28 : 36}
      minH={stacked ? (sheet ? 44 : 34) : sheet ? 44 : undefined}
      // inline-style: a custom property, which no gui prop carries. A coarse pointer's `min-height: var(--tap-target) !important`
      // outranks minH, and the composer lowers that variable to 24px: a phone takes it back to 44.
      style={sheet ? ({ '--tap-target': '44px' } as CSSProperties) : undefined}
      px={stacked ? '$2' : quiet ? 5 : small ? '$2' : '$3'}
      py={stacked ? 3 : undefined}
      gap={stacked ? '$1' : '$2'}
      items="center"
      minW={0}
      shrink={1}
      maxW="calc(100vw - 24px)"
      rounded={stacked ? '$3' : quiet ? 8 : '$3'}
      $max-sm={{ minH: 44 }}
      transition="quickest"
      borderWidth={1}
      borderColor={quiet || stacked ? (open ? STRONG : 'transparent') : STRONG}
      bg={open && (quiet || stacked) ? '$hover' : quiet || stacked ? 'transparent' : '$panel'}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={disabled ? undefined : { bg: '$hover', borderColor: STRONG }}
      pressStyle={disabled ? undefined : { bg: '$raised' }}
      focusVisibleStyle={RING}
      // Explicit click toggle works consistently both before and after lazy menu hydration (`disablePressTrigger`).
      onClick={disabled ? undefined : () => setOpen(!open)}
      onMouseEnter={disabled ? undefined : want}
      onFocus={
        disabled
          ? undefined
          : () => {
              focused.current = true
              want()
            }
      }
      onBlur={(e: { relatedTarget?: unknown }) => {
        if (e.relatedTarget) focused.current = false
      }}
      onKeyDown={(e: { key?: string; preventDefault?: () => void }) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault?.()
          setOpen(true)
        }
      }}
    >
      {stacked && bare ? (
        <Text fontSize="$2" lineHeight={16} fontWeight="500" color="$ink" numberOfLines={1} shrink={1}>
          {name}
        </Text>
      ) : stacked ? (
        <YStack flexDirection={sheet ? 'row' : 'column'} items={sheet ? 'center' : 'flex-start'} gap={sheet ? '$1' : 1} minW={0} shrink={1}>
          <Text fontSize="$1" lineHeight={14} color="$soft" numberOfLines={1} shrink={0}>
            {name}
          </Text>
          <Text fontSize="$2" lineHeight={16} fontWeight="500" color="$ink" numberOfLines={1} shrink={1}>
            {label}
          </Text>
        </YStack>
      ) : (
        <>
          <SizableText size={quiet ? '$3' : small ? '$1' : '$2'} color="$ink" fontWeight={quiet ? '500' : undefined} numberOfLines={1} shrink={1} minW={0}>
            {label}
          </SizableText>
          {selected && !quiet ? (
            <SizableText size={small ? '$1' : '$2'} color="$soft" numberOfLines={1} shrink={2} minW={0}>
              {groupLabel(selected)}
            </SizableText>
          ) : null}
          {quiet ? null : <ChevronsUpDown size={small ? 12 : 14} color="$aside" shrink={0} aria-hidden />}
        </>
      )}
    </XStack>
  )

  if (!Live) return button
  return (
    <Live
      trigger={button}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={close}
      disabled={disabled}
      width={popoverWidth}
      focusTrigger={() => trigger.current?.focus?.()}
      models={models}
      value={value}
      onChange={onChange}
      scope={scope}
      limits={limits}
      loading={loading}
      error={error}
      name={name}
      sheet={sheet}
      row={row}
      granted={granted}
      onUpgrade={onUpgrade}
      funded={funded}
      balance={balance}
      onTopUp={onTopUp}
    />
  )
}

export default ModelPicker
