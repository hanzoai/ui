'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '../utils'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../primitives/command'
import {
  familyOf,
  filterChatModels,
  groupModelsByFamily,
  type ModelCatalogEntry,
} from './catalog'

/** Show the search input once a catalog gets this large. */
const SEARCH_THRESHOLD = 12

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
 * hanzo.chat-style family grouping in a compact Radix Popover + cmdk Command
 * combobox: grouped sections with family headers, premium markers, context
 * suffixes, keyboard navigation, and type-to-filter search for large catalogs.
 * Monochrome, dark-first, data-agnostic.
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

  const visible = useMemo(
    () => (chatOnly ? filterChatModels(models) : models),
    [models, chatOnly],
  )
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
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border border-border bg-background text-left font-medium text-foreground transition hover:border-primary/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
            isSm ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm',
            className,
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          {selectedFamily && (
            <span className="truncate text-muted-foreground">{selectedFamily}</span>
          )}
          <ChevronsUpDown
            className={cn('ml-auto shrink-0 opacity-50', isSm ? 'h-3 w-3' : 'h-3.5 w-3.5')}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[14rem] border-border bg-popover p-0 text-popover-foreground shadow-md"
      >
        <Command>
          {showSearch && (
            <CommandInput placeholder="Search models…" className="h-9 text-sm" />
          )}
          <CommandList className="max-h-72">
            <CommandEmpty>No models found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup
                key={group.family}
                heading={group.family}
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
              >
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
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          m.id === value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{label}</span>
                      {m.premium && (
                        <span
                          className="text-muted-foreground"
                          title="Premium"
                          aria-label="Premium"
                        >
                          ✦
                        </span>
                      )}
                      {ctx && (
                        <span className="ml-auto shrink-0 pl-2 text-[10px] tabular-nums text-muted-foreground">
                          {ctx}
                        </span>
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
