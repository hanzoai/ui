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
  if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || window.hzDNT) return

  var LIB = 'hz.js'
  var VERSION = '0.3.7'
  var host = (s.getAttribute('data-host') || 'https://api.hanzo.ai').replace(/\/+$/, '')
  var product = s.getAttribute('data-product') || location.hostname
  var capture = s.getAttribute('data-capture') !== '0'

  function uid() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + '.' + Math.random().toString(36).slice(2)
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
    try {
      if (
        navigator.sendBeacon &&
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      )
        return
    } catch (e) {}
    fetch(url, {
      method: 'POST',
      body: body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).catch(function () {})
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
      url: location.href,
      path: location.pathname,
      referrer: document.referrer || undefined,
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
    if (el.getAttribute && el.getAttribute('href')) o.href = el.getAttribute('href')
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
          send('event', '$outbound', { url: el.href, el: loc })
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
