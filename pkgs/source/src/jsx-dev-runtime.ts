/**
 * The development JSX runtime, with the source position kept on the element.
 *
 * A compiler in development mode calls `jsxDEV(type, props, key, isStatic,
 * source, self)`, where `source` is the file, line and column the element was
 * written at. React itself reads none of that: it takes the first four
 * arguments and drops the rest. This runtime reads the fifth before handing the
 * call on, and writes it onto host elements as `data-source="file:line:column"`,
 * so the DOM carries the answer to "where is this?" and `client` can open it.
 *
 * Only host elements — a `div`, a `button` — are stamped. A component receives
 * its props by contract, and an unknown attribute would reach whatever it
 * renders, or be refused as one it does not take.
 */
import * as react from 'react/jsx-dev-runtime'

export { Fragment } from 'react/jsx-dev-runtime'

/** What a development compiler passes as the fifth argument. */
export interface Source {
  fileName: string
  lineNumber: number
  columnNumber?: number
}

type Props = Record<string, unknown> & { 'data-source'?: string }

const dev = react.jsxDEV as (
  type: unknown,
  props: Props,
  key?: unknown,
  isStatic?: boolean,
  source?: Source,
  self?: unknown,
) => unknown

export function jsxDEV(
  type: unknown,
  props: Props,
  key?: unknown,
  isStatic?: boolean,
  source?: Source,
  self?: unknown,
) {
  const stamped =
    typeof type === 'string' && source
      ? { ...props, 'data-source': `${source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}` }
      : props
  return dev(type, stamped, key, isStatic, source, self)
}
