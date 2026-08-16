'use client'

/**
 * OrgMark — the ONE organization identity treatment.
 *
 * An org shows its OWN logo when IAM carries one; when it does not, it shows its
 * MONOGRAM on a neutral tile — the same treatment the account widget gives a
 * person, so a workspace and a user read as peers. It is never a house mark: a
 * customer's console must show the customer's identity, not ours.
 *
 * Monochrome by construction (`$color4` tile, `$color12` glyph) so it belongs to
 * the chrome; colour stays with content — with one exception: an emoji logo is
 * rendered in full colour, because a monochrome emoji is not the emoji.
 *
 * Three kinds of `logo`, resolved in order: a URL, a short emoji string, or
 * nothing. A URL that FAILS to load falls back to the monogram rather than
 * leaving a broken-image glyph in the chrome — org logos are tenant-supplied and
 * a dead link is the normal case, not the exceptional one.
 */
import { useEffect, useState } from 'react'
import { Text, YStack } from '@hanzo/gui'

import type { Org } from './scope'

/**
 * An emoji mark rather than a URL.
 *
 * Tested by absence of a scheme/path and by shortness — an emoji sequence is a
 * handful of code points, and `Intl.Segmenter` counts grapheme clusters so a
 * flag or a family (several code points, one glyph) reads as one character.
 * Falls back to code-point length where `Segmenter` is unavailable.
 */
export function isEmoji(logo: string): boolean {
  const s = logo.trim()
  if (!s || /^(https?:|data:|\/)/.test(s)) return false
  // Regional_Indicator as well as Extended_Pictographic: a flag is a pair of
  // regional indicators and carries no pictographic code point at all, so the
  // pictographic test alone rejects every country mark.
  if (!/[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(s)) return false
  const Seg = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  const units = Seg ? [...new Seg().segment(s)].length : [...s].length
  return units <= 3
}

/**
 * The monogram for a name: the first letter of each of the first two words,
 * uppercased — the SAME rule @hanzo/iam's account widget applies to a person, so
 * a workspace and a user wear one treatment. Words break on whitespace and on the
 * separators an org id carries (`.`, `_`, `-`, `/`), so `acme-labs` reads AL
 * while a single word reads its one initial.
 */
export function monogram(name: string): string {
  const words = name.trim().split(/[\s._/-]+/).filter(Boolean)
  const letters = words
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
  return (letters || name.trim().slice(0, 2)).toUpperCase()
}

export type OrgMarkProps = {
  /** The org to mark — its `logo` wins, else the monogram of its display name. */
  org: Org
  /** Edge of the square tile / height of the logo. Default 22. */
  size?: number
  /**
   * Widest a LOGO may run, for a wordmark that is not square. Omit to keep the
   * logo square like the monogram (a switcher row, an avatar slot).
   */
  maxW?: number
}

/**
 * A mark's glyph is sized by TOKEN, not by arithmetic.
 *
 * It used to be a ratio of the tile — `size * 0.4` — which bypasses the type
 * system in two ways. It lands off the scale (at the 30px mark both identity
 * controls use it computed 12, a value on no ladder, and the console's design
 * sweep found it on every screen that renders a mark). And a raw pixel cannot
 * answer to `--type-scale`: the ramp behind every token is
 * `var(--text-sm, 13px)` and design multiplies it, so a person who turns their
 * type up watches all text grow EXCEPT the monogram, which is the one place the
 * drift is most visible because it sits beside their own name.
 *
 * So the tile's size chooses a token and the token carries the value. Bands
 * rather than a formula, because a token IS a band — the ladder is not linear,
 * and rounding onto it is the same mistake in a nicer coat.
 */
const glyphToken = (size: number): '$1' | '$2' | '$4' | '$6' =>
  size < 26 ? '$1' : size < 34 ? '$2' : size < 44 ? '$4' : '$6'

export function OrgMark({ org, size = 22, maxW }: OrgMarkProps) {
  // Reset when the mark changes: switcher rows reuse instances, so a failure on
  // one org must not blank the next org's logo.
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [org.logo])

  if (org.logo && isEmoji(org.logo)) {
    return (
      <YStack
        width={size}
        height={size}
        items="center"
        justify="center"
        style={{ flexShrink: 0 }}
      >
        <Text fontSize={Math.round(size * 0.72)} lineHeight={size}>
          {org.logo.trim()}
        </Text>
      </YStack>
    )
  }

  if (org.logo && !broken) {
    // An arbitrary tenant-supplied URL — a raw <img>, since next/image would need
    // a remote allow-list per customer domain.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={org.logo}
        alt=""
        onError={() => setBroken(true)}
        style={{
          height: size,
          width: maxW ? 'auto' : size,
          maxWidth: maxW ?? size,
          objectFit: 'contain',
          display: 'block',
          borderRadius: 6,
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <YStack
      width={size}
      height={size}
      rounded="$3"
      bg="$color4"
      items="center"
      justify="center"
      style={{ flexShrink: 0 }}
    >
      <Text fontSize={glyphToken(size)} fontWeight="800" color="$color12">
        {monogram(org.displayName || org.name)}
      </Text>
    </YStack>
  )
}
