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
 * A stable class handle for hosts that hook menu triggers from CSS. Styling
 * lives in the tokens; this only names the part.
 */
export const navigationMenuTriggerStyle = () => 'hz-nav-menu-trigger'

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
    <Box
      tag="button"
      type="button"
      aria-haspopup="true"
      aria-expanded={item?.open ?? false}
      aria-controls={item?.id}
      className={cn(navigationMenuTriggerStyle(), 'grid grid-flow-col auto-cols-max items-center gap-1', className)}
      onFocus={both(() => item?.setOpen(true), onFocus)}
      onBlur={both(() => item?.setOpen(false), onBlur)}
      // Touch has no hover. Without this the panel is unreachable on a phone —
      // which is where most of these menus are actually read.
      onClick={both(() => item?.setOpen(!item.open), onClick)}
      {...props}
    >
      {children}
    </Box>
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
