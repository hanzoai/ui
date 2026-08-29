'use client'

/**
 * Skeleton — the shape of content that has not arrived.
 *
 * It is a box with the pulse on it and nothing else, so the SIZE is the caller's
 * to state and should match what will land there. A skeleton that is not the
 * size of its content is worse than none: the page reflows when the real thing
 * appears, which is the jump the skeleton existed to prevent.
 */
import * as React from 'react'

import { Box } from '../../box'
import { cn } from '../../core/cn'

export const Skeleton = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    // Announced as busy so a screen reader says "loading" rather than reading
    // out an empty box, or nothing at all. A boolean, not the string "true":
    // gui types the ARIA states as booleans and React writes the attribute out
    // either way.
    aria-busy={true}
    aria-live="polite"
    className={cn('hz-pulse rounded-md bg-muted', className)}
    {...props}
  />
)
