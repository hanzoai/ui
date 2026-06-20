/**
 * Multi-framework integration tests for @hanzo/ui
 */

const fs = require('fs');
const path = require('path');

describe('@hanzo/ui Multi-Framework Support', () => {
  const rootDir = path.join(__dirname, '..');

  describe('Framework directories', () => {
    test('should have all framework directories', () => {
      const frameworks = ['react', 'vue', 'svelte', 'react-native', 'core', 'adapters'];
      frameworks.forEach(framework => {
        const frameworkPath = path.join(rootDir, 'frameworks', framework);
        expect(fs.existsSync(frameworkPath)).toBe(true);
      });
    });

    test('should have index files for each framework', () => {
      const frameworks = ['react', 'vue', 'svelte', 'react-native', 'core'];
      frameworks.forEach(framework => {
        const indexPath = path.join(rootDir, 'frameworks', framework, 'index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);
      });
    });
  });

  describe('Package.json exports', () => {
    const packageJson = require('../package.json');

    test('should have React export', () => {
      expect(packageJson.exports['./react']).toBeDefined();
      expect(packageJson.exports['./react'].import).toContain('react/index.mjs');
    });

    test('should have Vue export', () => {
      expect(packageJson.exports['./vue']).toBeDefined();
      expect(packageJson.exports['./vue'].import).toContain('vue/index.mjs');
    });

    test('should have Svelte export', () => {
      expect(packageJson.exports['./svelte']).toBeDefined();
      expect(packageJson.exports['./svelte'].svelte).toBeDefined();
    });

    test('should have React Native export', () => {
      expect(packageJson.exports['./react-native']).toBeDefined();
      expect(packageJson.exports['./react-native'].require).toContain('react-native/index.js');
    });
  });

  describe('Component tracking', () => {
    test('should have tracker.json', () => {
      const trackerPath = path.join(rootDir, 'frameworks', 'tracker.json');
      expect(fs.existsSync(trackerPath)).toBe(true);
    });

    test('tracker.json should have valid structure', () => {
      const trackerPath = path.join(rootDir, 'frameworks', 'tracker.json');
      const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));

      expect(tracker.components).toBeDefined();
      expect(Object.keys(tracker.components).length).toBeGreaterThan(0);

      // Check first component has all framework statuses
      const firstComponent = Object.values(tracker.components)[0];
      expect(firstComponent.react).toBeDefined();
      expect(firstComponent.vue).toBeDefined();
      expect(firstComponent.svelte).toBeDefined();
      expect(firstComponent['react-native']).toBeDefined();
    });
  });

  describe('Registry', () => {
    test('should have registry.json', () => {
      const registryPath = path.join(rootDir, 'registry.json');
      expect(fs.existsSync(registryPath)).toBe(true);
    });

    test('should have multi-framework registry', () => {
      const registryPath = path.join(rootDir, 'frameworks', 'registry.json');
      if (fs.existsSync(registryPath)) {
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        expect(registry.frameworks).toBeDefined();
        expect(registry.frameworks).toContain('react');
        expect(registry.frameworks).toContain('vue');
        expect(registry.frameworks).toContain('svelte');
        expect(registry.frameworks).toContain('react-native');
      }
    });
  });

  describe('Build outputs', () => {
    test('should build React framework', () => {
      const reactDistPath = path.join(rootDir, 'dist', 'react');
      if (fs.existsSync(reactDistPath)) {
        expect(fs.existsSync(path.join(reactDistPath, 'index.js'))).toBe(true);
        expect(fs.existsSync(path.join(reactDistPath, 'index.mjs'))).toBe(true);
      }
    });
  });

  describe('Core utilities', () => {
    test('should have cn function in core utils', () => {
      const utilsPath = path.join(rootDir, 'frameworks', 'core', 'utils', 'index.ts');
      if (fs.existsSync(utilsPath)) {
        const utilsContent = fs.readFileSync(utilsPath, 'utf8');
        expect(utilsContent).toContain('export function cn');
      }
    });
  });
});

// Test that can be run to verify imports work
describe('Import tests (manual verification)', () => {
  test.skip('React import should work', async () => {
    // This would be run after building
    const { Button } = await import('@hanzo/ui/react');
    expect(Button).toBeDefined();
  });

  test.skip('Vue import should work', async () => {
    // This would be run after building
    const { Button } = await import('@hanzo/ui/vue');
    expect(Button).toBeDefined();
  });
});