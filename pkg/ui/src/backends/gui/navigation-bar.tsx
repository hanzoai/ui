'use client'

/**
 * NavigationBar — the top bar of a page, in the shapes real products use.
 *
 * One frame (`<nav>`, a hairline bottom border, a fixed row height) and one
 * `variant` that picks what fills it: a logo with links, links either side of
 * a centred logo, a breadcrumb trail, a row of icon links, a dashboard title
 * with search/alerts/avatar, a storefront with categories and a cart count, a
 * document header with a stack of collaborator avatars, a call header with
 * phone/video/message actions, or a switcher button that opens a menu of
 * options. Every variant is the same frame wearing different content, so a
 * caller changing `variant` keeps the same height, border and props shape.
 */
import { ChevronRight, ChevronDown, Search, Bell, ShoppingCart, User, Users, Phone, Video, MessageSquare } from '@hanzogui/lucide-icons-2'
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Button } from './button'
import { DropdownMenu } from './dropdown-menu'
import { ink } from './ink'

export type NavigationBarLink = {
  label: string
  href?: string
  icon?: ReactNode
}

export type NavigationBarPerson = {
  name: string
  avatar?: string
}

export type NavigationBarOption = {
  id: string
  label: string
  description?: string
  icon?: ReactNode
}

export type NavigationBarVariant =
  | 'simple'
  | 'centered'
  | 'breadcrumb'
  | 'icon'
  | 'dashboard'
  | 'ecommerce'
  | 'collaboration'
  | 'communication'
  | 'switcher'

const HEIGHT = 64
const BREADCRUMB_HEIGHT = 48

/** Retag helpers — the ONE way this file swaps the host element under a gui primitive. */
const Nav = styled(XStack, { name: 'NavigationBar', render: 'nav' })
const List = styled(XStack, { name: 'NavigationBarBreadcrumbList', render: 'ol' })
const ListItem = styled(XStack, { name: 'NavigationBarBreadcrumbItem', render: 'li' })
const Anchor = styled(SizableText, { name: 'NavigationBarLink', render: 'a' })
const IconAnchor = styled(YStack, { name: 'NavigationBarIconLink', render: 'a' })

const Link = ({ item }: { item: NavigationBarLink }) =>
  item.href ? (
    <Anchor
      {...({ href: item.href } as object)}
      size="$3"
      fontWeight="500"
      color="$ink"
      hoverStyle={{ color: '$accentColor' }}
    >
      {item.label}
    </Anchor>
  ) : (
    <SizableText size="$3" fontWeight="500" color="$quiet" aria-current="page">
      {item.label}
    </SizableText>
  )

const Links = ({ items }: { items: NavigationBarLink[] }) => (
  <XStack gap="$5" items="center">
    {items.map((item) => (
      <Link key={item.href ?? item.label} item={item} />
    ))}
  </XStack>
)

const IconButton = ({
  children,
  ...props
}: {
  children: ReactNode
  'aria-label': string
  onPress?: () => void
}) => (
  <Button variant="ghost" size="icon" {...props}>
    {children}
  </Button>
)

const Avatars = ({ people, max = 3 }: { people: NavigationBarPerson[]; max?: number }) => (
  <XStack items="center">
    {people.slice(0, max).map((p, i) => (
      <Avatar key={p.name + i} ml={i > 0 ? -8 : 0} borderWidth={2} borderColor="$background">
        <AvatarImage src={p.avatar} />
        <AvatarFallback>{p.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
    ))}
    {people.length > max ? (
      <Avatar ml={-8} borderWidth={2} borderColor="$background">
        <AvatarFallback>+{people.length - max}</AvatarFallback>
      </Avatar>
    ) : null}
  </XStack>
)

export type NavigationBarProps = {
  variant?: NavigationBarVariant
  logo?: ReactNode
  /** Links for `simple`, `icon`, `ecommerce` (as categories) and `breadcrumb` (as the trail). */
  items?: NavigationBarLink[]
  /** `centered` only — links either side of the logo. */
  leftItems?: NavigationBarLink[]
  rightItems?: NavigationBarLink[]
  /** `dashboard` / `collaboration`. */
  title?: string
  /** `dashboard`. */
  user?: NavigationBarPerson
  /** `collaboration`. */
  collaborators?: NavigationBarPerson[]
  /** `ecommerce`. */
  cartCount?: number
  /** `communication`. */
  contactName?: string
  /** `switcher`. */
  options?: NavigationBarOption[]
  value?: string
  onValueChange?: (id: string) => void
  onSearch?: () => void
  onNotifications?: () => void
  onCall?: () => void
  onVideo?: () => void
  onMessage?: () => void
  children?: ReactNode
}

export function NavigationBar({
  variant = 'simple',
  logo,
  items = [],
  leftItems = [],
  rightItems = [],
  title,
  user,
  collaborators = [],
  cartCount = 0,
  contactName,
  options = [],
  value,
  onValueChange,
  onSearch,
  onNotifications,
  onCall,
  onVideo,
  onMessage,
  children,
}: NavigationBarProps) {
  const height = variant === 'breadcrumb' ? BREADCRUMB_HEIGHT : HEIGHT

  return (
    <Nav
      data-slot="navigation-bar"
      data-variant={variant}
      borderBottomWidth={1}
      borderColor="$borderColor"
      minH={height}
      px="$5"
      items="center"
      justify="space-between"
      gap="$4"
    >
      {variant === 'breadcrumb' ? (
        <List items="center" gap="$2" flex={1}>
          {items.map((item, i) => (
            <ListItem key={item.href ?? item.label} items="center" gap="$2">
              {i > 0 ? <ChevronRight size={14} opacity={0.6} /> : null}
              <Link item={item} />
            </ListItem>
          ))}
        </List>
      ) : variant === 'icon' ? (
        <XStack flex={1} items="center" justify="center" gap="$6">
          {items.map((item) => (
            <IconAnchor
              key={item.href ?? item.label}
              {...({ href: item.href, title: item.label } as object)}
              items="center"
              gap="$1"
            >
              {item.icon}
              {ink(item.label, SizableText, { size: '$1' })}
            </IconAnchor>
          ))}
        </XStack>
      ) : variant === 'centered' ? (
        <>
          <Links items={leftItems} />
          {ink(logo, SizableText, { fontWeight: '700' })}
          <Links items={rightItems} />
        </>
      ) : variant === 'dashboard' ? (
        <>
          {ink(title, SizableText, { size: '$5', fontWeight: '600' })}
          <XStack items="center" gap="$3">
            <IconButton aria-label="Search" onPress={onSearch}>
              <Search size={18} />
            </IconButton>
            <IconButton aria-label="Notifications" onPress={onNotifications}>
              <Bell size={18} />
            </IconButton>
            {user ? (
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            ) : null}
          </XStack>
        </>
      ) : variant === 'ecommerce' ? (
        <>
          {ink(logo, SizableText, { fontWeight: '700' })}
          <Links items={items} />
          <XStack items="center" gap="$1">
            <IconButton aria-label="Search" onPress={onSearch}>
              <Search size={18} />
            </IconButton>
            <IconButton aria-label="Account">
              <User size={18} />
            </IconButton>
            <XStack position="relative">
              <IconButton aria-label="Cart">
                <ShoppingCart size={18} />
              </IconButton>
              {cartCount > 0 ? (
                <Badge
                  data-slot="navigation-bar-cart-count"
                  variant="default"
                  style={{ position: 'absolute', top: -4, right: -4 }}
                >
                  {cartCount}
                </Badge>
              ) : null}
            </XStack>
          </XStack>
        </>
      ) : variant === 'collaboration' ? (
        <>
          {ink(title, SizableText, { size: '$4', fontWeight: '600' })}
          <XStack items="center" gap="$3">
            <Users size={18} opacity={0.6} />
            <Avatars people={collaborators} />
          </XStack>
        </>
      ) : variant === 'communication' ? (
        <>
          {ink(contactName, SizableText, { size: '$4', fontWeight: '600' })}
          <XStack items="center" gap="$1">
            <IconButton aria-label="Call" onPress={onCall}>
              <Phone size={18} />
            </IconButton>
            <IconButton aria-label="Video call" onPress={onVideo}>
              <Video size={18} />
            </IconButton>
            <IconButton aria-label="Message" onPress={onMessage}>
              <MessageSquare size={18} />
            </IconButton>
          </XStack>
        </>
      ) : variant === 'switcher' ? (
        <>
          <DropdownMenu
            trigger={
              <Button variant="outline" data-slot="navigation-bar-switcher-trigger">
                {options.find((o) => o.id === value)?.icon}
                {options.find((o) => o.id === value)?.label ?? 'Select'}
                <ChevronDown size={14} />
              </Button>
            }
            items={options.map((o) => ({
              key: o.id,
              label: o.label,
              description: o.description,
              icon: o.icon,
              selected: o.id === value,
              onSelect: () => onValueChange?.(o.id),
            }))}
          />
          <XStack items="center" gap="$2">
            {children}
          </XStack>
        </>
      ) : (
        <>
          {ink(logo, SizableText, { fontWeight: '700' })}
          <Links items={items} />
        </>
      )}
    </Nav>
  )
}
