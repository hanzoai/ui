'use client'

/**
 * PhoneCountryPicker — the calling code at the start of a phone field.
 *
 *   <InputGroup>
 *     <PhoneCountryPicker countries={list} value={iso} onValueChange={setIso} />
 *     <Input value={number} onChangeText={setNumber} inputMode="tel" />
 *   </InputGroup>
 *
 * A segment of the field (`Segment`) showing the country's flag and a chevron;
 * the list it opens is found by country name, ISO code and calling code, with
 * or without the "+". The picked country is named in a visually hidden label,
 * since a flag alone says nothing to a screen reader. Parsing and validating the
 * number belong to the field layer, not here. Data-free: the caller passes the
 * countries and their calling codes.
 *
 * Flags are regional-indicator text (`flag`), drawn by the platform. Anatomy
 * after twenty-ui's PhoneCountryPicker (MIT, NOTICE): 8px before the flag and 4
 * after the chevron, a 16×12 flag with 2px corners, a globe when none.
 */
import { SizableText, VisuallyHidden, XStack } from '@hanzo/gui'
import { ChevronDown, Globe } from '@hanzogui/lucide-icons-2'
import { useState, type ReactNode } from 'react'
import { flag } from './flag'
import { SearchList, Segment, useOpen, type SearchOption } from './search-list'

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2, e.g. "FR". */
  value: string
  /** The country's name in the reader's language. */
  label: string
  /** Without the "+", e.g. "33". */
  callingCode: string
  /** Overrides the regional-indicator flag. */
  flag?: ReactNode
  disabled?: boolean
}

export type PhoneCountryPickerProps = {
  countries: PhoneCountry[]
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (iso: string | null) => void
  closeOnSelect?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /** The segment's name to assistive technology, before the picked country. */
  label?: string
  searchLabel?: string
  emptyLabel?: string
}

/** The 16×12 flag box, 2px corners; a globe when there is no country. */
export function Flag({ iso, override }: { iso?: string | null; override?: ReactNode }) {
  const glyph = override ?? flag(iso)
  return (
    <XStack width={16} height={12} rounded="$2xs" overflow="hidden" items="center" justify="center" shrink={0} aria-hidden>
      {glyph == null ? (
        <Globe size={14} color="$hint" />
      ) : typeof glyph === 'string' ? (
        <SizableText size="$2" lineHeight={12}>
          {glyph}
        </SizableText>
      ) : (
        glyph
      )}
    </XStack>
  )
}

export function PhoneCountryPicker({
  countries,
  value,
  defaultValue = null,
  onValueChange,
  closeOnSelect = true,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  label: name = 'Country calling code',
  searchLabel = 'Search countries',
  emptyLabel = 'No country found',
}: PhoneCountryPickerProps) {
  const [own, setOwn] = useState<string | null>(defaultValue)
  const iso = value !== undefined ? value : own
  const [shown, setShown] = useOpen(open, defaultOpen, onOpenChange)
  const picked = countries.find((c) => c.value === iso)

  const options: SearchOption[] = countries.map((c) => ({
    value: c.value,
    label: c.label,
    keywords: [c.value, c.callingCode, `+${c.callingCode}`],
    disabled: c.disabled,
    start: (
      <XStack pr="$1">
        <Flag iso={c.value} override={c.flag} />
      </XStack>
    ),
    end: `+${c.callingCode}`,
  }))

  return (
    <SearchList
      open={shown && !disabled}
      onOpenChange={(next) => setShown(disabled ? false : next)}
      options={options}
      value={iso}
      searchLabel={searchLabel}
      emptyLabel={emptyLabel}
      width={280}
      onPick={(next) => {
        if (value === undefined) setOwn(next)
        if (next !== iso) onValueChange?.(next)
        if (closeOnSelect) setShown(false)
      }}
      trigger={
        <Segment
          {...({ 'data-slot': 'phone-country-picker' } as object)}
          disabled={disabled}
          open={shown}
          // Named by its hidden text, not an aria-label: the flag says nothing to
          // a screen reader, and the words are the ones a translator sees.
          gap="$0.5"
          pl="$2"
          pr="$1"
        >
          <Flag iso={picked?.value} override={picked?.flag} />
          <ChevronDown size={14} color="$hint" />
          <VisuallyHidden>{picked ? `${name}: ${picked.label} +${picked.callingCode}` : name}</VisuallyHidden>
        </Segment>
      }
    />
  )
}
