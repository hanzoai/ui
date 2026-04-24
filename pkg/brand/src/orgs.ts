/**
 * Hanzo brand configuration.
 *
 * Separation of concerns: this file owns ONLY Hanzo's identity.
 *   @zooai/brand       → Zoo (github.com/zooai/brand)
 *   @luxfi/brand       → Lux (github.com/luxfi/brand)
 *   @liquidityio/brand → Liquidity (github.com/liquidityio/brand)
 *
 * Never add other orgs' identities here.
 */
import type { BrandConfig } from './types'
import {
  hanzoMark,
  hanzoMarkDark,
  hanzoMarkLight,
  hanzoWordmark,
  hanzoWordmarkDark,
  hanzoWordmarkLight,
  hanzoFavicon,
} from './svg'

export const hanzo: BrandConfig = {
  id: 'hanzo',
  name: 'Hanzo',
  orgName: 'Hanzo AI',
  orgHandle: 'hanzoai',
  tagline: 'AI infrastructure for the future',
  description: 'Frontier AI infrastructure, foundational models, and developer tools.',

  npmOrg: '@hanzo',

  domain: 'hanzo.ai',
  iamDomain: 'hanzo.id',
  githubOrg: 'hanzoai',
  docsUrl: 'https://docs.hanzo.ai',

  logo: {
    mark: hanzoMark,
    markDark: hanzoMarkDark,
    markLight: hanzoMarkLight,
    wordmark: hanzoWordmark,
    wordmarkDark: hanzoWordmarkDark,
    wordmarkLight: hanzoWordmarkLight,
    favicon: hanzoFavicon,
    width: 67,
    height: 67,
  },

  colors: {
    primary: '222.2 47.4% 11.2%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
  },

  social: {
    twitter: '@hanzoai',
    github: 'https://github.com/hanzoai',
  },

  seo: {
    title: 'Hanzo AI — Infrastructure for AI',
    description: 'Frontier AI infrastructure and developer tools.',
    keywords: ['ai', 'infrastructure', 'hanzo', 'llm', 'mcp'],
  },
}

export const orgs = { hanzo }
export function getOrg(): BrandConfig {
  return hanzo
}
