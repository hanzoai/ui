import type { ReactNode } from 'react'
import { Text, XStack } from '@hanzo/gui'

import { fontMono } from '../core/fonts'

export type FactProps = {
  /** The row's left-hand label. */
  label: string
  /** The row's right-hand value. A string renders in the value color and
   *  weight; anything else (a badge, a link, a stack of controls) renders as
   *  given. */
  value: ReactNode
  /** Render a string value in the monospace face — an id, a hash, a path. */
  mono?: boolean
}

/**
 * Fact — one row of a property list: a label on the left, a value on the
 * right, a hairline separator beneath. The read-only counterpart to `Field`'s
 * editable row — a detail pane is a stack of these where a settings form is a
 * stack of `Field`s.
 *
 * Written twice, near-identically, in two console detail drawers before
 * either could find the other. This is the one definition; the wider of the
 * two shapes won (a non-string `value` renders as given, not stringified).
 */
export function Fact({ label, value, mono }: FactProps) {
  return (
    <XStack
      justify="space-between"
      items="center"
      py="$1.5"
      borderBottomWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <Text fontSize="$2" color="$color11">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text
          fontSize="$2"
          color="$color12"
          fontWeight="600"
          numberOfLines={1}
          style={mono ? { fontFamily: fontMono } : undefined}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </XStack>
  )
}
