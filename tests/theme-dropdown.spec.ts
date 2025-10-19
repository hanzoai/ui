import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3003';

test('Theme switcher dropdown should work on homepage', async ({ page }) => {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  
  // Get initial theme
  const initialTheme = await page.evaluate(() => {
    return document.documentElement.getAttribute('class')?.includes('dark') ? 'dark' : 'light';
  });
  
  // Find and click theme switcher button
  const themeButton = page.locator('button[aria-label="Toggle theme"]').first();
  await expect(themeButton).toBeVisible();
  await themeButton.click();
  
  // Wait for dropdown to open
  await page.waitForTimeout(300);
  
  // Select dark theme if currently light, otherwise select light
  const themeToSelect = initialTheme === 'light' ? 'Dark' : 'Light';
  const menuItem = page.locator('text=' + themeToSelect).first();
  await expect(menuItem).toBeVisible();
  await menuItem.click();
  
  // Wait for theme to apply
  await page.waitForTimeout(500);
  
  // Verify theme changed
  const newTheme = await page.evaluate(() => {
    return document.documentElement.getAttribute('class')?.includes('dark') ? 'dark' : 'light';
  });
  
  expect(newTheme).not.toBe(initialTheme);
  console.log(`Theme changed from ${initialTheme} to ${newTheme}`);
});

test('Theme switcher dropdown should work on dashboard example', async ({ page }) => {
  await page.goto(`${BASE_URL}/examples/dashboard`, { waitUntil: 'networkidle' });
  
  const themeButton = page.locator('button[aria-label="Toggle theme"]').first();
  await expect(themeButton).toBeVisible();
  
  // Get initial state
  const initialState = await page.evaluate(() => document.documentElement.getAttribute('class'));
  
  // Click theme button
  await themeButton.click();
  await page.waitForTimeout(300);
  
  // Select Dark theme
  const darkMenuItem = page.locator('text=Dark').first();
  await expect(darkMenuItem).toBeVisible();
  await darkMenuItem.click();
  
  await page.waitForTimeout(500);
  
  // Verify it changed
  const newState = await page.evaluate(() => document.documentElement.getAttribute('class'));
  expect(newState).not.toBe(initialState);
});

test('Theme should persist across page navigation', async ({ page }) => {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  
  // Switch to dark theme
  const themeButton = page.locator('button[aria-label="Toggle theme"]').first();
  await themeButton.click();
  await page.waitForTimeout(300);
  
  const darkMenuItem = page.locator('text=Dark').first();
  await darkMenuItem.click();
  await page.waitForTimeout(500);
  
  // Navigate to another page
  const docsLink = page.locator('a:has-text("Docs")').first();
  await docsLink.click();
  await page.waitForLoadState('networkidle');
  
  // Check theme is still dark
  const isDark = await page.evaluate(() => {
    return document.documentElement.getAttribute('class')?.includes('dark');
  });
  
  expect(isDark).toBe(true);
});
