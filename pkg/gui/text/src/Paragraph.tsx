import type { GetProps } from '@hanzo/gui-web'
import { styled } from '@hanzo/gui-web'

import { SizableText } from './SizableText'

export const Paragraph = styled(SizableText, {
  name: 'Paragraph',
  render: 'p',
  userSelect: 'auto',
  color: '$color',
  size: '$true',
  whiteSpace: 'normal',
})

export type ParagraphProps = GetProps<typeof Paragraph>
