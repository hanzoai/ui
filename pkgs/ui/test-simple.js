// Simple test to verify the package structure works

const fs = require('fs');
const path = require('path');

console.log('Testing @hanzo/ui package structure...\n');

// Check build outputs
const files = [
  'dist/index.js',
  'dist/index.mjs',
  'dist/src/utils.js',
  'dist/lib/utils.js'
];

console.log('Build outputs:');
files.forEach(file => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    console.log(`  ✅ ${file} (${(size/1024).toFixed(0)}KB)`);
  } else {
    console.log(`  ❌ ${file} missing`);
  }
});

// Check package.json configuration
const pkg = require('./package.json');
console.log('\nPackage info:');
console.log(`  Name: ${pkg.name}`);
console.log(`  Version: ${pkg.version}`);
console.log(`  Main: ${pkg.main}`);
console.log(`  Module: ${pkg.module}`);

// Check dependencies
console.log('\nDependency structure:');
console.log(`  Core dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
console.log(`  Optional dependencies: ${Object.keys(pkg.optionalDependencies || {}).length}`);
console.log(`  Peer dependencies: ${Object.keys(pkg.peerDependencies || {}).length}`);

// Try to load the cn utility without importing everything
try {
  const utils = require('./dist/src/utils.js');
  console.log('\n✅ Utils module loads successfully');
  console.log('  cn function:', typeof utils.cn === 'function' ? 'available' : 'missing');
} catch (e) {
  console.log('\n❌ Utils module failed to load:', e.message);
}

console.log('\n📦 Structure verification complete!');