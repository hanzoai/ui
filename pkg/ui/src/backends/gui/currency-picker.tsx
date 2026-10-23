'use client'

/**
 * CurrencyPicker — the currency at the start of an amount field.
 *
 *   <InputGroup>
 *     <CurrencyPicker currencies={list} value={code} onValueChange={setCode} />
 *     <NumberField value={amount} onValueChange={setAmount} />
 *   </InputGroup>
 *
 * A segment of the field, not a box beside it (`Segment`): the code in the
 * quiet ink and a small chevron, opening a searchable list in which the name,
 * the code and the symbol all match. Data-free: the caller passes the
 * currencies, from `Intl.supportedValuesOf('currency')` or its own list.
 *
 * Props and anatomy after the source kit's CurrencyPicker (MIT, NOTICE).
 */
import { SizableText } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import { useState, type ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { SearchList, Segment, useOpen, type SearchOption } from './search-list'

export type CurrencyOption = {
  /** ISO 4217, e.g. "USD". */
  code: string
  /** e.g. "US Dollar". */
  name: string
  symbol?: string
  disabled?: boolean
}

export type CurrencyPickerProps = {
  currencies: CurrencyOption[]
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (code: string | null) => void
  /** Shown in the segment when nothing is picked. */
  placeholder?: string
  /** What the segment shows for the picked currency; its code by default. */
  renderValue?: (currency: CurrencyOption | undefined) => ReactNode
  /** A row's label; "Name (CODE)" by default. */
  getOptionLabel?: (currency: CurrencyOption) => string
  /** What a row is found by beyond its label; the name, the code and the symbol by default. */
  getSearchText?: (currency: CurrencyOption) => string
  /** The picked currency first in the list. */
  selectedFirst?: boolean
  /** Close the list on a pick (default true). */
  closeOnSelect?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /** The segment's name to assistive technology, before the picked currency. */
  label?: string
  searchLabel?: string
  emptyLabel?: string
}

const label = (c: CurrencyOption) => `${c.name} (${c.code})`
const search = (c: CurrencyOption) => [c.name, c.code, c.symbol].filter(Boolean).join(' ')

export function CurrencyPicker({
  currencies,
  value,
  defaultValue = null,
  onValueChange,
  placeholder = '—',
  renderValue,
  getOptionLabel = label,
  getSearchText = search,
  selectedFirst = false,
  closeOnSelect = true,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  label: named,
  searchLabel,
  emptyLabel,
}: CurrencyPickerProps) {
  const { t } = useI18n()
  const name = named ?? t('Currency')
  const [own, setOwn] = useState<string | null>(defaultValue)
  const code = value !== undefined ? value : own
  const [shown, setShown] = useOpen(open, defaultOpen, onOpenChange)
  const picked = currencies.find((c) => c.code === code)

  const ordered = selectedFirst && picked ? [picked, ...currencies.filter((c) => c !== picked)] : currencies
  const options: SearchOption[] = ordered.map((c) => ({
    value: c.code,
    label: getOptionLabel(c),
    keywords: [getSearchText(c)],
    disabled: c.disabled,
    end: c.symbol,
  }))

  return (
    <SearchList
      open={shown && !disabled}
      onOpenChange={(next) => setShown(disabled ? false : next)}
      options={options}
      value={code}
      searchLabel={searchLabel ?? t('Search currencies')}
      emptyLabel={emptyLabel ?? t('No currency found')}
      onPick={(next) => {
        if (value === undefined) setOwn(next)
        if (next !== code) onValueChange?.(next)
        if (closeOnSelect) setShown(false)
      }}
      trigger={
        <Segment
          {...({ 'data-slot': 'currency-picker' } as object)}
          disabled={disabled}
          open={shown}
          label={picked ? t('{label}: {value}', { label: name, value: picked.name }) : name}
        >
          {renderValue ? (
            renderValue(picked)
          ) : (
            <SizableText size="$2" fontWeight="500" color="$hint">
              {picked?.code ?? placeholder}
            </SizableText>
          )}
          <ChevronDown size={14} color="$hint" />
        </Segment>
      }
    />
  )
}
