'use client'

/**
 * Cta — the one call to action: an address, drawn as the page's primary control.
 *
 * A link, not a button, because where it goes is an address: it opens in a new
 * tab, copies, and reads as what it is. Its ink and fill are the site's accent
 * (`--primary`), which @hanzo/appearance sets, so Hanzo, Lux and Zoo each draw
 * their own without a prop. `quiet` is the secondary: the same shape on the
 * surface ladder.
 *
 * The 44px floor is `minH`, not padding, so a two-line label stays balanced.
 */
import { Anchor, Text } from '@hanzo/gui'

import type { ComponentProps, ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

export type CtaProps = Omit<ComponentProps<typeof Anchor>, 'children' | 'href'> & {
  href: string
  children: ReactNode
  /** The secondary treatment. */
  quiet?: boolean
  onPress?: () => void
}

const Cta = ({ href, children, quiet = false, ...p }: CtaProps) => (
  <Anchor
    {...slot(quiet ? 'cta-quiet' : 'cta')}
    href={href}
    display="inline-flex"
    items="center"
    justify="center"
    minH={44}
    px="$5"
    rounded="$4"
    borderWidth={1}
    borderColor={quiet ? '$borderColor' : 'transparent'}
    bg={quiet ? 'transparent' : 'var(--primary)'}
    color={quiet ? '$ink' : 'var(--primary-foreground)'}
    fontSize="$4"
    fontWeight="500"
    text="center"
    textDecorationLine="none"
    hoverStyle={quiet ? { bg: '$hover' } : { bg: 'var(--primary-hover)' }}
    {...(p as object)}
  >
    {children}
  </Anchor>
)

export { Cta }

export type TextLinkProps = Omit<CtaProps, 'quiet' | 'href'> & {
  /** Where it goes. Without one it is a button that reads as a link — "try
   *  again", "change address" — and `onPress` is what it does. */
  href?: string
  disabled?: boolean
}

/**
 * TextLink — a link inside a sentence: full ink and an underline, because in
 * quiet text colour alone does not say "link", and the sentence's own face and
 * size. `Cta` is the control; this is the word. A button inside such a sentence (no `href`) reads as one of its
 * links: no box, and the sentence's own face, which @hanzo/design's base hands
 * every button.
 */
/** The sentence's own type, which gui's Text would otherwise replace with its
 *  body size. */
const WORD = { fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit', letterSpacing: 'inherit' } as const

const TextLink = ({ href, children, ...p }: TextLinkProps) =>
  href !== undefined ? (
    <Anchor
      {...slot('text-link')}
      href={href}
      {...(WORD as object)}
      color="$ink"
      textDecorationLine="underline"
      style={{ textUnderlineOffset: 3 }}
      {...(p as object)}
    >
      {children}
    </Anchor>
  ) : (
    <Text
      {...slot('text-link')}
      render={<button type="button" />}
      p={0}
      borderWidth={0}
      bg="transparent"
      {...(WORD as object)}
      color="$ink"
      textDecorationLine="underline"
      cursor="pointer"
      style={{ textUnderlineOffset: 3 }}
      {...(p as object)}
    >
      {children}
    </Text>
  )

export { TextLink }
