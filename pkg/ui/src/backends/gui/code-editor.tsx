'use client'

/**
 * CodeEditor — a CodeMirror 6 editor in a gui frame: a toolbar with the
 * language (a menu, or a label), Format for JSON and Copy; the editor with a
 * line-number gutter; and a footer that reports whether JSON parses and is the
 * handle that resizes the editor.
 *
 * Height. With no `height` the editor is as tall as its text, from `minHeight`
 * up to `maxHeight`, and scrolls past that. Dragging its bottom edge (`Grip`,
 * or ArrowUp / ArrowDown on it) sets a height of the reader's own, past the cap
 * if they want; a double-click hands the height back to the text. A `height` fixes it,
 * and `'100%'` fills a frame that is itself sized (a flex child).
 *
 * JSON. `language="json"` colours the syntax and checks the text on every
 * change with `checkJson`: a broken document tints the failing line, marks the
 * failing character and names line, column and reason in the footer. Every
 * object and array that spans lines folds from a marker in the gutter, and a
 * folded one reads `{…}` or `[…]` with how many keys or items it hides. With
 * `allowText`, text that does not open an object or an array is plain text and
 * passes. Format (or Shift-Alt-F) re-indents valid JSON by two spaces. Other
 * languages are edited as plain text: the package carries one grammar.
 *
 * Colour. The frame's colours are theme rungs over design tokens — the ink, the
 * hairline, the selection and the error state — and the syntax is the code
 * theme (`code-theme.ts`: Dracula on dark, GitHub Light on light), each token a
 * theme key of its own. Both follow the page into light or dark with nothing to
 * configure.
 */
import { SizableText, XStack, YStack, type YStackProps } from '@hanzo/gui'
import { AlignLeft, Check, CircleAlert, CircleCheck, Copy, Type } from '@hanzogui/lucide-icons-2'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { jsonLanguage } from '@codemirror/lang-json'
import {
  HighlightStyle,
  LanguageSupport,
  bracketMatching,
  codeFolding,
  foldGutter,
  foldKeymap,
  foldNodeProp,
  indentOnInput,
  syntaxHighlighting,
  syntaxTree,
} from '@codemirror/language'
import { Annotation, Compartment, EditorState, RangeSet, RangeSetBuilder, StateField } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  GutterMarker,
  drawSelection,
  gutterLineClass,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers as numbering,
  placeholder as hint,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import * as React from 'react'

import { Button } from './button'
import { Grip } from './grip'
import { checkJson, formatJson, type JsonCheck } from './json'
import { Select, SelectContent, SelectItem, SelectTrigger } from './select'
import { slot } from './slot'
import { toast } from './toaster'

export type CodeEditorWordWrap = 'on' | 'off' | 'wordWrapColumn' | 'bounded'

/** The languages the menu offers when a caller does not narrow the list. */
const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'dart',
  'html',
  'css',
  'scss',
  'json',
  'xml',
  'yaml',
  'sql',
  'markdown',
  'shell',
  'plaintext',
] as const

const LABEL: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  dart: 'Dart',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  sql: 'SQL',
  markdown: 'Markdown',
  shell: 'Shell',
  plaintext: 'Plain Text',
}

/** The tallest a drag makes the editor, px: a ceiling that is not one. */
const CEILING = 4096
/** Half the grip's band, so it sits astride the editor's edge. */
const BAND_HALF = 4

/** Line height as a multiple of the font size. */
const LEADING = 1.6
const MONO = "var(--font-mono, 'Zen Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)"

/**
 * The editor's surface. Every colour is one of the theme's named rungs — gui emits
 * each as a custom property on the theme class, so it inverts with the page — and
 * those rungs read @hanzo/design's tokens (`--ink` is `--foreground`, `--edge` is
 * `--border`, `--bad` is `--state-error`). The design ladder is NOT read directly:
 * on a host that mounts design's sheet without its light selector, `--text-primary`
 * stays the dark theme's white on a light page.
 */
const FRAME = /* @__PURE__ */ EditorView.theme({
  '&': { color: 'var(--ink)', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  // The scroller fills what the editor is given and no more: grown with its text up to the
  // editor's max-height, then scrolling; stretched to a fixed or dragged height. CodeMirror's
  // own `height: 100%` resolves against an auto-height editor as its min-height, which pinned
  // a growing editor at its floor.
  '.cm-scroller': {
    fontFamily: MONO,
    lineHeight: String(LEADING),
    overflow: 'auto',
    flex: '1 1 auto',
    height: 'auto',
    minHeight: '0',
  },
  '.cm-content': { padding: '8px 0', caretColor: 'var(--ink)' },
  '.cm-line': { padding: '0 12px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--dim)',
    border: 'none',
    borderRight: '1px solid var(--edge)',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 12px', minWidth: '28px' },
  '.cm-activeLine': { backgroundColor: 'var(--panel)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--quiet)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--ink)' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--raised)',
  },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--raised)',
    color: 'inherit',
    outline: 'none',
  },
  '.cm-nonmatchingBracket, &.cm-focused .cm-nonmatchingBracket': { backgroundColor: 'transparent' },
  '.cm-placeholder': { color: 'var(--dim)' },
  '.cm-foldGutter .cm-gutterElement': { padding: '0 4px', color: 'var(--dim)', cursor: 'pointer' },
  '.cm-foldGutter .cm-gutterElement:hover': { color: 'var(--ink)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--raised)',
    border: '1px solid var(--edge)',
    borderRadius: '4px',
    color: 'var(--codePunctuation)',
    padding: '0 4px',
    margin: '0 2px',
    cursor: 'pointer',
  },
  '.cm-foldCount': { color: 'var(--codeComment)' },
  '.cm-fault': { backgroundColor: 'var(--state-error-bg, rgb(239 68 68 / .1))' },
  '.cm-gutterElement.cm-fault': { color: 'var(--bad)' },
  '.cm-fault-at': {
    textDecoration: 'underline wavy var(--bad)',
    textDecorationSkipInk: 'none',
    textUnderlineOffset: '3px',
  },
})

/** The syntax in the code theme's colours: one theme key per kind of token, from `code-theme.ts`. */
const SYNTAX = /* @__PURE__ */ HighlightStyle.define([
  { tag: tags.propertyName, color: 'var(--codeKey)' },
  { tag: tags.string, color: 'var(--codeString)' },
  { tag: tags.number, color: 'var(--codeNumber)' },
  { tag: tags.bool, color: 'var(--codeBoolean)' },
  { tag: tags.null, color: 'var(--codeNull)' },
  { tag: [tags.punctuation, tags.separator, tags.brace, tags.squareBracket], color: 'var(--codePunctuation)' },
  { tag: tags.comment, color: 'var(--codeComment)' },
  { tag: tags.keyword, color: 'var(--codeKeyword)' },
])

/**
 * JSON folds from its opening bracket through its closing one, so a folded block
 * is drawn whole as `{…}` or `[…]` and has room to say what it holds. lang-json
 * folds inside the brackets, which leaves them standing around an ellipsis.
 */
const JSON_GRAMMAR = /* @__PURE__ */ new LanguageSupport(
  jsonLanguage.configure({
    props: [foldNodeProp.add({ 'Object Array': (node) => ({ from: node.from, to: node.to }) })],
  }),
)

const words = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/** What a folded range holds: its brackets and how many keys or items sit inside. */
function measureFold(state: EditorState, range: { from: number; to: number }) {
  let node = syntaxTree(state).resolveInner(range.from, 1)
  while (node.parent && node.name !== 'Object' && node.name !== 'Array') node = node.parent
  if (node.name === 'Object') return { open: '{', close: '}', count: words(node.getChildren('Property').length, 'key') }
  let n = 0
  for (let c = node.firstChild; c; c = c.nextSibling) if (!/^[[\],]$/.test(c.name) && !c.type.isError) n += 1
  return { open: '[', close: ']', count: words(n, 'item') }
}

const FOLDING = /* @__PURE__ */ codeFolding({
  preparePlaceholder: measureFold,
  placeholderDOM: (_view, onclick, fold: ReturnType<typeof measureFold>) => {
    const el = document.createElement('span')
    el.className = 'cm-foldPlaceholder'
    el.title = 'Unfold'
    el.setAttribute('aria-label', `Folded, ${fold.count}`)
    el.textContent = `${fold.open}…${fold.close}`
    const count = document.createElement('span')
    count.className = 'cm-foldCount'
    count.textContent = ` ${fold.count}`
    el.append(count)
    el.onclick = onclick
    return el
  },
})

/** How much deeper than its line a wrapped continuation starts, in characters. */
const HANG = 2

/** A line's own indentation in characters, a tab counted at the editor's tab width. */
const indentOf = (text: string, tab: number) => {
  let n = 0
  for (const c of text) {
    if (c === ' ') n += 1
    else if (c === '\t') n += tab - (n % tab)
    else break
  }
  return n
}

const hangs = new Map<number, Decoration>()
const hangFor = (n: number) => {
  let d = hangs.get(n)
  if (!d) {
    d = Decoration.line({ attributes: { style: `padding-left: calc(${n}ch + 12px); text-indent: -${n}ch` } })
    hangs.set(n, d)
  }
  return d
}

/**
 * Wrapped lines hang under their own text rather than restarting at the margin, so a
 * long string inside nested JSON still reads as belonging to its key. A line's padding
 * is its indentation plus the hang, and a negative text-indent of the same width puts
 * its first row back where it was.
 */
const hang = /* @__PURE__ */ ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = this.build(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view)
    }
    build(view: EditorView) {
      const out = new RangeSetBuilder<Decoration>()
      for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          const line = view.state.doc.lineAt(pos)
          out.add(line.from, line.from, hangFor(indentOf(line.text, view.state.tabSize) + HANG))
          pos = line.to + 1
        }
      }
      return out.finish()
    }
  },
  { decorations: (v) => v.decorations },
)

/** Marks a programmatic edit, so a caller's own `value` is never echoed back to `onChange`. */
const External = /* @__PURE__ */ Annotation.define<boolean>()

class Fault extends GutterMarker {
  override elementClass = 'cm-fault'
}
const FAULT_GUTTER = /* @__PURE__ */ new Fault()
const FAULT_LINE = /* @__PURE__ */ Decoration.line({ class: 'cm-fault' })
const FAULT_AT = /* @__PURE__ */ Decoration.mark({ class: 'cm-fault-at' })

type Verdict = { check: JsonCheck; marks: DecorationSet; gutter: RangeSet<GutterMarker> }

function judge(state: EditorState, text: boolean): Verdict {
  const check = checkJson(state.doc.toString(), { text })
  if (check.kind !== 'error') return { check, marks: Decoration.none, gutter: RangeSet.empty }
  const at = Number.isFinite(check.at) ? Math.min(check.at, state.doc.length) : 0
  const line = state.doc.lineAt(at)
  const end = Math.min(at + 1, line.to)
  const ranges = [FAULT_LINE.range(line.from), ...(end > at ? [FAULT_AT.range(at, end)] : [])]
  return { check, marks: Decoration.set(ranges, true), gutter: RangeSet.of([FAULT_GUTTER.range(line.from)]) }
}

/** The JSON verdict as editor state: recomputed on every edit, drawn as decorations. */
const verdict = (text: boolean) =>
  StateField.define<Verdict>({
    create: (state) => judge(state, text),
    update: (value, tr) => (tr.docChanged ? judge(tr.state, text) : value),
    provide: (field) => [
      EditorView.decorations.from(field, (v) => v.marks),
      gutterLineClass.from(field, (v) => v.gutter),
    ],
  })

const px = (v: string | number) => (typeof v === 'number' ? `${v}px` : v)

export interface CodeEditorProps
  extends Omit<YStackProps, 'children' | 'height' | 'minHeight' | 'maxHeight' | 'onChange'> {
  /** A controlled value; omit it and set `defaultValue` to let the editor own its text. */
  value?: string
  defaultValue?: string
  language?: string
  /** A fixed height. Omit it and the editor follows its text between `minHeight` and `maxHeight`. */
  height?: string | number
  /** The shortest the editor gets when it follows its text, in px. */
  minHeight?: number
  /** The tallest it grows on its own, in px; past it the editor scrolls. */
  maxHeight?: number
  /** Whether the editor's bottom edge resizes it. Defaults to true unless `height` is set. */
  resizable?: boolean
  /** JSON only: text that does not open an object or an array is plain text, not an error. */
  allowText?: boolean
  onChange?: (value: string) => void
  /** JSON only: the verdict on the text, after mount and after every edit. */
  onCheck?: (check: JsonCheck) => void
  /** Called once, after mount, with the CodeMirror view. */
  onMount?: (view: EditorView) => void
  readOnly?: boolean
  lineNumbers?: boolean
  wordWrap?: CodeEditorWordWrap
  fontSize?: number
  /** Shown while the editor is empty. */
  placeholder?: string
  showCopyButton?: boolean
  /** Defaults to true for editable JSON. */
  showFormatButton?: boolean
  showLanguageSelector?: boolean
  availableLanguages?: readonly string[]
  /**
   * The editor's accessible name. An editing surface with none is announced
   * with nothing to say what it holds; a file's path is the usual answer.
   * Defaults to "Code".
   */
  label?: string
}

export function CodeEditor({
  value,
  defaultValue = '',
  language = 'javascript',
  height,
  minHeight = 96,
  maxHeight = 480,
  resizable = height === undefined,
  allowText = false,
  onChange,
  onCheck,
  onMount,
  readOnly = false,
  lineNumbers = true,
  wordWrap = 'on',
  fontSize = 14,
  placeholder,
  showCopyButton = true,
  showFormatButton,
  showLanguageSelector = true,
  availableLanguages = LANGUAGES,
  label = 'Code',
  ...props
}: CodeEditorProps) {
  const [selected, setSelected] = React.useState(language)
  const [text, setText] = React.useState(value ?? defaultValue)
  const [check, setCheck] = React.useState<JsonCheck | null>(null)
  const [copied, setCopied] = React.useState(false)

  const host = React.useRef<HTMLElement | null>(null)
  /** Every text reported to `onChange` and not yet seen back as `value`. */
  const sent = React.useRef<string[]>([])
  const view = React.useRef<EditorView | null>(null)
  /** A height the reader dragged to, or null while the editor follows its text. */
  const [dragged, setDragged] = React.useState<number | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const listeners = React.useRef({ onChange, onCheck })
  listeners.current = { onChange, onCheck }

  const compartments = React.useMemo(
    () => ({ language: new Compartment(), gutter: new Compartment(), wrap: new Compartment(), edit: new Compartment() }),
    [],
  )
  const isJson = selected === 'json'
  const field = React.useMemo(() => verdict(allowText), [allowText])
  const judged = React.useRef<{ field: typeof field; seen?: Verdict }>({ field })
  judged.current.field = field

  const grammar = () => (isJson ? [JSON_GRAMMAR, field, FOLDING, foldGutter()] : [])
  const gutter = () => (lineNumbers ? [numbering(), highlightActiveLineGutter()] : [])
  const wrap = () => (wordWrap === 'off' ? [] : [EditorView.lineWrapping, hang])
  const edit = () => [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]

  /** Report the JSON verdict when it changed (an edit, or a new grammar). */
  const report = (state: EditorState) => {
    const v = state.field(judged.current.field, false)
    if (v === judged.current.seen) return
    judged.current.seen = v
    setCheck(v ? v.check : null)
    if (v) listeners.current.onCheck?.(v.check)
  }

  const format = React.useCallback(() => {
    const v = view.current
    if (!v || v.state.readOnly) return false
    const current = v.state.doc.toString()
    const next = formatJson(current)
    if (next === null || next === current) return false
    v.dispatch({ changes: { from: 0, to: current.length, insert: next } })
    return true
  }, [])

  React.useEffect(() => {
    const parent = host.current
    if (!parent) return
    const listen = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged && !update.transactions.some((tr) => tr.annotation(External))) {
        const next = update.state.doc.toString()
        setText(next)
        if (listeners.current.onChange) sent.current = [...sent.current.slice(-31), next]
        listeners.current.onChange?.(next)
      }
      report(update.state)
    })
    const editor = new EditorView({
      parent,
      state: EditorState.create({
        doc: value ?? defaultValue,
        extensions: [
          compartments.gutter.of(gutter()),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          highlightActiveLine(),
          syntaxHighlighting(SYNTAX),
          keymap.of([
            { key: 'Shift-Alt-f', run: format },
            indentWithTab,
            ...foldKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            {
              key: 'Escape',
              run: (v) => {
                v.contentDOM.blur()
                return true
              },
            },
          ]),
          compartments.language.of(grammar()),
          compartments.wrap.of(wrap()),
          compartments.edit.of(edit()),
          placeholder ? hint(placeholder) : [],
          EditorView.contentAttributes.of({ 'aria-label': label, 'data-slot': 'code-editor-content' }),
          FRAME,
          listen,
        ],
      }),
    })
    view.current = editor
    report(editor.state)
    onMount?.(editor)
    return () => {
      editor.destroy()
      view.current = null
      clearTimeout(timer.current)
    }
  }, [])

  // Props that reshape the editor reach it as a reconfiguration, not a remount,
  // so the caret, the selection and the undo history survive.
  React.useEffect(() => {
    view.current?.dispatch({
      effects: [
        compartments.language.reconfigure(grammar()),
        compartments.gutter.reconfigure(gutter()),
        compartments.wrap.reconfigure(wrap()),
        compartments.edit.reconfigure(edit()),
      ],
    })
  }, [isJson, field, lineNumbers, wordWrap, readOnly])

  // A controlled value that moved out from under the editor replaces the text. A
  // value the editor itself reported is an echo, however late it arrives: a parent
  // that renders one keystroke behind hands back the text before the last key, and
  // writing that in would drop the key and move the caret.
  React.useEffect(() => {
    const v = view.current
    if (!v || value === undefined) return
    const echo = sent.current.indexOf(value)
    if (echo !== -1) {
      sent.current = sent.current.slice(echo + 1)
      return
    }
    sent.current = []
    const current = v.state.doc.toString()
    if (value === current) return
    v.dispatch({ changes: { from: 0, to: current.length, insert: value }, annotations: External.of(true) })
    setText(value)
  }, [value])

  React.useEffect(() => {
    const dom = view.current?.dom
    if (!dom) return
    dom.style.fontSize = `${fontSize}px`
    const fixed = dragged !== null ? `${dragged}px` : height !== undefined ? px(height) : ''
    dom.style.height = fixed
    dom.style.minHeight = fixed ? '' : `${minHeight}px`
    dom.style.maxHeight = fixed ? '' : `${maxHeight}px`
    view.current?.requestMeasure()
  }, [dragged, height, minHeight, maxHeight, fontSize])

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
      toast.success('Code copied to clipboard')
    } catch {
      toast.error('Failed to copy code')
    }
  }, [text])

  // A percentage height fills a frame that is itself sized; the body has to flex for it to
  // resolve. Any other height is the editor's own, so the body is just as tall as the editor.
  const fills = typeof height === 'string' && height.endsWith('%')
  const formattable = showFormatButton ?? (isJson && !readOnly)
  const toolbar = showLanguageSelector || showCopyButton || formattable
  const footer = isJson && check !== null

  return (
    <YStack
      {...slot('code-editor')}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
      overflow="hidden"
      bg="$background"
      focusWithinStyle={{ borderColor: '$outlineColor' }}
      {...props}
    >
      {toolbar && (
        <XStack
          {...slot('code-editor-toolbar')}
          items="center"
          justify="space-between"
          flexWrap="wrap"
          gap="$2"
          borderBottomWidth={1}
          borderColor="$borderColor"
          bg="$panel"
          px="$2"
          py="$1"
        >
          {showLanguageSelector ? (
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger
                {...slot('code-editor-language-trigger')}
                width="auto"
                minHeight={32}
                borderWidth={0}
                bg="transparent"
                gap="$1.5"
                px="$2"
              >
                <SizableText size="$1" fontFamily="$mono">
                  {LABEL[selected] ?? selected}
                </SizableText>
              </SelectTrigger>
              <SelectContent {...slot('code-editor-language-content')}>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LABEL[lang] ?? lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <SizableText {...slot('code-editor-language')} size="$1" fontFamily="$mono" color="$soft" px="$2">
              {LABEL[selected] ?? selected}
            </SizableText>
          )}
          <XStack items="center" justify="flex-end" flexWrap="wrap" gap="$1" shrink={1} minW={0}>
            {formattable && (
              <Button
                {...slot('code-editor-format-button')}
                variant="ghost"
                size="sm"
                disabled={check?.kind !== 'json'}
                onClick={format}
              >
                <AlignLeft size={14} />
                Format
              </Button>
            )}
            {showCopyButton && (
              <Button
                {...slot('code-editor-copy-button')}
                variant="ghost"
                size="sm"
                disabled={!text}
                onClick={copy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </XStack>
        </XStack>
      )}
      {/* The grip measures its parent, so the editor and its grip share one box. */}
      <YStack position="relative" {...(fills && { flex: 1, minH: 0 })}>
        <YStack ref={host as never} {...slot('code-editor-body')} {...(fills && { flex: 1, minH: 0 })} />
        {resizable && (
          <Grip
            side="top"
            span={dragged ?? minHeight}
            floor={minHeight}
            ceil={CEILING}
            onSpan={setDragged}
            onReset={() => setDragged(null)}
            label={`Resize ${label}`}
            // Astride the editor's bottom edge, so it takes no line from the text.
            b={-BAND_HALF}
          />
        )}
      </YStack>
      {footer && (
        <XStack
          {...slot('code-editor-footer')}
          items="center"
          justify="space-between"
          gap="$2"
          minH={28}
          px="$3"
          py="$1"
          borderTopWidth={1}
          borderColor="$borderColor"
          bg="$panel"
        >
          <Status check={check} />
        </XStack>
      )}
    </YStack>
  )
}

/** The footer's JSON verdict, announced politely when it changes. */
function Status({ check }: { check: JsonCheck | null }) {
  const bad = check?.kind === 'error'
  const words =
    check === null
      ? ''
      : check.kind === 'error'
        ? `Line ${check.line}, column ${check.column}: ${check.message}`
        : check.kind === 'text'
          ? 'Plain text'
          : check.kind === 'empty'
            ? 'Empty'
            : 'Valid JSON'
  return (
    <XStack {...slot('code-editor-status')} aria-live="polite" items="center" gap="$1.5" flex={1} minW={0}>
      {bad ? (
        <CircleAlert size={14} color="$bad" />
      ) : check?.kind === 'text' ? (
        <Type size={14} color="$soft" />
      ) : check?.kind === 'json' ? (
        <CircleCheck size={14} color="$soft" />
      ) : null}
      <SizableText
        {...slot('code-editor-status-text')}
        data-kind={check?.kind}
        size="$1"
        fontFamily="$mono"
        color={bad ? '$bad' : '$soft'}
        numberOfLines={2}
      >
        {words}
      </SizableText>
    </XStack>
  )
}
