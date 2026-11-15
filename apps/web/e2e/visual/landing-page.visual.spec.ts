import { test, expect } from '@playwright/test';

test.describe('Visual Regression: Landing Page and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the workspace to mount
    await page.waitForLoadState('domcontentloaded');
  });

  test('landing page renders cleanly with zero horizontal overflow', async ({ page }) => {
    // Critical Rule 5: Zero horizontal overflow validation
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Full page visual baseline comparison
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('header navigation bar matches visual baseline', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    await expect(header).toHaveScreenshot('header-navigation.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
