'use client'

/**
 * NavigationMenu — a site menu whose entries can open a panel.
 *
 * Each item owns its own open state and opens on hover OR focus, closing on
 * leave or blur. Focus is not decoration here: a menu that opens only on hover
 * is a menu a keyboard cannot reach, and the panel behind it is unreachable
 * content rather than hidden content.
 *
 * A caller's own pointer handlers still run — several sites drive a shared
 * backdrop from the same events — so they are chained, never replaced.
 */
import * as React from 'react'

import { Text, XStack, styled } from '@hanzo/gui'

import { Box, type BoxProps } from '../../box'
import { cn } from '../../core/cn'

type ItemContext = {
  open: boolean
  setOpen: (open: boolean) => void
  id: string
}

const Item = /* @__PURE__ */ React.createContext<ItemContext | null>(null)

const useItem = () => React.useContext(Item)

/** Run the caller's handler after ours, never instead of it. */
const both =
  <E,>(ours: (e: E) => void, theirs?: (e: E) => void) =>
  (e: E) => {
    ours(e)
    theirs?.(e)
  }

export const NavigationMenu = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    tag="nav"
    aria-label="Main"
    className={cn('relative grid justify-center', className)}
    {...props}
  />
)

export const NavigationMenuList = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    tag="ul"
    className={cn('grid grid-flow-col auto-cols-max items-center gap-1', className)}
    {...props}
  />
)

export const NavigationMenuItem = ({ className, children, ...props }: React.ComponentProps<typeof Box>) => {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return (
    <Item.Provider value={{ open, setOpen, id }}>
      <Box
        tag="li"
        className={cn('relative', className)}
        // On the ITEM, not the trigger: the panel is a child of the item, so
        // the pointer can travel from the trigger into the panel without ever
        // leaving the item — which is what stops the menu closing under a
        // cursor moving towards it.
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </Box>
    </Item.Provider>
  )
}

/**
 * A top-level nav item: muted until pointed at or open. Padding rather than a
 * wider gap between items, because the padding is also the hit area and a nav
 * item wants a target bigger than its glyphs. Text's style table rides on the
 * row so the item carries its own ink.
 */
const Trigger = styled(
  XStack,
  {
    name: 'NavigationMenuTrigger',
    render: 'button',
    items: 'center',
    gap: 4,
    px: '$3',
    py: '$2',
    borderWidth: 0,
    bg: 'transparent',
    rounded: 'var(--radius, 0.5rem)',
    cursor: 'pointer',
    ...({ color: 'var(--muted-foreground)' } as object),
    hoverStyle: { bg: 'var(--muted)', ...({ color: 'var(--foreground)' } as object) },
    variants: {
      open: { true: { bg: 'var(--muted)', ...({ color: 'var(--foreground)' } as object) } },
    } as const,
  },
  { validStyles: Text.staticConfig.validStyles },
)

export const NavigationMenuTrigger = ({
  className,
  children,
  onFocus,
  onBlur,
  onClick,
  ...props
}: BoxProps<'button'>) => {
  const item = useItem()
  return (
    <Trigger
      data-slot="navigation-menu-trigger"
      {...({ type: 'button' } as object)}
      open={item?.open ?? false}
      aria-haspopup="true"
      aria-expanded={item?.open ?? false}
      aria-controls={item?.id}
      className={cn(className)}
      style={{ transition: 'color 150ms, background-color 150ms' }}
      onFocus={both(() => item?.setOpen(true), onFocus) as never}
      onBlur={both(() => item?.setOpen(false), onBlur) as never}
      // Touch has no hover. Without this the panel is unreachable on a phone —
      // which is where most of these menus are actually read.
      onClick={both(() => item?.setOpen(!item.open), onClick) as never}
      {...(props as object)}
    >
      {children}
    </Trigger>
  )
}

export const NavigationMenuContent = ({ className, children, ...props }: React.ComponentProps<typeof Box>) => {
  const item = useItem()
  if (item && !item.open) return null
  return (
    <Box id={item?.id} className={cn('absolute top-full left-0', className)} {...props}>
      {children}
    </Box>
  )
}

export const NavigationMenuLink = ({ className, ...props }: BoxProps<'a'>) => (
  <Box tag="a" className={className} {...props} />
)
