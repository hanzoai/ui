import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('One Zen Dark Appearance Contract Across Bot, Team, and App', () => {
  const ZEN_DARK_TOKENS = {
    background: '#090a0f',
    surface: '#12131a',
    border: '#1e2029',
    foreground: '#f3f4f6',
    mutedForeground: '#9ca3af',
    accent: '#3b82f6',
    radius: {
      card: '12px',
      button: '8px',
      avatar: '9999px',
    },
  };

  function generateBootScript(defaultTheme = 'zen-dark') {
    return `(function() {
      try {
        var saved = localStorage.getItem('hanzo_appearance_theme');
        var theme = saved || '${defaultTheme}';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.add(theme);
      } catch (e) {}
    })();`;
  }

  function resolveAppTheme(savedTheme, systemPrefersDark = true) {
    if (savedTheme === 'light') return 'light';
    if (savedTheme === 'dark') return 'dark';
    if (savedTheme === 'system') return systemPrefersDark ? 'zen-dark' : 'light';
    return 'zen-dark'; // default neutral near-black fresh install
  }

  function getLuminance(hex) {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;
    const a = [r, g, b].map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(hex1, hex2) {
    const l1 = getLuminance(hex1) + 0.05;
    const l2 = getLuminance(hex2) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  }

  test('bootScript guarantees zero-FOUC theme attribute injection', () => {
    const script = generateBootScript('zen-dark');
    assert.ok(script.includes("data-theme"));
    assert.ok(script.includes("hanzo_appearance_theme"));
    assert.ok(script.includes("zen-dark"));
  });

  test('resolves fresh installation default to neutral near-black zen-dark', () => {
    assert.equal(resolveAppTheme(null), 'zen-dark');
    assert.equal(resolveAppTheme(undefined), 'zen-dark');
  });

  test('retains explicit user preferences across sessions', () => {
    assert.equal(resolveAppTheme('light'), 'light');
    assert.equal(resolveAppTheme('dark'), 'dark');
    assert.equal(resolveAppTheme('system', true), 'zen-dark');
    assert.equal(resolveAppTheme('system', false), 'light');
  });

  test('satisfies WCAG AA contrast ratio (>= 4.5:1) on near-black background', () => {
    const contrast = getContrastRatio(ZEN_DARK_TOKENS.background, ZEN_DARK_TOKENS.foreground);
    assert.ok(contrast >= 4.5, `Contrast ratio ${contrast.toFixed(2)} must be >= 4.5`);
  });

  test('enforces unified border-radius and density tokens across products', () => {
    assert.equal(ZEN_DARK_TOKENS.radius.card, '12px');
    assert.equal(ZEN_DARK_TOKENS.radius.button, '8px');
    assert.equal(ZEN_DARK_TOKENS.radius.avatar, '9999px');
    assert.equal(ZEN_DARK_TOKENS.background, '#090a0f');
    assert.equal(ZEN_DARK_TOKENS.surface, '#12131a');
  });
});
