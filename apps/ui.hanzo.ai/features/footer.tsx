import type { ReactNode } from 'react'
import { H4, Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import { useTranslate } from '@hanzo/ui'
import { brand } from '~/brand'
import type { Href } from 'one'
import { Link } from 'one'

import { WIDTH } from './docs'
import { LocaleLink, useLocalHref } from './locale'

/** The library, the family it belongs to, and where to find it. */
export function Footer() {
  const t = useTranslate()
  const local = useLocalHref()
  const { framework } = brand
  const blurb = framework
    ? t('The {org} component library, built on {framework}.', {
        org: brand.org,
        framework: framework.name,
      })
    : t('The {org} component library.', { org: brand.org })
  return (
    <YStack render="footer" width="100%" maxW={WIDTH} self="center" px="$4" py="$8" gap="$8" borderTopWidth={1} borderColor="$borderColor">
      <XStack flexWrap="wrap" gap="$8">
        <YStack flex={2} minW={220} gap="$3">
          <XStack items="center" gap="$2">
            <brand.mark size={20} />
            <Text fontWeight="600">{brand.name}</Text>
          </XStack>
          <Paragraph size="$2" color="$color10" maxW={280}>
            {blurb}
          </Paragraph>
        </YStack>
        <Column title={t('Library')}>
          <FootLink href={local('/docs')}>{t('Docs')}</FootLink>
          <FootLink href={local('/ui')}>{t('Components')}</FootLink>
          <FootLink href={local('/blocks')}>{t('Blocks')}</FootLink>
          <FootLink href={local('/product')}>{t('Product')}</FootLink>
          <FootLink href={local('/chat')}>{t('Chat')}</FootLink>
          <FootLink href={local('/agents')}>{t('Agents')}</FootLink>
          <FootLink href={local('/settings')}>{t('Settings')}</FootLink>
          <FootLink href={local('/catalog')}>{t('Catalog')}</FootLink>
        </Column>
        <Column title={t('Family')}>
          <FootLink href={brand.site}>{brand.name}</FootLink>
          {framework ? <FootLink href={framework.url}>{framework.name}</FootLink> : null}
        </Column>
        <Column title={t('Community')}>
          <FootLink href={brand.github}>{t('GitHub')}</FootLink>
          <FootLink href={brand.npm}>npm</FootLink>
          <FootLink href={`https://x.com/${brand.twitter.slice(1)}`}>X</FootLink>
        </Column>
      </XStack>
      <XStack justify="center">
        <LocaleLink href="/" aria-label={t('Homepage')}>
          <brand.mark size={28} />
        </LocaleLink>
      </XStack>
    </YStack>
  )
}

const Column = ({ title, children }: { title: string; children: ReactNode }) => (
  <YStack flex={1} minW={140} gap="$2">
    <H4 fontFamily="$mono" size="$2" letterSpacing={1} opacity={0.5} mb="$2">
      {title}
    </H4>
    {children}
  </YStack>
)

const FootLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href as Href} {...(href.startsWith('http') && { target: '_blank' })} style={{ textDecorationLine: 'none' }}>
    <Paragraph size="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
      {children}
    </Paragraph>
  </Link>
)
