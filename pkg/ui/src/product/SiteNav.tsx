'use client'

/**
 * SiteNav — the ONE header every Hanzo property renders.
 *
 * `@hanzo/products` already decides WHAT the navigation is: `HEADERS[site]` gives
 * a property's local nav and its call-to-action, and `MEET_HANZO_MENU` gives the
 * ecosystem launcher (the six-product grid, the utility row, the install row).
 * Nothing about that content lives here. This module is only the renderer — the
 * missing half — so a property supplies a `SiteId` and gets the same header as
 * every other property, and the six hand-written `DesktopNav`/`MobileMenu` copies
 * that used to drift have nothing left to disagree about.
 *
 * It sits at the same 52px, border and background as `AppHeader`, so the
 * signed-out marketing bar and the signed-in shell bar read as one object.
 *
 * Three deliberate choices, each fixing something the old menus got wrong:
 *
 *   • The panel is FULL-BLEED. The old ones anchored a floating card to whichever
 *     word opened it, so a wide panel hung off-centre and the bar's alignment
 *     stopped meaning anything. Anchoring to the bar lets columns line up with the
 *     header and with each other.
 *   • Hover switches menus but never opens one. A bar where a passing cursor
 *     throws a full-width panel is hostile; the first open must be intentional.
 *   • ONE action. `SiteHeader.action` is a single call-to-action, so a property
 *     cannot render two competing sign-in buttons the way cloud.hanzo.ai did.
 *
 * Host-agnostic like the rest of this layer: `link` injects the host's navigation
 * primitive and `icon` resolves a product/link id to a glyph, so nothing here
 * imports a framework or an icon set.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Separator, Text, XStack, YStack } from '@hanzo/gui'
import type { Action, Link, MeetHanzoMenu, Product, SiteHeader } from '@hanzo/products'

/** Render a destination. Hosts pass next/link etc.; the default is a plain anchor. */
export type LinkRender = (props: {
  href: string
  children: ReactNode
  onNavigate?: () => void
}) => ReactNode

/** Absolute URLs leave the property; site-relative paths stay. */
const isExternal = (href: string) => /^https?:\/\//.test(href)

const defaultLink: LinkRender = ({ href, children, onNavigate }) => (
  <a
    href={href}
    onClick={onNavigate}
    {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
  >
    {children}
  </a>
)

export type SiteNavProps = {
  /** The property's header model — `HEADERS[site]` from @hanzo/products. */
  header: SiteHeader
  /** The ecosystem launcher — `MEET_HANZO_MENU`. Omit to hide the launcher. */
  menu?: MeetHanzoMenu
  /** Brand slot — usually `<BrandMark/>`; pressing it goes home. */
  brand?: ReactNode
  /**
   * Right-hand cluster BEFORE the action: an identity menu when signed in, or a
   * sign-in link when signed out. The action itself comes from `header`, so this
   * slot must not repeat it.
   */
  actions?: ReactNode
  /** Host link primitive. */
  link?: LinkRender
  /** Resolve a product/link `id` to a glyph. Entries render fine without it. */
  icon?: (id: string) => ReactNode
  /** Marks the active local-nav item by its `Link.id`. */
  active?: string
  /** Launcher label. */
  meetLabel?: string
}

/** A product cell in the launcher grid: verb kicker, name, the one job it owns. */
function ProductCell({ product, link, icon, close }: { product: Product; link: LinkRender; icon?: (id: string) => ReactNode; close: () => void }) {
  const glyph = icon?.(product.id)
  return (
    <YStack minW={200} flex={1} flexBasis={200}>
      {link({
        href: product.url,
        onNavigate: close,
        children: (
          <XStack gap="$2.5" items="flex-start" p="$2.5" rounded="$4" borderWidth={1} borderColor="$borderColor" hoverStyle={{ bg: '$color4' }}>
            {glyph ? <YStack pt="$0.5">{glyph}</YStack> : null}
            <YStack minW={0} gap="$0.5">
              {product.verb ? (
                <Text fontSize={11} color="$color10" textTransform="uppercase" letterSpacing={0.4}>
                  {product.verb}
                </Text>
              ) : null}
              <Text fontSize="$3" color="$color12">
                {product.name}
              </Text>
              <Text fontSize={12} color="$color10" lineHeight={16}>
                {product.job}
              </Text>
            </YStack>
          </XStack>
        ),
      })}
    </YStack>
  )
}

/** A titled column of plain links — the utility and install rows. */
function Column({ title, links, link, icon, close }: { title: string; links: Link[]; link: LinkRender; icon?: (id: string) => ReactNode; close: () => void }) {
  return (
    <YStack minW={160} flex={1} gap="$1">
      <Text fontSize={11} color="$color10" textTransform="uppercase" letterSpacing={0.5} px="$2" pb="$1">
        {title}
      </Text>
      {links.map((l) => (
        <XStack key={l.id} px="$2" py="$1" rounded="$3" hoverStyle={{ bg: '$color4' }} gap="$2" items="center">
          {icon?.(l.id) ?? null}
          {link({
            href: l.href,
            onNavigate: close,
            children: (
              <Text fontSize="$2" color="$color11">
                {l.label}
              </Text>
            ),
          })}
        </XStack>
      ))}
    </YStack>
  )
}

/**
 * The full-bleed launcher. The product grid wraps rather than scrolls, so the
 * family growing reflows instead of clipping.
 */
function Launcher({ menu, link, icon, close }: { menu: MeetHanzoMenu; link: LinkRender; icon?: (id: string) => ReactNode; close: () => void }) {
  return (
    <YStack
      position="absolute"
      t={52}
      l={0}
      r={0}
      z={50}
      bg="$background"
      borderBottomWidth={1}
      borderColor="$borderColor"
      px="$4"
      py="$4"
      gap="$3"
      maxH="80vh"
      overflow="scroll"
    >
      <XStack items="center" gap="$3" flexWrap="wrap">
        <Text fontSize="$2" color="$color11">
          {menu.eyebrow}
        </Text>
        <XStack ml="auto">
          {link({
            href: menu.allProducts.href,
            onNavigate: close,
            children: (
              <Text fontSize="$2" color="$color12">
                {menu.allProducts.label} →
              </Text>
            ),
          })}
        </XStack>
      </XStack>

      <XStack gap="$2.5" flexWrap="wrap">
        {menu.products.map((p) => (
          <ProductCell key={p.id} product={p} link={link} icon={icon} close={close} />
        ))}
      </XStack>

      <Separator />

      <XStack gap="$4" flexWrap="wrap" items="flex-start">
        <Column title="Platform" links={menu.utilities} link={link} icon={icon} close={close} />
        <Column title="Install" links={menu.installs} link={link} icon={icon} close={close} />
      </XStack>
    </YStack>
  )
}

/** The primary call-to-action — filled, so it reads as the one action on the bar. */
function Cta({ action, link }: { action: Action; link: LinkRender }) {
  return (
    <XStack bg="$color12" px="$3" py="$1.5" rounded="$3" hoverStyle={{ opacity: 0.9 }}>
      {link({
        href: action.href,
        children: (
          <Text fontSize="$2" color="$background">
            {action.label}
          </Text>
        ),
      })}
    </XStack>
  )
}

/**
 * The small-screen arrangement: the local nav and the launcher's own lists
 * stacked in one scrollable column. Same values, same rows — only the layout
 * differs, which is what kept the old per-repo MobileMenus drifting.
 */
function MobilePanel({ header, menu, link, icon, close }: { header: SiteHeader; menu?: MeetHanzoMenu; link: LinkRender; icon?: (id: string) => ReactNode; close: () => void }) {
  return (
    <YStack
      position="absolute"
      t={52}
      l={0}
      r={0}
      z={50}
      bg="$background"
      borderBottomWidth={1}
      borderColor="$borderColor"
      px="$3"
      py="$3"
      gap="$3"
      maxH="80vh"
      overflow="scroll"
    >
      <YStack gap="$1">
        {header.localNav.map((l) => (
          <XStack key={l.id} px="$2" py="$1.5" rounded="$3" hoverStyle={{ bg: '$color4' }}>
            {link({
              href: l.href,
              onNavigate: close,
              children: (
                <Text fontSize="$3" color="$color12">
                  {l.label}
                </Text>
              ),
            })}
          </XStack>
        ))}
      </YStack>

      {menu ? (
        <>
          <Separator />
          <YStack gap="$1">
            {menu.products.map((p) => (
              <XStack key={p.id} px="$2" py="$1.5" rounded="$3" hoverStyle={{ bg: '$color4' }} gap="$2" items="center">
                {icon?.(p.id) ?? null}
                {link({
                  href: p.url,
                  onNavigate: close,
                  children: (
                    <Text fontSize="$3" color="$color12">
                      {p.name}
                    </Text>
                  ),
                })}
              </XStack>
            ))}
          </YStack>
          <Separator />
          <Column title="Platform" links={menu.utilities} link={link} icon={icon} close={close} />
          <Column title="Install" links={menu.installs} link={link} icon={icon} close={close} />
        </>
      ) : null}
    </YStack>
  )
}

export function SiteNav({ header, menu, brand, actions, link = defaultLink, icon, active, meetLabel = 'Meet Hanzo' }: SiteNavProps) {
  const [launcher, setLauncher] = useState(false)
  const [mobile, setMobile] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)

  // Escape closes, and a click outside the bar+panel closes. Both are required for
  // a full-bleed panel: it covers enough of the page that there is no obvious
  // "off" target, so dismissal has to be explicit rather than incidental.
  useEffect(() => {
    if (!launcher && !mobile) return
    const dismiss = () => {
      setLauncher(false)
      setMobile(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) dismiss()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [launcher, mobile])

  return (
    <YStack ref={root as never} position="relative" bg="$background">
      <XStack items="center" gap="$1" px="$3" height={52} borderBottomWidth={1} borderColor="$borderColor">
        {brand ? (
          <XStack items="center" pr="$2">
            {brand}
          </XStack>
        ) : null}

        {menu ? (
          <XStack
            cursor="pointer"
            px="$2.5"
            py="$1.5"
            rounded="$3"
            bg={launcher ? '$color4' : 'transparent'}
            hoverStyle={{ bg: '$color4' }}
            onPress={() => setLauncher(!launcher)}
            accessibilityRole="button"
            aria-expanded={launcher}
          >
            <Text fontSize="$2" color="$color12">
              {meetLabel}
            </Text>
          </XStack>
        ) : null}

        {/* The property's own nav. Below $sm it moves into the menu button
            opposite — a row of labels plus a full-bleed panel does not fit a
            phone, and shrinking it to fit is how the old mobile menus became a
            second, diverging implementation. */}
        <XStack items="center" gap="$0.5" flex={1} minW={0} $sm={{ display: 'none' }}>
          {header.localNav.map((l) => (
            <XStack
              key={l.id}
              px="$2.5"
              py="$1.5"
              rounded="$3"
              hoverStyle={{ bg: '$color4' }}
              onMouseEnter={() => launcher && setLauncher(false)}
            >
              {link({
                href: l.href,
                children: (
                  <Text fontSize="$2" color={active === l.id ? '$color12' : '$color11'}>
                    {l.label}
                  </Text>
                ),
              })}
            </XStack>
          ))}
        </XStack>

        <XStack items="center" gap="$2" ml="auto">
          {actions}
          <Cta action={header.action} link={link} />
          <XStack
            display="none"
            $sm={{ display: 'flex' }}
            cursor="pointer"
            px="$2"
            py="$1.5"
            rounded="$3"
            hoverStyle={{ bg: '$color4' }}
            onPress={() => setMobile(!mobile)}
            accessibilityRole="button"
            aria-label={mobile ? 'Close menu' : 'Open menu'}
          >
            <Text fontSize="$2" color="$color12">
              {mobile ? 'Close' : 'Menu'}
            </Text>
          </XStack>
        </XStack>
      </XStack>

      {launcher && menu ? <Launcher menu={menu} link={link} icon={icon} close={() => setLauncher(false)} /> : null}
      {mobile ? <MobilePanel header={header} menu={menu} link={link} icon={icon} close={() => setMobile(false)} /> : null}
    </YStack>
  )
}
