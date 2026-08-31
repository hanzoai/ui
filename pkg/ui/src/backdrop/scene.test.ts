/**
 * The backdrop's rules, which are the whole of its security story.
 *
 * Every one of these is a refusal, and a refusal is the thing that fails
 * silently: allow one URL too many and nothing errors — an element simply fires
 * a GET at a host nobody chose, on every load, forever. So the cases here are
 * the ones that LOOK allowed and are not.
 *
 * Pure by construction: no React, no DOM, no `location`. That is what lets a
 * surface hold a scene to this rule before it has mounted anything.
 */
import { describe, expect, it } from 'vitest'

import {
  BLANK,
  channel,
  command,
  files,
  knobs,
  media,
  merge,
  playable,
  provider,
  scene,
  twitch,
  videoId,
  web,
  youtube,
} from './scene'

describe('web', () => {
  it('takes http(s) and nothing else', () => {
    expect(web('https://example.com/a')).toBe('https://example.com/a')
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'blob:https://a/b', '', 'not a url'])
      expect(web(bad), bad).toBe('')
  })

  it('refuses a URL longer than any real one', () => {
    expect(web(`https://example.com/${'a'.repeat(4000)}`)).toBe('')
  })
})

describe('media', () => {
  it('keeps our own path RELATIVE', () => {
    // A surface is served under several brands' domains; a stored absolute
    // origin would be right on one of them and wrong on the rest.
    expect(media('/clips/beluga.mp4')).toBe('/clips/beluga.mp4')
    expect(media('/clips/beluga.mp4?v=2')).toBe('/clips/beluga.mp4?v=2')
  })

  it('allows a host the caller named and drops every other', () => {
    expect(media('https://s3.hanzo.ai/beluga.mp4')).toBe('https://s3.hanzo.ai/beluga.mp4')
    expect(media('https://tracker.example/beluga.mp4')).toBe('')
    expect(media('https://cdn.brand.test/x.mp4', ['cdn.brand.test'])).toBe(
      'https://cdn.brand.test/x.mp4',
    )
  })

  it('is not fooled by a backslash', () => {
    // `/\evil.example/x.png` reads as a path and resolves to a different host,
    // which is why this parses rather than matching a prefix.
    expect(media('/\\evil.example/x.png')).toBe('')
  })

  it('refuses a scheme that is not a fetch', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA'])
      expect(media(bad), bad).toBe('')
  })
})

describe('files', () => {
  it('reads a list from a string, an array, or neither', () => {
    expect(files('/a.mp4, /b.mp4')).toEqual(['/a.mp4', '/b.mp4'])
    expect(files(['/a.mp4', '/b.mp4'])).toEqual(['/a.mp4', '/b.mp4'])
    expect(files(42)).toEqual([])
  })

  it('drops what it cannot play and repeats nothing', () => {
    expect(files('/a.mp4 https://tracker.example/b.mp4 /a.mp4')).toEqual(['/a.mp4'])
  })

  it('has an end, because appending is a loop a visitor can run', () => {
    expect(files(Array.from({ length: 200 }, (_, i) => `/c${i}.mp4`))).toHaveLength(64)
  })
})

describe('who serves it', () => {
  it('reads the host, not the path', () => {
    expect(provider('https://www.youtube.com/watch?v=UY5YH6B4A9o')).toBe('youtube')
    expect(provider('https://youtu.be/UY5YH6B4A9o')).toBe('youtube')
    expect(provider('https://player.twitch.tv/?channel=a')).toBe('twitch')
    // `other` means "we cannot play this", not "unknown": there is no embed, no
    // key and no partner tier that changes it.
    expect(provider('https://www.netflix.com/watch/1')).toBe('other')
    expect(playable({ url: 'https://www.netflix.com/watch/1', provider: 'other' })).toBe(false)
  })

  it('finds the id in every form people paste', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=UY5YH6B4A9o',
      'https://youtu.be/UY5YH6B4A9o',
      'https://www.youtube.com/embed/UY5YH6B4A9o',
      'https://www.youtube.com/shorts/UY5YH6B4A9o',
      'UY5YH6B4A9o',
    ])
      expect(videoId(url), url).toBe('UY5YH6B4A9o')
    expect(videoId('https://www.youtube.com/')).toBe('')
  })

  it('refuses a Twitch clip rather than playing the channel instead', () => {
    // Falling back would put a LIVE STREAM on the canvas in place of the few
    // seconds that were asked for: not the thing, and not obviously not it.
    expect(channel('https://www.twitch.tv/someone/clip/GloriousSlug').name).toBe('')
    expect(channel('https://www.twitch.tv/someone')).toEqual({ key: 'channel', name: 'someone' })
    expect(channel('https://www.twitch.tv/videos/123')).toEqual({ key: 'video', name: '123' })
  })
})

describe('the players', () => {
  it('gives a looping single video the playlist YouTube requires', () => {
    // Their rule, not ours: a lone video with `loop=1` and no list plays once.
    expect(youtube(['abcdefghijk'], true, 'https://a.test')).toContain('playlist=abcdefghijk')
    expect(youtube(['abcdefghijk'], false, 'https://a.test')).not.toContain('playlist=')
  })

  it('starts muted, always', () => {
    // Autoplay with sound is refused by every current browser, so `mute=1` is
    // what lets the embed start at all; sound is a command sent afterwards.
    expect(youtube(['abcdefghijk'], false, 'https://a.test')).toContain('mute=1')
  })

  it('opens where the knobs say', () => {
    expect(youtube(['abcdefghijk'], false, 'https://a.test', 42)).toContain('start=42')
    expect(knobs('https://youtu.be/abcdefghijk?t=12&rate=0.5&zoom=1.8')).toEqual({
      start: 12,
      rate: 0.5,
      zoom: 1.8,
    })
    expect(knobs('/clips/beluga.mp4')).toEqual({})
  })

  it('tells Twitch which host is framing it', () => {
    // Twitch refuses to frame for a `parent` it was not given.
    expect(twitch('https://www.twitch.tv/someone', 'hanzo.chat')).toContain('parent=hanzo.chat')
  })
})

describe('merge — the one gate', () => {
  it('drops a mode it does not know and keeps the current one', () => {
    expect(merge({ ...BLANK, mode: 'photo' }, { mode: 'iframe' }).mode).toBe('photo')
  })

  it('recomputes the provider instead of believing it', () => {
    // A caller claiming `youtube` for a netflix.com link must not be able to
    // talk the canvas into framing it.
    const out = merge(BLANK, {
      playlist: [{ url: 'https://www.netflix.com/watch/1', provider: 'youtube' }],
    })
    expect(out.playlist).toEqual([
      { url: 'https://www.netflix.com/watch/1', provider: 'other' },
    ])
    expect(out.playlist.filter(playable)).toEqual([])
  })

  it('re-validates clips on the way IN, not only on the way out', () => {
    // Bytes in storage are not ours: a rule enforced only at the settings panel
    // lasts exactly until the page is refreshed.
    expect(merge(BLANK, { clips: ['/ok.mp4', 'https://tracker.example/x.mp4'] }).clips).toEqual([
      '/ok.mp4',
    ])
  })

  it('leaves the scene alone when handed something that is not one', () => {
    for (const junk of [null, undefined, 'clips', 7]) expect(merge(BLANK, junk)).toBe(BLANK)
  })
})

describe('scene — what one configuration value means', () => {
  it('opens on clips for a list of files and on video for anything else', () => {
    expect(scene('/a.mp4,/b.mp4')).toEqual({ mode: 'clips', clips: ['/a.mp4', '/b.mp4'], video: '' })
    const url = 'https://www.youtube.com/watch?v=UY5YH6B4A9o'
    // An existing single-URL value does not change meaning.
    expect(scene(url)).toEqual({ mode: 'video', clips: [], video: url })
  })
})

describe('command', () => {
  it('is one of exactly two words', () => {
    // A word boundary would also match `/background-image …`, which is a
    // message and is sent as one.
    expect(command('/background-image of a reef', BLANK)).toBeNull()
    expect(command('tell me about /bg', BLANK)).toBeNull()
    expect(command('/bg off', BLANK)?.mode).toBe('off')
  })

  it('never guesses what a bare URL is', () => {
    // Guessing is a second way to say what `photo` and `video` say exactly, and
    // it is wrong precisely when the URL is unusual.
    expect(command('/bg https://youtu.be/UY5YH6B4A9o', BLANK)).toBeNull()
  })

  it('answers null for something it cannot play, so the line is sent as a message', () => {
    expect(command('/bg video https://www.netflix.com/watch/1', BLANK)).toBeNull()
    expect(command('/bg photo https://tracker.example/x.png', BLANK)).toBeNull()
    expect(command('/bg add https://www.netflix.com/watch/1', BLANK)).toBeNull()
  })

  it('appends through merge, so the list has one keeper of its length', () => {
    const one = command('/bg add https://youtu.be/UY5YH6B4A9o', BLANK)
    expect(one?.mode).toBe('playlist')
    expect(one?.playlist).toHaveLength(1)
  })

  it('reads loop both ways and refuses anything else', () => {
    expect(command('/bg loop off', BLANK)?.loop).toBe(false)
    expect(command('/bg loop on', { ...BLANK, loop: false })?.loop).toBe(true)
    expect(command('/bg loop maybe', BLANK)).toBeNull()
  })
})
