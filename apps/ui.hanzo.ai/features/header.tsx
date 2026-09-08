import { Button, Text, TooltipSimple, View, XStack, YStack } from '@hanzo/gui'
import { Github, Menu, Search } from '@hanzogui/lucide-icons-2'
import type { Href } from 'one'
import { Link, usePathname } from 'one'
import { useEffect, useState, type ReactNode } from 'react'

import { brand } from '~/brand'
import { Appearance } from './appearance'
import { HEADER, WIDTH, useMenu } from './docs'
import { ThemeToggle } from './theme'

/** The 60px bar: mark and name, the sections, and the page's controls. A
 *  hairline and a blur arrive once the page has scrolled under it. */
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const path = usePathname()
  const { setOpen, focus } = useMenu()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <XStack
      render="header"
      position="sticky"
      t={0}
      z={100}
      width="100%"
      justify="center"
      borderBottomWidth={1}
      borderColor={scrolled ? '$borderColor' : 'transparent'}
    >
      <YStack
        position="absolute"
        inset={0}
        bg="$background"
        opacity={scrolled ? 0.85 : 0}
        backdropFilter={scrolled ? 'blur(16px)' : undefined}
        pointerEvents="none"
      />
      <XStack width="100%" maxW={WIDTH} height={HEADER} px="$4" items="center" gap="$4" position="relative">
        <Link href="/" aria-label="Homepage" style={{ textDecorationLine: 'none' }}>
          <XStack items="center" gap="$2">
            <brand.mark size={22} />
            <Text fontWeight="600" fontSize={15} color="$color12">
              {brand.name}
            </Text>
          </XStack>
        </Link>

        <View flex={1} />

        <XStack render="nav" items="center" gap="$1" display="none" $lg={{ display: 'flex' }}>
          <NavLink href="/docs" active={path.startsWith('/docs')}>
            Docs
          </NavLink>
          <NavLink href="/ui" active={path.startsWith('/ui')}>
            Components
          </NavLink>
          <NavLink href="/blocks" active={path.startsWith('/blocks')}>
            Blocks
          </NavLink>
          <NavLink href="/product" active={path.startsWith('/product')}>
            Product
          </NavLink>
          {brand.framework ? <NavLink href={brand.framework.url}>Framework</NavLink> : null}
        </XStack>

        <XStack items="center" gap="$1">
          <Link href={brand.github as Href} target="_blank" aria-label="GitHub" style={{ textDecorationLine: 'none' }}>
            <XStack width={36} height={36} items="center" justify="center" rounded="$10" opacity={0.8} hoverStyle={{ opacity: 1, bg: '$color2' }}>
              <Github size={18} />
            </XStack>
          </Link>
          <ThemeToggle />
          <TooltipSimple label="Search">
            <Button
              size="$2"
              rounded="$10"
              aria-label="Search the catalog"
              icon={<Search size={14} />}
              iconAfter={
                <Text fontSize={11} opacity={0.4} display="none" $md={{ display: 'flex' }}>
                  ⌘K
                </Text>
              }
              onPress={focus}
            />
          </TooltipSimple>
          <Appearance />
          <View $lg={{ display: 'none' }}>
            <Button size="$3" circular chromeless aria-label="Menu" icon={<Menu size={20} />} onPress={() => setOpen(true)} />
          </View>
        </XStack>
      </XStack>
    </XStack>
  )
}

/** 13px, semibold, quiet until hovered; another host opens in a new tab. */
function NavLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  const external = href.startsWith('http')
  return (
    <Link href={href as Href} {...(external && { target: '_blank' })} style={{ textDecorationLine: 'none' }}>
      <Text
        fontSize={13}
        fontWeight="600"
        px="$3"
        py="$2"
        rounded="$3"
        color={active ? '$color12' : '$color11'}
        hoverStyle={{ color: '$color12', bg: '$color2' }}
        pressStyle={{ opacity: 0.5 }}
      >
        {children}
      </Text>
    </Link>
  )
}
