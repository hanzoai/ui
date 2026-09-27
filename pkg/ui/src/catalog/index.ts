/**
 * @hanzo/ui/catalog — a catalogue page: what an org has, and what it can add.
 *
 * `Shelf` is the page — title, the kinds as tabs, Yours/Discover, one search
 * and one Add over both — and the cards are its `children`: `Tiles` of `Tile`s,
 * a `Featured` first, each with an `Add`.
 *
 * Web-only, and off `@hanzo/ui/product` for it: `Tiles` lays out on
 * `@hanzo/ui/grid` (a `div` with `display: grid`), which the cross-platform
 * product layer cannot promise. The section parts a tab draws around its cards
 * — `Group`, `Soft`, `Note`, `Field` — are `@hanzo/ui/settings`'s, one set for
 * every page.
 */
export { Shelf, type ShelfProps } from './Shelf'
export {
  Add,
  Featured,
  Tile,
  Tiles,
  type AddProps,
  type FeaturedProps,
  type TileProps,
  type TilesProps,
} from './Tile'
