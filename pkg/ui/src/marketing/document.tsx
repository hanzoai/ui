'use client'

/**
 * Document — the body of a long document: a policy, a set of terms, an
 * explanation.
 *
 * Its content is authored as markdown and arrives as bare tags, which no prop
 * can reach, so the type is `@hanzo/ui/styles/document.css`, keyed on the slot
 * this stamps and selecting by tag from here down. `html` is a document
 * rendered from markdown at build time; it goes on this element itself, because
 * nested one level deeper the whole document would be one flex item and every
 * paragraph gap would vanish.
 *
 * A plain element, not a gui frame: a frame's base would lay the paragraphs out
 * as its own flex items with its own type, and the sheet is the type here.
 */
import type { ReactNode } from 'react'

export type DocumentProps = { html?: string; children?: ReactNode }

const Document = ({ html, children }: DocumentProps) =>
  html !== undefined ? (
    <div data-slot="document" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div data-slot="document">{children}</div>
  )

export { Document }
