/**
 * A country's flag as text: the two regional-indicator letters of its ISO
 * 3166-1 alpha-2 code, which a platform draws as its flag emoji. No assets ship
 * with the package for it; a platform that has no flag glyphs (Windows) draws the
 * two letters, which still name the country. Anything that is not two ASCII
 * letters is not a country code, and has no flag.
 */
export const flag = (iso: string | null | undefined): string | null => {
  const code = iso?.trim().toUpperCase()
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}
