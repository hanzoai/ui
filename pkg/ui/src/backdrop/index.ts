/**
 * @hanzo/ui/backdrop — ambient scenery behind a surface, on @hanzo/gui.
 *
 * `Backdrop` paints it and `scene.ts` decides what may be painted. The split is
 * the point: every rule about what can play, what a link means and what a typed
 * command does is decidable from data alone, so a surface answers a `/bg` line,
 * validates what came back out of storage and seeds a settings panel by CALLING
 * a function — nothing mounted, nothing measured — and the suite holds all of it
 * to account without rendering anything.
 *
 * Props-in, no store: a surface holds the `Scene` in whatever state it already
 * has and passes it. `merge` is the ONE gate a change goes through, and
 * `Backdrop` re-applies the media rule at the render boundary, so a scene that
 * arrives from storage, from a model's suggestion or from hand-written props is
 * held to the same rule in every direction.
 *
 * WEB ONLY, and off the main barrel for that reason — an embed is an `<iframe>`,
 * a clip is a `<video>`, and the cover crop is written in `vh`/`vw`. `Grid` sits
 * at its own subpath on the same rule.
 *
 * The rules live in `scene.ts` rather than a `backdrop.ts` beside `Backdrop.tsx`
 * because the two would emit `backdrop.js` and `Backdrop.js` into one directory,
 * which is ONE file on macOS. `dist.test.ts` holds that line for the whole
 * package now; the convention it enforces is the one already here — lowercase
 * for a module of rules, capitalised for a component.
 */
export { Backdrop, type BackdropProps } from './Backdrop'

export {
  BLANK,
  DWELL,
  HOSTS,
  PRESETS,
  channel,
  command,
  files,
  knobs,
  link,
  media,
  merge,
  playable,
  provider,
  scene,
  twitch,
  videoId,
  web,
  youtube,
  type Link,
  type Mode,
  type Preset,
  type Provider,
  type Scene,
} from './scene'
