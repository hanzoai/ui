#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./configs/index");
console.log('===== UI Library Scraper Configurations Test =====\n');
// Test 1: List all configured libraries
console.log('Configured Libraries:');
(0, index_1.getLibraryNames)().forEach(name => {
    const config = index_1.UI_LIBRARY_CONFIGS[name];
    console.log(`  - ${config.displayName} (${name}): ${config.description}`);
});
// Test 2: Show library categories
console.log('\nLibrary Categories:');
Object.entries(index_1.LIBRARY_CATEGORIES).forEach(([category, libraries]) => {
    console.log(`  ${category}:`);
    libraries.forEach(lib => {
        const config = index_1.UI_LIBRARY_CONFIGS[lib];
        if (config) {
            console.log(`    - ${config.displayName}`);
        }
    });
});
// Test 3: Libraries requiring authentication
console.log('\nLibraries Requiring Authentication:');
index_1.AUTHENTICATED_LIBRARIES.forEach(name => {
    const config = index_1.UI_LIBRARY_CONFIGS[name];
    console.log(`  - ${config.displayName}: ${config.authentication.type || 'required'}`);
    if (config.authentication.envVars) {
        console.log(`    Environment variables needed: ${config.authentication.envVars.join(', ')}`);
    }
});
// Test 4: React libraries
console.log('\nReact-compatible Libraries:');
(0, index_1.getConfigsByFramework)('React').forEach(config => {
    console.log(`  - ${config.displayName}`);
});
// Test 5: TypeScript support
console.log('\nLibraries with TypeScript Support:');
(0, index_1.getTypeScriptConfigs)().forEach(config => {
    console.log(`  - ${config.displayName}`);
});
// Test 6: Dark mode support
console.log('\nLibraries with Dark Mode Support:');
(0, index_1.getDarkModeConfigs)().forEach(config => {
    console.log(`  - ${config.displayName}: ${config.metadata.darkMode}`);
});
// Test 7: Rate limiting information
console.log('\nRate Limiting Configuration:');
(0, index_1.getAllConfigs)().forEach(config => {
    const delay = (0, index_1.calculateDelay)(config);
    console.log(`  - ${config.displayName}:`);
    console.log(`    Max requests/sec: ${config.rateLimit.maxRequestsPerSecond}`);
    console.log(`    Delay: ${delay}ms`);
    console.log(`    Max concurrent: ${config.rateLimit.maxConcurrent}`);
});
// Test 8: Validate configurations
console.log('\nConfiguration Validation:');
let allValid = true;
(0, index_1.getAllConfigs)().forEach(config => {
    const errors = [];
    // Check required fields
    if (!config.name)
        errors.push('Missing name');
    if (!config.displayName)
        errors.push('Missing displayName');
    if (!config.baseUrls || Object.keys(config.baseUrls).length === 0) {
        errors.push('Missing base URLs');
    }
    if (!config.componentPaths || config.componentPaths.length === 0) {
        errors.push('Missing component paths');
    }
    if (!config.selectors || Object.keys(config.selectors).length === 0) {
        errors.push('Missing selectors');
    }
    if (!config.categories || Object.keys(config.categories).length === 0) {
        errors.push('Missing categories');
    }
    // Validate authentication
    const authValid = (0, index_1.validateAuthentication)(config);
    if (!authValid) {
        errors.push('Missing required authentication environment variables');
    }
    if (errors.length > 0) {
        console.log(`  ❌ ${config.displayName}: ${errors.join(', ')}`);
        allValid = false;
    }
    else {
        console.log(`  ✅ ${config.displayName}: Valid`);
    }
});
console.log(`\n${allValid ? '✅ All configurations are valid!' : '❌ Some configurations have errors'}`);
// Test 9: Summary statistics
console.log('\n===== Summary Statistics =====');
console.log(`Total configured libraries: ${(0, index_1.getAllConfigs)().length}`);
console.log(`Libraries requiring authentication: ${index_1.AUTHENTICATED_LIBRARIES.length}`);
console.log(`TypeScript-enabled libraries: ${(0, index_1.getTypeScriptConfigs)().length}`);
console.log(`Dark mode-enabled libraries: ${(0, index_1.getDarkModeConfigs)().length}`);
const frameworks = new Set();
(0, index_1.getAllConfigs)().forEach(config => {
    config.metadata.framework.split('/').forEach(f => frameworks.add(f.trim()));
});
console.log(`Supported frameworks: ${Array.from(frameworks).join(', ')}`);
console.log('\n===== Test Complete =====');
