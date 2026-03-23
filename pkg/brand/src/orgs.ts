/**
 * Per-org brand configurations.
 */
import type { BrandConfig, OrgId } from './types'
import {
  hanzoMark,
  hanzoMarkDark,
  hanzoMarkLight,
  hanzoWordmark,
  hanzoWordmarkDark,
  hanzoWordmarkLight,
  hanzoFavicon,
} from './svg'

// ---------------------------------------------------------------------------
// Hanzo
// ---------------------------------------------------------------------------

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
    discord: 'https://discord.gg/hanzo',
    github: 'https://github.com/hanzoai',
  },

  seo: {
    title: 'Hanzo AI - Frontier AI Infrastructure',
    description: 'AI infrastructure, foundational models, and developer tools from Hanzo.',
    keywords: ['ai', 'infrastructure', 'llm', 'hanzo', 'mcp', 'agents'],
  },
}

// ---------------------------------------------------------------------------
// Lux
// ---------------------------------------------------------------------------

export const lux: BrandConfig = {
  id: 'lux',
  name: 'Lux',
  orgName: 'Lux Network',
  orgHandle: 'luxfi',
  tagline: 'Multi-consensus blockchain',
  description: 'High-performance blockchain with post-quantum cryptography and multi-consensus architecture.',

  npmOrg: '@luxfi',

  domain: 'lux.network',
  iamDomain: 'lux.id',
  githubOrg: 'luxfi',
  docsUrl: 'https://docs.lux.network',

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
    primary: '250 60% 50%',
    primaryForeground: '0 0% 100%',
    secondary: '250 30% 95%',
    secondaryForeground: '250 60% 20%',
    accent: '250 60% 60%',
    accentForeground: '0 0% 100%',
  },

  social: {
    twitter: '@luxnetwork',
    discord: 'https://discord.gg/lux',
    github: 'https://github.com/luxfi',
  },

  seo: {
    title: 'Lux Network - Multi-Consensus Blockchain',
    description: 'High-performance blockchain with post-quantum cryptography.',
    keywords: ['blockchain', 'lux', 'consensus', 'post-quantum', 'defi'],
  },
}

// ---------------------------------------------------------------------------
// Zoo
// ---------------------------------------------------------------------------

export const zoo: BrandConfig = {
  id: 'zoo',
  name: 'Zoo',
  orgName: 'Zoo Labs Foundation',
  orgHandle: 'zoolabs',
  tagline: 'Open AI research network',
  description: 'Decentralized AI and decentralized science research through community-driven governance.',

  npmOrg: '@zoo',

  domain: 'zoo.ngo',
  iamDomain: 'zoo.id',
  githubOrg: 'zoolabs',
  docsUrl: 'https://docs.zoo.ngo',

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
    primary: '142 60% 40%',
    primaryForeground: '0 0% 100%',
    secondary: '142 30% 95%',
    secondaryForeground: '142 60% 20%',
    accent: '142 60% 50%',
    accentForeground: '0 0% 100%',
  },

  social: {
    twitter: '@zoolabs',
    github: 'https://github.com/zoolabs',
  },

  seo: {
    title: 'Zoo Labs Foundation - Open AI Research',
    description: 'Decentralized AI research and decentralized science.',
    keywords: ['deai', 'desci', 'research', 'zoo', 'foundation', 'governance'],
  },
}

// ---------------------------------------------------------------------------
// Pars
// ---------------------------------------------------------------------------

export const pars: BrandConfig = {
  id: 'pars',
  name: 'Pars',
  orgName: 'Pars',
  orgHandle: 'pars',
  tagline: 'Identity and access',
  description: 'Identity, access management, and authentication infrastructure.',

  npmOrg: '@pars',

  domain: 'pars.id',
  iamDomain: 'pars.id',
  githubOrg: 'parsid',
  docsUrl: 'https://docs.pars.id',

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
    primary: '30 90% 50%',
    primaryForeground: '0 0% 100%',
    secondary: '30 40% 95%',
    secondaryForeground: '30 90% 20%',
    accent: '30 90% 60%',
    accentForeground: '0 0% 100%',
  },

  social: {
    github: 'https://github.com/parsid',
  },

  seo: {
    title: 'Pars - Identity & Access',
    description: 'Identity, access management, and authentication infrastructure.',
    keywords: ['identity', 'iam', 'auth', 'oidc', 'pars'],
  },
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All org brand configs indexed by org ID */
export const orgs: Record<OrgId, BrandConfig> = {
  hanzo,
  lux,
  zoo,
  pars,
}

/** Look up an org brand config by ID. Throws if unknown. */
export function getOrg(id: OrgId): BrandConfig {
  const config = orgs[id]
  if (!config) {
    throw new Error(`Unknown org: ${id}`)
  }
  return config
}
