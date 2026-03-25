import { ThemeableStack } from '@hanzo/gui-stacks'
import type { GetProps } from '@hanzo/gui-web'
import { styled } from '@hanzo/gui-web'

import { getShapeSize } from './getShapeSize'

export const Square = styled(
  ThemeableStack,
  {
    name: 'Square',
    alignItems: 'center',
    justifyContent: 'center',

    variants: {
      size: {
        '...size': getShapeSize,
        ':number': getShapeSize,
      },
    } as const,
  },
  {
    memo: true,
  }
)

export type SquareProps = GetProps<typeof Square>
