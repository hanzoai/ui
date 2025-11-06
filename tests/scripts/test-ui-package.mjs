#!/usr/bin/env node
// Test the @hanzo/ui package build

import React from 'react';
import { renderToString } from 'react-dom/server';

// Try importing from the built package
import { Button, Card } from './packages/ui/dist/index.mjs';

console.log('✅ Core imports work!');
console.log('Button:', typeof Button);
console.log('Card:', typeof Card);

// Test rendering a component
try {
  const html = renderToString(
    React.createElement(Button, { children: 'Test Button' })
  );
  console.log('✅ Button renders:', html.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ Render failed:', error.message);
}

// Try lazy components
import('./packages/ui/dist/index.mjs').then(module => {
  if (module.LazyComponents) {
    console.log('✅ LazyComponents available');
  }
});

console.log('\n📦 Package test complete!');