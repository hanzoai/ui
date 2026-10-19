'use client'

/**
 * ComboBox — a typeable select: a text input the user can type any value into, PLUS a
 * menu of LIVE options (filtered by what's typed) they can pick from. The value is
 * always exactly the input text, so a custom id is inherently supported. Prop-driven +
 * self-contained (options/loading/error injected by the caller).
 *
 * Uses the ONE shared menu spec (MenuItemView) + FloatingMenu (gui Portal) so options look
 * identical to every other menu and render correctly through the portal under a nested
 * `<Theme>` on gui-native hosts. The input row is the anchor (excluded from dismiss) and
 * the panel does NOT steal focus, so typing keeps filtering.
 *
 * Under `<Density value="compact">` it is the record kit's Autocomplete
 * (twenty-ui's, MIT, NOTICE): one 32px field box, the chevron a quiet icon
 * button inside its end rather than a control beside it. `limit` caps how many
 * live options the list shows. A regular surface draws the row it always has.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { Button, Input, Spinner, Text, XStack } from '@hanzo/gui'
import { ChevronDown, RefreshCw } from '@hanzogui/lucide-icons-2'

import { Button as KitButton } from '../backends/gui/button'
import { useDensity } from '../backends/gui/density'
import { Input as KitInput } from '../backends/gui/input'
import { InputGroup } from '../backends/gui/input-group'
import { useEmit } from './instrument'
import { filterOptions, type ComboOption } from './combobox/filter'
import { MenuItemView } from './menu/items'
import { FloatingMenu } from './menu/FloatingMenu'

export type { ComboOption } from './combobox/filter'

export function ComboBox({
  value,
  onChange,
  options,
  loading = false,
  error = null,
  onRetry,
  placeholder,
  disabled,
  emptyText = 'No matches — press to use what you typed.',
  minWidth = 240,
  limit,
}: {
  value: string
  onChange: (v: string) => void
  /** The live option list. Filtered against the typed text. */
  options: ComboOption[]
  /** True while the caller is loading the option list (shows a spinner row). */
  loading?: boolean
  /** A human message when the option list failed to load (list still typeable). */
  error?: string | null
  /** Retry the option load (shown next to the error). */
  onRetry?: () => void
  placeholder?: string
  disabled?: boolean
  /** Row shown when the filter matches nothing (the typed value is still usable). */
  emptyText?: string
  minWidth?: number
  /** At most this many live options in the list; all of them when unset. */
  limit?: number
}) {
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLElement | null>(null)
  const anchorRect = useCallback(() => rowRef.current?.getBoundingClientRect() ?? null, [])
  const anchorEl = useCallback(() => rowRef.current, [])
  const filtered = useMemo(() => {
    const all = filterOptions(options, value)
    return limit != null && limit >= 0 ? all.slice(0, limit) : all
  }, [options, value, limit])
  const compact = useDensity() === 'compact'

  const track = useEmit()

  const pick = (v: string) => {
    track({ component: 'ComboBox', action: 'select', id: v, value: filtered.length })
    onChange(v)
    setOpen(false)
  }

  const toggle = () => {
    track({ component: 'ComboBox', action: open ? 'close' : 'open' })
    setOpen((o) => !o)
  }

  return (
    <>
      {compact ? (
        <XStack ref={rowRef as never} minW={minWidth} data-slot="combo-box">
          <InputGroup
            end={
              <KitButton size="icon-2xs" variant="ghost" emphasis="subtle" disabled={disabled} aria-label="Show options" onPress={toggle}>
                <ChevronDown />
              </KitButton>
            }
          >
            <KitInput
              value={value}
              onChangeText={(v: string) => {
                onChange(v)
                if (!open) setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              disabled={disabled}
              placeholder={placeholder}
              autoCapitalize="none"
            />
          </InputGroup>
        </XStack>
      ) : (
      <XStack ref={rowRef as never} items="center" gap="$2" minW={minWidth}>
        <Input
          flex={1}
          value={value}
          onChangeText={(v: string) => {
            onChange(v)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          autoCapitalize="none"
        />
        <Button
          size="$2"
          chromeless
          disabled={disabled}
          icon={<ChevronDown size={16} opacity={0.7} />}
          onPress={toggle}
          aria-label="Show options"
        />
      </XStack>
      )}

      <FloatingMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRect={anchorRect}
        anchorEl={anchorEl}
        autoFocus={false}
        minWidth={minWidth}
        maxHeight={300}
      >
        {loading ? (
          <XStack items="center" gap="$2" px="$2" py="$2">
            <Spinner size="small" color="$quiet" />
            <Text fontSize="$2" color="$soft">
              Loading options…
            </Text>
          </XStack>
        ) : error ? (
          <XStack items="center" gap="$2" px="$2" py="$2">
            <Text fontSize="$2" color="$soft" flex={1} numberOfLines={2}>
              {error}
            </Text>
            {onRetry ? (
              <Button size="$1" chromeless icon={<RefreshCw size={12} />} onPress={onRetry} aria-label="Retry" />
            ) : null}
          </XStack>
        ) : filtered.length === 0 ? (
          <Text fontSize="$2" color="$soft" px="$2" py="$2">
            {emptyText}
          </Text>
        ) : (
          filtered.map((o) => (
            <MenuItemView
              key={o.value}
              label={o.label ?? o.value}
              description={o.hint}
              selected={o.value === value}
              onSelect={() => pick(o.value)}
            />
          ))
        )}
      </FloatingMenu>
    </>
  )
}
