// @vitest-environment jsdom

/**
 * Marquee3D's contract, asserted on the compiled markup: the loop's shape (a
 * doubled track, a trailing gap per copy, every copy past the first hidden
 * from readers), where the tilt lives and where the travel lives, and what
 * each prop turns into on the element. Never on the text, since @hanzo/gui
 * drops a prop it does not recognise with no throw and no type error. The
 * measurement — duration from the track, copies from the stage — runs on a
 * live DOM with the layout pinned by hand, since jsdom lays nothing out.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Marquee3D, Marquee3DFloating, Marquee3DPreset } from './3d-marquee'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** A live tree — the only place an effect measures anything. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    track: () => host.querySelector<HTMLElement>('[data-slot="marquee-3d-track"]')!,
    items: () => host.querySelectorAll('[data-slot="marquee-3d-item"]').length,
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

/** The opening tag of the first element carrying the slot. */
const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** Every opening tag carrying the slot. */
const tags = (markup: string, slot: string) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])

const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

describe('Marquee3D', () => {
  it('lays the items out twice, and reads only the first copy to a reader', () => {
    const markup = html(
      <Marquee3D repeat={3}>
        <span>one</span>
      </Marquee3D>,
    )
    const items = tags(markup, 'marquee-3d-item')

    expect(tag(markup, 'marquee-3d')).not.toBe('')
    expect(tag(markup, 'marquee-3d-track')).not.toBe('')
    expect(tags(markup, 'marquee-3d-group')).toHaveLength(2)
    // 3 copies per group, 2 groups.
    expect(items).toHaveLength(6)
    expect(markup.match(/>one</g)).toHaveLength(6)
    expect(items[0]).not.toContain('aria-hidden')
    for (const copy of items.slice(1)) expect(copy).toContain('aria-hidden="true"')
  })

  it('hosts a bare text child in a Text that takes the group’s ink', () => {
    const markup = html(<Marquee3D repeat={1}>hi</Marquee3D>)
    const label = tag(markup, 'marquee-3d-text')

    // The slot is set by hand: gui derives one from the styled name, and its
    // kebab rule turns `Marquee3DText` into `marquee3-d-text`.
    expect(label).toMatch(/^<span/)
    expect(label).toContain('is_Marquee3DText')
    expect(markup).not.toContain('marquee3-d')
    // gui's Text paints `var(--color)` by default; that would sit on top of a
    // gradient clipped through the glyphs.
    expect(cls(label, 'col')).toBe('_col-inherit')
  })

  // The keyframe moves the track by half of itself, so the gap after the last
  // item of one copy must equal the gap between items or the seam jumps.
  it('pads each copy by the gap so the period is exactly half the track', () => {
    const row = tags(html(<Marquee3D gap={24}>x</Marquee3D>), 'marquee-3d-group')
    const column = tags(
      html(
        <Marquee3D direction="up" gap={24}>
          x
        </Marquee3D>,
      ),
      'marquee-3d-group',
    )

    expect(cls(row[0], 'gap')).toBe('_gap-24px')
    expect(cls(row[0], 'pr')).toBe('_pr-24px')
    expect(cls(column[0], 'pb')).toBe('_pb-24px')
    expect(cls(column[0], 'pr')).toBe('')
  })

  // A keyframe's `transform` replaces the element's own, so a tilt on the
  // moving track would be overwritten on the first frame. The stage tilts; the
  // track only travels.
  it('tilts the stage with the perspective and moves only the track', () => {
    const markup = html(
      <Marquee3D perspective="lg" rotateX={-10} rotateY={5} rotateZ={1}>
        x
      </Marquee3D>,
    )
    const stage = tag(markup, 'marquee-3d-stage')
    const track = tag(markup, 'marquee-3d-track')

    expect(stage).toContain('transform:perspective(1500px) rotateX(-10deg) rotateY(5deg) rotateZ(1deg)')
    expect(track).not.toContain('rotateX')
    expect(track).toMatch(/animation-name:marquee-3d-x;animation-duration:[\d.]+s;animation-timing-function:linear;animation-iteration-count:infinite;animation-direction:normal/)
    // The play state is the hover rule's to set; inline it would win.
    expect(track).not.toContain('animation-play-state')
    expect(tag(markup, 'marquee-3d')).not.toContain('perspective')
  })

  it('draws flat for perspective "none"', () => {
    const stage = tag(html(<Marquee3D perspective="none">x</Marquee3D>), 'marquee-3d-stage')

    expect(stage).not.toContain('perspective(')
    expect(stage).toContain('rotateX(0deg)')
  })

  it('flips the play direction for right/down and again for reverse', () => {
    const play = (node: React.ReactNode) =>
      tag(html(node), 'marquee-3d-track').match(/animation-direction:(normal|reverse)/)?.[1]

    expect(play(<Marquee3D direction="left">x</Marquee3D>)).toBe('normal')
    expect(play(<Marquee3D direction="right">x</Marquee3D>)).toBe('reverse')
    expect(play(<Marquee3D direction="up">x</Marquee3D>)).toBe('normal')
    expect(play(<Marquee3D direction="down">x</Marquee3D>)).toBe('reverse')
    expect(
      play(
        <Marquee3D direction="right" reverse>
          x
        </Marquee3D>,
      ),
    ).toBe('normal')
  })

  it('runs the vertical keyframe in a column for up/down', () => {
    const markup = html(<Marquee3D direction="down">x</Marquee3D>)
    const track = tag(markup, 'marquee-3d-track')

    expect(track).toContain('animation-name:marquee-3d-y')
    expect(cls(track, 'fd')).toBe('_fd-column')
    expect(cls(tag(markup, 'marquee-3d-stage'), 'fd')).toBe('_fd-column')
    expect(markup).toContain('data-direction="down"')
  })

  // A floor instead would let a vertical marquee grow to the whole doubled track.
  it('fixes the frame’s height and the type size from `size`', () => {
    const markup = html(<Marquee3D size="3xl">x</Marquee3D>)

    expect(cls(tag(markup, 'marquee-3d'), 'height')).toBe('_height-128px')
    expect(cls(tag(markup, 'marquee-3d'), 'minH')).toBe('')
    expect(tag(markup, 'marquee-3d-item')).toContain('font-size:30px')
    expect(tag(markup, 'marquee-3d-item')).toContain('font-weight:700')
    // gui turns a bare number into px; only the keyword survives as a line box.
    expect(tag(markup, 'marquee-3d-item')).toContain('line-height:normal')
    expect(cls(tag(html(<Marquee3D size="sm">x</Marquee3D>), 'marquee-3d'), 'height')).toBe('_height-32px')
  })

  // On the item and not the group: gui gives every stack the theme's weight
  // and line height, so anything but the nearest stack is reset on the way down.
  it('inks the item per variant and surfaces the frame', () => {
    const group = (variant: React.ComponentProps<typeof Marquee3D>['variant']) =>
      tag(html(<Marquee3D variant={variant}>x</Marquee3D>), 'marquee-3d-item')

    expect(group('neon')).toContain('color:#22d3ee')
    expect(group('neon')).toContain('marquee-3d-pulse')
    expect(group('rainbow')).toContain('background-clip:text')
    expect(group('rainbow')).toContain('color:transparent')
    expect(group('fire')).toContain('drop-shadow(0 0 20px #ff6600)')
    expect(group('default')).not.toContain('color:')

    const glass = tag(html(<Marquee3D variant="glass">x</Marquee3D>), 'marquee-3d')
    expect(glass).toContain('data-variant="glass"')
    expect(glass).toContain('glass elevation-2')
    // The host's own surface and ink, as theme tokens.
    const plain = tag(html(<Marquee3D>x</Marquee3D>), 'marquee-3d')
    expect(cls(plain, 'bg')).toBe('_bg-background')
    expect(cls(plain, 'col')).toBe('_col-color')
  })

  it('marks the frame for pause-on-hover only when asked, with the rule to match', () => {
    const paused = html(<Marquee3D pauseOnHover>x</Marquee3D>)
    const running = html(<Marquee3D>x</Marquee3D>)

    expect(tag(paused, 'marquee-3d')).toContain('data-pause-hover="true"')
    expect(tag(running, 'marquee-3d')).not.toContain('data-pause-hover')
    expect(paused).toContain('[data-pause-hover]:hover [data-slot="marquee-3d-track"] { animation-play-state: paused }')
  })

  it('masks both ends only when gradient is requested, along the axis of travel', () => {
    const row = tag(
      html(
        <Marquee3D gradient gradientColor="#c4c4c4" gradientWidth={64}>
          x
        </Marquee3D>,
      ),
      'marquee-3d',
    )
    const column = tag(
      html(
        <Marquee3D direction="up" gradient>
          x
        </Marquee3D>,
      ),
      'marquee-3d',
    )

    expect(row).toContain('mask-image:linear-gradient(to right, transparent, #c4c4c4 64px, #c4c4c4 calc(100% - 64px), transparent)')
    expect(column).toContain('mask-image:linear-gradient(to bottom')
    expect(tag(html(<Marquee3D>x</Marquee3D>), 'marquee-3d')).not.toContain('mask-image')
  })

  // Hoisted by `href`: two marquees, one copy of the keyframes.
  it('emits the keyframes once for any number of marquees, and honours reduced motion', () => {
    const markup = html(
      <>
        <Marquee3D>a</Marquee3D>
        <Marquee3D>b</Marquee3D>
      </>,
    )

    expect(markup.match(/@keyframes marquee-3d-x/g)).toHaveLength(1)
    expect(markup).toContain('@media (prefers-reduced-motion: reduce)')
  })
})

describe('Marquee3D measures', () => {
  // What a real layout would report: the stage is the frame, an item is one
  // copy, and the track is every item it holds plus the gap after each.
  const layout = { stage: 600, item: 100, gap: 20 }
  const real = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        const slot = this.getAttribute('data-slot')
        if (slot === 'marquee-3d-stage') return layout.stage
        if (slot === 'marquee-3d-item') return layout.item
        if (slot === 'marquee-3d-track')
          return this.querySelectorAll('[data-slot="marquee-3d-item"]').length * (layout.item + layout.gap)
        return 0
      },
    })
    layout.stage = 600
  })
  afterEach(() => Object.defineProperty(HTMLElement.prototype, 'offsetWidth', real))

  it('takes the duration from half the rendered track over `speed`', () => {
    // 2 copies × 2 groups = 4 items × 120px = 480px; half of that at 60px/s.
    const view = mount(
      <Marquee3D repeat={2} gap={20} speed={60}>
        x
      </Marquee3D>,
    )

    expect(view.track().style.animationDuration).toBe('4s')
    view.cleanup()
  })

  it('lays out enough copies to cover the stage for `autoFill`, and re-measures the track they make', () => {
    const view = mount(
      <Marquee3D autoFill gap={20} speed={50}>
        x
      </Marquee3D>,
    )

    // ceil(600 / 120) + 1 = 6 per group; the track those 12 make is 1440px.
    expect(view.items()).toBe(12)
    expect(view.track().style.animationDuration).toBe('14.4s')

    // A wider stage wants more copies, and the pace holds.
    layout.stage = 1200
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(view.items()).toBe(22)
    expect(view.track().style.animationDuration).toBe('26.4s')
    view.cleanup()
  })
})

describe('Marquee3DPreset', () => {
  it('pins each preset to its variant and size', () => {
    const frame = (node: React.ReactNode) => tag(html(node), 'marquee-3d')

    expect(frame(<Marquee3DPreset.Hero>x</Marquee3DPreset.Hero>)).toContain('data-variant="rainbow"')
    expect(cls(frame(<Marquee3DPreset.Hero>x</Marquee3DPreset.Hero>), 'height')).toBe('_height-128px')
    expect(frame(<Marquee3DPreset.Neon>x</Marquee3DPreset.Neon>)).toContain('data-variant="neon"')
    expect(frame(<Marquee3DPreset.Neon>x</Marquee3DPreset.Neon>)).toContain('data-pause-hover="true"')
    expect(frame(<Marquee3DPreset.Metallic>x</Marquee3DPreset.Metallic>)).toContain('data-variant="metallic"')
    expect(frame(<Marquee3DPreset.Fire>x</Marquee3DPreset.Fire>)).toContain('data-variant="fire"')
    expect(frame(<Marquee3DPreset.Glass>x</Marquee3DPreset.Glass>)).toContain('data-variant="glass"')
  })

  it('still takes an override on top of the preset', () => {
    const markup = html(
      <Marquee3DPreset.Neon direction="down" rotateY={0}>
        x
      </Marquee3DPreset.Neon>,
    )

    expect(tag(markup, 'marquee-3d')).toContain('data-direction="down"')
    expect(tag(markup, 'marquee-3d-stage')).toContain('rotateY(0deg)')
  })
})

describe('Marquee3DFloating', () => {
  it('splits a text child into one bobbing glyph per character, spaces kept', () => {
    const markup = html(
      <Marquee3DFloating repeat={1} floatIntensity={8} floatSpeed={2}>
        a b
      </Marquee3DFloating>,
    )
    const chars = tags(markup, 'marquee-3d-char')

    // 3 glyphs, doubled for the loop.
    expect(chars).toHaveLength(6)
    expect(chars[0]).toContain('--float:-8px')
    expect(chars[0]).toContain('animation:marquee-3d-float 2s ease-in-out infinite')
    // The row is a Text, not a stack: a stack would reset the weight between
    // the item and the glyph.
    const row = tags(markup, 'marquee-3d-text').find((t) => t.includes('display:inline-flex;gap:4px')) ?? ''
    expect(row).toMatch(/^<span/)
    expect(row).toContain('is_Marquee3DText')
    expect(chars[0]).toContain('animation-delay:0s')
    expect(chars[2]).toContain('animation-delay:0.2s')
    // A plain space collapses to nothing inside a flex row; the glyph must be
    // a non-breaking one.
    expect(markup).toContain('\u00A0')
  })

  it('passes a non-string child straight through with no split', () => {
    const markup = html(
      <Marquee3DFloating>
        <span>node</span>
      </Marquee3DFloating>,
    )

    expect(tags(markup, 'marquee-3d-char')).toHaveLength(0)
    expect(markup).toContain('node')
  })
})
