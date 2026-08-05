'use client'

/**
 * Section — the page's vertical rhythm, in one place.
 *
 * Components kept inventing their own vertical story: a margin here, a padding
 * there, a `<div style={{marginTop: 64}}>` somewhere else. The result is a page
 * whose spacing is the sum of everyone's guesses, and which is never the same
 * twice on a phone.
 *
 * So the page-level spacing decision is made once, from the space scale, and it
 * is mobile-first: phone values by default, stepping up past `$gtSm`. A caller
 * that writes nothing gets the right answer at every width, which is the point —
 * the failure mode being designed out is "had to remember something".
 *
 * Two boxes, because they do two different jobs and merging them is what breaks:
 * the OUTER runs full-bleed and owns the vertical rhythm and the side gutter, so
 * a background set on it reaches both edges; the INNER is the centred measure and
 * owns `maxWidth`. Put `maxWidth` on the outer box instead and a section can
 * never have a full-width background.
 */
import { YStack, type YStackProps } from '@hanzo/gui'
import { slot } from './slot'

export interface SectionProps extends YStackProps {
  /** The centred measure. `false` lets the content run the full width. */
  maxWidth?: number | false
  /** Props for the inner centred column. */
  innerProps?: YStackProps
}

const Section = ({ maxWidth = 1200, children, innerProps, ...props }: SectionProps) => (
  <YStack
    {...slot('section')}
    width="100%"
    // Values come from the space scale, never literals — a section spaced in
    // raw px drifts from everything else on the page. `$md` is a MAX-width
    // query in this config, so the base is the roomy value and the phone steps
    // it down; that is the direction every other responsive prop in this
    // package is written in ($md/$sm in Field, PageHeader, SiteNav) and mixing
    // both directions in one codebase is how a breakpoint ends up applying
    // twice.
    py="$11"
    px="$6"
    $md={{ py: '$8', px: '$4' }}
    {...props}
  >
    <YStack
      {...slot('section-inner')}
      width="100%"
      {...(maxWidth === false ? {} : { maxWidth })}
      // The centring. `self: center` is the cross-axis rule a YStack understands
      // on web AND native, where `margin: auto` is web-only.
      self="center"
      {...innerProps}
    >
      {children}
    </YStack>
  </YStack>
)

export { Section }
