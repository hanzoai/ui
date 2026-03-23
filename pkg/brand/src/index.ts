/**
 * @hanzo/brand
 *
 * Brand assets and configuration for Hanzo, Lux, Zoo, and Pars organizations.
 *
 * Exports:
 *   - SVG strings (mark, wordmark, favicon) in dark/light/currentColor variants
 *   - Per-org BrandConfig objects
 *   - TypeScript types for brand configuration
 *   - svgToDataUri helper
 */

// Types
export type {
  OrgId,
  ColorMode,
  BrandColors,
  BrandLogo,
  BrandSocial,
  BrandSeo,
  BrandConfig,
} from './types'

// SVG strings
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

// Per-org configs
export {
  hanzo,
  lux,
  zoo,
  pars,
  orgs,
  getOrg,
} from './orgs'

// Default brand (backward compat with v1.0.0 stub)
export { hanzo as defaultBrand } from './orgs'
