import { BrandConfig } from '../brand.config'

export const zooBrand: BrandConfig = {
  name: "Zoo",
  orgName: "Zoo NGO",
  orgHandle: "zooai",
  tagline: "Build your NFT & gaming component library",
  description: "Powerful components for building NFT marketplaces and blockchain gaming applications. Creative. Interactive. Open Source.",
  
  npmOrg: "@zooai",
  packageName: "@zooai/ui",
  
  domain: "ui.zoo.ngo",
  githubOrg: "zooai",
  githubRepo: "ui",
  docsUrl: "https://ui.zoo.ngo",
  
  logo: {
    svg: "/zoo-logo.svg",
    width: 24,
    height: 24
  },
  
  colors: {
    // Zoo green/nature theme
    primary: "142.1 76.2% 36.3%",
    primaryForeground: "355.7 100% 97.3%",
    secondary: "240 4.8% 95.9%",
    secondaryForeground: "240 5.9% 10%",
    accent: "142.1 76.2% 36.3%",
    accentForeground: "355.7 100% 97.3%"
  },
  
  social: {
    twitter: "@zooai",
    discord: "https://discord.gg/zoo",
    github: "https://github.com/zooai/ui"
  },
  
  seo: {
    title: "Zoo UI - NFT & Gaming Component Library",
    description: "Production-ready React components for building NFT marketplaces and blockchain gaming applications",
    keywords: ["nft", "gaming", "metaverse", "react", "components", "ui", "web3", "blockchain", "zoo"]
  }
}