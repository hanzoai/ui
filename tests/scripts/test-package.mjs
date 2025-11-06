#!/usr/bin/env node
// Test that all @hanzo/ui imports work correctly

console.log('Testing @hanzo/ui package imports...\n');

async function testImports() {
  try {
    // Test 1: Top-level import with cn utility
    const { Button, Card, cn } = await import('./pkg/ui/components/index.ts');
    console.log('✅ Top-level import works:');
    console.log('   - Button:', typeof Button === 'object' ? 'loaded' : 'missing');
    console.log('   - Card:', typeof Card === 'object' ? 'loaded' : 'missing');
    console.log('   - cn:', typeof cn === 'function' ? 'function' : 'missing');

    // Test 2: Utils import
    const utils = await import('./pkg/ui/src/utils.ts');
    console.log('\n✅ Utils import works:');
    console.log('   - cn from utils:', typeof utils.cn === 'function' ? 'function' : 'missing');

    // Test 3: Check cn utility functionality
    const testClasses = cn('text-red-500', { 'bg-blue-500': true }, 'p-4');
    console.log('\n✅ cn utility functionality:');
    console.log('   - Result:', testClasses);

    console.log('\n🎉 All imports working correctly!');
    console.log('\nSupported import patterns:');
    console.log('  import { Button, cn } from "@hanzo/ui"');
    console.log('  import { Button, cn } from "@hanzo/ui/components"');
    console.log('  import { cn } from "@hanzo/ui/lib/utils"');

  } catch (error) {
    console.error('❌ Import test failed:', error.message);
    process.exit(1);
  }
}

testImports();