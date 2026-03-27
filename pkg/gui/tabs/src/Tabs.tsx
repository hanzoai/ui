import { styled, View } from '@hanzogui/core'
import { getButtonSized } from '@hanzogui/get-button-sized'
import { SizableStack, ThemeableStack } from '@hanzogui/stacks'

const TABS_NAME = 'Tabs'
export const DefaultTabsFrame = styled(SizableStack, {
  name: TABS_NAME,
})

const TRIGGER_NAME = 'TabsTrigger'

export const DefaultTabsTabFrame = styled(
  View,
  {
    name: TRIGGER_NAME,
    role: 'tab',

    variants: {
      size: {
        '...size': getButtonSized,
      },

      disabled: {
        true: {
          pointerEvents: 'none',
        },
      },

      unstyled: {
        false: {
          borderWidth: 0,
          backgroundColor: '$background',
          userSelect: 'none',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'nowrap',
          flexDirection: 'row',
          cursor: 'pointer',

          pressStyle: {
            backgroundColor: '$backgroundPress',
          },

          focusVisibleStyle: {
            outlineColor: '$outlineColor',
            outlineWidth: 2,
            outlineStyle: 'solid',
            zIndex: 10,
          },
        },
      },
    } as const,

    defaultVariants: {
      unstyled: process.env.HANZO_GUI_HEADLESS === '1',
    },
  },
  {
    accept: {
      activeStyle: 'style',
    } as const,
  }
)

const CONTENT_NAME = 'TabsContent'

export const DefaultTabsContentFrame = styled(ThemeableStack, {
  name: CONTENT_NAME,
})
