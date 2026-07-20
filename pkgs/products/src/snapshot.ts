/**
 * The checked-in catalog snapshot — the build-time fallback AND the seed handed to
 * commerce's `/v1/commerce/catalog`. Generated from the console2 catalog (the
 * richest hand-maintained list) as the one-time bootstrap; thereafter commerce is
 * the editable source and this is the offline fallback the client returns when
 * commerce is unreachable, so NOTHING static hard-depends on commerce being up.
 *
 * It is intentionally a plain JSON artifact (also exposed at `@hanzo/products/snapshot`)
 * so commerce can import it directly to seed the `hanzo-platform` collection.
 */
import catalog from "../snapshot/catalog.json"
import type { CatalogEntry } from "./types"

/** The full 103-product catalog snapshot. */
export const SNAPSHOT = catalog as unknown as CatalogEntry[]
