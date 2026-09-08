// @vitest-environment jsdom

/**
 * MediaPlayer behaviour, asserted on a live DOM. jsdom implements the
 * `<video>` element's properties but not playback, so `play`/`pause` are
 * stubbed and state transitions are driven by dispatching the same events the
 * real element fires.
 *
 * Imports `./video-player` directly rather than the backend barrel, so this
 * test only fails on this component's own regressions.
 */
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MediaPlayer, type MediaSource } from './video-player'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    video: () => host.querySelector<HTMLVideoElement>('[data-slot="media-player-video"]')!,
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const sources: MediaSource[] = [{ src: 'https://example.com/a.mp4', type: 'video/mp4', quality: '720p' }]

beforeAll(() => {
  // jsdom has no media pipeline — play/pause exist as no-ops that would
  // otherwise log "not implemented".
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()

  // The volume slider's layout measurement wants both observers; jsdom has
  // neither. Local to this suite — vitest.setup.ts only owes matchMedia.
  const Noop = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  globalThis.ResizeObserver ??= Noop as never
  globalThis.IntersectionObserver ??= Noop as never
})

describe('MediaPlayer markup', () => {
  it('renders the frame, the video and its sources', () => {
    const markup = html(
      <MediaPlayer sources={sources} poster="https://example.com/poster.jpg" subtitles={[]} />,
    )

    expect(markup).toContain('data-slot="media-player"')
    expect(markup).toContain('data-slot="media-player-video"')
    expect(markup).toContain('data-slot="media-player-controls"')
    expect(markup).toContain('poster="https://example.com/poster.jpg"')
    expect(markup).toContain('src="https://example.com/a.mp4"')
  })

  it('adds a track element per subtitle, defaulting the first', () => {
    const markup = html(
      <MediaPlayer
        sources={sources}
        subtitles={[
          { src: '/en.vtt', label: 'English', srcLang: 'en' },
          { src: '/fr.vtt', label: 'Français', srcLang: 'fr' },
        ]}
      />,
    )

    expect(markup).toContain('srcLang="en"')
    expect(markup).toContain('srcLang="fr"')
    // The default attribute renders as the empty-string form on the first track only.
    expect(markup.match(/<track[^>]*default=""/g)?.length).toBe(1)
  })

  it('drops the captions button when there are no subtitles, keeps it when there are', () => {
    expect(html(<MediaPlayer sources={sources} />)).not.toContain('aria-label="Toggle captions"')
    expect(html(<MediaPlayer sources={sources} subtitles={[{ src: '/en.vtt', label: 'EN', srcLang: 'en' }]} />)).toContain(
      'aria-label="Toggle captions"',
    )
  })

  it('offers a quality menu only once a source declares more than one quality', () => {
    const noQuality: MediaSource[] = [{ src: 'https://example.com/a.mp4', type: 'video/mp4' }]
    expect(html(<MediaPlayer sources={noQuality} />)).not.toContain('aria-label="Quality"')
    expect(
      html(
        <MediaPlayer
          sources={[
            { src: '/lo.mp4', type: 'video/mp4', quality: '480p' },
            { src: '/hi.mp4', type: 'video/mp4', quality: '1080p' },
          ]}
        />,
      ),
    ).toContain('aria-label="Quality"')
  })

  it('sizes the frame by the size variant', () => {
    const frameClass = (markup: string) =>
      markup.match(/data-slot="media-player"[^>]*class="([^"]+)"/)?.[1] ?? ''

    expect(frameClass(html(<MediaPlayer sources={sources} size="sm" />))).toMatch(/_maxW-448px/)
    expect(frameClass(html(<MediaPlayer sources={sources} size="full" />))).not.toMatch(/_maxW-/)
  })
})

describe('MediaPlayer playback', () => {
  it('plays on click and flips the transport to Pause', () => {
    const { host, video, cleanup } = mount(<MediaPlayer sources={sources} />)
    const play = video()

    expect(host.querySelector('[aria-label="Play"]')).toBeTruthy()
    act(() => play.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(play.play).toHaveBeenCalled()

    act(() => play.dispatchEvent(new Event('play')))
    expect(host.querySelector('[aria-label="Pause"]')).toBeTruthy()
    expect(host.querySelector('[aria-label="Play"]')).toBeFalsy()

    act(() => play.dispatchEvent(new Event('pause')))
    expect(host.querySelector('[aria-label="Play"]')).toBeTruthy()

    cleanup()
  })

  it('calls onPlay/onPause/onEnded as the element reports them', () => {
    const onPlay = vi.fn()
    const onPause = vi.fn()
    const onEnded = vi.fn()
    const { video, cleanup } = mount(
      <MediaPlayer sources={sources} onPlay={onPlay} onPause={onPause} onEnded={onEnded} />,
    )
    const el = video()

    act(() => el.dispatchEvent(new Event('play')))
    expect(onPlay).toHaveBeenCalledTimes(1)
    act(() => el.dispatchEvent(new Event('pause')))
    expect(onPause).toHaveBeenCalledTimes(1)
    act(() => el.dispatchEvent(new Event('ended')))
    expect(onEnded).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('toggles mute, silencing the element and relabelling the control', () => {
    const { host, video, cleanup } = mount(<MediaPlayer sources={sources} />)
    const el = video()

    const mute = host.querySelector<HTMLButtonElement>('[aria-label="Mute"]')!
    act(() => mute.click())

    expect(el.volume).toBe(0)
    expect(host.querySelector('[aria-label="Unmute"]')).toBeTruthy()

    cleanup()
  })

  it('skips forward and backward by clamping into the element’s current time', () => {
    const { host, video, cleanup } = mount(<MediaPlayer sources={sources} />)
    const el = video()
    Object.defineProperty(el, 'duration', { value: 100, configurable: true })
    el.currentTime = 20
    act(() => el.dispatchEvent(new Event('timeupdate')))

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Forward 10 seconds"]')!.click())
    expect(el.currentTime).toBe(30)
    act(() => el.dispatchEvent(new Event('timeupdate')))

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Rewind 10 seconds"]')!.click())
    expect(el.currentTime).toBe(20)

    cleanup()
  })

  it('reports the current time and duration through onTimeUpdate', () => {
    const onTimeUpdate = vi.fn()
    const { video, cleanup } = mount(<MediaPlayer sources={sources} onTimeUpdate={onTimeUpdate} />)
    const el = video()
    Object.defineProperty(el, 'duration', { value: 42, configurable: true })
    el.currentTime = 5
    act(() => el.dispatchEvent(new Event('timeupdate')))

    expect(onTimeUpdate).toHaveBeenCalledWith(5, 42)

    cleanup()
  })

  it('shows a buffering overlay while the element waits and clears it on canplay', () => {
    const { host, video, cleanup } = mount(<MediaPlayer sources={sources} />)
    const el = video()

    expect(host.querySelector('[data-slot="media-player-buffering"]')).toBeFalsy()

    act(() => el.dispatchEvent(new Event('waiting')))
    expect(host.querySelector('[data-slot="media-player-buffering"]')).toBeTruthy()

    act(() => el.dispatchEvent(new Event('canplay')))
    expect(host.querySelector('[data-slot="media-player-buffering"]')).toBeFalsy()

    cleanup()
  })

  it('switches source on a quality pick and calls onQualityChange', () => {
    const onQualityChange = vi.fn()
    const twoQuality: MediaSource[] = [
      { src: 'https://example.com/lo.mp4', type: 'video/mp4', quality: '480p' },
      { src: 'https://example.com/hi.mp4', type: 'video/mp4', quality: '1080p' },
    ]
    const { host, video, cleanup } = mount(
      <MediaPlayer sources={twoQuality} onQualityChange={onQualityChange} />,
    )

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Quality"]')!.click())
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((el) =>
      el.textContent?.includes('1080p'),
    ) as HTMLElement
    act(() => item.click())

    expect(video().src).toBe('https://example.com/hi.mp4')
    expect(onQualityChange).toHaveBeenCalledWith('1080p')

    cleanup()
  })

  it('changes playback speed from the speed menu and calls onSpeedChange', () => {
    const onSpeedChange = vi.fn()
    const { host, video, cleanup } = mount(<MediaPlayer sources={sources} onSpeedChange={onSpeedChange} />)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Playback speed"]')!.click())
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((el) => el.textContent === '2x') as HTMLElement
    act(() => item.click())

    expect(video().playbackRate).toBe(2)
    expect(onSpeedChange).toHaveBeenCalledWith(2)

    cleanup()
  })

  it('toggles the captions flag from the captions button', () => {
    const { host, cleanup } = mount(
      <MediaPlayer sources={sources} subtitles={[{ src: '/en.vtt', label: 'EN', srcLang: 'en' }]} />,
    )
    const captions = host.querySelector<HTMLButtonElement>('[aria-label="Toggle captions"]')!
    const before = captions.className

    act(() => captions.click())

    // The pressed state compiles a different background class onto the SAME
    // button — not a class toggled elsewhere, not a re-render with a new node.
    expect(captions.className).not.toBe(before)
    expect(captions.className).toMatch(/_bg-rgba/)

    cleanup()
  })
})
