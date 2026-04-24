/**
 * @hanzo/brand — Hanzo brand only.
 *
 * Each org owns its own brand package. Do NOT add other orgs here.
 *   Zoo       → @zooai/brand
 *   Lux       → @luxfi/brand
 *   Liquidity → @liquidityio/brand
 */

export type {
  OrgId,
  ColorMode,
  BrandColors,
  BrandLogo,
  BrandSocial,
  BrandSeo,
  BrandConfig,
} from './types'

export {
  hanzoMark,
  hanzoMarkDark,
  hanzoMarkLight,
  hanzoWordmark,
  hanzoWordmarkDark,
  hanzoWordmarkLight,
  hanzoFavicon,
  svgToDataUri,
} from './svg'

export { hanzo, orgs, getOrg } from './orgs'
export { hanzo as defaultBrand } from './orgs'
