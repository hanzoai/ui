'use client'

/**
 * CreditCard — a payment-card face at the standard 1.586:1 ratio, showing a
 * number, a holder name, an expiry and an optional CVV.
 *
 * `default` is a dark plate (a chip icon, the number, holder and expiry);
 * `minimal` is the same layout on a bordered surface, for a page that already
 * carries its own color.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { CreditCard as CreditCardIcon } from '@hanzogui/lucide-icons-2'
import { slot } from './slot'

export type CreditCardVariant = 'default' | 'minimal'

const RATIO = 1.586

const Frame = styled(YStack, {
  name: 'CreditCard',
  position: 'relative',
  width: '100%',
  maxW: 384,
  rounded: '$6',
  p: '$6',
  justify: 'space-between',

  variants: {
    variant: {
      default: {
        bg: '$ink',
        borderWidth: 0,
        shadowColor: '$dim',
        shadowRadius: 24,
        shadowOpacity: 0.35,
      },
      minimal: {
        bg: '$background',
        borderWidth: 2,
        borderColor: '$borderColor',
      },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const Row = styled(XStack, { name: 'CreditCardRow', justify: 'space-between', items: 'flex-start' })

const Label = styled(SizableText, {
  name: 'CreditCardLabel',
  size: '$1',

  variants: {
    variant: {
      default: { color: '$sunken', opacity: 0.7 },
      minimal: { color: '$quiet' },
    },
  } as const,
})

const Value = styled(SizableText, {
  name: 'CreditCardValue',
  size: '$3',
  fontWeight: '600',

  variants: {
    variant: {
      default: { color: '$sunken' },
      minimal: { color: '$color' },
    },
  } as const,
})

const Number = styled(SizableText, {
  name: 'CreditCardNumber',
  size: '$5',
  letterSpacing: 3,

  variants: {
    variant: {
      default: { color: '$sunken' },
      minimal: { color: '$color' },
    },
  } as const,
})

export type CreditCardProps = Omit<ComponentProps<typeof Frame>, 'variant' | 'children'> & {
  /** The card number, formatted or masked by the caller. */
  number?: string
  /** The name printed on the card. */
  name?: string
  /** MM/YY expiry, printed as given. */
  expiry?: string
  /** Security code, shown only when set. */
  cvv?: string
  variant?: CreditCardVariant | null
}

export function CreditCard({
  number = '•••• •••• •••• ••••',
  name = 'CARD HOLDER',
  expiry = 'MM/YY',
  cvv,
  variant = 'default',
  ...props
}: CreditCardProps) {
  const resolved = variant ?? 'default'
  return (
    <Frame
      {...slot('credit-card')}
      data-variant={resolved}
      variant={resolved}
      aspectRatio={RATIO}
      {...props}
    >
      <Row>
        <CreditCardIcon size={40} color={resolved === 'default' ? '$sunken' : '$ink'} />
        {cvv && (
          <XStack
            {...slot('credit-card-cvv')}
            bg={resolved === 'default' ? '$hover' : '$panel'}
            rounded="$2"
            px="$2"
            py="$1"
          >
            <Label {...slot('credit-card-cvv-value')} variant={resolved}>
              CVV: {cvv}
            </Label>
          </XStack>
        )}
      </Row>

      <YStack gap="$4">
        <Number {...slot('credit-card-number')} variant={resolved}>
          {number}
        </Number>
        <Row items="flex-end">
          <YStack>
            <Label variant={resolved}>Card Holder</Label>
            <Value {...slot('credit-card-name')} variant={resolved}>
              {name}
            </Value>
          </YStack>
          <YStack items="flex-end">
            <Label variant={resolved}>Expires</Label>
            <Value {...slot('credit-card-expiry')} variant={resolved}>
              {expiry}
            </Value>
          </YStack>
        </Row>
      </YStack>
    </Frame>
  )
}
