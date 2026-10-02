'use client'

/**
 * Pager — which of a run of slides is showing, and the way to any other.
 *
 * Each page is a pill: six pixels high, a dot at rest and a 24px bar for the
 * one showing, drawn in the ink of the ground it sits on so it reads on both
 * themes. The mark is drawn INSIDE a target rather than being one: a 6px mark
 * sized as the control would be a target nobody can hit, so each button is 24px
 * square around it (44px tall under a coarse pointer) and the row stays the
 * width of its marks plus their floors — ten pages fit a 360px phone.
 */
import { View, XStack, type XStackProps } from '@hanzo/gui'

import { slot } from '../backends/gui/slot'

export type PagerProps = Omit<XStackProps, 'children'> & {
  count: number
  /** The page showing. */
  index: number
  onSelect: (index: number) => void
  /** What a page is called, for its button's label. */
  label?: (index: number) => string
}

const Pager = ({ count, index, onSelect, label = (i) => `Go to slide ${i + 1}`, ...p }: PagerProps) => (
  <XStack {...slot('pager')} items="center" {...(p as object)}>
    {Array.from({ length: count }, (_, i) => {
      const on = i === index
      return (
        <View
          key={i}
          render={<button type="button" />}
          aria-label={label(i)}
          aria-current={on ? 'true' : undefined}
          onPress={() => onSelect(i)}
          group
          containerType="normal"
          display="flex"
          items="center"
          justify="center"
          minW={24}
          height={24}
          px={9}
          py={0}
          borderWidth={0}
          bg="transparent"
          cursor="pointer"
          $touchable={{ height: 44 }}
        >
          <View
            width={on ? 24 : 6}
            height={6}
            rounded={9999}
            bg={on ? 'var(--foreground)' : 'var(--muted-foreground)'}
            opacity={on ? 1 : 0.35}
            {...(on ? null : { '$group-hover': { opacity: 0.7 } })}
          />
        </View>
      )
    })}
  </XStack>
)

export { Pager }
