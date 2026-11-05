// @vitest-environment jsdom

/** FadeIn rises with motion.css's `rise`, staggers by gui props, and takes no style. */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { FadeIn } from './FadeIn'

const html = (node: React.ReactNode) => renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)

describe('FadeIn', () => {
  it('rises, staggered by index, as a block of gui classes with no style attribute', () => {
    const markup = html(
      <FadeIn index={3} width="100%">
        <span>row</span>
      </FadeIn>,
    )
    const tag = markup.match(/<div[^>]*data-motion="rise"[^>]*>/)?.[0] ?? ''
    expect(tag).not.toMatch(/style=/)
    expect(tag).toMatch(/_dsp-block/)
    expect(tag).toMatch(/_width-10037|_width-100%|_w-100/)
    expect(markup).toMatch(/animationDelay|animation-delay|150ms/)
  })
})
