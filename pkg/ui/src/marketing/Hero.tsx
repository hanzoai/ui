'use client'

/**
 * Hero — the first screen: the promise and the way in on the left, the product
 * at work on the right.
 *
 * Two columns from 1024px up; below that they stack, the pitch first. The pitch
 * is centred in its column, so the headline, the sign-in and the download read
 * as one stack.
 *
 *   signIn    a slot. The sign-in belongs to the site's identity provider; this
 *             draws where it goes and never what is in it.
 *   media     a slot for the right column: a <Media> loop, or anything with a
 *             shape. It sits in a rounded card whose ratio is fixed from the
 *             first paint (`ratio`, and `ratioCompact` once stacked), so it
 *             never moves the page when it loads.
 *   download  a secondary link under the sign-in.
 *
 * The headline is the page's one <h1>.
 */
import { YStack } from '@hanzo/gui'
import { useEffect, useRef, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { Cta } from './Cta'
import { useSeen } from './seen'
import { Line } from './type'

export type HeroProps = {
  title: ReactNode
  subtitle?: ReactNode
  signIn?: ReactNode
  /** The line under the sign-in: terms, privacy. */
  terms?: ReactNode
  download?: { href: string; label: string }
  media?: ReactNode
  /**
   * Whether the media sits in the rounded, bordered card. A picture that draws
   * its own edges and holds its own shape (a layered product shot) passes
   * `false`; the slot then only gives it the column.
   */
  mediaFrame?: boolean
  /** Width over height of the media card at full width. */
  ratio?: number
  /** …and once the columns stack. */
  ratioCompact?: number
  /** Called once, when the hero mounts. */
  onView?: () => void
  /** Called once, the first time half of the media card is on screen. */
  onMediaView?: () => void
}

const Hero = ({
  title,
  subtitle,
  signIn,
  terms,
  download,
  media,
  mediaFrame = true,
  ratio = 4 / 3,
  ratioCompact = 4 / 5,
  onView,
  onMediaView,
}: HeroProps) => {
  const card = useRef<HTMLDivElement>(null)
  useSeen(card, onMediaView)
  useEffect(() => {
    onView?.()
    // The view is counted once, whatever the host's callback identity does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <YStack
      {...slot('hero')}
      render="section"
      aria-labelledby="hero-title"
      width="100%"
      maxW={1320}
      mx="auto"
      flexDirection="column"
      items="center"
      gap={32}
      px="$4"
      pt={88}
      pb={48}
      $lg={{ flexDirection: 'row', gap: 64, px: '$6', pt: 120, pb: 72 }}
    >
      <YStack
        {...slot('hero-copy')}
        flex={0}
        flexBasis="auto"
        minW={0}
        width="100%"
        items="center"
        gap="$5"
        $lg={{ flex: 5, flexBasis: 0 }}
      >
        <Line
          render="h1"
          id="hero-title"
          m={0}
          maxW={520}
          align="center"
          fontFamily="$heading"
          fontSize="$11"
          lineHeight="$11"
          fontWeight={500}
          $lg={{ fontSize: '$13', lineHeight: '$13' }}
          style={{ letterSpacing: '-0.012em', textWrap: 'balance' }}
        >
          {title}
        </Line>
        {subtitle ? (
          <Line render="p" m={0} mt={-4} align="center" tone="muted" fontSize="$6" lineHeight="$6" $lg={{ fontSize: '$7', lineHeight: '$7' }}>
            {subtitle}
          </Line>
        ) : null}
        {signIn ? (
          <YStack {...slot('hero-signin')} width="100%" maxW={420}>
            {signIn}
          </YStack>
        ) : null}
        {terms ? (
          <Line render="p" m={0} mt={-4} maxW={420} align="center" tone="muted" size="xs">
            {terms}
          </Line>
        ) : null}
        {download ? (
          <Cta quiet href={download.href}>
            {download.label}
          </Cta>
        ) : null}
      </YStack>

      {media && mediaFrame ? (
        <YStack
          {...slot('hero-media')}
          ref={card as never}
          flex={0}
          flexBasis="auto"
          minW={0}
          width="100%"
          aspectRatio={ratioCompact}
          overflow="hidden"
          rounded={28}
          borderWidth={1}
          borderColor="$edge"
          bg="$panel"
          $lg={{ flex: 7, flexBasis: 0, aspectRatio: ratio }}
        >
          {media}
        </YStack>
      ) : media ? (
        <YStack {...slot('hero-media')} ref={card as never} flex={0} flexBasis="auto" minW={0} width="100%" $lg={{ flex: 7, flexBasis: 0 }}>
          {media}
        </YStack>
      ) : null}
    </YStack>
  )
}

export { Hero }
