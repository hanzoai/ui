import { beforeEach, describe as group, expect, it } from 'vitest'
import { isPrivate, redactValue } from './redact'

beforeEach(() => {
  document.body.innerHTML = ''
})

function mount(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body.firstElementChild as HTMLElement
}

group('redactValue', () => {
  it('withholds a text value by default but keeps structure (kind + length)', () => {
    const el = mount('<input type="text" name="nickname" value="hello">')
    expect(redactValue(el)).toEqual({ redacted: true, kind: 'text', length: 5 })
  })

  it('always withholds sensitive fields — no length leak', () => {
    for (const html of [
      '<input type="password" value="hunter2">',
      '<input type="text" name="cardNumber" value="4111111111111111">',
      '<input type="text" autocomplete="cc-csc" value="123">',
      '<input type="email" value="a@b.com">',
    ]) {
      const v = redactValue(mount(html))!
      expect(v.redacted).toBe(true)
      expect(v.value).toBeUndefined()
      expect(v.length).toBeUndefined()
    }
  })

  it('captures a bounded value only when masking is off and the field is safe', () => {
    const el = mount('<input type="text" name="query" value="react hooks">')
    expect(redactValue(el, { maskInput: false })).toEqual({
      redacted: false,
      kind: 'text',
      value: 'react hooks',
    })
    // masking off still cannot expose a sensitive field
    const pw = mount('<input type="password" value="hunter2">')
    expect(redactValue(pw, { maskInput: false })!.value).toBeUndefined()
  })

  it('summarizes checkbox/radio structurally and selects by label', () => {
    const cb = mount('<input type="checkbox" checked>')
    expect(redactValue(cb)).toEqual({ redacted: false, kind: 'checkbox', checked: true })
    document.body.innerHTML = '<select><option>One</option><option selected>Two</option></select>'
    expect(redactValue(document.querySelector('select')!)).toEqual({
      redacted: false,
      kind: 'select',
      value: 'Two',
    })
  })

  it('returns undefined for non-field elements', () => {
    expect(redactValue(mount('<button>x</button>'))).toBeUndefined()
  })
})

group('isPrivate', () => {
  it('excludes an element under a marked ancestor', () => {
    document.body.innerHTML = '<div data-hz-private><input id="i"></div>'
    expect(isPrivate(document.getElementById('i'))).toBe(true)
  })

  it('honors data-observe="off" and data-private', () => {
    document.body.innerHTML = '<form data-observe="off"><input id="a"></form><p data-private><b id="b">x</b></p>'
    expect(isPrivate(document.getElementById('a'))).toBe(true)
    expect(isPrivate(document.getElementById('b'))).toBe(true)
  })

  it('is false in an unmarked tree', () => {
    document.body.innerHTML = '<div><input id="i"></div>'
    expect(isPrivate(document.getElementById('i'))).toBe(false)
    expect(isPrivate(null)).toBe(false)
  })
})
