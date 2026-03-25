import { styled } from '@hanzo/gui-core'
import { getButtonSized } from '@hanzo/gui-get-button-sized'
import type { GetProps } from '@hanzo/gui-web'
import { ThemeableStack } from './ThemeableStack'
import { bordered, circular, elevate } from './variants'

export const SizableStack = styled(ThemeableStack, {
  name: 'SizableStack',

  variants: {
    unstyled: {
      true: {
        elevate: false,
        bordered: false,
      },
    },

    circular,
    elevate,

    bordered: {
      true: bordered,
    },

    size: {
      '...size': (val, extras) => {
        return getButtonSized(val, extras)
      },
    },
  } as const,
})

export type SizableStackProps = GetProps<typeof SizableStack>
