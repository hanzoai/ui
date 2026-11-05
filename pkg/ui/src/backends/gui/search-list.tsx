'use client'

/**
 * SearchList — the searchable list the record kit's pickers open: a currency, a
 * calling code, a country.
 *
 * Composition, as `Combobox` is: `Popover` owns the open state and the panel,
 * `Command` owns the search and the cursor — typed text filters the rows, the
 * arrows move, Enter picks, Escape closes. A row is matched on its label and on
 * its keywords, so "usd", "dollar" and "$" all find the US dollar.
 *
 * The panel is portalled, and a portal does not carry React context across, so
 * the density the trigger sits in is read here and given again inside, as
 * `PortalTheme` does for the theme. Rows are the record row: 32px, 4px corners.
 * After the source kit's searchable picker dropdown (MIT, NOTICE).
 */
import { SizableText, XStack, type GuiElement } from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'
import { forwardRef, useContext, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command'
import { BOX } from './control'
import { Density, fieldSize, useDensity } from './density'
import { touch } from './gesture'
import { GroupContext } from './input-group'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { RING } from './press'
import { slot } from './slot'

/** Open state, controlled or not: `open` wins when given, `onOpenChange` hears every change. */
export const useOpen = (open?: boolean, defaultOpen = false, onOpenChange?: (open: boolean) => void) => {
  const [own, setOwn] = useState(defaultOpen)
  const shown = open ?? own
  const set = (next: boolean) => {
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }
  return [shown, set] as const
}

export type SegmentProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  disabled?: boolean
  /** Whether the list it opens is open. */
  open?: boolean
  /**
   * Its name to assistive technology: what it picks and what is picked. Omit it
   * when the segment's own (visually hidden) text names it.
   */
  label?: string
  children?: ReactNode
}

/**
 * The start segment of an `InputGroup`: a picker trigger that is part of the
 * field rather than a box beside it. Transparent, as tall as the group's inside,
 * flush with its start edge (it takes back the group's gutter), with a hairline
 * divider on its end side and the group's start corners. A real `<button>`, so
 * Enter and Space open it with no key handling of ours; its focus ring is drawn
 * inside, where the group's edge would otherwise cover it.
 */
export const Segment = /* @__PURE__ */ forwardRef<GuiElement, SegmentProps>(function Segment(
  { disabled, open, label, children, ...props },
  ref,
) {
  const group = useContext(GroupContext)
  const density = useDensity()
  const box = BOX[group?.size ?? fieldSize(undefined, density)]
  return (
    <XStack
      ref={ref}
      {...slot('field-segment')}
      render="button"
      // `aria-haspopup` and `aria-expanded` arrive from the Popover trigger it
      // sits under; `aria-expanded` is stated as well for a segment used alone.
      {...({ type: 'button', disabled, 'aria-expanded': !!open, ...(label ? { 'aria-label': label } : null) } as object)}
      height={box.h - 2}
      marginInlineStart={group ? -box.gutter : 0}
      shrink={0}
      items="center"
      gap="$1"
      px="$2"
      bg="transparent"
      borderWidth={0}
      borderInlineEndWidth={1}
      borderColor="$borderColor"
      borderStartStartRadius="$3"
      borderEndStartRadius="$3"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={disabled ? undefined : { bg: '$hover' }}
      focusVisibleStyle={{ ...RING, outlineOffset: -2 }}
      {...props}
    >
      {children}
    </XStack>
  )
})

export type SearchOption = {
  value: string
  label: string
  /** More text the search matches: a code, a symbol, a calling code. */
  keywords?: string[]
  disabled?: boolean
  /** Before the label: a flag, an icon. */
  start?: ReactNode
  /** After the label, dimmed: a code, a calling code. */
  end?: ReactNode
}

export type SearchListProps = {
  /** The element that opens the list. It receives the press and the ref. */
  trigger: ReactElement
  open: boolean
  onOpenChange: (open: boolean) => void
  options: SearchOption[]
  /** The chosen value, marked with a check and highlighted on open. */
  value?: string | null
  onPick: (value: string) => void
  searchLabel?: string
  emptyLabel?: string
  /** The panel's width; 240 by default. */
  width?: number
}

const ROW = 32

export function SearchList({
  trigger,
  open,
  onOpenChange,
  options,
  value,
  onPick,
  searchLabel,
  emptyLabel,
  width = 240,
}: SearchListProps) {
  const { t } = useI18n()
  const density = useDensity()
  const search = searchLabel ?? t('Search')
  return (
    <Popover open={open} onOpenChange={onOpenChange} placement="bottom-start">
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent data-slot="search-list" p={0} width={width} sideOffset={8} overflow="hidden">
        <Density value={density}>
          <Command value={value ?? undefined}>
            <CommandInput placeholder={search} aria-label={search} autoFocus />
            <CommandList p="$1">
              <CommandEmpty>{emptyLabel ?? t('No results')}</CommandEmpty>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  keywords={[o.label, ...(o.keywords ?? [])]}
                  disabled={o.disabled}
                  minH={ROW}
                  px="$1"
                  rounded="$xs"
                  {...touch(ROW, 44, 'y')}
                  onSelect={(picked) => onPick(picked)}
                  {...({ 'aria-selected': o.value === value } as object)}
                >
                  {o.start ? (
                    <XStack shrink={0} items="center">
                      {o.start}
                    </XStack>
                  ) : null}
                  <SizableText size="$2" color="$ink" flex={1} minW={0} numberOfLines={1}>
                    {o.label}
                  </SizableText>
                  {o.end != null ? (
                    <SizableText size="$2" color="$hint" shrink={0}>
                      {o.end}
                    </SizableText>
                  ) : null}
                  <Check size={16} opacity={o.value === value ? 1 : 0} shrink={0} />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </Density>
      </PopoverContent>
    </Popover>
  )
}
