#!/usr/bin/env node
// Test the built @hanzo/ui package

// Test that exports work correctly
import * as UI from './dist/index.mjs';

console.log('Testing @hanzo/ui build output...\n');

// Check core utilities
console.log('✅ cn utility:', typeof UI.cn === 'function' ? 'working' : 'missing');

// Check some component exports
const coreComponents = [
  'Button',
  'Card', 
  'Badge',
  'Alert',
  'Dialog',
  'Input',
  'Label'
];

console.log('\nCore Components:');
coreComponents.forEach(comp => {
  const exists = comp in UI;
  console.log(`  ${exists ? '✅' : '❌'} ${comp}: ${exists ? 'exported' : 'missing'}`);
});

console.log('\nTotal exports:', Object.keys(UI).length);
console.log('Sample exports:', Object.keys(UI).slice(0, 10).join(', '));

// Check for lazy components
if (UI.LazyComponents) {
  console.log('\n✅ LazyComponents available');
  console.log('Lazy component count:', Object.keys(UI.LazyComponents).length);
}

console.log('\n📦 Package verification complete!');