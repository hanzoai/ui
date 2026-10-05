/**
 * The code theme: Dracula on dark, GitHub Light on light.
 *
 * `codeTheme` holds shiki's names for the two themes, so a shiki block takes it
 * as is: `codeToHtml(src, { lang, themes: codeTheme })`. `syntax` holds the
 * colours CodeEditor and JsonTree paint with, read from what shiki paints with
 * those two themes, so a highlighted block and an editor agree.
 *
 * Shiki paints a JSON number, boolean and null in one colour in both themes, and
 * GitHub Light paints a key in that colour too. A reader telling `1` from `true`
 * from `null` at a glance needs five colours, so the three take other colours
 * from the same theme: a number its constant purple, a boolean its green, a null
 * its keyword colour, which is what `null` is.
 *
 * The components never read these values directly. `gui-config` publishes each
 * as a theme key (`$codeKey`, `var(--codeKey)` …), so a colour follows the
 * nearest theme, nested ones included.
 */
export const codeTheme = { dark: 'dracula', light: 'github-light' } as const

export type CodeToken = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'comment' | 'keyword'

export const syntax = {
  dark: {
    key: '#8be9fd',
    string: '#f1fa8c',
    number: '#bd93f9',
    boolean: '#50fa7b',
    null: '#ff79c6',
    punctuation: '#f8f8f2',
    comment: '#6272a4',
    keyword: '#ff79c6',
  },
  light: {
    key: '#005cc5',
    string: '#032f62',
    number: '#6f42c1',
    boolean: '#22863a',
    null: '#d73a49',
    punctuation: '#24292e',
    comment: '#6a737d',
    keyword: '#d73a49',
  },
} as const satisfies Record<keyof typeof codeTheme, Record<CodeToken, string>>
