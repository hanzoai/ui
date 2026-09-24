/**
 * bridge — the message protocol between a builder and the page it previews.
 *
 * Ported from build-v2 `components/editor/preview/bridge.ts` (MIT, derived from
 * OSW Studio and DeepSite — see NOTICE). v2 wrote the preview document itself
 * (`srcdoc`) and injected this script into it. A repository's deployed site is
 * a page on ITS OWN origin that this package does not write, so nothing is
 * injected: the bridge is OPT-IN. A page that wants element picking and
 * console forwarding includes the script `script(parent)` returns — pinned to
 * the builder's origin — and the frame speaks to it only across that pair of
 * origins.
 *
 * The protocol, both directions, every message a plain object with `type`:
 *
 *   page → builder   preview:ready                    the bridge is listening
 *                    preview:hover   {selector, rect, tag} | {selector: null}
 *                    preview:select  {info}           an element was picked
 *                    preview:navigate {path}          an in-site link was followed
 *                    preview:console {level, text}    the page's console, as text
 *   builder → page   preview:editable {active}        picking on/off
 *                    preview:highlight {selector}     outline one element
 *
 * What v2 also sent — live style and text edits — is not here. A change made
 * inside the frame is gone on the next load; the builder's edits are runs that
 * commit, and a control that edits something it cannot keep is a lie.
 *
 * Both sides check ORIGIN, never `'*'`: the page posts only to the builder's
 * origin and reads only messages whose source is its parent and whose origin
 * is that origin; the builder reads only messages whose source is the frame's
 * window and whose origin is the frame's. `accept` is that check, in one place.
 */
import { level, type Level } from './log'

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/** What a picked element says about itself. Every field is text. */
export interface Picked {
  selector: string
  tag: string
  id?: string
  text?: string
  /** The element's outer HTML, capped. Shown as text, never rendered. */
  html: string
}

export type FrameEvent =
  | { type: 'preview:ready' }
  | { type: 'preview:hover'; selector: string | null; rect?: Rect; tag?: string }
  | { type: 'preview:select'; info: Picked }
  | { type: 'preview:navigate'; path: string }
  | { type: 'preview:console'; level: Level; text: string }

export type FrameCommand =
  | { type: 'preview:editable'; active: boolean }
  | { type: 'preview:highlight'; selector: string | null }

const TYPES = new Set(['preview:ready', 'preview:hover', 'preview:select', 'preview:navigate', 'preview:console'])

const str = (v: unknown): v is string => typeof v === 'string'
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** A control character or a line break: nothing a selector, a tag or a path carries. */
const CONTROL = /[\u0000-\u001f\u007f\u2028\u2029]/

/**
 * A selector the host may show and put in a prompt: short, one line. A page
 * that could send a long one could write the person's next ask for them.
 */
const selector = (v: unknown): v is string => str(v) && v.length > 0 && v.length <= 256 && !CONTROL.test(v)

/** An element's tag name, as the DOM spells one. */
const tag = (v: unknown): v is string => str(v) && /^[a-z][a-z0-9-]{0,31}$/i.test(v)

/** A path on the framed page's own origin: one leading slash, never two, never a backslash. */
const path = (v: unknown): v is string => str(v) && v.length <= 512 && /^\/(?![\/\\])/.test(v) && !CONTROL.test(v) && !v.includes('\\')

/**
 * The address a frame may load: an absolute http(s) URL, resolved against
 * `base`. Anything else — `javascript:`, `data:`, `blob:`, a malformed string —
 * is `null`, so a frame never runs an address a string could smuggle in.
 */
export function web(url: string | null | undefined, base?: string): URL | null {
  if (!url) return null
  try {
    const u = base ? new URL(url, base) : new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null
  } catch {
    return null
  }
}

/**
 * A message from the frame, or `null`. It must come FROM the frame's window,
 * FROM the frame's origin, and be one of the five shapes above with every
 * field the type it claims. A message that fails any of that is dropped
 * without a word — anything can post to a window.
 */
export function accept(
  event: { source: unknown; origin: string; data: unknown },
  frame: { contentWindow: unknown } | null,
  origin: string,
): FrameEvent | null {
  if (!frame || event.source !== frame.contentWindow || event.origin !== origin) return null
  const m = event.data as Record<string, unknown> | null
  if (!m || typeof m !== 'object' || !str(m.type) || !TYPES.has(m.type)) return null
  switch (m.type) {
    case 'preview:ready':
      return { type: 'preview:ready' }
    case 'preview:hover': {
      if (m.selector === null) return { type: 'preview:hover', selector: null }
      const r = m.rect as Record<string, unknown> | undefined
      if (!selector(m.selector) || !r || !num(r.top) || !num(r.left) || !num(r.width) || !num(r.height)) return null
      return {
        type: 'preview:hover',
        selector: m.selector,
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        tag: tag(m.tag) ? m.tag : undefined,
      }
    }
    case 'preview:select': {
      const i = m.info as Record<string, unknown> | undefined
      if (!i || !selector(i.selector) || !tag(i.tag) || !str(i.html)) return null
      return {
        type: 'preview:select',
        info: {
          selector: i.selector,
          tag: i.tag,
          id: str(i.id) && i.id.length <= 128 && !CONTROL.test(i.id) ? i.id : undefined,
          text: str(i.text) ? i.text.slice(0, 200) : undefined,
          html: i.html.slice(0, 8000),
        },
      }
    }
    case 'preview:navigate':
      return path(m.path) ? { type: 'preview:navigate', path: m.path } : null
    case 'preview:console': {
      return str(m.text) ? { type: 'preview:console', level: level(m.level), text: m.text.slice(0, 4000) } : null
    }
  }
  return null
}

/**
 * The script a previewed page includes to take part, pinned to the builder at
 * `parent` (an origin: `https://platform.hanzo.ai`). It posts only there, and
 * obeys only its parent window speaking from there.
 *
 * Serve it from the page itself (a `<script>` the site ships), never from the
 * builder: the page decides whether it can be picked apart, not the frame
 * around it.
 */
export function script(parent: string): string {
  const origin = new URL(parent).origin
  return `(function () {
  if (window.__hanzoBridge || window.parent === window) return;
  window.__hanzoBridge = true;
  var PARENT = ${JSON.stringify(origin)};
  var editable = false, hovered = null, marked = null;
  function send(m) { try { window.parent.postMessage(m, PARENT); } catch (e) {} }
  function sel(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
    var parts = [], node = el;
    while (node && node !== document.body && node.nodeType === 1) {
      var p = node.parentNode; if (!p) break;
      var same = [], i;
      for (i = 0; i < p.children.length; i++) if (p.children[i].tagName === node.tagName) same.push(p.children[i]);
      var tag = node.tagName.toLowerCase();
      parts.unshift(same.length > 1 ? tag + ':nth-of-type(' + (same.indexOf(node) + 1) + ')' : tag);
      node = p;
    }
    return 'body' + (parts.length ? ' > ' + parts.join(' > ') : '');
  }
  function find(s) { if (!s) return null; try { return document.querySelector(s); } catch (e) { return null; } }
  function outline(el, on) { if (el) el.style.outline = on ? '2px solid rgba(120,160,255,.9)' : ''; }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    var original = console[level]; if (typeof original !== 'function') return;
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments), out = [];
      for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (typeof a === 'string') out.push(a);
        else if (a instanceof Error) out.push(a.stack || a.name + ': ' + a.message);
        else { try { out.push(JSON.stringify(a)); } catch (e) { out.push(String(a)); } }
      }
      send({ type: 'preview:console', level: level, text: out.join(' ') });
      original.apply(console, args);
    };
  });
  window.addEventListener('error', function (e) { send({ type: 'preview:console', level: 'error', text: String(e.message || 'Script error') }); });
  document.addEventListener('mouseover', function (e) {
    if (!editable) return;
    var t = e.target; if (!t || t === document.body || t === hovered) return;
    outline(hovered, false); hovered = t; outline(t, true);
    var r = t.getBoundingClientRect();
    send({ type: 'preview:hover', selector: sel(t), tag: t.tagName.toLowerCase(), rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
  }, true);
  document.addEventListener('mouseout', function () {
    if (!editable) return; outline(hovered, false); hovered = null; send({ type: 'preview:hover', selector: null });
  }, true);
  document.addEventListener('click', function (e) {
    if (editable) {
      var t = e.target; if (!t || t === document.body) return;
      e.preventDefault(); e.stopPropagation();
      send({ type: 'preview:select', info: { selector: sel(t), tag: t.tagName.toLowerCase(), id: t.id || undefined, text: (t.textContent || '').slice(0, 200), html: (t.outerHTML || '').slice(0, 8000) } });
      return;
    }
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.indexOf('//') === 0) return;
    send({ type: 'preview:navigate', path: href });
  }, true);
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent || e.origin !== PARENT) return;
    var m = e.data; if (!m || typeof m !== 'object') return;
    if (m.type === 'preview:editable') { editable = !!m.active; if (!editable) { outline(hovered, false); hovered = null; } }
    else if (m.type === 'preview:highlight') { outline(marked, false); marked = find(m.selector); outline(marked, true); }
  });
  send({ type: 'preview:ready' });
})();`
}
