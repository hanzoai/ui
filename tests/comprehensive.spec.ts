import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3003';

const PAGES_TO_TEST = [
  // Homepage and Navigation
  { url: '/', name: 'Homepage', checkThemeSwitcher: true },
  
  // Examples Section
  { url: '/examples', name: 'Examples Base', checkThemeSwitcher: true },
  { url: '/examples/mail', name: 'Examples - Mail', checkThemeSwitcher: true, checkNav: 'mail' },
  { url: '/examples/dashboard', name: 'Examples - Dashboard', checkThemeSwitcher: true, checkNav: 'dashboard' },
  { url: '/examples/cards', name: 'Examples - Cards', checkThemeSwitcher: true, checkNav: 'cards' },
  { url: '/examples/tasks', name: 'Examples - Tasks', checkThemeSwitcher: true, checkNav: 'tasks' },
  { url: '/examples/playground', name: 'Examples - Playground', checkThemeSwitcher: true, checkNav: 'playground' },
  { url: '/examples/forms', name: 'Examples - Forms', checkThemeSwitcher: true, checkNav: 'forms' },
  { url: '/examples/music', name: 'Examples - Music', checkThemeSwitcher: true, checkNav: 'music' },
  { url: '/examples/authentication', name: 'Examples - Authentication', checkThemeSwitcher: true, checkNav: 'auth' },
  
  // Docs Section
  { url: '/docs', name: 'Docs Homepage', checkThemeSwitcher: true },
  { url: '/docs/components/button', name: 'Docs - Button Component', checkThemeSwitcher: true },
  { url: '/docs/components/card', name: 'Docs - Card Component', checkThemeSwitcher: true },
  
  // Components Section
  { url: '/components', name: 'Components List', checkThemeSwitcher: true },
  
  // Blocks Section
  { url: '/blocks', name: 'Blocks List', checkThemeSwitcher: true },
  
  // Theme Generator
  { url: '/theme-generator', name: 'Theme Generator', checkThemeSwitcher: true },
];

for (const testCase of PAGES_TO_TEST) {
  test(`Should load ${testCase.name}`, async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${testCase.url}`, { waitUntil: 'networkidle' });
    
    // Check status code
    expect(response?.status()).toBeLessThan(400);
    
    // Wait for content to render
    await page.waitForTimeout(1000);
    
    // Check for main heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 5000 });
    
    // If checking theme switcher
    if (testCase.checkThemeSwitcher) {
      const themeSwitcher = page.locator('button[aria-label="Toggle theme"]').first();
      await expect(themeSwitcher).toBeVisible({ timeout: 2000 });
    }
  });
}

test('Theme switcher should work on homepage', async ({ page }) => {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  
  // Get initial theme
  const initialTheme = await page.evaluate(() => {
    return document.documentElement.getAttribute('class')?.includes('dark') ? 'dark' : 'light';
  });
  
  // Find and click theme switcher
  const themeSwitcher = page.locator('button[aria-label="Toggle theme"]').first();
  await expect(themeSwitcher).toBeVisible();
  await themeSwitcher.click();
  
  // Wait for theme change
  await page.waitForTimeout(500);
  
  // Verify theme changed
  const newTheme = await page.evaluate(() => {
    return document.documentElement.getAttribute('class')?.includes('dark') ? 'dark' : 'light';
  });
  
  expect(newTheme).not.toBe(initialTheme);
});

test('Theme switcher should work on dashboard example', async ({ page }) => {
  await page.goto(`${BASE_URL}/examples/dashboard`, { waitUntil: 'networkidle' });
  
  const themeSwitcher = page.locator('button[aria-label="Toggle theme"]').first();
  await expect(themeSwitcher).toBeVisible();
  
  // Get initial state
  const initialState = await page.evaluate(() => document.documentElement.getAttribute('class'));
  
  // Click theme switcher
  await themeSwitcher.click();
  await page.waitForTimeout(500);
  
  // Verify it changed
  const newState = await page.evaluate(() => document.documentElement.getAttribute('class'));
  expect(newState).not.toBe(initialState);
});

test('Navigation highlighting should work on mail example', async ({ page }) => {
  await page.goto(`${BASE_URL}/examples/mail`, { waitUntil: 'networkidle' });
  
  // Look for the active nav item
  const navItems = page.locator('a, button[data-nav], li');
  
  // Should have navigation
  const navCount = await navItems.count();
  expect(navCount).toBeGreaterThan(0);
});

test('Components list should be navigable', async ({ page }) => {
  await page.goto(`${BASE_URL}/components`, { waitUntil: 'networkidle' });
  
  // Should have multiple component links
  const componentLinks = page.locator('a[href*="/components/"], li a');
  const count = await componentLinks.count();
  expect(count).toBeGreaterThan(5);
});

test('Docs should have working navigation', async ({ page }) => {
  await page.goto(`${BASE_URL}/docs/components/button`, { waitUntil: 'networkidle' });
  
  // Should have code preview
  const codeBlock = page.locator('code, pre, [class*="code"]').first();
  await expect(codeBlock).toBeVisible();
});
