import { describe, expect, it } from 'vitest'
import { transform } from './transform'
import { shouldTransform } from './filter'

const run = (code: string, filename = '/app/components/Card.tsx'): string =>
  transform(code, { filename })?.code ?? code

const count = (code: string, filename = '/app/components/Card.tsx'): number =>
  transform(code, { filename })?.count ?? 0

describe('transform', () => {
  it('annotates a function component with its own name', () => {
    expect(run('export function Card() { return <div>hi</div> }')).toBe(
      'export function Card() { return <div data-observe="Card">hi</div> }',
    )
  })

  it('annotates an arrow component with a concise body', () => {
    expect(run('const Badge = () => <span>1</span>')).toBe(
      'const Badge = () => <span data-observe="Badge">1</span>',
    )
  })

  it('annotates a self-closing root', () => {
    expect(run('const Rule = () => <hr className="x" />')).toBe(
      'const Rule = () => <hr className="x" data-observe="Rule" />',
    )
  })

  it('unwraps memo/forwardRef down to the component', () => {
    expect(run('const Btn = memo(forwardRef((p, r) => <button ref={r} />))')).toBe(
      'const Btn = memo(forwardRef((p, r) => <button ref={r} data-observe="Btn" />))',
    )
  })

  it('annotates a class component through its render method', () => {
    expect(run('class Panel extends Component { render() { return <section /> } }')).toBe(
      'class Panel extends Component { render() { return <section data-observe="Panel" /> } }',
    )
  })

  it('annotates BOTH arms of a conditional return', () => {
    const out = run('function List({ n }) { return n ? <ul /> : <p /> }')
    expect(out).toContain('<ul data-observe="List" />')
    expect(out).toContain('<p data-observe="List" />')
    expect(count('function List({ n }) { return n ? <ul /> : <p /> }')).toBe(2)
  })

  it('annotates the right side of a `&&` return', () => {
    expect(run('function Maybe({ on }) { return on && <b /> }')).toBe(
      'function Maybe({ on }) { return on && <b data-observe="Maybe" /> }',
    )
  })

  it('annotates every early return, not just the last', () => {
    const src = `function Gate({ ok }) {
  if (!ok) return <p>denied</p>
  return <main>yes</main>
}`
    const out = run(src)
    expect(out).toContain('<p data-observe="Gate">')
    expect(out).toContain('<main data-observe="Gate">')
  })

  // The attribute is LAST, so a `{...props}` spread carrying a parent's
  // data-observe cannot rename this node. A node is labelled by the component
  // that renders it — an identity, not something a caller can inject.
  it('wins over an inherited spread by being the last attribute', () => {
    expect(run('const Card = (props) => <div {...props} />')).toBe(
      'const Card = (props) => <div {...props} data-observe="Card" />',
    )
  })

  it('leaves a hand-written data-observe alone, including "off"', () => {
    const src = 'function Secret() { return <form data-observe="off"><input /></form> }'
    expect(transform(src, { filename: 'x.tsx' })).toBeNull()
  })

  it('does NOT annotate nested render callbacks with the outer name', () => {
    const src = 'function List({ xs }) { return <ul>{xs.map((x) => <li key={x} />)}</ul> }'
    const out = run(src)
    expect(out).toContain('<ul data-observe="List">')
    expect(out).not.toContain('<li key={x} data-observe')
  })

  it('annotates an inner component under its OWN name', () => {
    const src = `function Outer() {
  function Inner() { return <b /> }
  return <div><Inner /></div>
}`
    const out = run(src)
    expect(out).toContain('<b data-observe="Inner" />')
    expect(out).toContain('<div data-observe="Outer">')
  })

  // React warns on any prop but key/children for a Fragment, so it is the one
  // thing we must never touch.
  it('never puts an attribute ON a Fragment, Suspense or friends', () => {
    expect(transform('const A = () => <></>', { filename: 'a.tsx' })).toBeNull()
    expect(transform('const C = () => <React.Fragment />', { filename: 'c.tsx' })).toBeNull()
    expect(transform('const D = () => <Suspense />', { filename: 'd.tsx' })).toBeNull()
  })

  // A fragment is not the root — its element children are. Skipping it would
  // leave that whole subtree anonymous.
  it('annotates every element child of a fragment root', () => {
    const out = run('const Page = () => <><Header /><main>x</main></>')
    expect(out).toContain('<Header data-observe="Page" />')
    expect(out).toContain('<main data-observe="Page">')
    expect(count('const Page = () => <><Header /><main>x</main></>')).toBe(2)
  })

  it('reaches through a fragment child expression', () => {
    const out = run('const P = ({ on }) => <>{on && <b />}<i /></>')
    expect(out).toContain('<b data-observe="P" />')
    expect(out).toContain('<i data-observe="P" />')
  })

  it('skips document metadata elements', () => {
    expect(transform('const Head = () => <title>x</title>', { filename: 'h.tsx' })).toBeNull()
    expect(transform('const S = () => <script src="a" />', { filename: 's.tsx' })).toBeNull()
  })

  it('ignores lowercase (non-component) functions', () => {
    expect(transform('function helper() { return <div /> }', { filename: 'h.tsx' })).toBeNull()
  })

  it('returns null when there is nothing to annotate', () => {
    expect(transform('export const n = 1', { filename: 'n.ts' })).toBeNull()
    expect(transform('', { filename: 'e.tsx' })).toBeNull()
  })

  // The whole point of splicing text instead of re-printing an AST: a stack
  // trace and a source map still point at the right line.
  it('preserves the line count exactly', () => {
    const src = `import x from 'y'

export function Page() {
  return (
    <main>
      <h1>Title</h1>
    </main>
  )
}
`
    const out = run(src)
    expect(out.split('\n').length).toBe(src.split('\n').length)
    expect(out).toContain('<main data-observe="Page">')
  })

  it('leaves everything else in the file byte-identical', () => {
    const src = `// a comment with <angle> brackets
const s = "a string with <div> in it"
export function Card() { return <div>{s}</div> }`
    const out = run(src)
    expect(out).toContain('// a comment with <angle> brackets')
    expect(out).toContain('const s = "a string with <div> in it"')
    expect(out).toContain('<div data-observe="Card">')
  })

  it('annotates a component whose root is another component', () => {
    expect(run('const Page = () => <Layout title="x" />')).toBe(
      'const Page = () => <Layout title="x" data-observe="Page" />',
    )
  })

  it('handles a multi-component module and reports the count', () => {
    const src = `
export function A() { return <div /> }
export function B() { return <span /> }
export const C = () => <p />
`
    expect(count(src)).toBe(3)
  })

  it('never throws on malformed source', () => {
    expect(() => transform('function Broken( { return <div', { filename: 'b.tsx' })).not.toThrow()
  })
})

describe('shouldTransform', () => {
  it('takes app tsx/jsx', () => {
    expect(shouldTransform('/app/components/Card.tsx')).toBe(true)
    expect(shouldTransform('/app/components/Card.jsx')).toBe(true)
    expect(shouldTransform('/app/components/Card.tsx?rsc')).toBe(true)
  })

  it('skips non-JSX extensions', () => {
    expect(shouldTransform('/app/lib/util.ts')).toBe(false)
    expect(shouldTransform('/app/styles.css')).toBe(false)
  })

  it('skips dependencies but keeps transpiled @hanzo source', () => {
    expect(shouldTransform('/app/node_modules/left-pad/index.tsx')).toBe(false)
    expect(shouldTransform('/app/node_modules/@hanzo/ui/src/Button.tsx')).toBe(true)
    expect(shouldTransform('/app/node_modules/@hanzogui/shell/src/Nav.tsx')).toBe(true)
  })
})
