/**
 * What paints behind a conversation, and the pure rules that read it.
 *
 * No React and no imports: every rule about what can play, what a link means and
 * what a typed command does is decidable from data alone, so it is decidable in
 * a test without rendering anything — and a surface can read a stored value
 * before it has mounted anything.
 *
 * ONE switch. `mode: 'off'` is the only way to say "no backdrop"; there is
 * deliberately no enable flag beside it, because a pair of them makes two states
 * (off + video, on + off) that paint the same nothing, and that ambiguity is
 * where a bug grows.
 *
 * WHAT CANNOT PLAY, AND WHY: only YouTube and Twitch are embeddable. Every DRM
 * service — Netflix and its neighbours — publishes no embed, wraps playback in
 * Widevine and forbids framing in its terms. There is no key and no clever
 * iframe that changes that, so such a link is classed `other` and NEVER becomes
 * a frame. A menu can offer it as a link that opens in a tab; anything else
 * would be pretending.
 *
 * No provider password is ever asked for. A members-only or age-gated stream
 * plays if — and only if — the viewer is already signed in to that provider in
 * this browser, because the embed rides their own cookies. Collecting those
 * credentials is not a feature this is missing; it is one it refuses.
 */

/** Who serves a link. `other` means "we cannot play this", not "unknown". */
export type Provider = 'youtube' | 'twitch' | 'other'

/**
 * What the backdrop is painting. `off` is the master switch.
 *
 * `clips` is OURS where `video` and `playlist` are third-party frames: a list of
 * direct video files served from a host we allow, played as a preloaded
 * crossfade with nothing revealed until a frame is really painted. It is the one
 * mode that is a `<video>` this code controls rather than a frame it can only
 * ask, which is why an emotion-driven scene (see `Persona`) is built on it.
 */
export type Mode = 'off' | 'photo' | 'video' | 'playlist' | 'clips'

/** One entry of a playlist: what was pasted, and who serves it. */
export interface Link {
  url: string
  provider: Provider
}

/** What is on the canvas. Every field, so a scene is one value to store, merge
 *  and pass — never a bag of independent settings that can disagree. */
export interface Scene {
  mode: Mode
  /** Image URL. Empty means unset. */
  photo: string
  /** YouTube URL (or bare id). Empty means unset. */
  video: string
  playlist: Link[]
  /** Direct video files, played as a preloaded crossfade. Empty means none. */
  clips: string[]
  /** Repeat at the end — the single video, or the whole list. */
  loop: boolean
  /**
   * Play the backdrop's audio. OFF by default, and that default is the point: a
   * page that starts making noise on its own is a page people close, and this
   * one is scenery behind someone's reading.
   *
   * It is not a URL parameter. The embed must start MUTED or it does not start
   * at all — every current browser refuses autoplay with sound — so `mute=1`
   * stays in the player params and the sound is turned on afterwards, through
   * the API, once the player reports it is actually playing. Turning this on IS
   * the gesture that permits it: a setting a person just toggled is a user
   * activation, which is what the autoplay policy asks for.
   */
  sound: boolean
}

/** A blank canvas — the value a surface starts from and folds changes onto.
 *  `off`, because a component library must not begin streaming video on its
 *  own; a surface that wants footage says so. */
export const BLANK: Scene = {
  mode: 'off',
  photo: '',
  video: '',
  playlist: [],
  clips: [],
  loop: true,
  sound: false,
}

/** How long a live stream holds the canvas before the list moves on. A Twitch
 *  channel never ends, so unlike a video it cannot announce its turn is up. */
export const DWELL = 5 * 60 * 1000

/**
 * The longest URL that will be kept. Browsers stopped being the limit long ago;
 * the limit that matters is whatever storage a surface writes this to, one quota
 * shared by every preference it holds. A URL is a string a visitor can paste, so
 * without a ceiling one pasted megabyte fills that quota and the NEXT write of
 * any unrelated setting is the one that throws. 2048 is what every server and
 * proxy has accepted since forever, and far past any real link.
 */
const LONGEST = 2048

/** The longest list. Same quota, same reasoning: appending is a loop a visitor
 *  can run, so it needs an end. Well past any list anyone watches. */
const MOST = 64

/** A backdrop offered by name, for someone who does not have a URL in mind. */
export interface Preset {
  id: string
  label: string
  url: string
}

/**
 * A short list to choose from without knowing a link — offered, never a default
 * (`BLANK` is the default, and it is off). Short by intent: the set someone can
 * read in one glance, with the whole rest of the web one paste away.
 */
export const PRESETS: readonly Preset[] = [
  { id: 'cetaceans', label: 'Cetaceans', url: 'https://www.youtube.com/watch?v=UY5YH6B4A9o' },
  { id: 'reef', label: 'Reef', url: 'https://www.youtube.com/watch?v=6lZ3CookYNg' },
  { id: 'deep', label: 'Deep water', url: 'https://www.youtube.com/watch?v=7Exxd2ievAw' },
]

/**
 * The media hosts a file may be loaded from besides the page's own origin.
 *
 * The Hanzo store is the default because it is where our surfaces keep footage.
 * A brand serving from somewhere else passes its own list — every function here
 * that reads a URL takes one — and whatever it passes must also be what its
 * `img-src` / `media-src` policy allows, or the element is refused by the
 * browser and paints nothing with no error anywhere.
 */
export const HOSTS: readonly string[] = ['s3.hanzo.ai', 's3-api.hanzo.ai']

/**
 * The URL if it is one worth loading, else ''. Anything that is not http(s) —
 * `javascript:`, `data:`, `blob:` — is refused here, at the boundary, so no
 * caller downstream has to remember to check.
 */
export function web(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > LONGEST) return ''
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

const named = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

/** Any absolute URL resolves against this, so a relative path can be told from
 *  one that only looks relative. Never fetched; it is a ruler, not a place. */
const HERE = 'https://backdrop.invalid'

/**
 * A media file that may be painted or played, else ''.
 *
 * Narrower than `web`, and it is the one rule here that is not about what plays.
 * An `<img>` or a `<video src>` fires a GET the moment it renders, with no click
 * and no script, and a STORED one refires on every load afterwards — reporting
 * the viewer's address to whoever owns the host, forever. So a file is ours: a
 * path on this origin, kept RELATIVE because a surface is served under several
 * brands' domains and a stored absolute origin would be wrong on all but one, or
 * a file on a host the caller allows.
 *
 * A URL the browser's own policy would refuse is dropped HERE instead, where it
 * can be answered honestly: a blocked element never fires `load`, so allowing it
 * would mean a blank canvas and nothing anywhere saying why.
 *
 * Backslashes are why this parses rather than matches: `/\evil.example/x.png`
 * looks like a path and resolves to a different host.
 *
 * A photo and a clip are the same question asked about two elements, so they are
 * one function. Two copies would be two places to get the backslash wrong.
 */
export function media(value: unknown, hosts: readonly string[] = HOSTS): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > LONGEST) return ''
  try {
    const url = new URL(value.trim(), HERE)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    if (url.origin === HERE) return url.pathname + url.search
    return hosts.includes(named(url.href)) ? url.href : ''
  } catch {
    return ''
  }
}

/**
 * A list of files from an array, or from a comma- or space-separated string —
 * whichever a configuration value supplies. Every entry passes through `media`,
 * so an unusable one is dropped rather than trusted, and the whole is capped for
 * the same quota reason a playlist is.
 */
export function files(value: unknown, hosts: readonly string[] = HOSTS): string[] {
  const raw = Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v : ''))
    : typeof value === 'string'
      ? value.split(/[\s,]+/)
      : []
  const out: string[] = []
  for (const entry of raw) {
    const ok = media(entry, hosts)
    if (ok && !out.includes(ok)) out.push(ok)
    if (out.length >= MOST) break
  }
  return out
}

/** Who serves this link, decided by host alone. */
export function provider(url: string): Provider {
  const name = named(url)
  if (name === 'youtube.com' || name === 'm.youtube.com' || name === 'music.youtube.com') {
    return 'youtube'
  }
  if (name === 'youtu.be') return 'youtube'
  if (name === 'twitch.tv' || name === 'm.twitch.tv' || name === 'player.twitch.tv') {
    return 'twitch'
  }
  return 'other'
}

/** A YouTube video id is exactly 11 of these. */
const ID = /^[\w-]{11}$/

/**
 * The video id inside a YouTube URL, or '' if there is not one. Accepts the
 * forms people actually paste — watch links, share links, shorts, embeds — and a
 * bare id, which is what the address bar leaves you with often enough.
 */
export function videoId(value: string): string {
  const raw = value.trim()
  if (ID.test(raw)) return raw
  const url = web(raw)
  if (!url || provider(url) !== 'youtube') return ''
  const { pathname, searchParams } = new URL(url)
  const query = searchParams.get('v') ?? ''
  if (ID.test(query)) return query
  // youtu.be/ID, /embed/ID, /shorts/ID, /live/ID — the id is the last segment.
  const last = pathname.split('/').filter(Boolean).pop() ?? ''
  return ID.test(last) ? last : ''
}

/**
 * What to ask the Twitch player for: a live `channel`, or a recorded `video`.
 * Empty `name` means the URL names neither.
 *
 * A CLIP names neither. `twitch.tv/<channel>/clip/<slug>` is a few seconds
 * somebody cut out, and the player this builds cannot ask for one — that embed
 * is a different host with a different parameter. Falling back to the channel
 * would put a LIVE STREAM on the canvas in place of the clip that was asked for:
 * not the thing, and not obviously not the thing. So it is unplayable, and a
 * menu says so with a link out. Refusing what we cannot serve beats serving
 * something else.
 */
export function channel(value: string): { key: 'channel' | 'video'; name: string } {
  const none = { key: 'channel', name: '' } as const
  const url = web(value)
  if (!url || provider(url) !== 'twitch') return none
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/').filter(Boolean)
  const direct = parsed.searchParams.get('channel') ?? parsed.searchParams.get('video') ?? ''
  if (direct) return { key: parsed.searchParams.get('video') ? 'video' : 'channel', name: direct }
  if (parts[0] === 'videos' && parts[1]) return { key: 'video', name: parts[1] }
  if (parts.includes('clip')) return none
  return { key: 'channel', name: parts[0] ?? '' }
}

/** A playlist entry from a pasted URL, or null if it is not a URL at all. */
export function link(value: string): Link | null {
  const url = web(value)
  return url ? { url, provider: provider(url) } : null
}

/** Whether this can actually go on the canvas. `other` never can. */
export function playable(entry: Link): boolean {
  if (entry.provider === 'youtube') return videoId(entry.url) !== ''
  if (entry.provider === 'twitch') return channel(entry.url).name !== ''
  return false
}

/** Every YouTube player param that keeps the chrome out of frame. */
const PLAYER = [
  'autoplay=1',
  'mute=1',
  'controls=0',
  'rel=0',
  'playsinline=1',
  'disablekb=1',
  'fs=0',
  'iv_load_policy=3',
  'vq=hd1080',
  // The listening handshake this enables is what lets the canvas wait for a real
  // "playing" report before revealing anything.
  'enablejsapi=1',
].join('&')

/**
 * The embed URL for one or more YouTube videos.
 *
 * www.youtube.com, not youtube-nocookie: the nocookie host answers embeds with
 * "video player configuration error" (153) in current Chrome.
 *
 * `loop` needs `playlist` even for a single video — that is YouTube's rule, not
 * ours: a lone video with `loop=1` and no list plays once and stops.
 */
export function youtube(ids: string[], loop: boolean, origin: string, start?: number): string {
  const [first, ...rest] = ids
  const params = [PLAYER, `origin=${encodeURIComponent(origin)}`]
  if (loop) {
    params.push('loop=1', `playlist=${(rest.length ? rest : [first]).join(',')}`)
  } else if (rest.length) {
    params.push(`playlist=${rest.join(',')}`)
  }
  // Where the video opens, in seconds. Native `start=` on the embed, so it is
  // honoured before the first frame rather than seeked to after.
  if (start && start > 0) params.push(`start=${Math.floor(start)}`)
  return `https://www.youtube.com/embed/${first}?${params.join('&')}`
}

/**
 * Optional knobs a brand carries in the SAME video URL, so one configuration
 * value tunes all of them with no rebuild:
 *   `start` / `t`  seconds to open on
 *   `rate`         playback speed (YouTube quantises to its allowed steps —
 *                  0.25/0.5/0.75/1/…, so 0.42 plays at the nearest, 0.5)
 *   `zoom`         cover-crop scale, to push a corner watermark off-frame
 * Absent keys return undefined and the caller keeps its own default.
 */
export function knobs(value: string): { start?: number; rate?: number; zoom?: number } {
  const url = web(value)
  if (!url) return {}
  const q = new URL(url).searchParams
  const num = (k: string): number | undefined => {
    const v = q.get(k)
    if (v == null) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return { start: num('start') ?? num('t'), rate: num('rate'), zoom: num('zoom') }
}

/**
 * The embed URL for a Twitch channel or VOD. `parent` is mandatory — Twitch
 * refuses to frame for a host it was not told about — and must be the bare
 * hostname, no scheme, no port.
 */
export function twitch(value: string, parent: string): string {
  const { key, name } = channel(value)
  return (
    `https://player.twitch.tv/?${key}=${encodeURIComponent(name)}` +
    `&parent=${encodeURIComponent(parent)}&muted=true&autoplay=true&controls=false`
  )
}

const MODES: Mode[] = ['off', 'photo', 'video', 'playlist', 'clips']

/**
 * Fold an untrusted description of a backdrop onto the current one.
 *
 * This is the ONE gate, and it is deliberately total: anything it cannot make
 * sense of is dropped and the current value kept, so no caller can push a scene
 * into a shape the canvas has to defend against later. Everything a surface
 * takes in comes through here — a settings panel, a card a model can propose,
 * and the read back out of storage on the next load, which matters because bytes
 * in storage are not ours and a rule enforced only on the way in lasts exactly
 * until the page is refreshed.
 */
export function merge(current: Scene, change: unknown, hosts: readonly string[] = HOSTS): Scene {
  if (typeof change !== 'object' || change === null) return current
  const next = { ...current }
  const given = change as Record<string, unknown>

  if (MODES.includes(given.mode as Mode)) next.mode = given.mode as Mode
  if (typeof given.loop === 'boolean') next.loop = given.loop
  if (typeof given.sound === 'boolean') next.sound = given.sound

  const photo = media(given.photo, hosts)
  if (photo) next.photo = photo

  if (given.video !== undefined && videoId(String(given.video))) {
    next.video = String(given.video).trim()
  }
  if (Array.isArray(given.playlist)) {
    // The provider is recomputed from the URL every time rather than believed: a
    // caller claiming `provider: 'youtube'` for a netflix.com link must not be
    // able to talk the canvas into framing it.
    next.playlist = given.playlist
      .map((entry) =>
        link(typeof entry === 'string' ? entry : String((entry as Link | null)?.url ?? '')),
      )
      .filter((entry): entry is Link => entry !== null)
      .slice(0, MOST)
  }
  // Re-validated on the way in AND on the way out, the same as the playlist, so
  // a file the media policy would refuse cannot reach a `<video src>` by having
  // been written to storage under an older rule.
  if (given.clips !== undefined) next.clips = files(given.clips, hosts)

  return next
}

/**
 * What a brand's single configuration string names.
 *
 * A list of direct video files — comma- or space-separated, or any value naming
 * a media file the surface serves — opens on `clips`; anything else stays the
 * YouTube video it has always been, so an existing single-URL value does not
 * change meaning.
 *
 * Pure, and here rather than in a store, because "what does this value mean" is
 * a rule about data, decidable in a test with no browser.
 */
export function scene(
  value: string,
  hosts: readonly string[] = HOSTS,
): Pick<Scene, 'mode' | 'video' | 'clips'> {
  const list = files(value, hosts)
  if (list.length > 0) return { mode: 'clips', clips: list, video: '' }
  return { mode: 'video', clips: [], video: value }
}

/**
 * `/background` or `/bg`, and then a space or the end of the line — not merely a
 * word boundary, which `/background-image …` also satisfies. A command is one of
 * exactly two words; anything else is a message and is sent as one.
 */
const VERB = /^\/(?:background|bg)(?:\s|$)/i

/**
 * Read a `/background` (or `/bg`) line typed into a composer.
 *
 * Answers the scene it asks for, or null when the line is not one of these
 * commands or names something unusable — null meaning "not handled", so the
 * caller sends it on as an ordinary message and the viewer can see for
 * themselves that nothing was applied.
 *
 *   /bg off              stop painting anything
 *   /bg photo <url>      a still image
 *   /bg video <url>      one YouTube video
 *   /bg add <url>        append to the playlist and switch to it
 *   /bg loop on|off      repeat at the end
 *
 * There is no `/bg <url>` that guesses: guessing is a second way to say what
 * `photo` and `video` already say exactly, and the guess is wrong precisely when
 * the URL is unusual — which is when being wrong costs the most.
 */
export function command(
  input: string,
  current: Scene,
  hosts: readonly string[] = HOSTS,
): Scene | null {
  const line = input.trim()
  if (!VERB.test(line)) return null
  const [, verb = '', ...rest] = line.split(/\s+/)
  const argument = rest.join(' ').trim()

  switch (verb.toLowerCase()) {
    case 'off':
      return { ...current, mode: 'off' }
    case 'photo': {
      const url = media(argument, hosts)
      return url ? { ...current, mode: 'photo', photo: url } : null
    }
    case 'video':
      return videoId(argument) ? { ...current, mode: 'video', video: argument.trim() } : null
    case 'add': {
      // Through `merge` so the list has ONE keeper of its length, rather than a
      // second append here that forgets what the first one enforces.
      const entry = link(argument)
      return entry && playable(entry)
        ? merge(current, { mode: 'playlist', playlist: [...current.playlist, entry] }, hosts)
        : null
    }
    case 'loop': {
      const on = argument.toLowerCase()
      return on === 'on' || on === 'off' ? { ...current, loop: on === 'on' } : null
    }
    default:
      return null
  }
}
