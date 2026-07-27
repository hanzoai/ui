'use client'

/**
 * SiteFooter — the ONE footer, rendering `@hanzo/products`' `FOOTER`.
 *
 * 57 hand-written footers existed across the stack, differing in link set, column
 * count, type scale and legal line, so the bottom of every Hanzo page quietly
 * disagreed about what the company offers. The content question is already
 * settled in `@hanzo/products` (columns built from `FAMILY` and `DESTINATIONS`,
 * so a footer link and its menu twin cannot diverge); this is only the renderer.
 *
 * Deliberately not a mirror of the launcher: a footer is an index, not a menu, so
 * every entry is a plain link and no product copy is repeated here.
 */
import type { ReactNode } from 'react'
import { Separator, Text, XStack, YStack } from '@hanzo/gui'
import type { Footer } from '@hanzo/products'

import type { LinkRender } from './SiteNav'

const isExternal = (href: string) => /^https?:\/\//.test(href)

const defaultLink: LinkRender = ({ href, children }) => (
  <a
    href={href}
    {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    {children}
  </a>
)

export type SiteFooterProps = {
  /** The footer model — `FOOTER` from @hanzo/products. */
  footer: Footer
  /** Brand slot above the columns — usually `<BrandMark/>`. */
  brand?: ReactNode
  /** One line under the brand: what this company is. */
  tagline?: string
  /** Social / status / app-store row, rendered opposite the copyright. */
  meta?: ReactNode
  /** Host link primitive. */
  link?: LinkRender
}

export function SiteFooter({ footer, brand, tagline, meta, link = defaultLink }: SiteFooterProps) {
  return (
    <YStack borderTopWidth={1} borderColor="$borderColor" bg="$background" px="$4" py="$5" gap="$4">
      <XStack gap="$5" flexWrap="wrap" items="flex-start">
        {brand || tagline ? (
          <YStack gap="$2" minW={200} flex={1}>
            {brand}
            {tagline ? (
              <Text fontSize={12} color="$color10" lineHeight={18} maxW={280}>
                {tagline}
              </Text>
            ) : null}
          </YStack>
        ) : null}

        {footer.columns.map((column) => (
          <YStack key={column.id} gap="$1.5" minW={140}>
            <Text fontSize={11} color="$color10" textTransform="uppercase" letterSpacing={0.5} pb="$1">
              {column.title}
            </Text>
            {column.links.map((l) => (
              <XStack key={l.id} hoverStyle={{ opacity: 0.7 }}>
                {link({
                  href: l.href,
                  children: (
                    <Text fontSize="$2" color="$color11">
                      {l.label}
                    </Text>
                  ),
                })}
              </XStack>
            ))}
          </YStack>
        ))}
      </XStack>

      <Separator />

      <XStack items="center" gap="$3" flexWrap="wrap">
        <Text fontSize={12} color="$color10">
          {footer.legal.copyright}
        </Text>
        <XStack items="center" gap="$3" flexWrap="wrap">
          {footer.legal.links.map((l) => (
            <XStack key={l.id} hoverStyle={{ opacity: 0.7 }}>
              {link({
                href: l.href,
                children: (
                  <Text fontSize={12} color="$color10">
                    {l.label}
                  </Text>
                ),
              })}
            </XStack>
          ))}
        </XStack>
        {meta ? (
          <XStack ml="auto" items="center" gap="$3">
            {meta}
          </XStack>
        ) : null}
      </XStack>
    </YStack>
  )
}
