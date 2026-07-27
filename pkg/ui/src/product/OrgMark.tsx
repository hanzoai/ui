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
 * the chrome; colour stays with content.
 */
import { Text, YStack } from '@hanzo/gui'

import type { Org } from './scope'

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

export function OrgMark({ org, size = 22, maxW }: OrgMarkProps) {
  if (org.logo) {
    // An arbitrary tenant-supplied URL — a raw <img>, since next/image would need
    // a remote allow-list per customer domain.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={org.logo}
        alt=""
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
      <Text fontSize={Math.round(size * 0.4)} fontWeight="800" color="$color12">
        {monogram(org.displayName || org.name)}
      </Text>
    </YStack>
  )
}
