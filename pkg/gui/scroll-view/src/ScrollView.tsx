import { fullscreenStyle } from '@hanzogui/stacks'
import type { GetProps, GetRef } from '@hanzogui/web'
import { styled } from '@hanzogui/web'
import { ScrollView as ScrollViewNative } from 'react-native'

export const ScrollView = styled(
  ScrollViewNative,
  {
    name: 'ScrollView',
    scrollEnabled: true,

    variants: {
      fullscreen: {
        true: fullscreenStyle,
      },
    } as const,
  },
  {
    accept: {
      contentContainerStyle: 'style',
    } as const,
  }
)

export type ScrollView = GetRef<typeof ScrollView>

export type ScrollViewProps = GetProps<typeof ScrollView>
