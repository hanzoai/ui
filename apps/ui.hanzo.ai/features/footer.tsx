import { H4, Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import type { Href } from 'one'
import { Link } from 'one'
import type { ReactNode } from 'react'

import { brand } from '~/brand'
import { WIDTH } from './docs'

/** The library, the family it belongs to, and where to find it. */
export function Footer() {
  const { framework } = brand
  return (
    <YStack render="footer" width="100%" maxW={WIDTH} self="center" px="$4" py="$8" gap="$8" borderTopWidth={1} borderColor="$borderColor">
      <XStack flexWrap="wrap" gap="$8">
        <YStack flex={2} minW={220} gap="$3">
          <XStack items="center" gap="$2">
            <brand.mark size={20} />
            <Text fontWeight="600">{brand.name}</Text>
          </XStack>
          <Paragraph size="$2" color="$color10" maxW={280}>
            The {brand.org} component library{framework ? `, built on ${framework.name}` : ''}.
          </Paragraph>
        </YStack>
        <Column title="Library">
          <FootLink href="/docs">Docs</FootLink>
          <FootLink href="/ui">Components</FootLink>
          <FootLink href="/blocks">Blocks</FootLink>
          <FootLink href="/product">Product</FootLink>
        </Column>
        <Column title="Family">
          <FootLink href={brand.site}>{brand.name}</FootLink>
          {framework ? <FootLink href={framework.url}>{framework.name}</FootLink> : null}
        </Column>
        <Column title="Community">
          <FootLink href={brand.github}>GitHub</FootLink>
          <FootLink href={brand.npm}>npm</FootLink>
          <FootLink href={`https://x.com/${brand.twitter.slice(1)}`}>X</FootLink>
        </Column>
      </XStack>
      <XStack justify="center">
        <Link href="/" aria-label="Homepage">
          <brand.mark size={28} />
        </Link>
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
