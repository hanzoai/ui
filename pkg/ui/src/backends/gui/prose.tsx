'use client'
/**
 * ApplyTypography — turn on running-text styling for a subtree.
 *
 * Authored content (a CMS field, an .mdx file, a block's `content`) arrives as
 * bare tags: `<h1>`, `<p>`, `<ul>`. Nothing inside it can carry a class, so the
 * styling has to come from an ancestor and reach down by TAG. That is what this
 * does, and it is the reason it exists rather than each block styling its own
 * heading.
 *
 * The rules live in `theme.css` under `[data-slot='prose']`; this component
 * only chooses which rung (`data-size`) and which element. It is a plain host
 * element on purpose — the rules select `>` children by tag, because authored
 * content is bare tags no prop can reach, and a gui `styled()` frame would
 * insert an element between them.
 *
 * `size` is 'responsive' by default and is the only rung that moves with the
 * viewport. A t-shirt size is a decision the caller already made, so it stays
 * put — asking for 'sm' and getting 'lg' on a wide screen would make the prop a
 * suggestion.
 */
import * as React from 'react'
import { Box } from '../../box'

export type TypographySize = 'responsive' | 'sm' | 'base' | 'lg' | 'xl'

/** The tags a prose container is allowed to be — all of them block-level. */
export type ProseTag = 'div' | 'section' | 'nav' | 'main' | 'article' | 'aside'

export type ApplyTypographyProps = React.ComponentProps<'div'> & {
  asTag?: ProseTag
  size?: TypographySize
}

/**
 * Through `Box`, so a caller's layout classes are converted rather than
 * emitted: `<ApplyTypography className="flex w-full">` used to put two dead
 * tokens on the element, since nothing here defines them. `Box` with a `tag`
 * renders that one element and nothing around it, so the `>` child selectors
 * the prose rules depend on still reach the content.
 *
 * The hook is a data attribute rather than a class, so nothing here competes
 * with the `.prose` Tailwind's typography plugin claims, and `tw` has nothing
 * to convert.
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
  <Box
    tag={asTag as 'div'}
    data-slot="prose"
    data-size={size === 'base' ? undefined : size}
    className={className}
    {...(rest as object)}
  >
    {children}
  </Box>
)

export default ApplyTypography
