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
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { Check } from '@hanzogui/lucide-icons-2'
import { forwardRef, useState, type ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui'
import { grants, modelName, type ModelCatalogEntry, type PauseSource } from '../models/catalog'
import { ModelPicker } from '../models/ModelPicker'
import { RING } from './look'
import type { Way } from './ways'

/** Which model answers: the host's store (Chat and Dev share one), as the composer reads it. */
export interface Mind {
  model: string
  models: ModelCatalogEntry[]
  loading: boolean
  error: string | null
  /** A list shown from before, because this read failed. */
  note: string
  /** The plan grants only the free lane: anything else is an upgrade, never a pick. */
  free: boolean
  pick: (id: string) => void
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
 * A word in the row under the frame: 14px, no edge and no fill until a pointer
 * gives it the soft hover ground, eased. `dim` sets it in the muted ink — the
 * effort, which qualifies the model beside it. A phone stands it as tall as the
 * frame's controls. As a popover's trigger it IS the trigger, so the trigger's
 * state lands on the button itself.
 */
const Word = forwardRef<HTMLElement, { children: ReactNode; label: string; slotName: string; open: boolean; dim?: boolean; disabled?: boolean } & Record<string, unknown>>(
  function Word({ children, label, slotName, open, dim = false, disabled = false, ...trigger }, ref) {
    return (
      <XStack
        ref={ref as never}
        render="button"
        data-slot={slotName}
        {...trigger}
        aria-label={label}
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        items="center"
        height={28}
        px={5}
        rounded={8}
        cursor={disabled ? 'default' : 'pointer'}
        opacity={disabled ? 0.5 : 1}
        bg={open ? '$hover' : 'transparent'}
        hoverStyle={disabled ? undefined : { bg: '$hover' }}
        transition="quickest"
        focusVisibleStyle={RING}
        $max-sm={{ height: 36 }}
      >
        <SizableText size="$3" color={dim ? '$soft' : '$ink'} numberOfLines={1}>
          {children}
        </SizableText>
      </XStack>
    )
  },
)

/** A titled list of choices, a check on the one in force. */
export function Choices<T extends string>({ title, items, value, onPick }: { title: string; items: readonly Way<T>[]; value: T; onPick: (id: T) => void }) {
  const { t } = useI18n()
  return (
    <YStack role={'listbox' as never} aria-label={title} gap={2} data-slot="choices">
      <SizableText fontSize={13} color="$hint" px={10} pt={6} pb={4}>
        {title}
      </SizableText>
      {items.map((c) => (
        <XStack
          key={c.id}
          render="button"
          role="option"
          aria-selected={c.id === value}
          aria-disabled={c.off || undefined}
          onPress={() => !c.off && onPick(c.id)}
          items="flex-start"
          gap={12}
          px={10}
          py={8}
          rounded={8}
          width="100%"
          cursor={c.off ? 'default' : 'pointer'}
          opacity={c.off ? 0.5 : 1}
          hoverStyle={c.off ? undefined : { bg: '$hover' }}
        >
          <YStack flex={1} minW={0} items="flex-start" gap={2}>
            {/* inline-style: a button centres its words; a list reads from its start. */}
            <SizableText fontSize={14} color="$ink" style={{ textAlign: 'start' }}>
              {t(c.label)}
            </SizableText>
            <SizableText fontSize={13} color="$hint" style={{ textAlign: 'start' }}>
              {t(c.note)}
            </SizableText>
          </YStack>
          {c.id === value ? <Check size={16} color="var(--primary)" mt={2} aria-hidden /> : null}
        </XStack>
      ))}
    </YStack>
  )
}

/** A word in the row that opens a panel of choices. */
function Opens({ label, word, slotName, dim, disabled, children }: { label: string; word: ReactNode; slotName: string; dim?: boolean; disabled?: boolean; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={(o) => setOpen(disabled ? false : o)} allowFlip placement="top-end">
      <PopoverTrigger asChild>
        <Word label={label} slotName={slotName} open={open} dim={dim} disabled={disabled}>
          {word}
        </Word>
      </PopoverTrigger>
      <PopoverContent solid p={6} width={288} maxW="calc(100vw - 24px)">
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

/** The surface's chips, as words: one tap each, the one in force in the full ink. */
export function Chips({ chips }: { chips: readonly Chip[] }) {
  return (
    <XStack data-slot="composer-chips" items="center" gap={2} flexWrap="wrap" rowGap={2} minW={0} shrink={1} maxW="100%">
      {chips.map((c) => (
        <XStack
          key={c.id}
          render="button"
          data-slot="composer-chip"
          aria-pressed={c.on ?? undefined}
          onPress={c.onPress}
          items="center"
          gap={6}
          height={28}
          px={5}
          rounded={8}
          bg="transparent"
          cursor="pointer"
          hoverStyle={{ bg: '$hover' }}
          transition="quickest"
          focusVisibleStyle={RING}
          $max-sm={{ height: 36 }}
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

/** One of the surface's short lists, as a word that opens it. */
function Pick({ title, label, slotName, modes, dim, disabled }: { title: string; label: (now: string) => string; slotName: string; modes: Modes; dim?: boolean; disabled?: boolean }) {
  const { t } = useI18n()
  const now = modes.items.find((m) => m.id === modes.value) ?? modes.items[0]
  if (!now) return null
  return (
    <Opens label={label(t(now.label))} word={t(now.label)} slotName={slotName} dim={dim} disabled={disabled}>
      {(close) => (
        <Choices
          title={title}
          items={modes.items}
          value={modes.value}
          onPick={(m) => {
            modes.set(m)
            close()
          }}
        />
      )}
    </Opens>
  )
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
  return (
    <XStack data-slot="tune" items="center" gap={0} shrink={0} flexWrap="wrap">
      {mind ? (
        <XStack data-slot="mind">
          <ModelPicker
            quiet
            size="sm"
            name={t('Model')}
            describe={t('Model: {name}', { name: modelName(mind.models.find((m) => m.id === mind.model) ?? { id: mind.model }) })}
            models={mind.models}
            value={mind.model}
            onChange={mind.pick}
            loading={mind.loading}
            error={mind.error}
            limits={limits}
            granted={(id) => grants(mind.free, id, mind.models)}
            {...(onUpgrade ? { onUpgrade } : {})}
          />
        </XStack>
      ) : null}
      {effort ? <Pick title={t('Effort')} label={(level) => t('Effort: {level}', { level })} slotName="effort" modes={effort} dim disabled={disabled} /> : null}
      {mode ? (
        // The mode stands a step apart: the model and its effort are one thought, the mode another.
        <XStack marginInlineStart={12}>
          <Pick title={t('Mode')} label={(m) => t('Mode: {mode}', { mode: m })} slotName="mode" modes={mode} />
        </XStack>
      ) : null}
    </XStack>
  )
}
