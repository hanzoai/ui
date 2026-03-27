import { getFontSized } from '@hanzogui/get-font-sized'
import type { GetProps } from '@hanzogui/web'
import { Text, styled } from '@hanzogui/web'

export const SizableText = styled(Text, {
  name: 'SizableText',
  fontFamily: '$body',

  variants: {
    unstyled: {
      false: {
        size: '$true',
        color: '$color',
      },
    },

    size: getFontSized,
  },

  defaultVariants: {
    unstyled: process.env.HANZO_GUI_HEADLESS === '1',
  },
})

// we are doing weird stuff to avoid bad types
// TODO make this just work
SizableText.staticConfig.variants!.fontFamily = {
  '...': (val, extras) => {
    // pass through inherit directly without font variant expansion
    if (val === 'inherit') {
      return { fontFamily: 'inherit' }
    }

    const sizeProp = extras.props['size']
    const fontSizeProp = extras.props['fontSize']
    const size =
      sizeProp === '$true' && fontSizeProp
        ? fontSizeProp
        : extras.props['size'] || '$true'
    return getFontSized(size, extras)
  },
}

export type SizableTextProps = GetProps<typeof SizableText>
