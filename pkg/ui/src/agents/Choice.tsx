'use client'

/**
 * ModeSelect and PageSelect — pick one of a few, from a chip.
 *
 * Ported from build-v2 `components/editor/ask-ai` (the Build ⌄ mode chip) and
 * `components/editor/header` (the page selector) (MIT, derived from OSW Studio
 * and DeepSite — see NOTICE). Both are the same act — a label that says what
 * is chosen and a menu of what else can be — so both are one `Choice` over the
 * package's one `DropdownMenu`, which already owns the roving focus, the
 * placement and the dismiss. They differ in dress only: a mode is a compact
 * chip in a composer's row, a page is a wide field in the bar.
 *
 * WHAT A MODE MEANS IS THE HOST'S. `modes` is data; Build and Plan are the
 * builder's two, and the hint under each is where the host says what the
 * difference is ("edits, commits and pushes" / "plans without writing").
 */
import { SizableText, XStack } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '../backends/gui/button'
import { DropdownMenu } from '../backends/gui/dropdown-menu'
import { slot } from '../backends/gui/slot'

/** One thing to choose. */
export interface Option {
  id: string
  label: string
  /** A second line in the menu: what choosing this does. */
  hint?: string
  icon?: ReactNode
}

type Trigger = Omit<ComponentProps<typeof Button>, 'children' | 'onChange' | 'value'>

/** What every choice takes, whatever it chooses between. */
interface Chosen {
  value: string
  onChange: (id: string) => void
  /** Where the menu opens relative to the chip. */
  placement?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'bottom' | 'top'
}

interface ChoiceProps extends Chosen, Trigger {
  options: readonly Option[]
  /** The control's accessible name; the chosen label follows it. */
  label: string
}

function Choice({
  options,
  value,
  onChange,
  label,
  placement = 'bottom-start',
  part,
  field,
  ...rest
}: ChoiceProps & { part: string; field: boolean }) {
  const chosen = options.find((o) => o.id === value) ?? options[0]
  return (
    <DropdownMenu
      placement={placement}
      trigger={
        <Button
          {...slot(part)}
          type="button"
          variant={field ? 'default' : 'ghost'}
          size="sm"
          aria-label={`${label}: ${chosen?.label ?? 'none'}`}
          aria-haspopup="menu"
          minHeight={field ? 32 : 28}
          px={field ? '$3' : '$2'}
          rounded="$3"
          bg={field ? '$hover' : '$panel'}
          justify={field ? 'center' : 'flex-start'}
          // A chip is as wide as its word, in a row or in a column.
          self="flex-start"
          {...rest}
        >
          <XStack items="center" gap="$1.5" minW={0}>
            {chosen?.icon ?? null}
            <SizableText size="$2" color="$ink" numberOfLines={1}>
              {chosen?.label ?? ''}
            </SizableText>
            <ChevronDown size={13} opacity={0.6} />
          </XStack>
        </Button>
      }
      items={options.map((o) => ({
        key: o.id,
        label: o.label,
        description: o.hint,
        icon: o.icon,
        selected: o.id === value,
        onSelect: () => onChange(o.id),
      }))}
    />
  )
}

export interface ModeSelectProps extends Chosen, Trigger {
  modes: readonly Option[]
  /** The control's accessible name. Defaults to "Mode". */
  label?: string
}

/** The composer's mode chip — v2's Build ⌄. Opens upward: it sits at the bottom. */
export function ModeSelect({ modes, label = 'Mode', placement = 'top-start', ...rest }: ModeSelectProps) {
  return <Choice part="mode-select" field={false} options={modes} label={label} placement={placement} {...rest} />
}

export interface PageSelectProps extends Chosen, Trigger {
  pages: readonly Option[]
  /** The control's accessible name. Defaults to "Page". */
  label?: string
}

/** The bar's page selector — v2's wide "Homepage ⌄" field. */
export function PageSelect({ pages, label = 'Page', placement = 'bottom', ...rest }: PageSelectProps) {
  return (
    <Choice part="page-select" field options={pages} label={label} placement={placement} minW={140} maxW={200} {...rest} />
  )
}
