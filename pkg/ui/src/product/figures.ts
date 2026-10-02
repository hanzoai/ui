/**
 * Figures: the mono face with tabular digits, so a column of prices, IDs and
 * counts lines up digit under digit. Spread onto a gui Text.
 *
 *   <Text {...FIGURES}>{value}</Text>
 */
export const FIGURES = {
  fontFamily: '$mono' as const,
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
  letterSpacing: '-0.01em' as never,
}

/** Tabular digits in the surrounding face: a header over a column of figures. */
export const TABULAR = { fontVariant: ['tabular-nums'] as ['tabular-nums'] }
