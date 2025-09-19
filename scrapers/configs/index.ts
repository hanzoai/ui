import { ScraperConfig } from '../types'

// Import all UI library configurations
import { shadcnUIConfig } from './shadcn-ui.config'
import { tailwindUIConfig } from './tailwind-ui.config'
import { radixUIConfig } from './radix-ui.config'
import { headlessUIConfig } from './headless-ui.config'
import { materialUIConfig } from './material-ui.config'
import { antDesignConfig } from './ant-design.config'
import { chakraUIConfig } from './chakra-ui.config'
import { mantineConfig } from './mantine.config'
import { nextUIConfig } from './nextui.config'
import { daisyUIConfig } from './daisyui.config'

// Export individual configs
export {
  shadcnUIConfig,
  tailwindUIConfig,
  radixUIConfig,
  headlessUIConfig,
  materialUIConfig,
  antDesignConfig,
  chakraUIConfig,
  mantineConfig,
  nextUIConfig,
  daisyUIConfig
}

// Master configuration map
export const UI_LIBRARY_CONFIGS: Record<string, ScraperConfig> = {
  'shadcn-ui': shadcnUIConfig,
  'tailwind-ui': tailwindUIConfig,
  'radix-ui': radixUIConfig,
  'headless-ui': headlessUIConfig,
  'material-ui': materialUIConfig,
  'ant-design': antDesignConfig,
  'chakra-ui': chakraUIConfig,
  'mantine': mantineConfig,
  'nextui': nextUIConfig,
  'daisyui': daisyUIConfig
}

// Helper functions
export function getConfig(libraryName: string): ScraperConfig | undefined {
  return UI_LIBRARY_CONFIGS[libraryName]
}

export function getAllConfigs(): ScraperConfig[] {
  return Object.values(UI_LIBRARY_CONFIGS)
}

export function getLibraryNames(): string[] {
  return Object.keys(UI_LIBRARY_CONFIGS)
}

// Configuration categories for grouping
export const LIBRARY_CATEGORIES = {
  'Headless/Unstyled': ['radix-ui', 'headless-ui'],
  'Tailwind-based': ['shadcn-ui', 'tailwind-ui', 'daisyui', 'nextui'],
  'Material Design': ['material-ui'],
  'Enterprise': ['ant-design'],
  'Modern/Flexible': ['chakra-ui', 'mantine']
}

// Libraries that require authentication
export const AUTHENTICATED_LIBRARIES = getAllConfigs()
  .filter(config => config.authentication.required)
  .map(config => config.name)

// Get configs by framework
export function getConfigsByFramework(framework: 'React' | 'Vue' | 'Angular' | 'Svelte'): ScraperConfig[] {
  return getAllConfigs().filter(config =>
    config.metadata.framework.toLowerCase().includes(framework.toLowerCase())
  )
}

// Get configs that support TypeScript
export function getTypeScriptConfigs(): ScraperConfig[] {
  return getAllConfigs().filter(config => config.metadata.typescript)
}

// Get configs with dark mode support
export function getDarkModeConfigs(): ScraperConfig[] {
  return getAllConfigs().filter(config => config.metadata.darkMode)
}

// Validation function to ensure all required environment variables are set
export function validateAuthentication(config: ScraperConfig): boolean {
  if (!config.authentication.required) return true

  if (config.authentication.envVars) {
    return config.authentication.envVars.every(
      envVar => process.env[envVar] !== undefined
    )
  }

  return true
}

// Rate limit calculator
export function calculateDelay(config: ScraperConfig): number {
  return Math.max(
    config.rateLimit.delayMs,
    1000 / config.rateLimit.maxRequestsPerSecond
  )
}

// Export type for use in other modules
export type { ScraperConfig } from '../types'