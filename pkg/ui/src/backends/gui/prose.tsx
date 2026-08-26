/**
 * ApplyTypography — turn on running-text styling for a subtree.
 *
 * Authored content (a CMS field, an .mdx file, a block's `content`) arrives as
 * bare tags: `<h1>`, `<p>`, `<ul>`. Nothing inside it can carry a class, so the
 * styling has to come from an ancestor and reach down by TAG. That is what this
 * does, and it is the reason it exists rather than each block styling its own
 * heading.
 *
 * The rules live in `theme.css` under `.prose`; this component only chooses
 * which rung and which element. It is a plain host element on purpose — the
 * rules select `>` children, and a gui `styled()` frame would insert one.
 *
 * `size` is 'responsive' by default and is the only rung that moves with the
 * viewport. A t-shirt size is a decision the caller already made, so it stays
 * put — asking for 'sm' and getting 'lg' on a wide screen would make the prop a
 * suggestion.
 */
import * as React from 'react'
import { Box } from '../../box'
import { cn } from '../../core/cn'

export type TypographySize = 'responsive' | 'sm' | 'base' | 'lg' | 'xl'

/** The tags a prose container is allowed to be — all of them block-level. */
export type ProseTag = 'div' | 'section' | 'nav' | 'main' | 'article' | 'aside'

export type ApplyTypographyProps = React.ComponentProps<'div'> & {
  asTag?: ProseTag
  size?: TypographySize
}

/**
 * Namespaced, and this family especially: `.prose` is what Tailwind's own
 * typography plugin claims. A site part-way through leaving that engine would
 * otherwise have two stylesheets fighting over the same selector, and which one
 * won would depend on import order.
 */
const RUNG: Record<TypographySize, string> = {
  responsive: 'hz-prose-responsive',
  // `base` is the unmodified `.hz-prose` rung, so it adds nothing.
  base: '',
  sm: 'hz-prose-sm',
  lg: 'hz-prose-lg',
  xl: 'hz-prose-xl',
}

/**
 * Through `Box`, so a caller's layout classes are converted rather than
 * emitted: `<ApplyTypography className="flex w-full">` used to put two dead
 * tokens on the element, since nothing here defines them. `Box` with a `tag`
 * renders that one element and nothing around it, so the `>` child selectors
 * the prose rules depend on still reach the content.
 *
 * `hz-prose*` survives the conversion and stays on the element — it is real
 * css in theme.css, which is exactly what `tw` leaves alone.
 */
export const ApplyTypography = ({
  children,
  className,
  asTag = 'div',
  size = 'responsive',
  ...rest
}: ApplyTypographyProps) => (
  // `asTag` is a union, so it cannot be inferred as Box's single tag parameter —
  // narrowed to one member of it, which is what the union guarantees anyway.
  <Box tag={asTag as 'div'} className={cn('hz-prose', RUNG[size], className)} {...(rest as object)}>
    {children}
  </Box>
)

export default ApplyTypography
