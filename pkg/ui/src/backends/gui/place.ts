/**
 * PLACE — one floating panel, two vocabularies.
 *
 * gui speaks floating-ui's single placement string (`bottom`, `bottom-start`),
 * and it keeps that string on the popper ROOT. The compound API every call site
 * is written against splits the same fact in two and puts it on the CONTENT: a
 * `side` and an `align`. Rejoining them is the whole of the translation, and it
 * belongs in one place because two components need it — `popover` and
 * `hover-card`, which is a popover in hover mode.
 *
 * It lives in its own leaf rather than in either component so that neither has
 * to import the other for it. It was written twice before that was true, and the
 * two copies had already diverged: one of them could not re-align a side that
 * already carried a suffix.
 */

/** Where the panel sits relative to its trigger. */
export type Side = 'top' | 'right' | 'bottom' | 'left'

/** Where the panel lines up along that side. */
export type Align = 'start' | 'center' | 'end'

/**
 * The placement a side and an align name together.
 *
 * `center` is the ABSENCE of a suffix rather than a suffix of its own, and a
 * side that already carries one is RE-aligned rather than appended to — so the
 * result is always a legal placement and applying it twice changes nothing.
 *
 * An align that is not named does not mean centre. A side arrives already
 * carrying its own alignment whenever the root was given a whole placement, and
 * only a Content that names one has anything to say about it — so the carried
 * suffix survives, and naming `center` is how a caller re-centres on purpose.
 *
 *     place('bottom')              === 'bottom'
 *     place('bottom', 'start')     === 'bottom-start'
 *     place('bottom-start')        === 'bottom-start'
 *     place('bottom-end', 'start') === 'bottom-start'
 *     place('bottom-start', 'center') === 'bottom'
 */
export const place = (side: string, align?: Align): string => {
  const [base, carried] = side.split('-')
  const named = align ?? (carried as Align | undefined)
  return !named || named === 'center' ? base : `${base}-${named}`
}
