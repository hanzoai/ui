/**
 * checkJson's verdicts and formatJson's output. The positions are the point:
 * every engine words `JSON.parse` failures differently and Safari gives no
 * position at all, so the line and column here come from the scanner and must
 * name the byte a person would point at.
 */
import { describe, expect, it } from 'vitest'

import { checkJson, formatJson } from './json'

const fault = (text: string, text_ = false) => {
  const c = checkJson(text, { text: text_ })
  if (c.kind !== 'error') throw new Error(`expected an error, got ${c.kind}`)
  return c
}

describe('checkJson', () => {
  it('parses JSON of every top-level shape', () => {
    expect(checkJson('{"a":1}')).toEqual({ kind: 'json', value: { a: 1 } })
    expect(checkJson('[1, 2]')).toEqual({ kind: 'json', value: [1, 2] })
    expect(checkJson('"s"')).toEqual({ kind: 'json', value: 's' })
    expect(checkJson('  42 ')).toEqual({ kind: 'json', value: 42 })
    expect(checkJson('null')).toEqual({ kind: 'json', value: null })
  })

  it('calls blank text empty', () => {
    expect(checkJson('')).toEqual({ kind: 'empty' })
    expect(checkJson(' \n\t')).toEqual({ kind: 'empty' })
  })

  it('lets plain text through only when asked, and never text that opens an object or array', () => {
    expect(checkJson('The API returns 502s', { text: true })).toEqual({ kind: 'text', value: 'The API returns 502s' })
    expect(checkJson('The API returns 502s').kind).toBe('error')
    expect(fault('{ customer: "Acme" }', true).message).toBe(
      "Expected a double-quoted property name, found character 'c'",
    )
    expect(fault('[1, 2', true).kind).toBe('error')
  })

  it('holds a log line that opens with a bracket as text, and a real array to JSON', () => {
    expect(checkJson('[INFO] user exported 50000 rows', { text: true }).kind).toBe('text')
    expect(checkJson('[WARN]: disk 91%', { text: true }).kind).toBe('text')
    expect(checkJson('["a", 1', { text: true }).kind).toBe('error')
    expect(checkJson('[ {"a": 1}', { text: true }).kind).toBe('error')
    expect(checkJson('[', { text: true }).kind).toBe('error')
  })

  it('walks any depth without exhausting the stack, and names where it ends', () => {
    const open = '['.repeat(20000)
    expect(checkJson(open)).toMatchObject({ kind: 'error', at: 20000, message: 'Unexpected end of input' })
    expect(checkJson(`${open}${']'.repeat(20000)}`).kind).toBe('json')
    expect(checkJson(`${'{"a":'.repeat(5000)}1${'}'.repeat(4999)}`)).toMatchObject({
      kind: 'error',
      message: "Expected ',' or '}' after property value, found end of input",
    })
  })

  it('points at a missing comma', () => {
    const c = fault('{\n  "a": 1\n  "b": 2\n}')
    expect(c).toMatchObject({ line: 3, column: 3, message: "Expected ',' or '}' after property value, found character '\"'" })
  })

  it('points at a trailing comma', () => {
    expect(fault('{"a": 1,}')).toMatchObject({ line: 1, column: 9, message: "Trailing comma before '}'" })
    expect(fault('[1, 2,\n]')).toMatchObject({ line: 2, column: 1, message: "Trailing comma before ']'" })
  })

  it('points at an unquoted key, a single-quoted string and a stray word', () => {
    expect(fault('{a: 1}')).toMatchObject({ column: 2 })
    expect(fault("{\"a\": 'x'}")).toMatchObject({ column: 7, message: "Unexpected character '''" })
    expect(fault('{"a": yes}')).toMatchObject({ column: 7, message: "Unexpected character 'y'" })
  })

  it('names an unterminated string at the line break that ends it', () => {
    expect(fault('{"a": "open\n}')).toMatchObject({ line: 1, column: 12, message: 'Unterminated string' })
  })

  it('names the end of input, at the end', () => {
    const text = '{"a": [1, 2'
    expect(fault(text)).toMatchObject({ at: text.length, message: "Expected ',' or ']' after array element, found end of input" })
  })

  it('names what follows a complete value', () => {
    expect(fault('{} {}')).toMatchObject({ column: 4, message: "Unexpected character '{' after the JSON value" })
  })

  it('names a bad escape and a bad number', () => {
    expect(fault('"\\x"')).toMatchObject({ column: 3, message: "Invalid escape '\\x' in string" })
    expect(fault('"\\u12"')).toMatchObject({ column: 4, message: 'Expected four hex digits after \\u' })
    expect(fault('-')).toMatchObject({ column: 1, message: 'Invalid number' })
    expect(fault('[01]')).toMatchObject({ column: 3 })
  })
})

describe('formatJson', () => {
  it('re-indents JSON by two spaces', () => {
    expect(formatJson('{"a":[1,{"b":null}]}')).toBe('{\n  "a": [\n    1,\n    {\n      "b": null\n    }\n  ]\n}')
  })

  it('refuses what is not JSON', () => {
    expect(formatJson('{"a":')).toBeNull()
    expect(formatJson('plain text')).toBeNull()
    expect(formatJson('')).toBeNull()
  })
})
