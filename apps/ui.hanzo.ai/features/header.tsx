import { useEffect, useState, type ReactNode } from 'react'
import { Button, Text, TooltipSimple, View, XStack, YStack } from '@hanzo/gui'
import { useTranslate } from '@hanzo/ui'
import { Github, Menu, Search } from '@hanzogui/lucide-icons-2'
import { brand } from '~/brand'
import type { Href } from 'one'
import { Link } from 'one'

import { Appearance } from './appearance'
import { HEADER, useMenu, WIDTH } from './docs'
import { LanguageSwitch, LocaleLink, useBarePath, useLocalHref } from './locale'
import { ThemeToggle } from './theme'

/** The 60px bar: mark and name, the sections, and the page's controls. A
 *  hairline and a blur arrive once the page has scrolled under it. */
export function Header() {
  const t = useTranslate()
  const local = useLocalHref()
  const [scrolled, setScrolled] = useState(false)
  const path = useBarePath()
  const { setOpen, focus } = useMenu()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <XStack render="header" position="sticky" t={0} z={100} width="100%" justify="center" borderBottomWidth={1} borderColor={scrolled ? '$borderColor' : 'transparent'}>
      <YStack position="absolute" inset={0} bg="$background" opacity={scrolled ? 0.85 : 0} backdropFilter={scrolled ? 'blur(16px)' : undefined} pointerEvents="none" />
      <XStack width="100%" maxW={WIDTH} height={HEADER} px="$4" items="center" gap="$4" position="relative">
        <LocaleLink href="/" aria-label={t('Homepage')} style={{ textDecorationLine: 'none' }}>
          <XStack items="center" gap="$2">
            <brand.mark size={22} />
            <Text fontWeight="600" fontSize={15} color="$color12">
              {brand.name}
            </Text>
          </XStack>
        </LocaleLink>

        <View flex={1} />

        <XStack render="nav" items="center" gap="$1" display="none" $lg={{ display: 'flex' }}>
          <NavLink href={local('/docs')} active={path.startsWith('/docs')}>
            {t('Docs')}
          </NavLink>
          <NavLink href={local('/ui')} active={path.startsWith('/ui')}>
            {t('Components')}
          </NavLink>
          <NavLink href={local('/blocks')} active={path.startsWith('/blocks')}>
            {t('Blocks')}
          </NavLink>
          <NavLink href={local('/product')} active={path.startsWith('/product')}>
            {t('Product')}
          </NavLink>
          <NavLink href={local('/chat')} active={path.startsWith('/chat')}>
            {t('Chat')}
          </NavLink>
          <NavLink href={local('/agents')} active={path.startsWith('/agents')}>
            {t('Agents')}
          </NavLink>
          <NavLink href={local('/settings')} active={path.startsWith('/settings')}>
            {t('Settings')}
          </NavLink>
          <NavLink href={local('/catalog')} active={path.startsWith('/catalog')}>
            {t('Catalog')}
          </NavLink>
          {brand.framework ? <NavLink href={brand.framework.url}>{t('Framework')}</NavLink> : null}
        </XStack>

        <XStack items="center" gap="$1">
          <LocaleLink href={brand.github} target="_blank" aria-label={t('GitHub')} style={{ textDecorationLine: 'none' }}>
            <XStack width={36} height={36} items="center" justify="center" rounded="$10" opacity={0.8} hoverStyle={{ opacity: 1, bg: '$color2' }}>
              <Github size={18} />
            </XStack>
          </LocaleLink>
          <ThemeToggle />
          <LanguageSwitch />
          <TooltipSimple label={t('Search')}>
            <Button
              size="$2"
              rounded="$10"
              aria-label={t('Search the catalog')}
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
            <Button size="$3" circular chromeless aria-label={t('Menu')} icon={<Menu size={20} />} onPress={() => setOpen(true)} />
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
      <Text fontSize={13} fontWeight="600" px="$3" py="$2" rounded="$3" color={active ? '$color12' : '$color11'} hoverStyle={{ color: '$color12', bg: '$color2' }} pressStyle={{ opacity: 0.5 }}>
        {children}
      </Text>
    </Link>
  )
}
