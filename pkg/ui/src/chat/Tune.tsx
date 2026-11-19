'use client'

/**
 * The row under the composer's frame: the surface's chips at its start, and at
 * its end the model, the effort and the mode — quiet words, each opening its
 * choices, all three drawn alike so the row reads as one line.
 *
 * The model is `ModelPicker` in its quiet look — the one picker, here as a word
 * in a row — and is drawn only where the person turned the model selector on
 * (`useComposing`). The effort and the mode are lists the surface hands over: a
 * chat offers all six efforts and the modes Auto and Manual, Dev's runs a subset
 * and add Plan. The chips are the surface's own: Chat's are the model families
 * the catalog lists, Dev's are the places a run reaches.
 *
 * Its words are the reader's language (@hanzo/i18n `t`): efforts and modes are
 * marked English (`phrase`), drawn through `t`; model names are the catalog's.
 */
import { SizableText, Text, View, XStack, YStack, useMedia } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { Check } from '@hanzogui/lucide-icons-2'
import { forwardRef, useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger, Sheet, SheetContent, SheetTitle, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../backends/gui'
import { slot } from '../backends/gui/slot'
import { grants, modelName, type ModelCatalogEntry, type PauseSource } from '../models/catalog'
import { ModelPicker } from '../models/ModelPicker'
import { RING } from './look'
import type { Way } from './ways'

const STRONG = 'var(--border-strong)' as const

// The composer lowers `--tap-target` to 24px (Composer.tsx `FLOOR`); the words under the frame are thumbs' targets, so on a phone they take it back to 44.
// inline-style: a custom property, which no gui prop carries.
const PHONE_FLOOR = { '--tap-target': '44px' } as CSSProperties
const SAFE_BOTTOM = 'calc(24px + env(safe-area-inset-bottom, 0px))' as `var(--${string})`

/** Which model answers: the host's store (Chat and Dev share one), as the composer reads it. */
export interface Mind {
  model: string
  models: ModelCatalogEntry[]
  loading: boolean
  error: string | null
  /** A list shown from before, because this read failed. */
  note: string
  /** The plan grants only Enso Auto: anything else is an upgrade, never a pick. */
  free: boolean
  pick: (id: string) => void
  /**
   * Another maker's models are paid from the prepaid balance on any plan, so on Free
   * they are not an upgrade: with this, one the balance cannot pay for says Top up and
   * choosing it calls `topUp`. Absent, they follow `free` as before.
   */
  funded?: (id: string) => boolean
  /** The balance, as the billing API states it. */
  balance?: string
  /** The way to the top-up, given the model chosen if one was. */
  topUp?: (id?: string) => void
}

/** A short list the surface owns, one in force: the effort, or the mode as the pill at the row's end. */
export interface Modes<T extends string = string> {
  value: T
  /** A method, so a surface's own union (`'auto' | 'plan'`) is a `Modes` without a cast. */
  set(mode: T): void
  items: readonly Way<T>[]
}

/** One chip under the frame: a quick pick, a place to go. `on` marks the one in force. */
export interface Chip {
  id: string
  label: string
  icon?: ReactNode
  on?: boolean
  onPress: () => void
}

/**
 * A labeled control in the cluster under the frame: micro-label stacked cleanly
 * above (or beside on narrow mobile) the active value, lifting softly on hover.
 */
const Word = forwardRef<
  HTMLElement,
  {
    category: string
    children: ReactNode
    label: string
    slotName: string
    open: boolean
    disabled?: boolean
    onActivate?: () => void
  } & Record<string, any>
>(function Word({ category, children, label, slotName, open, disabled = false, onActivate, ...trigger }, ref) {
  const media = useMedia()
  const compact = !media.sm
  const { onPress: _ignoredOnPress, onClick: triggerOnClick, ...triggerRest } = trigger
  return (
    <XStack
      ref={ref as never}
      render={<button type="button" />}
      data-slot={slotName}
      {...triggerRest}
      onClick={(e: unknown) => {
        triggerOnClick?.(e)
        onActivate?.()
      }}
      aria-label={label}
      aria-expanded={open}
      aria-disabled={disabled || undefined}
      items="center"
      minW={0}
      shrink={1}
      maxW="calc(100vw - 24px)"
      // Inline: the base layer's `button { min-height: 24px }` outranks a class. On a phone the coarse-pointer
      // `min-height: var(--tap-target) !important` outranks the inline one, so the floor itself is raised to 44.
      style={{ minHeight: compact ? 44 : 34, ...(compact ? PHONE_FLOOR : null) }}
      px="$2"
      py={3}
      rounded="$3"
      borderWidth={1}
      borderColor={open ? STRONG : 'transparent'}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      bg={open ? '$hover' : 'transparent'}
      hoverStyle={disabled ? undefined : { bg: '$hover', borderColor: STRONG }}
      transition="quickest"
      focusVisibleStyle={RING}
      $max-sm={{ minH: 44 }}
    >
      {compact ? (
        <XStack items="center" gap="$1" minW={0} shrink={1}>
          <Text fontSize="$1" lineHeight={14} color="$soft" numberOfLines={1} shrink={0}>
            {category}
          </Text>
          <Text fontSize="$2" lineHeight={16} fontWeight="500" color="$ink" numberOfLines={1} shrink={1}>
            {children}
          </Text>
        </XStack>
      ) : (
        <YStack items="flex-start" gap={1} minW={0} shrink={1}>
          <Text fontSize="$1" lineHeight={13} color="$soft" numberOfLines={1}>
            {category}
          </Text>
          <XStack items="center" gap="$1" minW={0}>
            <Text fontSize="$2" lineHeight={16} fontWeight="500" color="$ink" numberOfLines={1} shrink={1}>
              {children}
            </Text>
          </XStack>
        </YStack>
      )}
    </XStack>
  )
})

/** A titled list of choices, a check on the one in force. */
export function Choices<T extends string>({
  title,
  items,
  value,
  onPick,
  compact = false,
  hideTitle = false,
}: {
  title: string
  items: readonly Way<T>[]
  value: T
  onPick: (id: T) => void
  compact?: boolean
  hideTitle?: boolean
}) {
  const { t } = useI18n()
  return (
    <YStack role={'listbox' as never} aria-label={title} gap={2} data-slot="choices">
      {hideTitle ? null : (
        <SizableText size="$1" color="$soft" px={10} pt={6} pb={4}>
          {title}
        </SizableText>
      )}
      {items.map((c) => {
        const selected = c.id === value
        return (
          <XStack
            key={c.id}
            render={<button type="button" />}
            role="option"
            aria-selected={selected}
            aria-disabled={c.off || undefined}
            onClick={() => !c.off && onPick(c.id)}
            items="flex-start"
            gap={12}
            minH={compact ? 44 : 38}
            $max-sm={{ minH: 44 }}
            px={10}
            py={compact ? 10 : 8}
            rounded={8}
            width="100%"
            borderWidth={1}
            borderColor={selected ? STRONG : 'transparent'}
            bg={selected ? '$panel' : 'transparent'}
            cursor={c.off ? 'default' : 'pointer'}
            opacity={c.off ? 0.5 : 1}
            hoverStyle={c.off ? undefined : { bg: '$hover', borderColor: STRONG }}
            focusVisibleStyle={RING}
          >
            <YStack flex={1} minW={0} items="flex-start" gap={2}>
              <SizableText size="$2" fontWeight={selected ? '600' : '500'} color="$ink" text="start">
                {t(c.label)}
              </SizableText>
              <SizableText size="$1" color="$aside" text="start">
                {t(c.note)}
              </SizableText>
            </YStack>
            {selected ? <Check size={16} color="var(--foreground)" mt={2} aria-hidden /> : null}
          </XStack>
        )
      })}
    </YStack>
  )
}

/** A labeled control in the row that opens a panel of choices (bottom sheet on mobile, popover on desktop). */
function Opens({
  category,
  hint,
  label,
  word,
  slotName,
  disabled,
  children,
}: {
  category: string
  hint: string
  label: string
  word: ReactNode
  slotName: string
  disabled?: boolean
  children: (close: () => void, compact: boolean) => ReactNode
}) {
  const media = useMedia()
  const sheet = !media.sm
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) {
      queueMicrotask(() => triggerRef.current?.focus?.())
    }
  }, [])

  if (sheet) {
    return (
      <>
        <Word
          ref={triggerRef}
          category={category}
          label={label}
          slotName={slotName}
          open={open}
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
        >
          {word}
        </Word>
        <Sheet open={open} onOpenChange={(o: boolean) => (o ? !disabled && setOpen(true) : close(true))}>
          <SheetContent
            {...slot(`${slotName}-sheet`)}
            side="bottom"
            showCloseButton={false}
            b={0}
            l={8}
            r={8}
            width="calc(100vw - 16px)"
            maxW="100vw"
            maxH="75dvh"
            overflowY="auto"
            borderStartStartRadius="$5"
            borderStartEndRadius="$5"
            borderEndStartRadius={0}
            borderEndEndRadius={0}
            pt="$2"
            px="$2.5"
            pb={SAFE_BOTTOM}
            bg="var(--popover)"
            borderWidth={1}
            borderColor={STRONG}
            boxShadow="var(--shadow-floating)"
            gap="$1.5"
            onCloseAutoFocus={(e: Event) => {
              e.preventDefault()
              triggerRef.current?.focus?.()
            }}
          >
            <XStack justify="center" pt="$1" pb="$1" shrink={0} aria-hidden {...slot('sheet-handle')}>
              <View width={36} height={4} rounded="$10" bg="$edge" />
            </XStack>
            <SheetTitle size="$3" fontWeight="600" color="$ink" px={10} pt={2}>
              {category}
            </SheetTitle>
            {children(() => close(true), true)}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={(o) => (o ? !disabled && setOpen(true) : close(false))} allowFlip stayInFrame placement="top-end">
      <Tooltip placement="top" offset={6} open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <XStack items="center" minW={0} shrink={1} maxW="100%">
            <PopoverTrigger asChild disablePressTrigger>
              <Word
                ref={triggerRef}
                category={category}
                label={label}
                slotName={slotName}
                open={open}
                disabled={disabled}
                onActivate={() => {
                  if (!disabled) setOpen((prev) => !prev)
                }}
              >
                {word}
              </Word>
            </PopoverTrigger>
          </XStack>
        </TooltipTrigger>
        <TooltipContent bg="var(--popover)" borderWidth={1} borderColor={STRONG}>
          <Text fontFamily="$body" fontSize="$1" lineHeight={16} color="$ink">
            {hint}
          </Text>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        solid
        bg="var(--popover)"
        borderWidth={1}
        borderColor={STRONG}
        boxShadow="var(--shadow-floating)"
        rounded="$4"
        p={6}
        width={288}
        maxW="calc(100vw - 24px)"
        maxH="75dvh"
        overflowY="auto"
        onCloseAutoFocus={(e: Event) => {
          e.preventDefault()
          triggerRef.current?.focus?.()
        }}
      >
        {children(() => close(true), false)}
      </PopoverContent>
    </Popover>
  )
}

/** The surface's chips, as words: one tap each, the one in force in the full ink. */
export function Chips({ chips }: { chips: readonly Chip[] }) {
  const phone = !useMedia().sm
  return (
    <XStack data-slot="composer-chips" items="center" gap={2} flexWrap="wrap" rowGap={2} minW={0} shrink={1} maxW="100%">
      {chips.map((c) => (
        <XStack
          key={c.id}
          render={<button type="button" />}
          data-slot="composer-chip"
          aria-pressed={c.on ?? undefined}
          onClick={c.onPress}
          items="center"
          gap={6}
          height={28}
          px={6}
          rounded={8}
          borderWidth={1}
          borderColor={c.on ? STRONG : 'transparent'}
          bg={c.on ? '$panel' : 'transparent'}
          cursor="pointer"
          hoverStyle={{ bg: '$hover', borderColor: STRONG }}
          transition="quickest"
          focusVisibleStyle={RING}
          style={phone ? { height: 'auto', minHeight: 44, ...PHONE_FLOOR } : undefined}
        >
          {/* The mark goes on a phone, where the row would not fit one line with it. */}
          {c.icon ? <XStack aria-hidden $max-sm={{ display: 'none' }}>{c.icon}</XStack> : null}
          <SizableText size="$3" color={c.on ? '$ink' : '$soft'} numberOfLines={1}>
            {c.label}
          </SizableText>
        </XStack>
      ))}
    </XStack>
  )
}

/** One of the surface's short lists, as a stacked control that opens it. */
function Pick({
  title,
  hint,
  label,
  slotName,
  modes,
  disabled,
}: {
  title: string
  hint: string
  label: (now: string) => string
  slotName: string
  modes: Modes
  disabled?: boolean
}) {
  const { t } = useI18n()
  const now = modes.items.find((m) => m.id === modes.value) ?? modes.items[0]
  if (!now) return null
  return (
    <Opens category={title} hint={hint} label={label(t(now.label))} word={t(now.label)} slotName={slotName} disabled={disabled}>
      {(close, compact) => (
        <Choices
          title={title}
          items={modes.items}
          value={modes.value}
          compact={compact}
          hideTitle={compact}
          onPick={(m) => {
            modes.set(m)
            close()
          }}
        />
      )}
    </Opens>
  )
}

/** Subtle vertical hairline separating Model, Effort, and Mode. */
function Hairline() {
  return <View width={1} height={22} bg="$edge" shrink={0} $max-sm={{ display: 'none' }} aria-hidden />
}

/** The row's end: the model where it is shown, the effort, and the mode. */
export function Tune({
  mind,
  effort,
  mode,
  onUpgrade,
  limits,
  disabled,
}: {
  mind?: Mind | null
  effort?: Modes | null
  mode?: Modes | null
  onUpgrade?: (model: string) => void
  limits?: PauseSource | null
  disabled?: boolean
}) {
  const { t } = useI18n()
  const [modelOpen, setModelOpen] = useState(false)
  const resolved = mind?.models.find((m) => m.id === mind.model)
  const resolvedName = mind ? modelName(resolved ?? { id: mind.model }) : ''

  return (
    <TooltipProvider delay={250}>
      <XStack data-slot="tune" items="center" gap="$1" shrink={1} minW={0} maxW="100%" flexWrap="wrap">
        {mind ? (
          <Tooltip placement="top" offset={6} open={modelOpen ? false : undefined}>
            <TooltipTrigger asChild>
              <XStack data-slot="mind" items="center" minW={0} shrink={1} maxW="100%">
                <ModelPicker
                  quiet
                  stacked
                  size="sm"
                  name={t('Model')}
                  describe={t('Model: {name}', { name: resolvedName })}
                  models={mind.models}
                  value={mind.model}
                  onChange={mind.pick}
                  loading={mind.loading}
                  error={mind.error}
                  limits={limits}
                  granted={(id) => grants(mind.free, id)}
                  scope="chat"
                  funded={mind.funded}
                  balance={mind.balance}
                  onTopUp={mind.topUp}
                  open={modelOpen}
                  onOpenChange={setModelOpen}
                  {...(onUpgrade ? { onUpgrade } : {})}
                />
              </XStack>
            </TooltipTrigger>
            <TooltipContent bg="var(--popover)" borderWidth={1} borderColor={STRONG}>
              <YStack gap={2}>
                <Text fontFamily="$body" fontSize="$1" lineHeight={16} color="$ink">
                  {t('Which AI model answers')}
                </Text>
                {resolved?.description ? (
                  <Text fontFamily="$body" fontSize="$1" lineHeight={15} color="$aside">
                    {resolved.description}
                  </Text>
                ) : null}
              </YStack>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {mind && effort ? <Hairline /> : null}
        {effort ? (
          <Pick
            title={t('Effort')}
            hint={t('How deeply Hanzo thinks before answering')}
            label={(level) => t('Effort: {level}', { level })}
            slotName="effort"
            modes={effort}
            disabled={disabled}
          />
        ) : null}
        {(mind || effort) && mode ? <Hairline /> : null}
        {mode ? (
          <Pick
            title={t('Mode')}
            hint={t('Whether Hanzo runs steps automatically or asks first')}
            label={(m) => t('Mode: {mode}', { mode: m })}
            slotName="mode"
            modes={mode}
            disabled={disabled}
          />
        ) : null}
      </XStack>
    </TooltipProvider>
  )
}
