/**
 * Brand Configuration for White-Labeling
 * 
 * This file defines all brand-specific settings that can be customized
 * when forking this UI library for different organizations.
 */

export interface BrandConfig {
  // Organization identity
  name: string
  orgName: string
  orgHandle: string
  tagline: string
  description: string
  
  // Package naming
  npmOrg: string
  packageName: string
  
  // URLs and domains
  domain: string
  githubOrg: string
  githubRepo: string
  docsUrl: string
  
  // Brand assets
  logo: {
    svg?: string
    lightSrc?: string
    darkSrc?: string
    width: number
    height: number
  }
  
  // Colors (CSS variables)
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
  }
  
  // Social links
  social: {
    twitter?: string
    discord?: string
    github: string
  }
  
  // SEO
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

// Default Hanzo brand configuration
export const defaultBrand: BrandConfig = {
  name: "Hanzo",
  orgName: "Hanzo AI",
  orgHandle: "hanzoai",
  tagline: "Build your component library",
  description: "Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.",
  
  npmOrg: "@hanzo",
  packageName: "@hanzo/ui",
  
  domain: "ui.hanzo.ai",
  githubOrg: "hanzoai",
  githubRepo: "ui",
  docsUrl: "https://ui.hanzo.ai",
  
  logo: {
    svg: "/hanzo-logo.svg",
    width: 24,
    height: 24
  },
  
  colors: {
    primary: "222.2 47.4% 11.2%",
    primaryForeground: "210 40% 98%",
    secondary: "210 40% 96.1%",
    secondaryForeground: "222.2 47.4% 11.2%",
    accent: "210 40% 96.1%",
    accentForeground: "222.2 47.4% 11.2%"
  },
  
  social: {
    twitter: "@hanzoai",
    github: "https://github.com/hanzoai/ui"
  },
  
  seo: {
    title: "Hanzo UI - Modern React Component Library",
    description: "Production-ready React components for building modern web applications",
    keywords: ["react", "components", "ui", "library", "tailwind", "typescript"]
  }
}

// Load brand configuration from environment or use default
export function loadBrandConfig(): BrandConfig {
  // Check if there's a custom brand config file
  try {
    // @ts-ignore - This will be replaced at build time
    if (typeof BRAND_CONFIG !== 'undefined') {
      return BRAND_CONFIG
    }
  } catch (e) {
    // Use default if no custom config
  }
  
  return defaultBrand
}

export const brand = loadBrandConfig()