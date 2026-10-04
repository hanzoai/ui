/**
 * JSON verdicts — whether a piece of text is JSON, plain text, or broken JSON,
 * and for broken JSON the offset, line, column and reason.
 *
 * `JSON.parse` decides validity; it is the parser every caller will use on the
 * text afterwards, so nothing here can call valid what it refuses. It does not
 * say where it failed in a form every engine shares (V8 names a position,
 * Firefox a line and column, Safari neither), so a broken document is walked a
 * second time by a scanner that follows RFC 8259 and reports the first byte it
 * cannot accept, in the same words on every engine.
 *
 * Imports nothing, so a server, a test or a worker can read it.
 */

export type JsonCheck =
  | { kind: 'empty' }
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'error'; message: string; at: number; line: number; column: number }

export interface JsonCheckOptions {
  /**
   * Text that does not open an object or an array passes as plain text instead
   * of failing — for a field that takes either. A document that opens with `{`,
   * or with `[` and a JSON value, is still held to JSON, because that is what its
   * author meant; `[INFO] …` is a log line, not a broken array.
   */
  text?: boolean
}

type Fault = { at: number; message: string }

const SPACE = ' \t\n\r'
const ESCAPE = '"\\/bfnrt'
const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const HEX = /[0-9a-fA-F]{4}/y
/**
 * Text that means to be JSON: an object, or an array whose first element looks
 * like a JSON value. A log line such as `[INFO] export started` opens with a
 * bracket and is prose, so it is not held to JSON.
 */
const STRUCTURED = /^(\{|\[\s*([[{"\]\-\d]|true\b|false\b|null\b|$))/

const shown = (c: string | undefined) =>
  c === undefined ? 'end of input' : c === '\n' ? 'line break' : `character '${c}'`

/** The first offset RFC 8259 does not accept, and why; `null` when it accepts all of it. */
function scan(s: string): Fault | null {
  let i = 0
  const fail = (message: string, at = i): never => {
    throw { at, message } satisfies Fault
  }
  const space = () => {
    while (i < s.length && SPACE.includes(s[i]!)) i++
  }

  const string = () => {
    i++
    while (i < s.length) {
      const c = s[i]!
      if (c === '"') {
        i++
        return
      }
      if (c === '\\') {
        const e = s[i + 1]
        if (e === 'u') {
          HEX.lastIndex = i + 2
          if (!HEX.test(s)) fail('Expected four hex digits after \\u', i + 2)
          i += 6
          continue
        }
        if (e === undefined || !ESCAPE.includes(e)) fail(`Invalid escape '\\${e ?? ''}' in string`, i + 1)
        i += 2
        continue
      }
      if (c < ' ') fail(c === '\n' ? 'Unterminated string' : 'Control character in string')
      i++
    }
    fail('Unterminated string')
  }

  const number = () => {
    NUMBER.lastIndex = i
    const m = NUMBER.exec(s)
    if (!m || m[0] === '-') fail('Invalid number')
    i += m![0].length
  }

  /** A property name and its colon, where one must be. */
  const key = (afterComma: boolean) => {
    space()
    if (s[i] !== '"') {
      fail(afterComma && s[i] === '}' ? "Trailing comma before '}'" : `Expected a double-quoted property name, found ${shown(s[i])}`)
    }
    string()
    space()
    if (s[i] !== ':') fail(`Expected ':' after property name, found ${shown(s[i])}`)
    i++
  }

  // A loop over an explicit stack of the containers still open, not a call per
  // level: a few thousand unclosed brackets would otherwise exhaust the call stack,
  // and `JSON.parse` (which does not recurse) accepts the same depth when closed.
  const open: ('{' | '[')[] = []
  let wantValue = true
  try {
    for (;;) {
      space()
      if (wantValue) {
        const c = s[i]
        if (c === '{' || c === '[') {
          i++
          space()
          if (s[i] === (c === '{' ? '}' : ']')) {
            i++
            wantValue = false
            continue
          }
          open.push(c)
          if (c === '{') key(false)
          continue
        }
        if (c === '"') string()
        else if (c === '-' || (c !== undefined && c >= '0' && c <= '9')) number()
        else {
          const word = ['true', 'false', 'null'].find((w) => s.startsWith(w, i))
          if (!word) fail(`Unexpected ${shown(c)}`)
          i += word!.length
        }
        wantValue = false
        continue
      }
      const top = open.at(-1)
      if (!top) {
        if (i < s.length) fail(`Unexpected ${shown(s[i])} after the JSON value`)
        return null
      }
      if (s[i] === ',') {
        i++
        if (top === '{') key(true)
        else {
          space()
          if (s[i] === ']') fail("Trailing comma before ']'")
        }
        wantValue = true
        continue
      }
      if (s[i] === (top === '{' ? '}' : ']')) {
        i++
        open.pop()
        continue
      }
      fail(
        top === '{'
          ? `Expected ',' or '}' after property value, found ${shown(s[i])}`
          : `Expected ',' or ']' after array element, found ${shown(s[i])}`,
      )
    }
  } catch (e) {
    return e as Fault
  }
}

/** The 1-based line and column of an offset. */
function place(s: string, at: number): { line: number; column: number } {
  let line = 1
  let start = 0
  for (let i = 0; i < at && i < s.length; i++) {
    if (s[i] === '\n') {
      line++
      start = i + 1
    }
  }
  return { line, column: at - start + 1 }
}

/** Is `text` JSON, plain text (when allowed), empty, or broken — and where? */
export function checkJson(text: string, options: JsonCheckOptions = {}): JsonCheck {
  const body = text.trim()
  if (!body) return { kind: 'empty' }
  try {
    return { kind: 'json', value: JSON.parse(text) }
  } catch (e) {
    if (options.text && !STRUCTURED.test(body)) return { kind: 'text', value: text }
    const fault = scan(text) ?? { at: 0, message: e instanceof Error ? e.message : String(e) }
    return { kind: 'error', message: fault.message, at: fault.at, ...place(text, fault.at) }
  }
}

/** `text` re-indented by two spaces, or `null` when it is not JSON. */
export function formatJson(text: string): string | null {
  const check = checkJson(text)
  return check.kind === 'json' ? JSON.stringify(check.value, null, 2) : null
}
