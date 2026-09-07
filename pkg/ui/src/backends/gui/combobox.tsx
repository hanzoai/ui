'use client'

/**
 * Combobox — a searchable single-select built from `Popover` + `Command`.
 *
 * A `Button` trigger shows the selected option's label (or a placeholder), a
 * filterable list drops from it, and picking an already-selected row clears
 * the value. `Popover` owns open state, `Command` owns the search/selection
 * state machine — this file is composition, not a new primitive.
 */
import { useId, useState, type ComponentProps, type ComponentType } from 'react'
import { XStack } from '@hanzo/gui'
import { Check, ChevronsUpDown } from '@hanzogui/lucide-icons-2'

import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type ComboboxOption = {
  value: string
  label: string
}

export type ComboboxProps = Omit<ComponentProps<typeof PopoverContent>, 'children' | 'onChange'> & {
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
}

function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  disabled,
  width = 200,
  ...contentProps
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-slot="combobox-trigger"
          role="combobox"
          aria-expanded={open}
          aria-controls={id}
          variant="outline"
          disabled={disabled}
          width={width}
          justify="space-between"
        >
          {selected ? selected.label : placeholder}
          <ChevronsUpDown size={16} opacity={0.5} shrink={0} />
        </Button>
      </PopoverTrigger>
      <PopoverContent id={id} data-slot="combobox-content" p={0} width={width} {...contentProps}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(current) => {
                    onChange?.(current === value ? '' : current)
                    setOpen(false)
                  }}
                >
                  <Check size={16} opacity={option.value === value ? 1 : 0} shrink={0} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * A `Combobox` row that carries an icon beside its label — the "set status"
 * pattern where each option also draws a glyph in the trigger once picked.
 */
export type ComboboxIconOption = ComboboxOption & {
  icon: ComponentType<{ size?: number }>
}

export type ComboboxWithIconsProps = Omit<ComboboxProps, 'options'> & {
  options: ComboboxIconOption[]
}

function ComboboxWithIcons({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  disabled,
  width = 200,
  ...contentProps
}: ComboboxWithIconsProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const selected = options.find((option) => option.value === value)
  const SelectedIcon = selected?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-slot="combobox-trigger"
          role="combobox"
          aria-expanded={open}
          aria-controls={id}
          variant="outline"
          disabled={disabled}
          width={width}
          justify="flex-start"
        >
          {selected && SelectedIcon ? (
            <XStack items="center" gap="$2">
              <SelectedIcon size={16} />
              {selected.label}
            </XStack>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent id={id} data-slot="combobox-content" p={0} width={width} {...contentProps}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const Icon = option.icon
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(current) => {
                      onChange?.(current === value ? '' : current)
                      setOpen(false)
                    }}
                  >
                    <Icon size={16} />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, ComboboxWithIcons }
