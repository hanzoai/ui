/*! anon.js — THE anonymous-identity chain. ONE implementation, three distributions.
 *
 * One browser is ONE person on every Hanzo surface, whichever client a page
 * happens to have loaded. There were three implementations writing TWO keys —
 * `hz_anon_id` (the npm client, the hosted tag) and `hz_id` (hz.js) — so the same
 * visitor was several people depending on which snippet the surface shipped.
 *
 * The three call sites:
 *   1. src/storage.ts        — the bundled npm client; IMPORTS this file.
 *   2. hz.js                 — the no-build script tag; INLINES the marked region.
 *   3. hanzoai/cloud apps/analytics/tag.js — the tag the door hosts at
 *      /v1/event.js; vendors this file and its tag.go serves the marked region
 *      with the tag as one asset, so the door holds no second copy either.
 *
 * (2) and (3) have no bundler and cannot import anything, which is why the chain
 * lives in a file that is plain ES5 rather than in a .ts: the region between the
 * BEGIN and END markers is COPIED VERBATIM, and src/anon.test.ts fails if hz.js's
 * copy is so much as a byte different. Keep the region ES5, dependency-free,
 * `hz`-prefixed (it is spliced into other people's scopes) and unformatted — a
 * reformat of one copy is a diff against the other.
 */

/* ── BEGIN hz anon chain — copied VERBATIM into hz.js and hanzoai/cloud ────── */

/** The ONE anonymous-id key, on every surface and in every distribution. */
var HZ_ANON_KEY = 'hz_anon_id'

/** hz.js used to write `hz_id` — a SECOND identity space, so the one-paste tag
 *  and the npm client were two different people on one page. It is READ and never
 *  written: an id already in the wild is ADOPTED into the shared identity, because
 *  minting over one detaches a returning visitor from their own history. */
var HZ_ANON_LEGACY_KEY = 'hz_id'

/** The registrable domain the cookie is scoped to, so docs, cloud, console,
 *  studio, pay, id and www all read the ONE id. localStorage cannot do this: it is
 *  ORIGIN-scoped, which is what made one journey arrive as several strangers. */
var HZ_ANON_DOMAIN = 'hanzo.ai'

/** Two years, rewritten on every read, so the cookie rolls forward with the
 *  visitor instead of expiring two years after first touch. Safari caps a
 *  SCRIPT-written cookie at 7 days no matter what this says, so the rewrite is
 *  what keeps a returning Safari visitor: each read re-arms the 7-day window. */
var HZ_ANON_MAX_AGE = 2 * 365 * 24 * 60 * 60

/** Last resort for a browser that refuses cookies AND localStorage: without it
 *  every event in a page load would mint an id of its own. */
var hzAnonMemo

/**
 * hzUuidv7 mints a time-ordered UUIDv7 (RFC 9562 §5.7) for `now` in epoch ms.
 *
 * It has to be v7, and this is the only minter any distribution may use. The
 * session rollups on the event plane derive a session's start instant FROM THE ID
 * and admit only ids whose version nibble is 7, so a crypto.randomUUID() (v4) id
 * is not merely unordered there — it is DISCARDED, silently, and the rollup stays
 * empty. Without crypto only the ENTROPY degrades; the shape is always a valid v7.
 */
function hzUuidv7(now) {
  var b = new Uint8Array(16)
  var i
  var c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b)
  else for (i = 0; i < 16; i++) b[i] = (Math.random() * 256) | 0
  var t = Math.floor(now === undefined ? Date.now() : now)
  for (i = 5; i >= 0; i--) {
    b[i] = t % 256
    t = Math.floor(t / 256)
  }
  b[6] = 0x70 | (b[6] & 0x0f) // version 7
  b[8] = 0x80 | (b[8] & 0x3f) // variant 0b10
  var h = ''
  for (i = 0; i < 16; i++) {
    h += (b[i] + 0x100).toString(16).slice(1)
    if (i === 3 || i === 5 || i === 7 || i === 9) h += '-'
  }
  return h
}

/** The cookie jar, or null wherever there is no document to read one from. */
function hzAnonJar() {
  try {
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') return null
    return document
  } catch (e) {
    return null // sandboxed frame with an opaque origin
  }
}

/** localStorage, or null when the browser refuses it (Safari private mode). */
function hzAnonStore() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch (e) {
    return null
  }
}

/** One stored value, or '' — a jar can read as well as refuse to. */
function hzAnonItem(store, name) {
  try {
    return (store && store.getItem(name)) || ''
  } catch (e) {
    return ''
  }
}

/** The value of cookie `name`, or ''. */
function hzAnonCookie(name) {
  var d = hzAnonJar()
  if (!d) return ''
  var parts = d.cookie.split(';')
  for (var i = 0; i < parts.length; i++) {
    var eq = parts[i].indexOf('=')
    if (eq < 0 || parts[i].slice(0, eq).trim() !== name) continue
    var v = parts[i].slice(eq + 1).trim()
    if (!v) continue
    try {
      return decodeURIComponent(v)
    } catch (e) {
      return v // not percent-encoded — take it as written
    }
  }
  return ''
}

/** Writes `name` on the registrable domain, for as long as the browser allows. */
function hzAnonWrite(name, value) {
  var d = hzAnonJar()
  if (!d) return
  var host = ''
  var secure = false
  try {
    if (typeof window !== 'undefined' && window.location) {
      host = window.location.hostname || ''
      // A Secure cookie is refused outright by a non-secure origin, which would
      // strand http://localhost dev on the localStorage path.
      secure = window.location.protocol === 'https:'
    }
  } catch (e) {
    /* location unreachable — write a host-only, non-secure cookie */
  }
  // encodeURIComponent leaves a UUID byte-identical while making any value that is
  // not one unable to forge a `;` and inject an attribute.
  var c = name + '=' + encodeURIComponent(value)
  c += '; Path=/; Max-Age=' + HZ_ANON_MAX_AGE + '; SameSite=Lax'
  // Off hanzo.ai (localhost, previews, other registrable domains) the attribute
  // would be rejected and the whole cookie dropped, so it stays host-only there.
  // Prefixing both sides with '.' matches the domain itself and its subdomains
  // while refusing a suffix that merely ends in the same letters (evilhanzo.ai).
  if (('.' + host).slice(-(HZ_ANON_DOMAIN.length + 1)) === '.' + HZ_ANON_DOMAIN) {
    c += '; Domain=' + HZ_ANON_DOMAIN
  }
  if (secure) c += '; Secure'
  try {
    d.cookie = c
  } catch (e) {
    /* cookies refused — localStorage still carries the id */
  }
}

/**
 * hzAnonId returns the stable anonymous id for this browser, '' during SSR.
 *
 * Resolution is strictly ADDITIVE — every id that already exists is ADOPTED, and
 * only a browser holding none of them is given a new one:
 *
 *   cookie · localStorage hz_anon_id · localStorage hz_id · in-memory · mint
 *
 * Minting over an id resets a returning visitor and detaches them from their own
 * history, so the order is the migration: the cookie is the shared home, the two
 * localStorage keys are what the three implementations wrote before it existed,
 * and each is read until nothing is left to adopt.
 *
 * localStorage keeps being written, so a rollback finds everyone where it left
 * them, and a browser that refuses cookies still holds one id per origin.
 */
function hzAnonId() {
  if (typeof window === 'undefined') return '' // SSR / prerender: no browser to identify
  var s = hzAnonStore()
  var id =
    hzAnonCookie(HZ_ANON_KEY) ||
    hzAnonItem(s, HZ_ANON_KEY) ||
    hzAnonItem(s, HZ_ANON_LEGACY_KEY) ||
    hzAnonMemo ||
    hzUuidv7()
  hzAnonMemo = id
  hzAnonWrite(HZ_ANON_KEY, id)
  try {
    if (s && s.getItem(HZ_ANON_KEY) !== id) s.setItem(HZ_ANON_KEY, id)
  } catch (e) {
    /* quota exhausted, or a private-mode jar that reads but refuses writes */
  }
  return id
}

/* ── END hz anon chain ─────────────────────────────────────────────────────── */

export { hzAnonId, hzUuidv7 }
