'use client'

import { useState, type MouseEvent, type ReactNode } from 'react'
import { Anchor, XStack, YStack } from '@hanzo/gui'
import { MARK_BLOCKS, MARK_SHADE, MARK_VIEWBOX } from '@hanzo/logo'
import { useI18n } from '@hanzo/i18n/react'

import { slot } from '../backends/gui/slot'
import { PrivacyChoicesIcon } from '../consent/icon'
import { Line } from './type'
import { COMPANY_MENU_EVENT } from '../masthead/nav'

/**
 * The enormous closing signature. "hanzo" is real, selectable Zen typography,
 * NOT a raster or outlined wordmark. Its punctuation is the canonical seven-path
 * H from @hanzo/logo, held in the same baseline-relative flex lockup.
 *
 * This is opt-in: the marketing Footer is also used by non-Hanzo brands.
 */
export function HanzoFooterSignature() {
  const [highlight, setHighlight] = useState(false)
  const openCompanyMenu = (e: MouseEvent<HTMLAnchorElement>) => {
    // Modifier-click retains the usual home link behavior.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    // Masthead cancels the event when it opens the real Company menu.
    // On a page with no Masthead, the link still goes to hanzo.ai.
    if (!window.dispatchEvent(new Event(COMPANY_MENU_EVENT, { cancelable: true }))) {
      e.preventDefault()
    }
  }
  return (
    <a
      href="https://hanzo.ai"
      aria-label="Open Hanzo company menu"
      onClick={openCompanyMenu}
      onPointerEnter={() => setHighlight(true)}
      onPointerLeave={() => setHighlight(false)}
      onFocus={() => setHighlight(true)}
      onBlur={() => setHighlight(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        gap: 'clamp(4px, 0.5vw, 10px)',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        textDecoration: 'none',
        fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
        fontSize: 'clamp(68px, 26vw, 480px)',
        fontWeight: 750,
        letterSpacing: '-0.085em',
        lineHeight: 0.88,
        paddingBottom: '0.02em',
        color: 'var(--foreground)',
        opacity: highlight ? 0.35 : 0.18,
        transition: 'opacity 160ms ease',
      }}
    >
      <span aria-hidden="true" style={{ whiteSpace: 'nowrap', paddingRight: '0.04em' }}>
        hanzo
      </span>
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          flex: '0 0 auto',
          width: '0.225em',
          height: '0.225em',
          marginBottom: '0.082em',
          lineHeight: 0,
          letterSpacing: 'normal',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={MARK_VIEWBOX}
          fill="currentColor"
          focusable="false"
          aria-hidden="true"
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          {/* All seven canonical paths use the exact wordmark grey. */}
          {MARK_BLOCKS.map((d) => <path key={d} d={d} />)}
          {MARK_SHADE.map((d) => <path key={d} d={d} />)}
        </svg>
      </span>
    </a>
  )
}

export type FooterLink = { label: string; href: string; out?: boolean }
export type FooterColumn = {
  id: string
  title: string
  href?: string
  out?: boolean
  links: readonly FooterLink[]
}

export type FooterProps = {
  columns: readonly FooterColumn[]
  ask?: ReactNode
  /** Backwards-compatible closing lockup slot; render this AFTER legal/social. */
  wordmark?: ReactNode
  /** Explicit closing signature; takes precedence over wordmark when supplied. */
  signature?: ReactNode
  copyright?: ReactNode
  legal?: readonly FooterLink[]
  /** Social destinations are separate from legal links. Only pass verified URLs. */
  social?: readonly FooterLink[]
  gutter?: string
  /** Legacy custom social content. Rendered above legal and signature. */
  after?: ReactNode
}

const open = (out?: boolean) => (out ? { target: '_blank', rel: 'noopener noreferrer' } : {})
const LEGAL = { display: 'inline-flex', alignItems: 'center', gap: 6 } as const

const Door = ({ link }: { link: FooterLink }) => {
  const { t } = useI18n()
  return (
    <Anchor
      href={link.href}
      {...open(link.out)}
      color="$soft"
      fontSize="$2"
      lineHeight="$2"
      py={3}
      textDecorationLine="none"
      hoverStyle={{ color: '$ink' }}
    >
      {t(link.label)}
      {link.out ? ' ↗' : ''}
    </Anchor>
  )
}

const Footer = ({
  columns, ask, wordmark, signature, copyright, legal = [], social = [],
  gutter = 'clamp(20px, 4vw, 72px)', after,
}: FooterProps) => {
  const { t } = useI18n()
  const closing = signature ?? wordmark
  return (
    <YStack
      {...slot('footer')}
      render="footer"
      width="100%"
      bg="$panel"
      borderTopWidth={1}
      borderColor="$edge"
      pt={48}
      pb={16}
      gap={28}
      style={{ paddingInline: gutter }}
    >
      {ask ? <YStack width="100%" items="center">{ask}</YStack> : null}

      {/* Compact, even columns. No phantom Featured pane and no stretched links. */}
      <XStack
        display="grid"
        width="100%"
        gridTemplateColumns="repeat(2, minmax(0, 1fr))"
        columnGap={22}
        rowGap={32}
        $sm={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
        $lg={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}
      >
        {columns.map((c) => (
          <YStack key={c.id} render="nav" aria-label={t(c.title)} minW={0} gap={2}>
            {c.href ? (
              <Anchor
                href={c.href}
                {...open(c.out)}
                color="$ink"
                fontSize="$2"
                lineHeight="$2"
                fontWeight="600"
                pb={10}
                textDecorationLine="none"
              >
                {t(c.title)}{c.out ? ' ↗' : ''}
              </Anchor>
            ) : (
              <Line size="sm" weight="600" pb={10}>{t(c.title)}</Line>
            )}
            <YStack>
              {c.links.map((l) => <Door key={l.href + l.label} link={l} />)}
            </YStack>
          </YStack>
        ))}
      </XStack>

      {(social.length > 0 || after) ? (
        <YStack borderTopWidth={1} borderColor="$edge" pt={18} gap={8}>
          {social.length > 0 ? (
            <XStack render="nav" aria-label={t('Social links')} flexWrap="wrap" gap={18} rowGap={6}>
              {social.map((l) => <Door key={l.href + l.label} link={l} />)}
            </XStack>
          ) : null}
          {after}
        </YStack>
      ) : null}

      <XStack borderTopWidth={1} borderColor="$edge" pt={16} flexWrap="wrap" items="center" gap={16} rowGap={8}>
        {copyright ? <Line size="sm" tone="dim">{copyright}</Line> : null}
        <XStack render="nav" aria-label={t('Terms & Policies')} flexWrap="wrap" gap={16} rowGap={8} shrink={1} minW={0}>
          {legal.map((l) => (
            <Anchor
              key={l.href + l.label}
              href={l.href}
              {...open(l.out)}
              color="$faint"
              fontSize="$2"
              lineHeight="$2"
              textDecorationLine="none"
              hoverStyle={{ color: '$ink' }}
              {...LEGAL}
            >
              {l.href.endsWith('#choices') ? <PrivacyChoicesIcon /> : null}
              {t(l.label)}
            </Anchor>
          ))}
        </XStack>
      </XStack>

      {/* The LAST line: the Hanzo text + H period, or a host's own brand lockup. */}
      {closing ? <YStack width="100%" pt={4} minW={0}>{closing}</YStack> : null}
    </YStack>
  )
}

export { Footer }
