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
 * Every listed model can be picked. One the payer's plan has paused, by class
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
import { SizableText, XStack, useMedia } from '@hanzo/gui'
import { ChevronsUpDown } from '@hanzogui/lucide-icons-2'
import { useCallback, useEffect, useRef, useState } from 'react'

import { RING } from '../backends/gui/press'
import { slot } from '../backends/gui/slot'
import { groupLabel, modelName, type Capability, type ModelCatalogEntry, type PauseSource } from './catalog'
import type { ModelPickerMenu as Menu } from './ModelPickerMenu'

/** The open half, once loaded: every picker on the page shares it. */
let menu: typeof Menu | null = null
let pending: Promise<typeof Menu> | null = null
const load = (): Promise<typeof Menu> =>
  (pending ??= import('./ModelPickerMenu').then((m) => (menu = m.ModelPickerMenu)))

/** Row height, px: a line of 13px type on a pointer, a thumb's reach on a phone. */
const ROW = 32
const ROW_TOUCH = 44

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
  /** The plain look, for a picker in a row of words (a composer): no fill, no hairline. */
  quiet?: boolean
  size?: 'sm' | 'md'
  placeholder?: string
  /** What it chooses, for its accessible name. */
  name?: string
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
  size = 'md',
  placeholder = 'Choose a model',
  name = 'Model',
  open: openProp,
  onOpenChange,
}: ModelPickerProps) {
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
  const label = selected ? modelName(selected) : value || placeholder

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
  const button = (
    <XStack
      ref={trigger as never}
      {...slot('model-picker')}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${name}: ${label}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-disabled={disabled || undefined}
      height={small ? 28 : 36}
      px={small ? '$2' : '$3'}
      gap="$2"
      items="center"
      maxW="100%"
      rounded="$3"
      borderWidth={quiet ? 0 : 1}
      borderColor="$borderColor"
      bg={quiet ? 'transparent' : '$background'}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={disabled ? undefined : quiet ? { bg: '$hover' } : { borderColor: '$rim' }}
      pressStyle={disabled ? undefined : { bg: '$hover' }}
      focusVisibleStyle={RING}
      onLayout={(e: { nativeEvent?: { layout?: { width?: number } } }) => setTriggerW(e.nativeEvent?.layout?.width ?? 0)}
      // The popover opens on press once it is here; before that, and on a phone, the press opens it.
      onPress={disabled || (Live && !sheet) ? undefined : () => setOpen(true)}
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
      <SizableText size={small ? '$1' : '$2'} color={quiet ? '$quiet' : '$ink'} numberOfLines={1} shrink={1} minW={0}>
        {label}
      </SizableText>
      {selected && !quiet ? (
        <SizableText size={small ? '$1' : '$2'} color="$soft" numberOfLines={1} shrink={2} minW={0}>
          {groupLabel(selected)}
        </SizableText>
      ) : null}
      <ChevronsUpDown size={small ? 12 : 14} color="$soft" shrink={0} aria-hidden />
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
      width={triggerW}
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
    />
  )
}

export default ModelPicker
