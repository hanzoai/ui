
/**
 * Band — the page's vertical rhythm, in one place.
 *
 * Components kept inventing their own vertical story: a margin here, a padding
 * there, a `<div style={{marginTop: 64}}>` somewhere else. The result is a page
 * whose spacing is the sum of everyone's guesses, and which is never the same
 * twice on a phone. So the page-level spacing decision is made once, from the
 * space scale, and it is mobile-first: phone values by default, stepping up past
 * `$gtSm`. A caller that writes nothing gets the right answer at every width,
 * which is the point — the failure mode being designed out is "had to remember
 * something".
 *
 * It is called Band and not Section because `Section` is already taken, by the
 * thing it is built ON: `@hanzo/gui` exports a `Section` that is the semantic
 * `<section>` element, beside Article, Main, Header, Aside, Footer and Nav. Two
 * packages exporting one name for two components is a defect you cannot see —
 * the import resolves, the build is green, and the page is spaced by whichever
 * one the author happened to reach for. A band is what this is: a full-bleed
 * horizontal band of the page.
 *
 * Two boxes, because they do two different jobs and merging them is what breaks:
 * the OUTER runs full-bleed and owns the vertical rhythm and the side gutter, so
 * a background set on it reaches both edges; the INNER is the centred measure and
 * owns `maxWidth`. Put `maxWidth` on the outer box instead and a band can never
 * have a full-width background.
 */
import { Section, type YStackProps } from '@hanzo/gui'
import { YStack } from '@hanzo/gui'
import { slot } from './slot'

export interface BandProps extends YStackProps {
  /**
   * The centred column's width. `false` lets the content run full width.
   *
   * It is not called `maxWidth`: `maxWidth` is a real style prop on the band
   * itself, and a component that redefines one to mean "the width of a
   * different box" is a trap with no error in it. The typographic name is the
   * true one anyway — this is the measure, not the band's own limit.
   */
  measure?: number | false
  /** Props for the centred column. */
  inner?: YStackProps
}

const Band = ({ measure = 1200, children, inner, ...props }: BandProps) => (
  <Section
    {...slot('band')}
    width="100%"
    // Values come from the space scale, never literals — a band spaced in raw
    // px drifts from everything else on the page. `$md` is a MAX-width query in
    // this config, so the base is the roomy value and the phone steps it down;
    // that is the direction every other responsive prop in this package is
    // written in ($md/$sm in Field, PageHeader, SiteNav), and mixing both
    // directions in one codebase is how a breakpoint ends up applying twice.
    py="$11"
    px="$6"
    $md={{ py: '$8', px: '$4' }}
    {...props}
  >
    <YStack
      {...slot('band-inner')}
      width="100%"
      {...(measure === false ? {} : { maxWidth: measure })}
      // The centring. `self: center` is the cross-axis rule a YStack understands
      // on web AND native, where `margin: auto` is web-only.
      self="center"
      {...inner}
    >
      {children}
    </YStack>
  </Section>
)

export { Band }
