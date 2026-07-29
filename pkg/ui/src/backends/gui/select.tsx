'use client'

/**
 * Select — the compound picker on @hanzogui/select.
 *
 * gui's `Select.Item` needs a positional `index`. Call sites should not have to
 * count, so `SelectContent` walks its subtree once per render and stamps
 * sequential indices on every `SelectItem` it finds — including items nested in a
 * `SelectGroup`. An item is written `<SelectItem value="x">Label</SelectItem>`
 * and the numbering always matches render order.
 */
import { Select as GuiSelect, SelectSeparator as GuiSelectSeparator, XStack } from '@hanzo/gui'
import { Check, ChevronDown, ChevronUp } from '@hanzogui/lucide-icons-2'
import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

const ROW_H = 32
const TRIGGER_H = 36

const Select: typeof GuiSelect = GuiSelect
const SelectGroup: typeof GuiSelect.Group = GuiSelect.Group
const SelectValue: typeof GuiSelect.Value = GuiSelect.Value

export type SelectTriggerProps = ComponentProps<typeof GuiSelect.Trigger>
export type SelectContentProps = ComponentProps<typeof GuiSelect.Content>
export type SelectItemProps = Omit<ComponentProps<typeof GuiSelect.Item>, 'index'> & {
  index?: number
}
export type SelectLabelProps = ComponentProps<typeof GuiSelect.Label>
export type SelectSeparatorProps = ComponentProps<typeof GuiSelectSeparator>
export type SelectScrollButtonProps = ComponentProps<typeof GuiSelect.ScrollUpButton>

const SelectTrigger = ({ children, ...props }: SelectTriggerProps) => (
  <GuiSelect.Trigger
    {...slot('select-trigger')}
    unstyled
    items="center"
    justify="space-between"
    gap="$2"
    height={TRIGGER_H}
    px="$3"
    rounded="$3"
    borderWidth={1}
    borderColor="$borderColor"
    bg="transparent"
    cursor="pointer"
    {...touch(TRIGGER_H, 44, 'y')}
    {...props}
  >
    {ink(children, undefined, { size: '$2' })}
    <GuiSelect.Icon>
      <ChevronDown size={16} opacity={0.5} />
    </GuiSelect.Icon>
  </GuiSelect.Trigger>
)

const SelectItem = ({ children, ...props }: SelectItemProps) => (
  <GuiSelect.Item
    {...slot('select-item')}
    unstyled
    index={props.index ?? 0}
    items="center"
    gap="$2"
    minH={ROW_H}
    pl="$2"
    pr="$7"
    rounded="$2"
    cursor="pointer"
    {...touch(ROW_H, 44, 'y')}
    hoverStyle={{ bg: '$color5' }}
    focusStyle={{ bg: '$color5' }}
    {...props}
  >
    <GuiSelect.ItemText>{children}</GuiSelect.ItemText>
    <XStack position="absolute" r="$2" items="center" justify="center" pointerEvents="none">
      <GuiSelect.ItemIndicator>
        <Check size={16} />
      </GuiSelect.ItemIndicator>
    </XStack>
  </GuiSelect.Item>
)

/** Depth-first stamp of `index` onto every `SelectItem` in render order. */
const stampIndices = (children: ReactNode, next: () => number): ReactNode =>
  Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    if (child.type === SelectItem) return cloneElement(child, { index: next() } as never)
    const kids = (child.props as { children?: ReactNode }).children
    return kids === undefined ? child : cloneElement(child, undefined, stampIndices(kids, next))
  })

const SelectScrollUpButton = (props: SelectScrollButtonProps) => (
  <GuiSelect.ScrollUpButton {...slot('select-scroll-up-button')} items="center" justify="center" py="$1" {...props}>
    <ChevronUp size={16} />
  </GuiSelect.ScrollUpButton>
)

const SelectScrollDownButton = (props: SelectScrollButtonProps) => (
  <GuiSelect.ScrollDownButton {...slot('select-scroll-down-button')} items="center" justify="center" py="$1" {...props}>
    <ChevronDown size={16} />
  </GuiSelect.ScrollDownButton>
)

const SelectContent = ({ children, ...props }: SelectContentProps) => {
  let n = 0
  return (
    <GuiSelect.Content {...slot('select-content')} {...props}>
      <SelectScrollUpButton />
      <GuiSelect.Viewport
        minW={128}
        p="$1"
        bg="$color2"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$4"
      >
        {stampIndices(children, () => n++)}
      </GuiSelect.Viewport>
      <SelectScrollDownButton />
    </GuiSelect.Content>
  )
}

const SelectLabel = (props: SelectLabelProps) => (
  <GuiSelect.Label {...slot('select-label')} px="$2" py="$1.5" fontSize="$1" color="$color11" {...props} />
)

const SelectSeparator = (props: SelectSeparatorProps) => (
  <GuiSelectSeparator {...slot('select-separator')} my="$1" borderColor="$borderColor" {...props} />
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
