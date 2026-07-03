import { GeistMono } from "geist/font/mono"
import localFont from "next/font/local"

// Canonical Hanzo typography (single source of truth; see DESIGN.md):
//  - UI / body / display / heading -> Basel Grotesk (self-hosted, Book 400 + Medium 500)
//  - code / data / mono            -> Geist Mono
// Basel replaces Geist Sans / DM Sans / Figtree / Inter as the default sans.
export const fontSans = localFont({
  src: [
    { path: "../fonts/Basel-Grotesk-Book.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Basel-Grotesk-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-basel-sans",
  display: "swap",
})

export const fontMono = GeistMono
