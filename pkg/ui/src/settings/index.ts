/**
 * @hanzo/ui/settings — a settings page, and what its sections are drawn from.
 *
 * `Settings` is the page: the sections grouped in a column from `md` up, a row
 * of chips below it, and the open section in a 760px column. The section is the
 * host's `children`, drawn from `Heading`, `Group`, `Card` + `Row`, `Field`,
 * `Soft`, `Note` and `Once`, so every section of every surface reads as one
 * page.
 *
 * Props in, callbacks out: which section is open is the host's (its address),
 * and nothing here fetches.
 */
export { Settings, type Entry, type SettingsProps } from './Settings'
export {
  Card,
  Field,
  Group,
  Heading,
  Note,
  Once,
  Row,
  Soft,
  type GroupProps,
  type HeadingProps,
  type OnceProps,
  type RowProps,
} from './Section'
