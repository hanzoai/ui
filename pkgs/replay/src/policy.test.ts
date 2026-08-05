import { beforeEach, describe as group, expect, it } from 'vitest'
import { isPrivate } from '@hanzo/observe'
import {
  CREDENTIAL_SELECTOR,
  fieldIdentity,
  maskInput,
  maskText,
  privateSelector,
  recorderOptions,
} from './policy'

beforeEach(() => {
  document.body.innerHTML = ''
})

function mount(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body.querySelector('input,textarea,select,[id]') as HTMLElement
}

group('maskInput', () => {
  it('masks every input value by default, keeping only the length', () => {
    const el = mount('<input type="text" name="nickname" value="hello">')
    expect(maskInput('hello', el)).toBe('*****')
  })

  it('never captures a password field — not even its length', () => {
    const el = mount('<input type="password" name="pw" value="hunter2">')
    const out = maskInput('hunter2', el)
    expect(out).not.toContain('hunter2')
    expect(out).toBe('********')
    // and the same holds with masking explicitly turned off
    expect(maskInput('hunter2', el, { maskInput: false })).toBe('********')
  })

  it('withholds the length of any field @hanzo/observe calls sensitive', () => {
    for (const html of [
      '<input type="text" name="cardNumber" value="4111111111111111">',
      '<input type="text" autocomplete="cc-csc" value="123">',
      '<input type="text" id="api_key" value="hk-abc">',
      '<input type="email" value="a@b.com">',
      '<input type="tel" value="+15551234567">',
      '<input type="text" aria-label="Social Security Number" value="1">',
    ]) {
      const el = mount(html)
      const raw = (el as HTMLInputElement).value
      // masking off is the hostile case: it must still refuse these
      const out = maskInput(raw, el, { maskInput: false })
      expect(out, html).toBe('********')
      expect(out, html).not.toContain(raw)
    }
  })

  it('excludes a data-hz-private subtree even when the field itself is innocuous', () => {
    document.body.innerHTML = '<div data-hz-private><input id="i" name="nickname" value="hello"></div>'
    const el = document.getElementById('i')!
    expect(isPrivate(el)).toBe(true)
    expect(maskInput('hello', el, { maskInput: false })).toBe('********')
  })

  it('honors data-observe="off" and data-private the same way', () => {
    document.body.innerHTML =
      '<form data-observe="off"><input id="a" name="q" value="hi"></form>' +
      '<div data-private><input id="b" name="q" value="hi"></div>'
    for (const id of ['a', 'b']) {
      const el = document.getElementById(id)!
      expect(isPrivate(el), id).toBe(true)
      expect(maskInput('hi', el, { maskInput: false }), id).toBe('********')
    }
  })

  it("honors a caller's custom privateAttribute at node level", () => {
    document.body.innerHTML = '<section data-vault><input id="i" name="q" value="hi"></section>'
    const el = document.getElementById('i')!
    const policy = { privateAttribute: 'data-vault', maskInput: false }
    expect(maskInput('hi', el, policy)).toBe('********')
    // …and the selector carries it too, so the subtree is blocked outright
    expect(privateSelector(policy)).toContain('[data-vault]')
  })

  it('honors an unselectable custom privateAttribute through isPrivate alone', () => {
    // `x:vault` is a legal HTML attribute name but not a legal CSS identifier, so
    // it is dropped from the selector. The node-level gate is what keeps it a real
    // opt-out rather than a silent no-op.
    const policy = { privateAttribute: 'x:vault', maskInput: false }
    expect(privateSelector(policy)).not.toContain('vault')
    document.body.innerHTML = '<div><input id="i" name="q" value="hi"></div>'
    document.body.firstElementChild!.setAttribute('x:vault', '')
    expect(maskInput('hi', document.getElementById('i')!, policy)).toBe('********')
  })

  it('returns the raw value only when masking is off AND the field is provably safe', () => {
    const el = mount('<input type="text" name="query" value="react hooks">')
    expect(maskInput('react hooks', el, { maskInput: false })).toBe('react hooks')
    // masked: rrweb's own input default — even the spacing of a value is a hint
    expect(maskInput('react hooks', el)).toBe('***********')
  })

  it('redacts secret CONTENT even from a field whose identity is innocuous', () => {
    // Field identity is a guess about what a box is FOR. With masking off it is
    // the only guard left, so the value itself gets read too.
    const el = mount('<input type="text" name="query" value="x">')
    const off = { maskInput: false }
    expect(maskInput('4111111111111111', el, off)).toBe('[redacted]')
    expect(maskInput('call me on sk-proj-abcdefghijklmnop', el, off)).toContain('[redacted]')
    expect(maskInput('https://id.dev/callback?code=live123', el, off)).toBe(
      'https://id.dev/callback?code=[redacted]',
    )
    // ordinary text is left alone — the recording still has to be readable
    expect(maskInput('order 1753468800000', el, off)).toBe('order 1753468800000')
  })
})

group('maskText', () => {
  it('replaces every visible character but keeps the whitespace, so layout survives', () => {
    expect(maskText('Ada Lovelace')).toBe('*** ********')
    expect(maskText('')).toBe('')
  })
})

group('privateSelector', () => {
  it('mirrors isPrivate: the configured attribute plus the two fixed conventions', () => {
    expect(privateSelector()).toBe('[data-hz-private],[data-observe="off"],[data-private]')
  })

  it('replaces the default attribute exactly as isPrivate does', () => {
    const s = privateSelector({ privateAttribute: 'data-vault' })
    expect(s).toBe('[data-vault],[data-observe="off"],[data-private]')
    expect(s).not.toContain('data-hz-private')
  })
})

group('recorderOptions', () => {
  it('masks all inputs by default and consults our decision for every type', () => {
    const o = recorderOptions()
    // false = "do not substitute your list for mine"; the masking itself is in
    // maskInputOptions + maskInputFn below.
    expect(o.maskAllInputs).toBe(false)
    expect(o.maskInputOptions?.password).toBe(true)
    expect(o.maskInputOptions?.text).toBe(true)
    expect(o.maskInputOptions?.textarea).toBe(true)
    expect(typeof o.maskInputFn).toBe('function')
    expect(typeof o.maskTextFn).toBe('function')
  })

  it('blocks password- and payment-shaped fields outright', () => {
    const o = recorderOptions()
    for (const sel of [
      'input[type="password"]',
      'input[autocomplete="one-time-code"]',
      'input[autocomplete^="cc-"]',
    ]) {
      expect(o.blockSelector, sel).toContain(sel)
    }
    expect(CREDENTIAL_SELECTOR).toContain('input[type="password"]')
  })

  it('blocks and masks every private-subtree convention', () => {
    const o = recorderOptions()
    for (const sel of ['[data-hz-private]', '[data-observe="off"]', '[data-private]']) {
      expect(o.blockSelector, sel).toContain(sel)
      expect(o.maskTextSelector, sel).toContain(sel)
    }
  })

  it('keeps pixel capture off — a canvas is content no text rule can mask', () => {
    const o = recorderOptions()
    expect(o.recordCanvas).toBe(false)
    expect(o.inlineImages).toBe(false)
  })

  it("adds the app's selectors without dropping the policy's", () => {
    const o = recorderOptions({}, { blockSelector: '.secret', maskTextSelector: '.pii' })
    expect(o.blockSelector).toContain('.secret')
    expect(o.blockSelector).toContain('[data-hz-private]')
    expect(o.maskTextSelector).toContain('.pii')
    expect(o.maskTextSelector).toContain('[data-private]')
  })

  it('lets the rrweb escape hatch tune sampling but never widen the gate', () => {
    const o = recorderOptions(
      {},
      { extra: { mousemoveWait: 100, maskAllInputs: false, blockSelector: '.nope' } },
    )
    expect(o.mousemoveWait).toBe(100)
    expect(o.maskAllInputs).toBe(false) // ours wins — see below for why false IS the gate
    expect(o.blockSelector).toContain('[data-hz-private]')
    expect(o.blockSelector).not.toBe('.nope')
  })

  // rrweb reads `maskAllInputs: true` as "use MY hardcoded type list instead of
  // yours", and that list omits `hidden`. Passing false keeps our table — and
  // therefore maskInputFn — in charge of every type we name.
  it('keeps the masking decision in maskInputFn rather than rrwebs own list', () => {
    for (const policy of [{}, { maskInput: false }, { maskInput: true }]) {
      const o = recorderOptions(policy)
      expect(o.maskAllInputs).toBe(false)
      expect(typeof o.maskInputFn).toBe('function')
      expect(o.maskInputOptions?.hidden).toBe(true)
    }
  })

  it('still follows the policy when masking is explicitly turned off', () => {
    // Not via maskAllInputs any more — via the function that owns the decision.
    const el = mount('<input type="text" name="nickname">')
    expect(maskInput('Zach', el, { maskInput: false })).toBe('Zach')
    expect(maskInput('Zach', el, {})).toBe('****')
    // …but a secure type is refused whatever the mode says.
    const pw = mount('<input type="hidden" name="csrf_token">')
    expect(maskInput('CSRF-TOKEN', pw, { maskInput: false })).toBe('********')
  })

  // With maskInput:false, maskAllInputs is false and rrweb consults
  // maskInputOptions to decide whether maskInputFn runs at all. A type that
  // SECURE_TYPES calls "never captured" but this table omits is masked by nothing.
  it('opts every SECURE_TYPE into maskInputOptions, so none can serialize raw', () => {
    for (const policy of [{}, { maskInput: false }]) {
      const o = recorderOptions(policy)
      for (const t of ['password', 'hidden', 'email', 'tel']) {
        expect(o.maskInputOptions?.[t as keyof typeof o.maskInputOptions]).toBe(true)
      }
    }
  })

  it('masks the value-bearing types a user never typed', () => {
    const o = recorderOptions({})
    for (const t of ['hidden', 'checkbox', 'radio', 'file']) {
      expect(o.maskInputOptions?.[t as keyof typeof o.maskInputOptions]).toBe(true)
    }
  })

  // The escape hatch is spread FIRST, so anything the gate does not NAME is
  // something the caller can still set. These are the switches that widen capture.
  it('pins every widening rrweb switch against the escape hatch', () => {
    const o = recorderOptions(
      {},
      {
        extra: {
          recordCrossOriginIframes: true,
          collectFonts: true,
          recordCanvas: true,
          inlineImages: true,
          blockClass: 'not-rr-block',
          ignoreClass: 'not-rr-ignore',
          maskTextClass: 'not-rr-mask',
          plugins: [{ name: 'evil' }] as never,
        },
      },
    )
    expect(o.recordCrossOriginIframes).toBe(false)
    expect(o.collectFonts).toBe(false)
    expect(o.recordCanvas).toBe(false)
    expect(o.inlineImages).toBe(false)
    // Renaming these silently disarms every rr-block/rr-ignore/rr-mask already
    // written into the app's markup.
    expect(o.blockClass).toBe('rr-block')
    expect(o.ignoreClass).toBe('rr-ignore')
    expect(o.maskTextClass).toBe('rr-mask')
    expect(o.plugins).toEqual([])
  })
})

group('fieldIdentity', () => {
  it('composes the same attributes @hanzo/observe reads, so one policy decides', () => {
    const el = mount(
      '<input name="cc" id="num" autocomplete="cc-number" placeholder="Card" aria-label="Card number">',
    )
    expect(fieldIdentity(el)).toBe('cc num cc-number Card Card number')
  })
})
