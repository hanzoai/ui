'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from '@hanzogui/lucide-icons-2'
import { SizableText, XStack } from '@hanzo/gui'

import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../backends/gui'
import { familyOf, filterChatModels, groupModelsByFamily, type ModelCatalogEntry } from './catalog'

/** Show the search input once a catalog gets this large. */
const SEARCH_THRESHOLD = 12
/** Panel floor when the trigger has not reported its width yet. */
const MIN_W = 224
const MAX_H = 288

function fmtContext(ctx: number | undefined): string {
  if (!ctx) return ''
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 === 0 ? 0 : 1)}M`
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}K`
  return `${ctx}`
}

export interface ModelSelectorProps {
  models: ModelCatalogEntry[]
  value?: string
  onChange: (id: string) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  placeholder?: string
  /** Default true: filter to chat-capable models (exclude embedding/image/etc.). */
  chatOnly?: boolean
  className?: string
}

/**
 * ModelSelector — the one unified model picker for every Hanzo app.
 *
 * Family-grouped picker in a Popover + Command combobox: grouped sections with
 * family headers, premium markers, context suffixes, keyboard navigation, and
 * type-to-filter search for large catalogs.
 *
 * Styling is gui style props and tokens throughout — no class strings. The panel
 * matches the trigger's MEASURED width (`onLayout`, which gui implements on web
 * too), never a Radix `--radix-popover-trigger-width` custom property: nothing
 * defines that variable now that Radix is gone.
 */
export function ModelSelector({
  models,
  value,
  onChange,
  disabled = false,
  size = 'md',
  placeholder = 'Select model',
  chatOnly = true,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [triggerW, setTriggerW] = useState(0)

  const visible = useMemo(() => (chatOnly ? filterChatModels(models) : models), [models, chatOnly])
  const groups = useMemo(() => groupModelsByFamily(visible), [visible])
  const showSearch = visible.length > SEARCH_THRESHOLD

  // Resolve the selected label from the FULL list so a current pick still shows
  // even when chatOnly would otherwise hide it.
  const selected = value ? models.find((m) => m.id === value) : undefined
  const selectedLabel = selected ? (selected.label ?? selected.id) : placeholder
  const selectedFamily = selected ? familyOf(selected) : undefined

  const isSm = size === 'sm'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <XStack width="100%" onLayout={(e) => setTriggerW(e.nativeEvent.layout.width)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={isSm ? 'sm' : 'default'}
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            justify="flex-start"
            width="100%"
            className={className}
          >
          <SizableText numberOfLines={1} size={isSm ? '$1' : '$2'} color="$color12">
            {selectedLabel}
          </SizableText>
          {selectedFamily && (
            <SizableText numberOfLines={1} size={isSm ? '$1' : '$2'} color="$color11">
              {selectedFamily}
            </SizableText>
          )}
            <ChevronsUpDown size={isSm ? 12 : 14} ml="auto" shrink={0} opacity={0.5} />
          </Button>
        </PopoverTrigger>
      </XStack>
      <PopoverContent align="start" p={0} width={Math.max(triggerW, MIN_W)}>
        <Command>
          {showSearch && <CommandInput placeholder="Search models…" />}
          <CommandList maxH={MAX_H}>
            <CommandEmpty>No models found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.family} heading={group.family}>
                {group.models.map((m) => {
                  const label = m.label ?? m.id
                  const ctx = fmtContext(m.context_window)
                  return (
                    <CommandItem
                      key={m.id}
                      value={`${group.family} ${label} ${m.id}`}
                      onSelect={() => {
                        onChange(m.id)
                        setOpen(false)
                      }}
                    >
                      <Check size={14} shrink={0} opacity={m.id === value ? 1 : 0} />
                      <SizableText numberOfLines={1} size="$2">
                        {label}
                      </SizableText>
                      {m.premium && (
                        <SizableText size="$2" color="$color11" aria-label="Premium">
                          ✦
                        </SizableText>
                      )}
                      {ctx && (
                        <XStack ml="auto" shrink={0} pl="$2">
                          <SizableText size="$1" color="$color11" fontVariant={['tabular-nums']}>
                            {ctx}
                          </SizableText>
                        </XStack>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ModelSelector
