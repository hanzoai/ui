// @vitest-environment jsdom

/**
 * AvatarGroup: four shown, the rest counted, a server-side total honoured, the
 * overlap on the reading direction's start side, nothing at all when empty.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { AvatarGroup } from './avatar-group'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const count = (markup: string, slot: string) => markup.split(`data-slot="${slot}"`).length - 1
const six = Array.from({ length: 6 }, (_, i) => <i key={i} data-a={i} />)

describe('AvatarGroup', () => {
  it('shows four and counts the other two', () => {
    const markup = html(<AvatarGroup avatars={six} />)
    expect(count(markup, 'avatar-group-item')).toBe(4)
    expect(markup).toContain('+2')
  })

  it('a total larger than the list counts what was never sent', () => {
    expect(html(<AvatarGroup avatars={six.slice(0, 3)} total={12} />)).toContain('+9')
  })

  it('the first item carries no overlap; the rest pull 3px on the start side', () => {
    const markup = html(<AvatarGroup avatars={six.slice(0, 2)} />)
    const items = [...markup.matchAll(/<div[^>]*data-slot="avatar-group-item"[^>]*>/g)].map((m) => m[0])
    expect(items[0]).not.toMatch(/marginInlineStart|_ms-/)
    expect(items[1]).toMatch(/_marginInlineStart--3px/)
  })

  it('renders nothing with nothing to show', () => {
    expect(html(<AvatarGroup avatars={[]} />)).not.toContain('avatar-group')
  })

  it('a custom overflow', () => {
    expect(html(<AvatarGroup avatars={six} renderOverflow={(n) => <b>{`and ${n} more`}</b>} />)).toContain('and 2 more')
  })
})
