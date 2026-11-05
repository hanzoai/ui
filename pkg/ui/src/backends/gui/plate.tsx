'use client'

/**
 * A plate: the frame gui's `Card` was before @hanzo/gui 8.4 retired it (a card
 * is a design decision, so it lives here): a column on `$background`, its
 * corner from the size token. It keeps gui's name `Card`, so a theme's `Card`
 * sub-theme still reaches it. The surfaces that drew gui's Card draw this; the
 * card with a head, a title and a description is ./card.
 */
import { YStack, styled } from '@hanzo/gui'

export const Plate = styled(YStack, {
  name: 'Card',
  bg: '$background',
  position: 'relative',
  rounded: '$true',
})
