#!/usr/bin/env ts-node

import {
  UI_LIBRARY_CONFIGS,
  getAllConfigs,
  getLibraryNames,
  LIBRARY_CATEGORIES,
  AUTHENTICATED_LIBRARIES,
  getConfigsByFramework,
  getTypeScriptConfigs,
  getDarkModeConfigs,
  validateAuthentication,
  calculateDelay
} from './configs/index'

console.log('===== UI Library Scraper Configurations Test =====\n')

// Test 1: List all configured libraries
console.log('Configured Libraries:')
getLibraryNames().forEach(name => {
  const config = UI_LIBRARY_CONFIGS[name]
  console.log(`  - ${config.displayName} (${name}): ${config.description}`)
})

// Test 2: Show library categories
console.log('\nLibrary Categories:')
Object.entries(LIBRARY_CATEGORIES).forEach(([category, libraries]) => {
  console.log(`  ${category}:`)
  libraries.forEach(lib => {
    const config = UI_LIBRARY_CONFIGS[lib]
    if (config) {
      console.log(`    - ${config.displayName}`)
    }
  })
})

// Test 3: Libraries requiring authentication
console.log('\nLibraries Requiring Authentication:')
AUTHENTICATED_LIBRARIES.forEach(name => {
  const config = UI_LIBRARY_CONFIGS[name]
  console.log(`  - ${config.displayName}: ${config.authentication.type || 'required'}`)
  if (config.authentication.envVars) {
    console.log(`    Environment variables needed: ${config.authentication.envVars.join(', ')}`)
  }
})

// Test 4: React libraries
console.log('\nReact-compatible Libraries:')
getConfigsByFramework('React').forEach(config => {
  console.log(`  - ${config.displayName}`)
})

// Test 5: TypeScript support
console.log('\nLibraries with TypeScript Support:')
getTypeScriptConfigs().forEach(config => {
  console.log(`  - ${config.displayName}`)
})

// Test 6: Dark mode support
console.log('\nLibraries with Dark Mode Support:')
getDarkModeConfigs().forEach(config => {
  console.log(`  - ${config.displayName}: ${config.metadata.darkMode}`)
})

// Test 7: Rate limiting information
console.log('\nRate Limiting Configuration:')
getAllConfigs().forEach(config => {
  const delay = calculateDelay(config)
  console.log(`  - ${config.displayName}:`)
  console.log(`    Max requests/sec: ${config.rateLimit.maxRequestsPerSecond}`)
  console.log(`    Delay: ${delay}ms`)
  console.log(`    Max concurrent: ${config.rateLimit.maxConcurrent}`)
})

// Test 8: Validate configurations
console.log('\nConfiguration Validation:')
let allValid = true
getAllConfigs().forEach(config => {
  const errors: string[] = []

  // Check required fields
  if (!config.name) errors.push('Missing name')
  if (!config.displayName) errors.push('Missing displayName')
  if (!config.baseUrls || Object.keys(config.baseUrls).length === 0) {
    errors.push('Missing base URLs')
  }
  if (!config.componentPaths || config.componentPaths.length === 0) {
    errors.push('Missing component paths')
  }
  if (!config.selectors || Object.keys(config.selectors).length === 0) {
    errors.push('Missing selectors')
  }
  if (!config.categories || Object.keys(config.categories).length === 0) {
    errors.push('Missing categories')
  }

  // Validate authentication
  const authValid = validateAuthentication(config)
  if (!authValid) {
    errors.push('Missing required authentication environment variables')
  }

  if (errors.length > 0) {
    console.log(`  ❌ ${config.displayName}: ${errors.join(', ')}`)
    allValid = false
  } else {
    console.log(`  ✅ ${config.displayName}: Valid`)
  }
})

console.log(`\n${allValid ? '✅ All configurations are valid!' : '❌ Some configurations have errors'}`)

// Test 9: Summary statistics
console.log('\n===== Summary Statistics =====')
console.log(`Total configured libraries: ${getAllConfigs().length}`)
console.log(`Libraries requiring authentication: ${AUTHENTICATED_LIBRARIES.length}`)
console.log(`TypeScript-enabled libraries: ${getTypeScriptConfigs().length}`)
console.log(`Dark mode-enabled libraries: ${getDarkModeConfigs().length}`)

const frameworks = new Set<string>()
getAllConfigs().forEach(config => {
  config.metadata.framework.split('/').forEach(f => frameworks.add(f.trim()))
})
console.log(`Supported frameworks: ${Array.from(frameworks).join(', ')}`)

console.log('\n===== Test Complete =====')