import { ThemeableStack } from '@hanzogui/stacks'
import type { GetProps } from '@hanzogui/web'
import { styled } from '@hanzogui/web'

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
