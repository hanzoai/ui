#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trackerPath = path.join(__dirname, 'frameworks', 'tracker.json');
const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));

const frameworks = ['react', 'vue', 'svelte', 'react-native'];
const componentNames = Object.keys(tracker.components);

console.log('🔍 Multi-Framework Gap Analysis\n');
console.log('=' .repeat(80));

frameworks.forEach(fw => {
  console.log(`\n📋 ${fw.toUpperCase()} - Missing Components`);
  console.log('-'.repeat(80));
  
  const missing = componentNames.filter(
    comp => tracker.components[comp][fw]?.status === 'missing' || !tracker.components[comp][fw]
  );
  
  const implemented = componentNames.filter(
    comp => tracker.components[comp][fw]?.status === 'complete'
  );
  
  console.log(`Coverage: ${tracker.coverage[fw]?.percentage || 0}% (${implemented.length}/${componentNames.length})`);
  console.log(`Missing: ${missing.length} components\n`);
  
  if (missing.length > 0) {
    missing.forEach((comp, i) => {
      const otherImplementations = frameworks
        .filter(f => f !== fw && tracker.components[comp][f]?.status === 'complete')
        .map(f => f);
      
      const status = otherImplementations.length > 0 
        ? `(✅ in ${otherImplementations.join(', ')})` 
        : '(❌ nowhere)';
      
      console.log(`  ${(i + 1).toString().padStart(2)}. ${comp.padEnd(25)} ${status}`);
    });
  } else {
    console.log('  🎉 No missing components!');
  }
});

// Cross-framework consistency check
console.log('\n\n🔄 Cross-Framework Consistency Analysis');
console.log('=' .repeat(80));

const universalComponents = componentNames.filter(comp => 
  frameworks.every(fw => tracker.components[comp][fw]?.status === 'complete')
);

const partialComponents = componentNames.filter(comp => 
  frameworks.some(fw => tracker.components[comp][fw]?.status === 'complete') &&
  !frameworks.every(fw => tracker.components[comp][fw]?.status === 'complete')
);

console.log(`\n✅ Universal Components (in all frameworks): ${universalComponents.length}`);
if (universalComponents.length > 0) {
  console.log(universalComponents.map((c, i) => `  ${i + 1}. ${c}`).join('\n'));
}

console.log(`\n⚠️  Partial Components (missing in some frameworks): ${partialComponents.length}`);
if (partialComponents.length > 0) {
  partialComponents.forEach((comp, i) => {
    const missing = frameworks.filter(fw => 
      tracker.components[comp][fw]?.status !== 'complete'
    );
    console.log(`  ${i + 1}. ${comp.padEnd(25)} - Missing in: ${missing.join(', ')}`);
  });
}

// Priority recommendations
console.log('\n\n🎯 Priority Recommendations');
console.log('=' .repeat(80));

console.log('\n1. React Native (43% coverage) - Highest Priority:');
const rnMissing = componentNames.filter(
  comp => tracker.components[comp]['react-native']?.status !== 'complete'
);
console.log(`   Missing ${rnMissing.length} components`);
console.log('   Top priorities:', rnMissing.slice(0, 10).join(', '));

console.log('\n2. React (64% coverage) - Medium Priority:');
const reactMissing = componentNames.filter(
  comp => tracker.components[comp]['react']?.status !== 'complete'
);
console.log(`   Missing ${reactMissing.length} components`);
console.log('   Top priorities:', reactMissing.slice(0, 10).join(', '));

console.log('\n3. Svelte (70% coverage) - Lower Priority:');
const svelteMissing = componentNames.filter(
  comp => tracker.components[comp]['svelte']?.status !== 'complete'
);
console.log(`   Missing ${svelteMissing.length} components`);
console.log('   Top priorities:', svelteMissing.slice(0, 10).join(', '));

console.log('\n4. Vue (81% coverage) - Lowest Priority:');
const vueMissing = componentNames.filter(
  comp => tracker.components[comp]['vue']?.status !== 'complete'
);
console.log(`   Missing ${vueMissing.length} components`);
console.log('   Top priorities:', vueMissing.slice(0, 10).join(', '));

console.log('\n' + '=' .repeat(80) + '\n');
