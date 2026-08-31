'use client'

/**
 * Backdrop — a still image, one muted video, a list of them, or our own clips,
 * painted behind whatever a surface renders on top of it.
 *
 * The layer takes no pointer and is `aria-hidden`, so nothing about the controls
 * above it, the focus order or the screen-reader surface changes: it is scenery,
 * not UI. That is also why nothing here is clickable — a backdrop that could
 * take a click would be a trap sitting under the conversation.
 *
 * NOTHING IS REVEALED UNTIL IT IS ACTUALLY THERE. A video appears only once the
 * player reports footage rolling, an image only once it has decoded. A video the
 * provider refuses — taken down, region-blocked, embed throttled — and an image
 * URL that 404s both simply stay invisible, instead of showing the provider's
 * error card through the canvas.
 *
 * Provider chrome (title, watermark, suggestions) is kept out of frame two ways:
 * players are built with every control off, and the frame is centre-cropped well
 * past the viewport (16:9 cover, then overscan), so the strips providers reserve
 * at the top and bottom land offscreen. The scrim keeps text legible over bright
 * footage.
 *
 * WEB ONLY, and it ships at its own subpath for that reason. A YouTube embed is
 * an `<iframe>` and a clip is a `<video>`; neither exists off the web, and the
 * cover crop is written in `vh`/`vw`. `Grid` is off the barrel on the same rule.
 *
 * Configuration arrives as PROPS. There is no store here and no context: a
 * surface holds the scene (in whatever it already uses) and passes it, which is
 * what lets the same component serve a settings panel, a `/bg` command and a
 * persona's emotion with one implementation and no adapter between them.
 */
import { YStack } from '@hanzo/gui'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type SyntheticEvent,
} from 'react'

import { slot } from '../backends/gui/slot'
import {
  DWELL,
  HOSTS,
  files,
  knobs,
  media,
  playable,
  twitch,
  videoId,
  youtube,
  type Link,
  type Scene,
} from './scene'

const ORIGIN = 'https://www.youtube.com'

/**
 * Send the origin, never the path.
 *
 * The address of a conversation is `/c/<id>`, and a `Referer` carrying it would
 * hand that id to YouTube, to Twitch, and to whatever host serves a photo
 * somebody pasted — on every load, to a party with no reason to know which
 * thread is open. Origin alone is all these embeds need: Twitch checks the
 * `parent` parameter and YouTube the `origin` one, both passed deliberately.
 * Chrome's default already stops at the origin; Safari and older engines do not,
 * which is why this is stated rather than assumed.
 */
const REFERRER = 'strict-origin-when-cross-origin'

/** How long the adaptive ramp is given before anything is revealed: quality
 *  cannot be forced (embeds have ignored every quality API since 2019), so the
 *  low-res opening plays out hidden. */
const RAMP = 4000

/** The cover-crop: deliberately larger than the container, and told so twice
 *  because a page's own `img, iframe, video { max-width: 100% }` reset would
 *  otherwise clamp the formula and letterbox the footage on a narrow screen. */
const COVER: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 'max(177.78vh, 100vw)',
  height: 'max(56.25vw, 100vh)',
  maxWidth: 'none',
  maxHeight: 'none',
  border: 0,
}

/** The cover-crop at a brand's zoom, or the house 1.4. A larger scale pushes a
 *  corner watermark off-frame. */
const cover = (zoom?: number): CSSProperties => ({
  ...COVER,
  transform: `translate(-50%, -50%) scale(${zoom && zoom > 0 ? zoom : 1.4})`,
})

const fade = (shown: boolean): CSSProperties => ({
  opacity: shown ? 1 : 0,
  transition: 'opacity 1.2s ease',
})

/**
 * Ask a YouTube player to start, through its API. Muted playback started by
 * script is always allowed, and the API path sidesteps the viewability heuristic
 * that can leave the autoplay param unhonoured for a player sitting under the
 * content layer. Repeated because the player ignores commands sent before its
 * own scripts finish booting.
 */
function start(event: SyntheticEvent<HTMLIFrameElement>, rate?: number) {
  const frame = event.currentTarget
  const post = (message: object) =>
    frame.contentWindow?.postMessage(JSON.stringify(message), ORIGIN)
  const kick = () => {
    // The listening handshake makes the player report state back — the reveal
    // below waits for a real "playing" signal.
    post({ event: 'listening', id: 'backdrop', channel: 'widget' })
    // Quality cannot be forced (see the note above); this only skips the low
    // first rung. Ask for the top one so a 4K display is offered the 2160p
    // rendition when the source and the bandwidth allow — the size-based auto
    // picker caps at the viewport otherwise.
    post({ event: 'command', func: 'setPlaybackQuality', args: ['hd2160'] })
    // A brand's chosen speed. YouTube quantises to its allowed steps, so an
    // off-grid value plays at the nearest; sent with the other kicks because a
    // command before the player boots is dropped.
    if (rate && rate > 0) post({ event: 'command', func: 'setPlaybackRate', args: [rate] })
    post({ event: 'command', func: 'playVideo', args: [] })
  }
  kick()
  setTimeout(kick, 1500)
  setTimeout(kick, RAMP)
}

/**
 * The BROWSER's transport controls, disowned.
 *
 * A page that plays media gets a system play/pause/skip overlay — Safari draws
 * it over the middle of the conversation — and `controls=0` never reaches it,
 * because that overlay belongs to the user agent, not to the player.
 * `mediaSession` is where a page says whose media this is: cleared metadata, no
 * playback state, no handlers, nothing to present.
 *
 * This is scenery. It is muted, it loops, and the only controls that mean
 * anything for it belong to the surface. System skip buttons put furniture over
 * the page and wire it to nothing.
 */
function disown() {
  try {
    const ms = navigator.mediaSession
    if (!ms) return
    ms.metadata = null
    ms.playbackState = 'none'
    const actions = [
      'play',
      'pause',
      'previoustrack',
      'nexttrack',
      'seekbackward',
      'seekforward',
      'stop',
    ] as const
    for (const action of actions) {
      try {
        ms.setActionHandler(action, null)
      } catch {
        /* an action this agent does not know */
      }
    }
  } catch {
    /* no mediaSession here */
  }
}

/** A YouTube player. Revealed on a real `playing` report; calls `onEnd` when the
 *  player says the video finished, which is how a mixed list advances. */
function Video({
  src,
  onEnd,
  rate,
  zoom,
  sound = false,
}: {
  src: string
  onEnd?: () => void
  rate?: number
  zoom?: number
  sound?: boolean
}) {
  const [playing, setPlaying] = useState(false)
  const [ramped, setRamped] = useState(false)
  const frame = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const hear = (event: MessageEvent) => {
      if (event.origin !== ORIGIN) return
      try {
        const state = JSON.parse(event.data)?.info?.playerState
        if (state === 1) {
          setPlaying(true)
          disown()
        } else if (state === 0) {
          onEnd?.()
        }
      } catch {
        /* not the player */
      }
    }
    window.addEventListener('message', hear)
    const ramp = setTimeout(() => setRamped(true), RAMP)
    return () => {
      window.removeEventListener('message', hear)
      clearTimeout(ramp)
    }
  }, [onEnd])

  /**
   * Sound is turned on AFTER the player is playing, never in the URL.
   *
   * `mute=1` is what lets the embed start at all — autoplay with sound is
   * refused by every current browser — so unmuting is a command, and it is only
   * worth sending once the player has said it is running: commands sent before
   * its scripts boot are dropped, which is the same reason `start` kicks three
   * times. Gating on `playing` rides that report instead of racing it.
   *
   * It follows the setting both ways while the video is on screen, so turning
   * the sound back off silences it now rather than at the next reload — the one
   * direction a person is likely to be in a hurry about.
   */
  useEffect(() => {
    if (!playing) return
    const post = (message: object) =>
      frame.current?.contentWindow?.postMessage(JSON.stringify(message), ORIGIN)
    post({ event: 'command', func: sound ? 'unMute' : 'mute', args: [] })
    // Wallpaper, not a concert. Loud enough to hear under a conversation.
    if (sound) post({ event: 'command', func: 'setVolume', args: [35] })
  }, [playing, sound])

  return (
    <iframe
      ref={frame}
      src={src}
      title=""
      tabIndex={-1}
      allow="autoplay; encrypted-media"
      referrerPolicy={REFERRER}
      onLoad={(e) => start(e, rate)}
      style={{ ...cover(zoom), ...fade(playing && ramped) }}
    />
  )
}

/**
 * A Twitch player.
 *
 * Twitch publishes no state channel for a bare iframe the way YouTube does —
 * reading playback state means loading their embed script, a third party we
 * would have to let run — so this reveals on load rather than on a playing
 * report. The honest consequence: an offline channel shows Twitch's own idle
 * screen rather than staying hidden. A live stream also never ends, so its turn
 * in a list is ended by the clock instead of by the player.
 */
function Stream({ src, onEnd }: { src: string; onEnd?: () => void }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!onEnd) return
    const turn = setTimeout(onEnd, DWELL)
    return () => clearTimeout(turn)
  }, [onEnd])

  return (
    <iframe
      src={src}
      title=""
      tabIndex={-1}
      allow="autoplay; encrypted-media"
      referrerPolicy={REFERRER}
      onLoad={() => setLoaded(true)}
      style={{ ...cover(), ...fade(loaded) }}
    />
  )
}

/** A still image, revealed once it has decoded — a URL that 404s never fires
 *  `load`, so it stays invisible for the same reason a refused video does. */
function Photo({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={url}
      alt=""
      referrerPolicy={REFERRER}
      onLoad={() => setLoaded(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        maxHeight: 'none',
        objectFit: 'cover',
        ...fade(loaded),
      }}
    />
  )
}

/**
 * One entry of a list, dispatched to the player its provider needs.
 *
 * Twitch is told the bare hostname it is being framed by — it refuses to load
 * for a `parent` it was not given — while YouTube's API handshake is keyed to
 * the full origin. Two different values, from the same page, for two different
 * reasons.
 */
function Entry({ entry, onEnd, at }: { entry: Link; onEnd: () => void; at: Where }) {
  if (entry.provider === 'twitch') {
    return <Stream src={twitch(entry.url, at.host)} onEnd={onEnd} />
  }
  if (entry.provider === 'youtube') {
    // No loop on a single entry: the list, not the video, decides what repeats.
    return <Video src={youtube([videoId(entry.url)], false, at.origin)} onEnd={onEnd} />
  }
  // Named, not defaulted. Callers filter by `playable` before they get here, so
  // this branch should be unreachable — but a dispatch whose LAST case is a
  // fall-through hands every future provider to whichever player happens to be
  // written last, and here that would ask YouTube to embed a netflix.com link. A
  // player has to be chosen on purpose; nothing else gets one.
  return null
}

/** The list, one entry at a time: a video hands over when it ends, a stream when
 *  its dwell is up. Runs only when the list is NOT all YouTube — that case is
 *  handed to YouTube's own playlist player instead. */
function Rotation({ links, loop, at }: { links: Link[]; loop: boolean; at: Where }) {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)

  // A changed list is a new rotation, not a continuation of the old one.
  useEffect(() => {
    setIndex(0)
    setDone(false)
  }, [links])

  const advance = useCallback(() => {
    setIndex((current) => {
      const next = current + 1
      if (next < links.length) return next
      if (loop) return 0
      setDone(true)
      return current
    })
  }, [links.length, loop])

  const entry = links[index]
  if (done || !entry) return null
  // Keyed by URL so a handover resets the next player's reveal state rather than
  // inheriting the last one's.
  return <Entry key={entry.url} entry={entry} onEnd={advance} at={at} />
}

/**
 * Direct video clips, ours to serve, played as a preloaded crossfade.
 *
 * Two stacked `<video>`s take turns: the shown one plays while the hidden one
 * loads the next clip, and they swap only once the next has reported it is
 * actually playing — so the canvas crosses one live frame over another and never
 * flashes black between them. That is the same "nothing is revealed until it is
 * real" rule the YouTube scene keeps, met with the element's own `playing` event
 * instead of a postMessage handshake. A clip a host refuses (404, decode error)
 * fires `error`, not `playing`, so it never appears and hands the turn on.
 *
 * A single clip loops itself; a list lets each clip END and advances on it — an
 * unhurried idle cycle. `preload="auto"` is what makes the handoff seamless: the
 * next file is already buffered when its turn comes.
 *
 * The FIRST clip goes into the hidden slot and is revealed by the same flip
 * every later clip uses, so there is one reveal path and no black first frame.
 */
function Clips({ urls, loop, zoom }: { urls: string[]; loop: boolean; zoom?: number }) {
  const [showA, setShowA] = useState(true)
  const [srcA, setSrcA] = useState<string | undefined>(undefined)
  const [srcB, setSrcB] = useState<string | undefined>(undefined)
  const [lit, setLit] = useState(false)
  const shown = useRef(true)
  shown.current = showA
  const at = useRef(0)

  // Load `url` into whichever slot is hidden right now; its `playing` event then
  // flips which slot is shown, crossing the new frame in over the old. A ref for
  // `showA` because this is called from timers and event handlers that must read
  // the current slot, not the one captured when they were created.
  const cue = useCallback((url: string) => {
    if (shown.current) setSrcB(url)
    else setSrcA(url)
  }, [])

  const advance = useCallback(() => {
    if (urls.length < 2) return
    at.current = (at.current + 1) % urls.length
    cue(urls[at.current])
  }, [urls, cue])

  // Head of the list on mount and whenever the list changes (a brand's own
  // footage arriving, or a persona changing mood). The first clip is cued into
  // the hidden slot so the reveal below is the only path that ever shows one.
  useEffect(() => {
    at.current = 0
    setShowA(true)
    setSrcA(undefined)
    setSrcB(undefined)
    setLit(false)
    if (urls.length) cue(urls[0])
  }, [urls, cue])

  if (!urls.length) return null

  // Only the HIDDEN slot reaching `playing` is a handover — so the flip is
  // "show whoever just started", never a toggle. The SHOWN slot fires `playing`
  // again after any stall or seek, and toggling on that would swap a live frame
  // for a stale one for no reason.
  const reveal = (isA: boolean) => {
    if (lit && isA === shown.current) return
    setLit(true)
    setShowA(isA)
  }

  const slotStyle = (isA: boolean): CSSProperties => ({
    ...cover(zoom),
    objectFit: 'cover',
    opacity: lit && isA === showA ? 1 : 0,
    transition: 'opacity 1.2s ease',
  })

  const one = (isA: boolean, src: string | undefined) => (
    <video
      key={isA ? 'a' : 'b'}
      src={src}
      autoPlay
      muted
      playsInline
      // A lone clip repeats itself; a member of a list must be allowed to END so
      // the next can cross in — looping one would freeze the cycle on it.
      loop={urls.length < 2 && loop}
      preload="auto"
      onPlaying={() => reveal(isA)}
      onEnded={urls.length > 1 ? advance : undefined}
      onError={advance}
      tabIndex={-1}
      aria-hidden
      style={slotStyle(isA)}
    />
  )

  return (
    <>
      {one(true, srcA)}
      {one(false, srcB)}
    </>
  )
}

/** Where this page is, as the two embeds each need it spelled. Read after mount,
 *  never during render: a server has no `location`, and a src built from a
 *  guessed origin is a hydration mismatch on top of a player that would refuse
 *  the handshake anyway. */
interface Where {
  origin: string
  host: string
}

/** What the scene asks to be painted, or null when that is nothing. */
function Canvas({ scene, at, zoom }: { scene: Scene; at: Where; zoom?: number }) {
  const links = useMemo(() => scene.playlist.filter(playable), [scene.playlist])

  if (scene.mode === 'clips') {
    return scene.clips.length ? (
      <Clips urls={scene.clips} loop={scene.loop} zoom={knobs(scene.clips[0]).zoom ?? zoom} />
    ) : null
  }

  if (scene.mode === 'photo') return scene.photo ? <Photo url={scene.photo} /> : null

  if (scene.mode === 'video') {
    const id = videoId(scene.video)
    // start / rate / zoom ride the same URL, so a brand tunes all of them from
    // one configuration value with no rebuild.
    const k = knobs(scene.video)
    return id ? (
      <Video
        src={youtube([id], scene.loop, at.origin, k.start)}
        rate={k.rate}
        zoom={k.zoom ?? zoom}
        sound={scene.sound}
      />
    ) : null
  }

  if (links.length === 0) return null

  // An all-YouTube list is handed to YouTube's own playlist player: it holds the
  // queue in one frame, so there is no handover gap between videos and no second
  // player to reveal.
  if (links.every((entry) => entry.provider === 'youtube')) {
    return (
      <Video
        src={youtube(links.map((entry) => videoId(entry.url)), scene.loop, at.origin)}
        sound={scene.sound}
      />
    )
  }

  return <Rotation links={links} loop={scene.loop} at={at} />
}

export interface BackdropProps
  extends Partial<Scene>,
    Omit<ComponentProps<typeof YStack>, 'children' | keyof Scene> {
  /**
   * The veil over the footage, 0–1. It is `$background` at this opacity rather
   * than a black wash, so a light theme veils with its own ground instead of
   * dimming to something no brand chose.
   */
  scrim?: number
  /**
   * The cover-crop scale. The house 1.4 is OVERSCAN, and it is there to push a
   * provider's furniture — the title strip, the corner watermark, the suggestion
   * overlay — off the frame. Our own clips carry none of that, so a surface
   * showing footage it serves itself can say `zoom={1}` and keep the whole
   * frame. A `?zoom=` on the media URL is more specific and wins over this.
   */
  zoom?: number
  /** Media hosts allowed besides this origin. Defaults to the Hanzo store. */
  hosts?: readonly string[]
}

export function Backdrop({
  mode = 'off',
  photo = '',
  video = '',
  playlist = [],
  clips = [],
  loop = true,
  sound = false,
  scrim = 0.5,
  zoom,
  hosts = HOSTS,
  ...props
}: BackdropProps) {
  const [at, setAt] = useState<Where | null>(null)
  useEffect(() => {
    setAt({ origin: window.location.origin, host: window.location.hostname })
  }, [])

  // The gate again, at the render boundary. `merge` guards what a surface STORES;
  // this guards what actually reaches a `src`, so a caller that builds props by
  // hand cannot point an element at a host the media policy would refuse.
  const scene = useMemo<Scene>(
    () => ({
      mode,
      photo: media(photo, hosts),
      video,
      playlist,
      clips: files(clips, hosts),
      loop,
      sound,
    }),
    [mode, photo, video, playlist, clips, loop, sound, hosts],
  )

  // Off means ABSENT, not hidden: these are third-party frames that autoplay
  // video, so leaving one mounted at opacity 0 would keep it streaming behind a
  // setting that says it is off.
  if (mode === 'off' || !at) return null

  return (
    <YStack
      {...slot('backdrop')}
      data-mode={mode}
      fullscreen
      overflow="hidden"
      pointerEvents="none"
      aria-hidden
      {...props}
    >
      <Canvas scene={scene} at={at} zoom={zoom} />
      <YStack fullscreen bg="$background" opacity={scrim} />
    </YStack>
  )
}
