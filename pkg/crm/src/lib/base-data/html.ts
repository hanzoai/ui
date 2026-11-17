/**
 * An `editor` field and the text a person reads and writes. Base keeps an editor
 * field as HTML — paragraphs, breaks, every character escaped — and a page that
 * showed it as stored printed "<p>I&#39;m a product designer…" (hanzo-inc/cloud#478).
 * So an editor field is read as text and written back as paragraphs.
 */

/** One pass of HTML to text: paragraphs, breaks and tags, then the entities read back. */
const unhtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>\s*/gi, '\n')
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

/**
 * An editor field's HTML as the plain text a person wrote. A mail that was HTML
 * already is filed escaped inside the editor's paragraphs, so what one pass leaves
 * still reads as markup: it is read again, once.
 */
export function plain(html: string): string {
  let text = unhtml(html)
  if (/<\/?[a-z][^>]*>/i.test(text)) text = unhtml(text)
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/** Text as an editor field holds it: each paragraph its own, every character escaped. */
export function paragraphs(text: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/**
 * An editor field as the text a field shows and edits: its paragraphs apart by a
 * blank line, so paragraphs() writes back the paragraphs it read.
 */
export const editorText = (html: string): string =>
  html
    .split(/<\/p\s*>/i)
    .map(plain)
    .filter(Boolean)
    .join('\n\n')
