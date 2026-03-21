import { YStack } from '@hanzo/gui-stacks'
import type { GetProps, SizeTokens } from '@hanzo/gui-web'
import { createStyledContext, styled, withStaticProperties } from '@hanzo/gui-web'

const CardContext = createStyledContext({
  size: '$true' as SizeTokens,
})

export const CardFrame = styled(YStack, {
  name: 'Card',
  context: CardContext,

  variants: {
    unstyled: {
      false: {
        size: '$true',
        backgroundColor: '$background',
        position: 'relative',
      },
    },

    size: {
      '...size': (val, { tokens }) => {
        return {
          borderRadius: tokens.radius[val] ?? val,
        }
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.HANZO_GUI_HEADLESS === '1',
  },
})

export const CardHeader = styled(YStack, {
  name: 'CardHeader',
  context: CardContext,

  variants: {
    unstyled: {
      false: {
        zIndex: 10,
        backgroundColor: 'transparent',
        marginBottom: 'auto',
      },
    },

    size: {
      '...size': (val, { tokens }) => {
        return {
          padding: tokens.space[val] ?? val,
        }
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.HANZO_GUI_HEADLESS === '1',
  },
})

export const CardFooter = styled(CardHeader, {
  name: 'CardFooter',

  variants: {
    unstyled: {
      false: {
        zIndex: 5,
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 0,
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.HANZO_GUI_HEADLESS === '1',
  },
})

export const CardBackground = styled(YStack, {
  name: 'CardBackground',

  variants: {
    unstyled: {
      false: {
        zIndex: 0,
        fullscreen: true,
        overflow: 'hidden',
        pointerEvents: 'none',
        padding: 0,
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.HANZO_GUI_HEADLESS === '1',
  },
})

export type CardHeaderProps = GetProps<typeof CardHeader>
export type CardFooterProps = GetProps<typeof CardFooter>
export type CardProps = GetProps<typeof CardFrame>

export const Card = withStaticProperties(CardFrame, {
  Header: CardHeader,
  Footer: CardFooter,
  Background: CardBackground,
})
