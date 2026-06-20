#!/usr/bin/env node

/**
 * Comprehensive Multi-Framework Test for @hanzo/ui
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frameworks = ['react', 'vue', 'svelte', 'react-native'];
const results = {
  overall: { pass: 0, fail: 0, skip: 0 },
  frameworks: {},
  issues: []
};

console.log('🔍 Multi-Framework Component Testing\n');
console.log('=' .repeat(60));

// Load tracker.json
const trackerPath = path.join(__dirname, 'frameworks', 'tracker.json');
const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));

// Load registry.json
const registryPath = path.join(__dirname, 'frameworks', 'registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// Test 1: Framework Directory Structure
console.log('\n📁 Test 1: Framework Directory Structure');
console.log('-'.repeat(60));

frameworks.forEach(fw => {
  const fwPath = path.join(__dirname, 'frameworks', fw);
  const exists = fs.existsSync(fwPath);
  const hasIndex = fs.existsSync(path.join(fwPath, 'index.ts'));
  const hasPkg = fs.existsSync(path.join(fwPath, 'package.json'));
  
  if (!results.frameworks[fw]) results.frameworks[fw] = { tests: [], coverage: 0 };
  
  if (exists && hasIndex && hasPkg) {
    console.log(`✅ ${fw.padEnd(15)} - Structure OK`);
    results.frameworks[fw].tests.push({ name: 'structure', status: 'pass' });
    results.overall.pass++;
  } else {
    console.log(`❌ ${fw.padEnd(15)} - Missing: ${!exists ? 'dir' : !hasIndex ? 'index' : 'pkg.json'}`);
    results.frameworks[fw].tests.push({ name: 'structure', status: 'fail' });
    results.overall.fail++;
    results.issues.push(`${fw}: Missing directory structure`);
  }
});

// Test 2: Package.json Exports
console.log('\n📦 Test 2: Package.json Framework Exports');
console.log('-'.repeat(60));

const mainPackage = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

frameworks.forEach(fw => {
  const exportKey = `./${fw}`;
  const hasExport = mainPackage.exports && mainPackage.exports[exportKey];
  
  if (hasExport) {
    const hasImport = mainPackage.exports[exportKey].import;
    const hasTypes = mainPackage.exports[exportKey].types;
    
    if (hasImport && hasTypes) {
      console.log(`✅ ${fw.padEnd(15)} - Export configured`);
      results.frameworks[fw].tests.push({ name: 'exports', status: 'pass' });
      results.overall.pass++;
    } else {
      console.log(`⚠️  ${fw.padEnd(15)} - Incomplete export (missing: ${!hasImport ? 'import' : 'types'})`);
      results.frameworks[fw].tests.push({ name: 'exports', status: 'fail' });
      results.overall.fail++;
      results.issues.push(`${fw}: Incomplete package.json export`);
    }
  } else {
    console.log(`❌ ${fw.padEnd(15)} - No export found`);
    results.frameworks[fw].tests.push({ name: 'exports', status: 'fail' });
    results.overall.fail++;
    results.issues.push(`${fw}: Missing package.json export`);
  }
});

// Test 3: Component Coverage
console.log('\n📊 Test 3: Component Coverage Analysis');
console.log('-'.repeat(60));

const componentNames = Object.keys(tracker.components);

frameworks.forEach(fw => {
  const implemented = componentNames.filter(
    comp => tracker.components[comp][fw]?.status === 'complete'
  );
  const missing = componentNames.filter(
    comp => tracker.components[comp][fw]?.status === 'missing' || !tracker.components[comp][fw]
  );
  
  const coverage = tracker.coverage[fw]?.percentage || 0;
  results.frameworks[fw].coverage = coverage;
  
  console.log(`\n${fw.toUpperCase()}`);
  console.log(`  Coverage: ${coverage}% (${implemented.length}/${componentNames.length})`);
  console.log(`  Implemented: ${implemented.length}`);
  console.log(`  Missing: ${missing.length}`);
  
  if (missing.length > 0 && missing.length <= 10) {
    console.log(`  Missing components: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
  }
});

// Test 4: Registry Validation
console.log('\n📋 Test 4: Registry Validation');
console.log('-'.repeat(60));

if (registry.frameworks && Array.isArray(registry.frameworks)) {
  const missingFrameworks = frameworks.filter(fw => !registry.frameworks.includes(fw));
  
  if (missingFrameworks.length === 0) {
    console.log('✅ All frameworks listed in registry');
    results.overall.pass++;
  } else {
    console.log(`❌ Missing frameworks in registry: ${missingFrameworks.join(', ')}`);
    results.overall.fail++;
    results.issues.push(`Registry missing: ${missingFrameworks.join(', ')}`);
  }
} else {
  console.log('❌ Invalid registry.json structure');
  results.overall.fail++;
  results.issues.push('Invalid registry.json structure');
}

// Test 5: Component Consistency
console.log('\n🔄 Test 5: Component Consistency Check');
console.log('-'.repeat(60));

const registryComponents = registry.components || [];
const trackerComponents = Object.keys(tracker.components);

registryComponents.forEach(comp => {
  const inTracker = trackerComponents.includes(comp.name);
  const hasAllFrameworks = frameworks.every(fw => comp.implementations && comp.implementations[fw]);
  
  if (!inTracker) {
    console.log(`⚠️  ${comp.name.padEnd(20)} - In registry but not in tracker`);
    results.issues.push(`${comp.name}: In registry but not in tracker`);
  }
  
  if (!hasAllFrameworks) {
    const missing = frameworks.filter(fw => !comp.implementations[fw]);
    console.log(`⚠️  ${comp.name.padEnd(20)} - Missing implementations: ${missing.join(', ')}`);
  }
});

// Test 6: Build Configuration
console.log('\n🔨 Test 6: Build Configuration');
console.log('-'.repeat(60));

const tsupConfigExists = fs.existsSync(path.join(__dirname, 'tsup.config.minimal.ts')) ||
                         fs.existsSync(path.join(__dirname, 'tsup.config.ts'));

if (tsupConfigExists) {
  console.log('✅ Build configuration found');
  results.overall.pass++;
} else {
  console.log('❌ No tsup configuration found');
  results.overall.fail++;
  results.issues.push('Missing build configuration');
}

// Summary Report
console.log('\n' + '='.repeat(60));
console.log('📈 SUMMARY REPORT');
console.log('='.repeat(60));

console.log(`\nOverall Results:`);
console.log(`  ✅ Passed: ${results.overall.pass}`);
console.log(`  ❌ Failed: ${results.overall.fail}`);
console.log(`  ⏭️  Skipped: ${results.overall.skip}`);

console.log(`\nFramework Coverage:`);
frameworks.forEach(fw => {
  const coverage = results.frameworks[fw]?.coverage || 0;
  const icon = coverage >= 80 ? '🟢' : coverage >= 50 ? '🟡' : '🔴';
  console.log(`  ${icon} ${fw.padEnd(15)} - ${coverage}%`);
});

if (results.issues.length > 0) {
  console.log(`\n⚠️  Issues Found (${results.issues.length}):`);
  results.issues.slice(0, 10).forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
  if (results.issues.length > 10) {
    console.log(`  ... and ${results.issues.length - 10} more`);
  }
}

// Export summary JSON
const summaryPath = path.join(__dirname, 'test-results-frameworks.json');
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Full results saved to: ${summaryPath}`);

console.log('\n' + '='.repeat(60));
console.log(`🏁 Test Complete: ${results.overall.fail === 0 ? '✅ PASSED' : '❌ FAILED'}`);
console.log('='.repeat(60) + '\n');

process.exit(results.overall.fail === 0 ? 0 : 1);
