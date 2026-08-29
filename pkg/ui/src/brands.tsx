// brands.tsx — the marks that belong to somebody else.
//
// lucide 1.0 removed them. It draws a vocabulary — a gear, an arrow, a
// magnifier — and a company's logo is not vocabulary: it is that company's
// property, it changes when they change it, and it cannot be restyled to fit a
// set. simple-icons is the collection that exists for exactly this and tracks
// those changes, so the marks come from there and the names stay what every call
// site already writes.
//
// Twitter is X. The company renamed, simple-icons followed, and a call site
// still saying `Twitter` gets the mark that is actually on the site it links to.
//
// LinkedIn asked to be removed from simple-icons, so it is drawn here — the same
// nominative use as every other mark on this list: a link to their site, wearing
// their sign.

import * as React from 'react'
import {
  SiFacebook,
  SiGithub,
  SiGooglechrome,
  SiInstagram,
  SiTrello,
  SiX,
  SiYoutube,
} from '@icons-pack/react-simple-icons'

/** Read off a mark rather than named: one definition, and it follows theirs. */
export type BrandProps = React.ComponentProps<typeof SiGithub>

export {
  SiGithub as Github,
  SiX as Twitter,
  SiX as X,
  SiGooglechrome as Chrome,
  SiFacebook as Facebook,
  SiInstagram as Instagram,
  SiTrello as Trello,
  SiYoutube as Youtube,
}

/** LinkedIn, drawn here because simple-icons was asked to drop it. */
export const Linkedin = ({ size = 24, color = 'currentColor', ...props }: BrandProps) => (
  <svg
    role='img'
    viewBox='0 0 24 24'
    width={size}
    height={size}
    fill={color}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <title>LinkedIn</title>
    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z' />
  </svg>
)
