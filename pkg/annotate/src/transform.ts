// The build-time half of @hanzo/observe.
//
// `@hanzo/observe` derives a semantic hierarchy at runtime by walking the DOM —
// "a click on the Save button, inside UserCard, inside the Dashboard navigation".
// It can only name UserCard if UserCard left its name in the DOM. In development
// React's fiber carries `_debugOwner` and the name is there for free; a production
// build strips it and minifies the function, so every node goes anonymous exactly
// where the data matters. The standing workaround is to hand-write
// `data-hz-name="UserCard"` on components you remembered to care about, which is
// the same bug with extra steps: the annotation exists where someone thought of
// it, not where the user clicked.
//
// So derive it from the source instead. Every component already states its own
// name — `function UserCard()` — and every component already has a root element.
// This transform parses the module and writes the one onto the other, so the name
// is a CONSEQUENCE of declaring a component rather than a chore attached to it.
//
// It edits TEXT, never an AST it re-prints. TypeScript parses the module, we
// compute a handful of insertion offsets, and we splice ` data-observe="Name"`
// into the original source. Nothing else in the file can change, no printer has
// an opinion about the author's formatting, and because an insertion never
// contains a newline, every line number is exactly where it was — a stack trace
// and a source map still point at the right line.

// TypeScript 7 is a native (Go) compiler: the root `typescript` module only
// re-exports the version string, and the compiler API moved behind the
// `typescript/unstable/*` subpaths. AST types + `is*` guards + enums come from
// `typescript/unstable/ast`, parsing goes through the sync API in
// `typescript/unstable/sync` (which spawns the bundled tsgo binary), and the
// in-memory filesystem comes from `typescript/unstable/fs`. Neither subpath
// exposes the old `ts.createSourceFile` / `ts.forEachChild` free functions:
// a `SourceFile` is minted by the API and children are walked with
// `node.forEachChild(...)`.
import {
  SyntaxKind,
  isArrowFunction,
  isAsExpression,
  isBinaryExpression,
  isBlock,
  isCallExpression,
  isClassDeclaration,
  isClassExpression,
  isConditionalExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isMethodDeclaration,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isReturnStatement,
  isSatisfiesExpression,
  isVariableDeclaration,
} from 'typescript/unstable/ast'
import type {
  ArrowFunction,
  Expression,
  FunctionExpression,
  JsxOpeningLikeElement,
  Node,
  SourceFile,
} from 'typescript/unstable/ast'
import { API } from 'typescript/unstable/sync'
import { createVirtualFileSystem } from 'typescript/unstable/fs'

/** The attribute this writes. It is also the attribute @hanzo/observe reads.
 *
 *  ONE attribute answers ONE question — "what is this node, for observation?" —
 *  and `data-observe="off"` (redact.ts) is the answer "nothing, look away". A
 *  component name can never collide with it: JSX requires component names to be
 *  capitalised, and `off` is not. */
const ATTRIBUTE = 'data-observe'

/** Names that must not be given a DOM attribute.
 *
 *  React's own wrappers are the whole list, and they are here because React
 *  *warns* about it: a Fragment accepts `key` and `children` and nothing else.
 *  Everything else — host elements and user components alike — takes a `data-*`
 *  prop harmlessly, so it is not this transform's business to guess which
 *  components forward their props. One that doesn't simply isn't annotated, and
 *  its subtree is still described by its ancestors. */
const NEVER = new Set(['Fragment', 'Suspense', 'StrictMode', 'Profiler', 'SuspenseList'])

/** Document-metadata elements: real DOM nodes, but never interaction targets, and
 *  `<head>` children are hoisted out of the tree that observe walks. Annotating
 *  them costs bytes on every page and buys nothing. */
const METADATA = new Set(['html', 'head', 'title', 'meta', 'link', 'script', 'style', 'base'])

/** Higher-order wrappers whose ARGUMENT is the component. `memo(forwardRef(fn))`
 *  nests, so unwrapping recurses. */
const WRAPPERS = new Set(['memo', 'forwardRef', 'observer', 'React.memo', 'React.forwardRef'])

export interface TransformOptions {
  /** Path of the module being transformed. Only used to pick the parser's
   *  dialect (TSX vs TS vs JS) and to appear in errors. */
  filename: string
}

export interface TransformResult {
  code: string
  /** How many components got annotated — the number this transform is judged on. */
  count: number
}

/** True when a name is a component name by JSX's own rule: JSX treats a
 *  lowercase tag as a host element and a capitalised one as a component, so
 *  capitalisation is not a convention here, it is the language. */
const isComponentName = (name: string): boolean => /^[A-Z]/.test(name)

/** Peel the expression wrappers that sit between `return` and the JSX: parens,
 *  `as const`, and the two conditionals every component uses to render one thing
 *  or another. Both arms of a conditional are roots — a component that returns
 *  `<Empty/>` or `<List/>` has two root elements and both should carry its name. */
function jsxRoots(node: Node | undefined, out: JsxOpeningLikeElement[]): void {
  if (!node) return
  if (isParenthesizedExpression(node) || isAsExpression(node) || isSatisfiesExpression(node)) {
    return jsxRoots(node.expression, out)
  }
  if (isConditionalExpression(node)) {
    jsxRoots(node.whenTrue, out)
    jsxRoots(node.whenFalse, out)
    return
  }
  if (isBinaryExpression(node)) {
    const op = node.operatorToken.kind
    // `cond && <A/>` — only the right side can be JSX.
    if (op === SyntaxKind.AmpersandAmpersandToken) return jsxRoots(node.right, out)
    // `a || <B/>` and `a ?? <B/>` — either side can be.
    if (op === SyntaxKind.BarBarToken || op === SyntaxKind.QuestionQuestionToken) {
      jsxRoots(node.left, out)
      jsxRoots(node.right, out)
    }
    return
  }
  if (isJsxElement(node)) {
    out.push(node.openingElement)
    return
  }
  if (isJsxSelfClosingElement(node)) {
    out.push(node)
    return
  }
  // A fragment carries no attribute itself, but it is not the root — its element
  // children are. `return <><Header/><Main/></>` is a component with TWO roots,
  // and skipping it would leave that whole subtree anonymous.
  if (isJsxFragment(node)) {
    for (const child of node.children) {
      if (isJsxElement(child) || isJsxSelfClosingElement(child) || isJsxFragment(child)) {
        jsxRoots(child, out)
      } else if (isJsxExpression(child)) {
        jsxRoots(child.expression, out)
      }
    }
  }
}

/** Every root element a function-like body can return.
 *
 *  Nested functions are deliberately NOT descended into. A `renderItem` callback
 *  or an inner component declares its own scope, and its returns belong to it —
 *  attributing them to the enclosing component is how a hierarchy starts lying. */
function rootsOf(body: Node): JsxOpeningLikeElement[] {
  const out: JsxOpeningLikeElement[] = []
  if (!isBlock(body)) {
    jsxRoots(body, out) // concise arrow body: `() => <div/>`
    return out
  }
  const visit = (node: Node): void => {
    if (
      isFunctionDeclaration(node) ||
      isFunctionExpression(node) ||
      isArrowFunction(node) ||
      isClassDeclaration(node) ||
      isClassExpression(node)
    ) {
      return
    }
    if (isReturnStatement(node)) jsxRoots(node.expression, out)
    node.forEachChild(visit)
  }
  body.forEachChild(visit)
  return out
}

/** Unwrap `memo(...)` / `forwardRef(...)` down to the function underneath. */
function unwrap(expr: Expression): Expression {
  if (!isCallExpression(expr) || expr.arguments.length === 0) return expr
  const callee = isPropertyAccessExpression(expr.expression)
    ? `${expr.expression.expression.getText()}.${expr.expression.name.text}`
    : isIdentifier(expr.expression)
      ? expr.expression.text
      : ''
  return WRAPPERS.has(callee) ? unwrap(expr.arguments[0]!) : expr
}

const isFunctionLike = (n: Node): n is ArrowFunction | FunctionExpression =>
  isArrowFunction(n) || isFunctionExpression(n)

/** Find every component in the module, paired with the root elements it renders.
 *  A component is a function or class that has a capitalised name — the same test
 *  JSX itself applies at the call site. */
function components(source: SourceFile): Array<{ name: string; roots: JsxOpeningLikeElement[] }> {
  const found: Array<{ name: string; roots: JsxOpeningLikeElement[] }> = []

  const visit = (node: Node): void => {
    if (isFunctionDeclaration(node) && node.name && node.body && isComponentName(node.name.text)) {
      found.push({ name: node.name.text, roots: rootsOf(node.body) })
    } else if (isVariableDeclaration(node) && isIdentifier(node.name) && node.initializer) {
      if (isComponentName(node.name.text)) {
        const fn = unwrap(node.initializer)
        if (isFunctionLike(fn) && fn.body) found.push({ name: node.name.text, roots: rootsOf(fn.body) })
      }
    } else if (isClassDeclaration(node) && node.name && isComponentName(node.name.text)) {
      for (const member of node.members) {
        if (isMethodDeclaration(member) && isIdentifier(member.name) && member.name.text === 'render' && member.body) {
          found.push({ name: node.name.text, roots: rootsOf(member.body) })
        }
      }
    }
    node.forEachChild(visit)
  }

  source.forEachChild(visit)
  return found
}

function tagOf(el: JsxOpeningLikeElement, source: SourceFile): string {
  return el.tagName.getText(source)
}

/** Already annotated by hand? Then the author has said something specific —
 *  including `data-observe="off"` — and this transform does not argue with it. */
function annotated(el: JsxOpeningLikeElement): boolean {
  return el.attributes.properties.some(
    (p) =>
      isJsxAttribute(p) &&
      (isIdentifier(p.name) ? p.name.text : p.name.getText()) === ATTRIBUTE,
  )
}

function skip(tag: string): boolean {
  if (NEVER.has(tag)) return true
  if (METADATA.has(tag)) return true
  // `React.Fragment`, `Foo.Fragment` — the member name is what matters.
  const last = tag.slice(tag.lastIndexOf('.') + 1)
  return NEVER.has(last)
}

/** Parse `code` as `filename` through the TypeScript 7 sync API.
 *
 *  The API reads files through a filesystem, so the module is handed to it as
 *  an in-memory file: `createVirtualFileSystem` is seeded with the contents up
 *  front (mutating the seed afterwards is NOT re-read — the server caches the
 *  first read, which is why this creates a fresh API per call rather than
 *  reusing one). The API infers the parser dialect from the file extension, so
 *  no `ScriptKind` has to be picked by hand. */
function parseSourceFile(filename: string, code: string): SourceFile {
  // The API only resolves absolute paths for `openFiles`, so a bare `h.tsx`
  // (which `ts.createSourceFile` happily took) is anchored under a virtual
  // root. Real callers hand us absolute resource paths, so this only matters
  // for tests and direct `transform` calls.
  const file = filename.startsWith('/') ? filename : `/virtual/${filename}`
  const api = new API({ fs: createVirtualFileSystem({ [file]: code }) })
  try {
    const snapshot = api.updateSnapshot({ openFiles: [file] })
    const source = snapshot
      .getDefaultProjectForFile(file)
      ?.program.getSourceFile(file)
    if (!source) throw new Error(`typescript: could not parse ${filename}`)
    return source
  } finally {
    api.close()
  }
}

/** transform annotates every component root in `code`, or returns null when there
 *  was nothing to do — so a caller can hand back the original string untouched
 *  and skip both the copy and the source-map churn. */
export function transform(code: string, options: TransformOptions): TransformResult | null {
  // Cheap gate first: no `<` means no JSX, and most files in a repo are not JSX.
  if (!code.includes('<')) return null

  const source = parseSourceFile(options.filename, code)

  // offset -> the name to write there. A Map dedupes the case where one element
  // is the root of two returns (`return cond ? <A/> : <A/>` shares no node, but a
  // shared helper can), keeping the first name that claimed it.
  const edits = new Map<number, string>()
  for (const { name, roots } of components(source)) {
    for (const el of roots) {
      if (annotated(el) || skip(tagOf(el, source))) continue
      const at = el.attributes.end
      if (!edits.has(at)) edits.set(at, name)
    }
  }
  if (edits.size === 0) return null

  // Apply back-to-front so every offset stays valid as the string grows.
  let out = code
  for (const [at, name] of [...edits].sort((a, b) => b[0] - a[0])) {
    out = `${out.slice(0, at)} ${ATTRIBUTE}="${name}"${out.slice(at)}`
  }
  return { code: out, count: edits.size }
}

export { ATTRIBUTE }
