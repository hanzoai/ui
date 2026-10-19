'use client'

/**
 * Item — a flex row for displaying content with media, a title, a description
 * and actions. `ItemGroup` stacks several with one rhythm and a separator
 * between them; `asChild` puts the item's hover/focus styling on a passed-in
 * element (an anchor, say) instead of wrapping it.
 *
 * `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`,
 * `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemGroup`, `ItemSeparator`, and
 * the `data-slot`/`data-variant`/`data-size` markers.
 *
 * Variant and size live on `Item` alone — border, background, gap and padding.
 * The parts inside (`ItemMedia`, `ItemTitle`, ...) carry fixed styling of their
 * own and never read Item's variant or size, matching the original shape.
 *
 * `size="row"` is the list row a picker, a field list and a member list are
 * made of (twenty-ui's ListItem, MIT, NOTICE): 32px, 4px inset, 8px gap, the 4px
 * corner, the hover rung. It takes the parts a list row has around its content —
 * an `indicator` (a trailing check or a leading box), a `shortcut`, trailing
 * `actions` revealed under the pointer or focus, a submenu chevron — and the
 * states a list owner sets: `selected`, `focused` (a cursor that is not focus),
 * `color="danger"`, `disabled`. Rendered as a button it is a list row button:
 * `render="button"` gives the native element, and `focusableWhenDisabled` keeps
 * a disabled row in the tab order as `aria-disabled` instead of `disabled`.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { Check, ChevronRight } from '@hanzogui/lucide-icons-2'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { Separator } from './layout'
import { ink } from './ink'
import { RING } from './press'
import { touch } from './gesture'
import { Kbd, KbdGroup } from './kbd'

export type ItemVariant = 'default' | 'outline' | 'muted'
export type ItemSize = 'default' | 'sm' | 'row'
export type ItemMediaVariant = 'default' | 'icon' | 'image'


const ItemFrame = styled(XStack, {
  name: 'Item',
  flexWrap: 'wrap',
  items: 'center',
  rounded: '$3',
  borderWidth: 1,
  borderColor: 'transparent',
  outlineWidth: 0,
  focusVisibleStyle: RING,
  hoverStyle: { bg: '$hover' },

  variants: {
    variant: {
      default: { bg: 'transparent' },
      outline: { bg: 'transparent', borderColor: '$borderColor' },
      muted: { bg: '$edge' },
    },
    size: {
      default: { gap: '$4', p: '$4' },
      sm: { gap: '$2.5', px: '$4', py: '$3' },
      row: { gap: '$2', px: '$1', py: 0, minH: 32, rounded: '$xs', flexWrap: 'nowrap' },
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

export type ItemProps = Omit<ComponentProps<typeof ItemFrame>, 'color'> & {
  variant?: ItemVariant | null
  size?: ItemSize | null
  asChild?: boolean
  /** `check` after the content when `selected`; `checkbox` a box before it; `none` (default) tints a selected row. */
  indicator?: 'none' | 'check' | 'checkbox'
  selected?: boolean
  /** Highlighted by a cursor that is not focus (a list whose search field keeps focus). */
  focused?: boolean
  color?: 'neutral' | 'danger'
  disabled?: boolean
  /** Keep a disabled row focusable, saying `aria-disabled` instead of `disabled`. */
  focusableWhenDisabled?: boolean
  /** Keys after the content: one key or a list read as a chord. */
  shortcut?: string | readonly string[]
  /** Trailing controls; `hover` shows them under the pointer or focus (always on touch). */
  actions?: ReactNode
  actionsVisibility?: 'hover' | 'always'
  /** A trailing chevron; a disabled row keeps its width so rows align. */
  hasSubmenu?: boolean
}

/** A picture of a checkbox for a row that is itself the control. */
const Box = ({ on }: { on: boolean }) => (
  <XStack
    width={14}
    height={14}
    shrink={0}
    rounded="$xs"
    borderWidth={1}
    borderColor={on ? ('var(--primary)' as never) : '$bound'}
    bg={on ? ('var(--primary)' as never) : 'transparent'}
    items="center"
    justify="center"
  >
    {on ? <Check size={12} strokeWidth={3} color={'var(--primary-foreground)' as never} /> : null}
  </XStack>
)

export function Item({
  variant = 'default',
  size = 'default',
  asChild = false,
  indicator = 'none',
  selected = false,
  focused = false,
  color = 'neutral',
  disabled = false,
  focusableWhenDisabled = false,
  shortcut,
  actions,
  actionsVisibility = 'hover',
  hasSubmenu = false,
  children,
  ...props
}: ItemProps) {
  const v = variant ?? 'default'
  const s = size ?? 'default'
  const row = s === 'row'
  const [shown, setShown] = useState(false)
  const button = (props as { render?: unknown }).render === 'button'
  const visible = actionsVisibility === 'always' || shown
  return (
    <ItemFrame
      data-slot="item"
      data-variant={v}
      data-size={s}
      {...(selected ? { 'data-selected': '' } : null)}
      {...(focused ? { 'data-focused': '' } : null)}
      variant={v}
      size={s}
      asChild={asChild}
      render={asChild ? undefined : 'div'}
      {...(row ? touch(32, 44, 'y') : null)}
      {...((selected && indicator === 'none') || focused ? { bg: '$hover' } : null)}
      {...(color === 'danger' ? { theme: 'red' as never } : null)}
      {...(disabled
        ? {
            opacity: 0.5,
            hoverStyle: { bg: 'transparent' },
            cursor: 'default',
            ...(button && !focusableWhenDisabled ? { disabled: true } : { 'aria-disabled': true }),
          }
        : row
          ? { cursor: 'pointer' }
          : null)}
      {...(button ? ({ type: 'button' } as object) : null)}
      {...(actions ? { onHoverIn: () => setShown(true), onHoverOut: () => setShown(false), onFocus: () => setShown(true), onBlur: () => setShown(false) } : null)}
      {...props}
    >
      {/* asChild hands the frame to ONE child, so the list-row parts are not drawn around it. */}
      {asChild ? (
        children
      ) : (
        <>
          {indicator === 'checkbox' ? <Box on={selected} /> : null}
          {children}
          {shortcut ? (
            typeof shortcut === 'string' ? (
              <Kbd>{shortcut}</Kbd>
            ) : (
              <KbdGroup>
                {shortcut.map((k, i) => (
                  <Kbd key={`${k}-${i}`}>{k}</Kbd>
                ))}
              </KbdGroup>
            )
          ) : null}
          {indicator === 'check' && selected ? <Check size={16} strokeWidth={2} /> : null}
          {actions ? (
            <XStack
              data-slot="item-row-actions"
              role="group"
              shrink={0}
              items="center"
              gap="$1"
              opacity={visible ? 1 : 0}
              $touchable={{ opacity: 1 }}
              animation="75ms"
            >
              {actions}
            </XStack>
          ) : null}
          {hasSubmenu ? (
            <XStack shrink={0} opacity={disabled ? 0 : 1}>
              <ChevronRight size={14} color="$dim" />
            </XStack>
          ) : null}
        </>
      )}
    </ItemFrame>
  )
}

const ItemMediaFrame = styled(XStack, {
  name: 'ItemMedia',
  shrink: 0,
  items: 'center',
  justify: 'center',
  gap: '$2',

  variants: {
    variant: {
      default: { bg: 'transparent' },
      icon: { bg: '$edge', width: 32, height: 32, rounded: '$2', borderWidth: 1, borderColor: '$borderColor' },
      image: { width: 40, height: 40, rounded: '$2', overflow: 'hidden' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

export type ItemMediaProps = ComponentProps<typeof ItemMediaFrame> & {
  variant?: ItemMediaVariant | null
}

export function ItemMedia({ variant = 'default', ...props }: ItemMediaProps) {
  const v = variant ?? 'default'
  return <ItemMediaFrame data-slot="item-media" data-variant={v} variant={v} {...props} />
}

const ItemContentFrame = styled(YStack, {
  name: 'ItemContent',
  flex: 1,
  gap: '$1',
})

export type ItemContentProps = ComponentProps<typeof ItemContentFrame>

export function ItemContent(props: ItemContentProps) {
  return <ItemContentFrame data-slot="item-content" {...props} />
}

const ItemTitleFrame = styled(XStack, {
  name: 'ItemTitle',
  display: 'inline-flex',
  self: 'flex-start',
  items: 'center',
  gap: '$2',
})

export type ItemTitleProps = ComponentProps<typeof ItemTitleFrame>

export function ItemTitle({ children, ...props }: ItemTitleProps) {
  return (
    <ItemTitleFrame data-slot="item-title" {...props}>
      {ink(children, SizableText, { size: '$3', fontWeight: '600' })}
    </ItemTitleFrame>
  )
}

const ItemDescriptionFrame = styled(SizableText, {
  name: 'ItemDescription',
  size: '$3',
  color: '$quiet',
  fontWeight: '400',
})

export type ItemDescriptionProps = ComponentProps<typeof ItemDescriptionFrame>

// The line clamp shadcn ships as `line-clamp-2`. `-webkit-box` degrades to a
// plain paragraph on a host that ignores it, which is the correct fallback —
// carried as an inline style rather than a styled() variant because it is CSS
// with no token behind it, not a design choice a theme should be able to flip.
const CLAMP = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const

export function ItemDescription({ style, ...props }: ItemDescriptionProps) {
  return (
    <ItemDescriptionFrame
      data-slot="item-description"
      style={{ ...CLAMP, ...(style as object) }}
      {...props}
    />
  )
}

const ItemActionsFrame = styled(XStack, {
  name: 'ItemActions',
  items: 'center',
  gap: '$2',
})

export type ItemActionsProps = ComponentProps<typeof ItemActionsFrame>

export function ItemActions(props: ItemActionsProps) {
  return <ItemActionsFrame data-slot="item-actions" {...props} />
}

const ItemHeaderFrame = styled(XStack, {
  name: 'ItemHeader',
  flexBasis: '100%',
  items: 'center',
  justify: 'space-between',
  gap: '$2',
})

export type ItemHeaderProps = ComponentProps<typeof ItemHeaderFrame>

export function ItemHeader(props: ItemHeaderProps) {
  return <ItemHeaderFrame data-slot="item-header" {...props} />
}

const ItemFooterFrame = styled(XStack, {
  name: 'ItemFooter',
  flexBasis: '100%',
  items: 'center',
  justify: 'space-between',
  gap: '$2',
})

export type ItemFooterProps = ComponentProps<typeof ItemFooterFrame>

export function ItemFooter(props: ItemFooterProps) {
  return <ItemFooterFrame data-slot="item-footer" {...props} />
}

const ItemGroupFrame = styled(YStack, {
  name: 'ItemGroup',
})

export type ItemGroupProps = ComponentProps<typeof ItemGroupFrame>

export function ItemGroup(props: ItemGroupProps) {
  return <ItemGroupFrame data-slot="item-group" role="list" {...props} />
}

export type ItemSeparatorProps = ComponentProps<typeof Separator>

export function ItemSeparator(props: ItemSeparatorProps) {
  return <Separator data-slot="item-separator" my={0} {...props} />
}
