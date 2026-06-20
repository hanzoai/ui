#!/usr/bin/env node
// Test selective imports from @hanzo/ui

console.log('Testing selective imports from @hanzo/ui...\n');

// Test 1: Import only Button from main export
console.log('Test 1: Importing only Button from main index...');
try {
  const { Button } = await import('./dist/index.mjs');
  console.log('✅ Button imported successfully:', typeof Button);
} catch (e) {
  console.log('❌ Failed:', e.message);
}

// Test 2: Check that Calendar is NOT in main index
console.log('\nTest 2: Checking Calendar is NOT in main index...');
try {
  const main = await import('./dist/index.mjs');
  if ('Calendar' in main) {
    console.log('❌ Calendar found in main index - should not be there!');
  } else {
    console.log('✅ Calendar correctly excluded from main index');
  }
} catch (e) {
  console.log('❌ Failed:', e.message);
}

// Test 3: Import Calendar from its own entry point
console.log('\nTest 3: Importing Calendar from dedicated entry...');
try {
  const { default: Calendar } = await import('./dist/calendar.mjs');
  console.log('✅ Calendar imported from @hanzo/ui/calendar:', typeof Calendar);
} catch (e) {
  console.log('❌ Failed (needs react-day-picker):', e.message.includes('react-day-picker') ? 'Missing dependency' : e.message);
}

// Test 4: Check main bundle doesn't load heavy deps
console.log('\nTest 4: Checking main bundle size...');
import { statSync } from 'fs';
const mainSize = statSync('./dist/index.mjs').size;
const calendarSize = statSync('./dist/calendar.mjs').size;
console.log(`Main bundle: ${(mainSize/1024).toFixed(0)}KB`);
console.log(`Calendar bundle: ${(calendarSize/1024).toFixed(0)}KB`);
if (mainSize < 200000) { // Less than 200KB
  console.log('✅ Main bundle is lean (under 200KB)');
} else {
  console.log('⚠️  Main bundle might include optional deps');
}

// Test 5: List what's exported from main
console.log('\nTest 5: Core components in main export:');
const main = await import('./dist/index.mjs');
const components = Object.keys(main).filter(k => k[0] === k[0].toUpperCase() && k !== 'LazyComponents');
console.log(`Found ${components.length} components`);
console.log('Sample:', components.slice(0, 10).join(', '));

console.log('\n📦 Selective import test complete!');