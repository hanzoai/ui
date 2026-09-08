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
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { Separator } from './layout'
import { ink } from './ink'

export type ItemVariant = 'default' | 'outline' | 'muted'
export type ItemSize = 'default' | 'sm'
export type ItemMediaVariant = 'default' | 'icon' | 'image'

/** The system's WCAG-checked ring, restored on the plain `<div>` this renders as. */
const RING = { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } as const

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
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

export type ItemProps = ComponentProps<typeof ItemFrame> & {
  variant?: ItemVariant | null
  size?: ItemSize | null
  asChild?: boolean
}

export function Item({ variant = 'default', size = 'default', asChild = false, ...props }: ItemProps) {
  const v = variant ?? 'default'
  const s = size ?? 'default'
  return (
    <ItemFrame
      data-slot="item"
      data-variant={v}
      data-size={s}
      variant={v}
      size={s}
      asChild={asChild}
      render={asChild ? undefined : 'div'}
      {...props}
    />
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
