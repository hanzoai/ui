import { BrandConfig } from '../brand.config'

export const luxfiBrand: BrandConfig = {
  name: "Lux",
  orgName: "Lux Finance",
  orgHandle: "luxfi",
  tagline: "Build your DeFi component library",
  description: "Enterprise-grade components for building decentralized finance applications. Secure. Scalable. Open Source.",
  
  npmOrg: "@luxfi",
  packageName: "@luxfi/ui",
  
  domain: "ui.lux.finance",
  githubOrg: "luxfi",
  githubRepo: "ui",
  docsUrl: "https://ui.lux.finance",
  
  logo: {
    svg: "/lux-logo.svg",
    width: 24,
    height: 24
  },
  
  colors: {
    // Lux purple/violet theme
    primary: "262.1 83.3% 57.8%",
    primaryForeground: "210 20% 98%",
    secondary: "220 14.3% 95.9%",
    secondaryForeground: "220.9 39.3% 11%",
    accent: "262.1 83.3% 57.8%",
    accentForeground: "210 20% 98%"
  },
  
  social: {
    twitter: "@luxfi",
    discord: "https://discord.gg/luxfi",
    github: "https://github.com/luxfi/ui"
  },
  
  seo: {
    title: "Lux UI - DeFi Component Library",
    description: "Production-ready React components for building decentralized finance applications",
    keywords: ["defi", "blockchain", "react", "components", "ui", "web3", "ethereum", "lux"]
  }
}