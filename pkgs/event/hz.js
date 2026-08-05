/*! hz.js — the no-build distribution of @hanzo/event.
 *
 * A <script> tag for surfaces that have no bundler: a CMS page, a landing page,
 * a docs site. It speaks the SAME wire as the npm client and posts to the SAME
 * front door — one batch of WireEvents to POST {host}/v1/event:
 *
 *     { batch: [ { messageId, type, event, timestamp, distinctId, anonymousId,
 *                  sessionId, product, url, path, referrer, properties }, … ] }
 *
 *   <script async src="https://unpkg.com/@hanzo/event/hz.js"
 *           data-product="hanzo.ai"          // required: which surface this is
 *           data-ingest-key="pk-…"           // required off api.hanzo.ai's own origin
 *           data-host="https://api.hanzo.ai" // optional: API host override
 *           data-ga="G-XXXX" data-fb="123"   // optional: also fan out to GA4 / Meta
 *           data-capture="1"></script>       // optional: autocapture off with "0"
 *
 * It adds what a bundled app does not need and a plain page cannot get: DOM
 * AUTOCAPTURE. Clicks on interactive elements (with a compact element locator),
 * outbound links, scroll depth, form submits and core web vitals arrive as
 * `$click` / `$outbound` / `$scroll` / `$form` / `$vitals` events on the one
 * stream. Manual: window.hanzo.track(name, props) · identify(id, traits) · page().
 * Respects DNT. No PII beyond the short element text the locator carries.
 *
 * It used to live in hanzoai/analytics and post a BARE JSON ARRAY of
 * {site, ts, type, path, …} to analytics.hanzo.ai/v1/event — a second protocol
 * behind an identical path spelling, served by a second collector with its own
 * database. Both are deleted. There is one wire, one door and one client home,
 * and this file is that client's script-tag form.
 */
;(function () {
  var s = document.currentScript
  if (!s) return

  // ── consent ───────────────────────────────────────────────────────────────
  // The same three sources the bundled stack honours, restated here for the same
  // reason the uid minter and the scrubber are: a script tag has no bundler and
  // cannot import them. An EXPLICIT stored choice — `hz_consent`, the key a Hanzo
  // consent banner writes — outranks the browser signal in BOTH directions,
  // because that is what "explicit" means. Otherwise Global Privacy Control (the
  // signal CPRA actually obliges a site to obey) and Do Not Track are refusals.
  var choice = null
  try {
    choice = localStorage.getItem('hz_consent')
  } catch (e) {}
  if (choice !== 'granted') {
    if (choice === 'denied' || window.hzDNT) return
    if (navigator.globalPrivacyControl === true) return
    if (
      navigator.doNotTrack === '1' ||
      navigator.doNotTrack === 'yes' ||
      window.doNotTrack === '1' ||
      navigator.msDoNotTrack === '1'
    )
      return
  }

  var LIB = 'hz.js'
  var VERSION = '0.3.12'
  var host = (s.getAttribute('data-host') || 'https://api.hanzo.ai').replace(/\/+$/, '')
  var product = s.getAttribute('data-product') || location.hostname
  var capture = s.getAttribute('data-capture') !== '0'
  // The publishable ingest key (pk-…). Write-only and safe in page source: it
  // attributes a write and mints no reading principal.
  //
  // Without it a tag on any origin but the door's own sends an UNATTRIBUTED
  // write, and the door refuses one (401 ingest_key_required) — silently, since
  // nothing here reads the response. Through 0.3.11 this file had no way to
  // present a key at all, so every keyed static surface looked wired, measured
  // fine in the browser, and filed nothing.
  var key = s.getAttribute('data-ingest-key') || ''

  // uuidv7 (RFC 9562 §5.7) — the same minter as src/uid.ts, restated here for the
  // same reason `clean` restates scrub.ts: this file has no bundler and cannot
  // import it. It has to be v7. The session rollups on the plane derive a session's
  // start instant from the 48-bit millisecond timestamp the id carries and admit
  // only ids whose version nibble is 7, so a crypto.randomUUID() (v4) session id —
  // and equally the old base36 fallback, which does not even parse as a UUID — is
  // dropped there silently and the session never appears.
  function uid(now) {
    var b = new Uint8Array(16),
      i
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b)
    else for (i = 0; i < 16; i++) b[i] = (Math.random() * 256) | 0
    var t = Math.floor(now || Date.now())
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
  function stored(store, key) {
    try {
      var v = store.getItem(key)
      if (!v) store.setItem(key, (v = uid()))
      return v
    } catch (e) {
      return 'anon'
    }
  }
  var anon = stored(localStorage, 'hz_id')
  var sid = stored(sessionStorage, 'hz_sid')
  var person = null
  try {
    person = localStorage.getItem('hz_uid')
  } catch (e) {}

  var queue = [],
    timer
  function flush() {
    clearTimeout(timer)
    if (!queue.length) return
    var body = JSON.stringify({ batch: queue.splice(0, queue.length) })
    var url = host + '/v1/event'
    // The key rides the two channels each transport can actually carry — the
    // same pair core.ts uses, so the door cannot tell the distributions apart:
    // a headerless sendBeacon puts it in the query, a fetch puts it in the
    // Authorization header.
    try {
      if (
        navigator.sendBeacon &&
        navigator.sendBeacon(
          key ? url + '?ingest_key=' + encodeURIComponent(key) : url,
          new Blob([body], { type: 'application/json' }),
        )
      )
        return
    } catch (e) {}
    var headers = { 'content-type': 'application/json' }
    if (key) headers.authorization = 'Bearer ' + key
    fetch(url, {
      method: 'POST',
      body: body,
      keepalive: true,
      headers: headers,
    }).catch(function () {})
  }
  // ── location redaction ────────────────────────────────────────────────────
  // The same policy src/scrub.ts applies in the npm client, restated here because
  // this file has no bundler and therefore cannot import it: a reset, invite or
  // magic link carries a JWT in the query and an address in `?email=`, and the
  // location is stamped on EVERY event — so without this, one page load ships the
  // credential to the warehouse and every later click repeats it.
  //
  // Deliberately a SUBSET: the shapes that actually appear in a URL. Free-text
  // error scrubbing (PANs, private keys, stack text) has no counterpart here
  // because this distribution has no error plane. Keep the markers identical to
  // scrub.ts — a warehouse row must not reveal which distribution wrote it.
  var SECRETS = [
    /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g, // JWT
    /\bbearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi,
    /\b(?:sk|pk|rk)-[A-Za-z0-9]{2,}-?[A-Za-z0-9]{12,}/g,
    /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,}/g,
    /\bhk-[A-Za-z0-9]{16,}/g,
    /\bgh[posru]_[A-Za-z0-9]{20,}/g,
    /\bAIza[0-9A-Za-z_-]{20,}/g,
    /\bAKIA[0-9A-Z]{16}\b/g,
    // Bounded like scrub.ts's: the unbounded form backtracks quadratically on
    // colon-rich text that never reaches an '@'.
    /[a-zA-Z][a-zA-Z0-9+.-]{0,32}:\/\/[^\s:@/]{1,256}:[^\s@/]{1,256}@/g,
  ]
  var EMAIL = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}/g
  function clean(u) {
    if (!u) return u
    if (u.length > 8192) u = u.slice(0, 8192) + '… [truncated]'
    for (var i = 0; i < SECRETS.length; i++) u = u.replace(SECRETS[i], '[redacted]')
    return u.replace(EMAIL, '[email]')
  }

  // send builds ONE WireEvent — the same shape core.ts build() produces, so the
  // server cannot tell which distribution emitted it.
  function send(kind, event, props) {
    queue.push({
      messageId: uid(),
      type: kind,
      event: event,
      timestamp: new Date().toISOString(),
      distinctId: person || anon,
      anonymousId: anon,
      personId: person || undefined,
      sessionId: sid,
      product: product,
      url: clean(location.href),
      path: clean(location.pathname),
      referrer: clean(document.referrer) || undefined,
      properties: props || undefined,
      library: LIB,
      libraryVersion: VERSION,
    })
    clearTimeout(timer)
    timer = setTimeout(flush, 400)
  }

  // ── element locator (the autocapture detail) ──────────────────────────────
  // A compact, stable, PII-light descriptor of the element interacted with, so
  // movements read logically: tag, short text, id, data-*, and an ancestor path.
  function locator(el) {
    if (!el || el === document) return null
    var o = {
      tag: el.tagName ? el.tagName.toLowerCase() : '',
      id: el.id || undefined,
      name:
        (el.getAttribute && (el.getAttribute('name') || el.getAttribute('aria-label'))) ||
        undefined,
    }
    var txt = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 80)
    if (txt) o.text = txt
    // A link target is a URL like any other — a share/invite href carries the
    // same token shapes the page URL does.
    if (el.getAttribute && el.getAttribute('href')) o.href = clean(el.getAttribute('href'))
    if (el.dataset) for (var k in el.dataset) if (k !== 'hz') (o.data = o.data || {})[k] = el.dataset[k]
    var p = [],
      n = el,
      i = 0
    while (n && n.tagName && i++ < 4) {
      var seg = n.tagName.toLowerCase()
      if (n.id) {
        seg += '#' + n.id
        p.unshift(seg)
        break
      }
      if (n.className && typeof n.className === 'string')
        seg += '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.')
      p.unshift(seg)
      n = n.parentElement
    }
    o.sel = p.join('>')
    return o
  }
  function interactive(el) {
    return el && el.closest && el.closest('a,button,[role=button],input,select,textarea,[data-hz],[onclick]')
  }

  // ── auto pageviews (initial + SPA) ────────────────────────────────────────
  var last = ''
  function page() {
    var k = location.pathname + location.search
    if (k === last) return
    last = k
    send('pageview', '$pageview')
  }
  page()
  ;['pushState', 'replaceState'].forEach(function (m) {
    var o = history[m]
    history[m] = function () {
      var r = o.apply(this, arguments)
      page()
      return r
    }
  })
  addEventListener('popstate', page)

  // ── autocapture: clicks, outbound, scroll depth, form submits ─────────────
  if (capture) {
    addEventListener(
      'click',
      function (e) {
        var el = interactive(e.target)
        if (!el) return
        var loc = locator(el)
        send('event', '$click', loc)
        if (el.tagName === 'A' && el.host && el.host !== location.host)
          send('event', '$outbound', { url: clean(el.href), el: loc })
      },
      true,
    )
    addEventListener('submit', function (e) { send('event', '$form', locator(e.target)) }, true)
    var seen = {}
    addEventListener(
      'scroll',
      function () {
        var d = document.documentElement
        var pct = Math.round(((scrollY + innerHeight) / (d.scrollHeight || 1)) * 100)
        ;[25, 50, 75, 100].forEach(function (m) {
          if (pct >= m && !seen[m]) {
            seen[m] = 1
            send('event', '$scroll', { depth: m })
          }
        })
      },
      { passive: true },
    )
  }

  // ── core web vitals (best-effort, no dep) ─────────────────────────────────
  var vitals = {}
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (x) { vitals.lcp = Math.round(x.startTime) })
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (x) {
        if (!x.hadRecentInput) vitals.cls = +((vitals.cls || 0) + x.value).toFixed(3)
      })
    }).observe({ type: 'layout-shift', buffered: true })
  } catch (e) {}
  addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden') return
    if (vitals.lcp != null || vitals.cls != null) send('event', '$vitals', vitals)
    flush()
  })

  // ── public API (manual funnel/identify) + GA/Meta fan-out ─────────────────
  function assign(a, b) {
    if (b) for (var k in b) a[k] = b[k]
    return a
  }
  window.hanzo = {
    track: function (name, props) { send('event', name, props || undefined) },
    identify: function (id, traits) {
      person = id
      try { localStorage.setItem('hz_uid', id) } catch (e) {}
      send('identify', undefined, traits || undefined)
    },
    page: function (props) {
      last = ''
      page()
      if (props) send('event', 'page_props', props)
    },
    flush: flush,
  }
  var ga = s.getAttribute('data-ga'),
    fb = s.getAttribute('data-fb')
  function load(src) {
    var el = document.createElement('script')
    el.async = true
    el.src = src
    document.head.appendChild(el)
  }
  if (ga) {
    load('https://www.googletagmanager.com/gtag/js?id=' + ga)
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { dataLayer.push(arguments) }
    gtag('js', new Date())
    gtag('config', ga)
    var _t = window.hanzo.track
    window.hanzo.track = function (n, p) {
      _t(n, p)
      try { gtag('event', n, p || {}) } catch (e) {}
    }
  }
  if (fb) {
    !(function (f) {
      if (f.fbq) return
      var n = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      })
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = '2.0'
      n.queue = []
    })(window)
    load('https://connect.facebook.net/en_US/fbevents.js')
    fbq('init', fb)
    fbq('track', 'PageView')
    var _u = window.hanzo.track
    window.hanzo.track = function (n, p) {
      _u(n, p)
      try { fbq('trackCustom', n, p || {}) } catch (e) {}
    }
  }
})()
