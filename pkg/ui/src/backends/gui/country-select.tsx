'use client'

/**
 * CountrySelect — a searchable country chooser with flags and a "No country"
 * first row: an address's country, a default country in settings.
 *
 * The trigger is a Select trigger in shape — the field box at its size, the
 * flag, the name truncated, the chevron — and the list is the kit's searchable
 * list, found by name or ISO code. Data-free: the caller passes the countries,
 * named in the reader's language (`Intl.DisplayNames` with `type: 'region'`
 * names any ISO code). A list that is empty disables the control.
 *
 * Props and anatomy after the source kit's CountrySelect (MIT, NOTICE): a 16px flag
 * slot holding a crossed circle when there is no country, an optional visible
 * label above in the small semibold caption.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, CircleOff } from '@hanzogui/lucide-icons-2'
import { useId, useState, type ReactNode } from 'react'
import { BOX, FIELD, type FieldSize } from './control'
import { fieldSize, useDensity } from './density'
import { flag } from './flag'
import { touch } from './gesture'
import { SearchList, useOpen, type SearchOption } from './search-list'
import { slot } from './slot'
import { align } from './dir'

export type CountryOption = {
  /** ISO 3166-1 alpha-2, e.g. "DE". */
  value: string
  label: string
  /** Overrides the regional-indicator flag. */
  flag?: ReactNode
  disabled?: boolean
}

export type CountrySelectProps = {
  countries: CountryOption[]
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (iso: string | null) => void
  /** A visible label above the trigger. */
  label?: string
  /** The trigger's name to assistive technology when there is no visible label. */
  'aria-label'?: string
  noCountryLabel?: string
  searchLabel?: string
  noResultsLabel?: string
  size?: FieldSize
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

/** The value the "No country" row carries: lowercase and four letters, so never an ISO code. */
const NONE = 'none'

/** A country's 16×16 flag slot; a crossed circle when there is none. */
const Mark = ({ iso, override }: { iso?: string | null; override?: ReactNode }) => {
  const glyph = override ?? flag(iso)
  return (
    <XStack width={16} height={16} items="center" justify="center" shrink={0} aria-hidden>
      {glyph == null ? (
        <CircleOff size={16} color="$hint" />
      ) : typeof glyph === 'string' ? (
        <SizableText size="$3" lineHeight={16}>
          {glyph}
        </SizableText>
      ) : (
        glyph
      )}
    </XStack>
  )
}

export function CountrySelect({
  countries,
  value,
  defaultValue = null,
  onValueChange,
  label,
  'aria-label': ariaLabel,
  noCountryLabel = 'No country',
  searchLabel = 'Search',
  noResultsLabel = 'No results',
  size,
  open,
  defaultOpen,
  onOpenChange,
  disabled: off = false,
}: CountrySelectProps) {
  const density = useDensity()
  const box = BOX[fieldSize(size, density)]
  const id = useId()
  const [own, setOwn] = useState<string | null>(defaultValue)
  const iso = value !== undefined ? value : own
  const [shown, setShown] = useOpen(open, defaultOpen, onOpenChange)
  const disabled = off || countries.length === 0
  const picked = countries.find((c) => c.value === iso)

  const options: SearchOption[] = [
    { value: NONE, label: noCountryLabel, start: <Mark /> },
    ...countries.map((c) => ({
      value: c.value,
      label: c.label,
      keywords: [c.value],
      disabled: c.disabled,
      start: <Mark iso={c.value} override={c.flag} />,
    })),
  ]

  const trigger = (
    <XStack
      {...slot('country-select')}
      render="button"
      {...({
        type: 'button',
        disabled,
        'aria-expanded': shown,
        ...(label ? { 'aria-labelledby': id } : ariaLabel ? { 'aria-label': ariaLabel } : null),
      } as object)}
      componentName="Input"
      {...FIELD}
      {...(density === 'compact' ? { bg: '$panel' } : null)}
      minH={box.h}
      px={box.gutter}
      width="100%"
      minW={0}
      items="center"
      gap="$2"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      borderColor={shown ? '$borderColorFocus' : '$borderColor'}
      hoverStyle={disabled ? undefined : { borderColor: '$borderColorHover' }}
      {...touch(box.h, 44, 'y')}
    >
      <Mark iso={picked?.value} override={picked?.flag} />
      <SizableText size={box.font} color={picked ? '$ink' : '$placeholderColor'} flex={1} minW={0} numberOfLines={1} {...align('start')}>
        {picked?.label ?? noCountryLabel}
      </SizableText>
      <ChevronDown size={16} opacity={0.5} shrink={0} />
    </XStack>
  )

  return (
    <YStack {...slot('country-select-field')} width="100%" minW={0} gap="$1">
      {label ? (
        <SizableText id={id} size="$1" fontWeight="600" color="$hint">
          {label}
        </SizableText>
      ) : null}
      <SearchList
        open={shown && !disabled}
        onOpenChange={(next) => setShown(disabled ? false : next)}
        options={options}
        value={iso ?? NONE}
        searchLabel={searchLabel}
        emptyLabel={noResultsLabel}
        width={280}
        onPick={(next) => {
          const picked = next === NONE ? null : next
          if (value === undefined) setOwn(picked)
          if (picked !== iso) onValueChange?.(picked)
          setShown(false)
        }}
        trigger={trigger}
      />
    </YStack>
  )
}
