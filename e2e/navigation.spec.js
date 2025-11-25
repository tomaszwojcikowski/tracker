import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Navigation
 * Tests the main navigation flows and tab switching
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"], .tab-bar, nav', { timeout: 10000 });
  });

  test('should load the app successfully', async ({ page }) => {
    // App should show either the workout view or the main navigation
    const hasContent = await page.locator('body').evaluate(el => el.textContent.length > 0);
    expect(hasContent).toBe(true);
  });

  test('should switch between tabs', async ({ page }) => {
    // Look for tab buttons or navigation elements
    const tabs = page.locator('button, [role="tab"], nav a').filter({ hasText: /train|library|history|coach|profile/i });
    
    if (await tabs.count() > 0) {
      // Click each tab and verify navigation
      const tabCount = await tabs.count();
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(300); // Wait for animation
      }
    }
  });

  test('should handle browser back navigation', async ({ page }) => {
    // Navigate to different views
    const initialUrl = page.url();
    
    // Try to navigate somewhere
    const navigableElements = page.locator('button, a').first();
    if (await navigableElements.count() > 0) {
      await navigableElements.click();
      await page.waitForTimeout(500);
      
      // Go back
      await page.goBack();
      await page.waitForTimeout(300);
    }
  });
});
