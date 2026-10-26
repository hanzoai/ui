'use client'

/**
 * The row under the composer's frame: the surface's chips at its start, and at
 * its end the model, the effort (dim) and the mode, each opening its choices.
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
import { useState, type ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui'
import { grants, modelName, type ModelCatalogEntry, type PauseSource } from '../models/catalog'
import { ModelPicker } from '../models/ModelPicker'
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

/** A text button in the row. */
function Word({ children, dim = false, label, open }: { children: ReactNode; dim?: boolean; label: string; open: boolean }) {
  return (
    <XStack
      render="button"
      aria-label={label}
      aria-expanded={open}
      items="center"
      height={24}
      px={6}
      rounded={6}
      cursor="pointer"
      bg={open ? '$hover' : 'transparent'}
      hoverStyle={{ bg: '$hover' }}
      focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
      $max-sm={{ height: 44, px: 8 }}
    >
      <SizableText fontSize={14} fontWeight={dim ? '400' : '500'} color={dim ? '$hint' : '$ink'} numberOfLines={1}>
        {children}
      </SizableText>
    </XStack>
  )
}

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
function Opens({ label, word, dim, pill, children }: { label: string; word: ReactNode; dim?: boolean; pill?: boolean; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen} allowFlip placement="top-end">
      <PopoverTrigger asChild>
        {pill ? (
          <XStack
            render="button"
            data-slot="mode"
            aria-label={label}
            aria-expanded={open}
            items="center"
            height={24}
            px={8}
            marginInlineStart={4}
            rounded={6}
            bg="$hover"
            cursor="pointer"
            hoverStyle={{ bg: '$raised' }}
            focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
            $max-sm={{ height: 44, px: 12 }}
          >
            <SizableText fontSize={14} color="$ink">
              {word}
            </SizableText>
          </XStack>
        ) : (
          <XStack>
            <Word label={label} dim={dim} open={open}>
              {word}
            </Word>
          </XStack>
        )}
      </PopoverTrigger>
      <PopoverContent solid p={6} width={288} maxW="calc(100vw - 24px)">
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

/** The surface's chips: one tap each, the one in force marked. */
export function Chips({ chips }: { chips: readonly Chip[] }) {
  return (
    <XStack data-slot="composer-chips" items="center" gap={4} flexWrap="wrap" rowGap={4} minW={0} shrink={1} maxW="100%">
      {chips.map((c) => (
        <XStack
          key={c.id}
          render="button"
          data-slot="composer-chip"
          aria-pressed={c.on ?? undefined}
          onPress={c.onPress}
          items="center"
          gap={6}
          height={26}
          px={10}
          rounded={999}
          borderWidth={1}
          borderColor={c.on ? '$rim' : '$borderColor'}
          bg={c.on ? '$hover' : 'transparent'}
          cursor="pointer"
          hoverStyle={{ bg: '$hover' }}
          focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
          $max-sm={{ height: 36, px: 12 }}
        >
          {/* The mark goes on a phone, where the row would not fit one line with it. */}
          {c.icon ? <XStack aria-hidden $max-sm={{ display: 'none' }}>{c.icon}</XStack> : null}
          <SizableText fontSize={13} color={c.on ? '$ink' : '$quiet'} numberOfLines={1}>
            {c.label}
          </SizableText>
        </XStack>
      ))}
    </XStack>
  )
}

/** The row's end: the model where it is shown, and the mode. The effort is the composer's dial. */
export function Tune({
  mind,
  mode,
  onUpgrade,
  limits,
}: {
  mind?: Mind | null
  mode?: Modes | null
  onUpgrade?: (model: string) => void
  limits?: PauseSource | null
}) {
  const { t } = useI18n()
  const now = mode ? mode.items.find((m) => m.id === mode.value) : undefined
  return (
    <XStack data-slot="tune" items="center" gap={2} marginInlineStart="auto" shrink={0}>
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
      {mode && now ? (
        <Opens label={t('Mode: {mode}', { mode: t(now.label) })} word={t(now.label)} pill>
          {(close) => (
            <Choices
              title={t('Mode')}
              items={mode.items}
              value={mode.value}
              onPick={(m) => {
                mode.set(m)
                close()
              }}
            />
          )}
        </Opens>
      ) : null}
    </XStack>
  )
}
