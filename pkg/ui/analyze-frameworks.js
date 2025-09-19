#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define framework paths
const TEMP_DIR = '/tmp/shadcn-analysis';
const FRAMEWORKS = {
  react: {
    repo: 'shadcn-react',
    componentPaths: [
      'apps/www/registry/default/ui',
      'apps/www/registry/new-york/ui'
    ],
    extension: '.tsx'
  },
  svelte: {
    repo: 'shadcn-svelte',
    componentPaths: [
      'registry-template/src/lib/registry/ui',
      'docs/src/lib/registry/ui'
    ],
    extension: '.svelte'
  },
  vue: {
    repo: 'shadcn-vue',
    componentPaths: [
      'apps/www/src/registry/default/ui',
      'apps/www/src/registry/new-york/ui'
    ],
    extension: '.vue'
  },
  'react-native': {
    repo: 'shadcn-react-native',
    componentPaths: [
      'packages/registry/src/default/components/ui',
      'packages/registry/src/new-york/components/ui'
    ],
    extension: '.tsx'
  }
};

// Extract component names from paths
function extractComponentName(filePath) {
  const basename = path.basename(filePath);
  const nameWithoutExt = basename.replace(/\.(tsx|svelte|vue)$/, '');
  // Handle special cases like card-header.tsx -> card
  const mainComponent = nameWithoutExt.split('-')[0];
  return mainComponent;
}

// Get all components for a framework
function getFrameworkComponents(framework, repoPath) {
  const components = new Set();
  const config = FRAMEWORKS[framework];

  config.componentPaths.forEach(componentPath => {
    const fullPath = path.join(repoPath, componentPath);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        if (file.endsWith(config.extension)) {
          const component = extractComponentName(file);
          components.add(component);
        }
      });

      // Also check subdirectories
      const dirs = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      dirs.forEach(dir => {
        const dirPath = path.join(fullPath, dir);
        if (fs.existsSync(dirPath)) {
          const dirFiles = fs.readdirSync(dirPath);
          dirFiles.forEach(file => {
            if (file.endsWith(config.extension)) {
              components.add(dir); // Use directory name as component name
            }
          });
        }
      });
    }
  });

  return Array.from(components).sort();
}

// Main analysis function
function analyzeFrameworks() {
  const analysis = {
    timestamp: new Date().toISOString(),
    frameworks: {},
    components: {},
    coverage: {}
  };

  // Collect components from each framework
  Object.keys(FRAMEWORKS).forEach(framework => {
    const repoPath = path.join(TEMP_DIR, FRAMEWORKS[framework].repo);
    const components = getFrameworkComponents(framework, repoPath);
    analysis.frameworks[framework] = components;
  });

  // Build component matrix
  const allComponents = new Set();
  Object.values(analysis.frameworks).forEach(components => {
    components.forEach(c => allComponents.add(c));
  });

  Array.from(allComponents).sort().forEach(component => {
    analysis.components[component] = {};
    Object.keys(FRAMEWORKS).forEach(framework => {
      const hasComponent = analysis.frameworks[framework].includes(component);
      analysis.components[component][framework] = {
        status: hasComponent ? 'exists' : 'missing',
        native: hasComponent
      };
    });
  });

  // Calculate coverage
  Object.keys(FRAMEWORKS).forEach(framework => {
    const total = Object.keys(analysis.components).length;
    const implemented = Object.values(analysis.components)
      .filter(c => c[framework].status === 'exists').length;
    analysis.coverage[framework] = {
      implemented,
      total,
      percentage: Math.round((implemented / total) * 100)
    };
  });

  return analysis;
}

// Generate tracker.json
function generateTracker(analysis) {
  const tracker = {
    version: '1.0.0',
    lastUpdated: analysis.timestamp,
    frameworks: Object.keys(FRAMEWORKS),
    coverage: analysis.coverage,
    components: {}
  };

  Object.entries(analysis.components).forEach(([component, frameworks]) => {
    tracker.components[component] = {};
    Object.entries(frameworks).forEach(([framework, data]) => {
      tracker.components[component][framework] = {
        status: data.status === 'exists' ? 'complete' : 'missing',
        version: data.status === 'exists' ? '1.0.0' : null,
        path: data.status === 'exists'
          ? `frameworks/${framework}/${component}.${FRAMEWORKS[framework].extension}`
          : null,
        native: data.native || false
      };
    });
  });

  return tracker;
}

// Main execution
console.log('🔍 Analyzing shadcn framework implementations...\n');
const analysis = analyzeFrameworks();
const tracker = generateTracker(analysis);

// Create frameworks directory
const frameworksDir = path.join(__dirname, 'frameworks');
if (!fs.existsSync(frameworksDir)) {
  fs.mkdirSync(frameworksDir, { recursive: true });
}

// Save tracker.json
fs.writeFileSync(
  path.join(frameworksDir, 'tracker.json'),
  JSON.stringify(tracker, null, 2)
);

// Generate analysis report
const report = {
  '📊 Coverage Summary': analysis.coverage,
  '🧩 Total Components': Object.keys(analysis.components).length,
  '🎯 Framework Comparison': {
    'React': `${analysis.coverage.react.implemented}/${analysis.coverage.react.total} (${analysis.coverage.react.percentage}%)`,
    'Svelte': `${analysis.coverage.svelte.implemented}/${analysis.coverage.svelte.total} (${analysis.coverage.svelte.percentage}%)`,
    'Vue': `${analysis.coverage.vue.implemented}/${analysis.coverage.vue.total} (${analysis.coverage.vue.percentage}%)`,
    'React Native': `${analysis.coverage['react-native'].implemented}/${analysis.coverage['react-native'].total} (${analysis.coverage['react-native'].percentage}%)`
  }
};

console.log(JSON.stringify(report, null, 2));
console.log('\n✅ Analysis complete! tracker.json saved to frameworks/tracker.json');

// Export for use in other scripts
module.exports = { analysis, tracker };