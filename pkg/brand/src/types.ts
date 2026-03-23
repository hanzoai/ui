/**
 * Shared types for brand configuration.
 */

export type OrgId = 'hanzo' | 'lux' | 'zoo' | 'pars'

export type ColorMode = 'light' | 'dark'

export interface BrandColors {
  /** HSL value (without hsl() wrapper), e.g. "222.2 47.4% 11.2%" */
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
}

export interface BrandLogo {
  /** SVG string -- currentColor variant */
  mark: string
  /** SVG string -- dark background variant (light fill) */
  markDark: string
  /** SVG string -- light background variant (dark fill) */
  markLight: string
  /** SVG string -- currentColor wordmark */
  wordmark: string
  /** SVG string -- dark background wordmark */
  wordmarkDark: string
  /** SVG string -- light background wordmark */
  wordmarkLight: string
  /** SVG string for favicon */
  favicon: string
  /** viewBox width */
  width: number
  /** viewBox height */
  height: number
}

export interface BrandSocial {
  twitter?: string
  discord?: string
  github: string
}

export interface BrandSeo {
  title: string
  description: string
  keywords: string[]
}

export interface BrandConfig {
  /** Short org identifier */
  id: OrgId
  /** Display name */
  name: string
  /** Full organization name */
  orgName: string
  /** Org handle (lowercase, no spaces) */
  orgHandle: string
  /** One-liner */
  tagline: string
  /** Longer description */
  description: string

  /** npm scope, e.g. "@hanzo" */
  npmOrg: string

  /** Primary domain */
  domain: string
  /** IAM domain for auth */
  iamDomain: string
  /** GitHub org handle */
  githubOrg: string
  /** Docs URL */
  docsUrl: string

  /** Logo/mark assets (SVG strings) */
  logo: BrandLogo

  /** Brand colors (HSL values) */
  colors: BrandColors

  /** Social links */
  social: BrandSocial

  /** SEO defaults */
  seo: BrandSeo
}
