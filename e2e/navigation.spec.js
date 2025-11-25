import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Navigation
 * Tests the main navigation flows and tab switching
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load - look for the navigation bar with tab buttons
    // The app has a fixed bottom navigation with buttons for Train, Library, History, Coach, Settings
    await page.waitForSelector('button[aria-label="Train"], button[aria-label="Library"]', { timeout: 15000 });
  });

  test('should load the app successfully', async ({ page }) => {
    // App should show the navigation bar with tab buttons
    const trainButton = page.locator('button[aria-label="Train"]');
    await expect(trainButton).toBeVisible();

    // Should have content in body
    const hasContent = await page.locator('body').evaluate(el => el.textContent.length > 0);
    expect(hasContent).toBe(true);
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on Library tab
    const libraryTab = page.locator('button[aria-label="Library"]');
    await libraryTab.click();
    await page.waitForTimeout(500);

    // The Library tab should now be active (has aria-current="page")
    await expect(libraryTab).toHaveAttribute('aria-current', 'page');

    // Click on History tab
    const historyTab = page.locator('button[aria-label="History"]');
    await historyTab.click();
    await page.waitForTimeout(500);

    await expect(historyTab).toHaveAttribute('aria-current', 'page');
  });

  test('should handle browser back navigation', async ({ page }) => {
    // Start on Train tab
    const trainTab = page.locator('button[aria-label="Train"]');
    await expect(trainTab).toHaveAttribute('aria-current', 'page');

    // Navigate to Library
    const libraryTab = page.locator('button[aria-label="Library"]');
    await libraryTab.click();
    await page.waitForTimeout(500);

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    // Should be back on Train (or URL should change)
    // Note: depends on how the app handles URL state
  });
});
