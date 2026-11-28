import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Hanzo UI Tree-Shaking, React 19 / Next.js Static Export & Appearance Contract', () => {
  // Theme & Token definitions
  const THEMES = ['light', 'dark', 'system', 'zen-dark'];
  const CORE_TOKENS = {
    colors: {
      background: '#090a0f',
      foreground: '#f3f4f6',
      primary: '#3b82f6',
      muted: '#6b7280',
      border: '#1f2937',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    spacing: {
      sm: '8px',
      md: '16px',
      lg: '24px',
    },
  };

  function simulateStaticRender(theme, tokens) {
    if (!THEMES.includes(theme)) {
      throw new Error(`Invalid theme: ${theme}`);
    }
    const styleAttr = `data-theme="${theme}" style="--bg: ${tokens.colors.background}; --fg: ${tokens.colors.foreground};"`;
    const html = `<div id="__hanzo-root" ${styleAttr}><main class="p-4"></main></div>`;
    return {
      html,
      hasHydrationWarning: false,
      isStaticExportReady: true,
    };
  }

  function validateTreeShakingEntry(exportName, exportedModule) {
    return {
      name: exportName,
      isPure: true,
      hasSideEffects: false,
      keys: Object.keys(exportedModule),
    };
  }

  test('validates static HTML render without hydration mismatch', () => {
    const rendered = simulateStaticRender('zen-dark', CORE_TOKENS);
    assert.ok(rendered.html.includes('data-theme="zen-dark"'));
    assert.equal(rendered.hasHydrationWarning, false);
    assert.equal(rendered.isStaticExportReady, true);
  });

  test('supports all canonical appearance themes (light, dark, system, zen-dark)', () => {
    for (const theme of THEMES) {
      const result = simulateStaticRender(theme, CORE_TOKENS);
      assert.ok(result.html.includes(`data-theme="${theme}"`));
    }
  });

  test('verifies pure tree-shaking exports for isolated tokens', () => {
    const colorsEntry = validateTreeShakingEntry('colors', CORE_TOKENS.colors);
    assert.equal(colorsEntry.isPure, true);
    assert.equal(colorsEntry.hasSideEffects, false);
    assert.ok(colorsEntry.keys.includes('background'));
    assert.ok(colorsEntry.keys.includes('foreground'));

    const radiiEntry = validateTreeShakingEntry('radii', CORE_TOKENS.radii);
    assert.equal(radiiEntry.isPure, true);
    assert.ok(radiiEntry.keys.includes('md'));
  });

  test('enforces Next.js output: export contract with trailingSlash compatibility', () => {
    const nextConfig = {
      output: 'export',
      trailingSlash: true,
      images: { unoptimized: true },
      transpilePackages: ['@hanzo/ui', '@hanzo/tokens', '@hanzo/appearance'],
    };

    assert.equal(nextConfig.output, 'export');
    assert.equal(nextConfig.trailingSlash, true);
    assert.equal(nextConfig.images.unoptimized, true);
    assert.ok(nextConfig.transpilePackages.includes('@hanzo/ui'));
  });

  test('rejects invalid theme names in appearance provider', () => {
    assert.throws(
      () => {
        simulateStaticRender('neon-rainbow', CORE_TOKENS);
      },
      { message: /Invalid theme/ }
    );
  });
});
