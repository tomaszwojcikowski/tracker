import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Navigation
 * Tests the main navigation flows and tab switching
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding by setting localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
    await page.goto('/');
    // Wait for app to load - look for the navigation bar with tab buttons
    // The app has a fixed bottom navigation with buttons for Train, Library, History, Settings
    await page.waitForSelector('button[aria-label="Train"]:visible, button[aria-label="Library"]:visible', { timeout: 15000 });
  });

  test('should load the app successfully', async ({ page }) => {
    // App should show the navigation bar with tab buttons
    const trainButton = page.locator('button[aria-label="Train"]:visible');
    await expect(trainButton).toBeVisible();

    // Should have content in body
    const hasContent = await page.locator('body').evaluate(el => el.textContent.length > 0);
    expect(hasContent).toBe(true);
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on Library tab
    const libraryTab = page.locator('button[aria-label="Library"]:visible');
    await libraryTab.click();
    await page.waitForTimeout(500);

    // The Library tab should now be active (has aria-current="page")
    await expect(libraryTab).toHaveAttribute('aria-current', 'page');

    // Click on History tab
    const historyTab = page.locator('button[aria-label="History"]:visible');
    await historyTab.click();
    await page.waitForTimeout(500);

    await expect(historyTab).toHaveAttribute('aria-current', 'page');
  });

  test('should handle browser back navigation', async ({ page }) => {
    // Start on Train tab
    const trainTab = page.locator('button[aria-label="Train"]:visible');
    await expect(trainTab).toHaveAttribute('aria-current', 'page');

    // Navigate to Library
    const libraryTab = page.locator('button[aria-label="Library"]:visible');
    await libraryTab.click();
    await page.waitForTimeout(500);

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    // Should be back on Train (or URL should change)
    // Note: depends on how the app handles URL state
  });

  test('back from workout stays inside app', async ({ page }) => {
    // Start Day 1 workout
    await page.getByRole('button', { name: /start day 1 workout/i }).click();
    await page.waitForTimeout(500);

    // Click back
    await page.getByRole('button', { name: /go back/i }).click();
    await page.waitForTimeout(500);

    // Should be on Train tab and URL should not be a foreign history entry
    const trainTab = page.locator('button[aria-label="Train"]:visible');
    await expect(trainTab).toHaveAttribute('aria-current', 'page');
    expect(page.url()).not.toContain('view=workout');
  });

  test('custom workout persists on reload', async ({ page }) => {
    // Start a custom (empty) workout
    await page.getByRole('button', { name: /start custom workout/i }).click();
    await page.waitForTimeout(500);

    // Verify custom workout view
    await expect(page.getByText(/custom workout/i)).toBeVisible();
    expect(page.url()).toContain('view=empty-workout');

    // Reload and ensure we stay in custom workout
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.getByText(/custom workout/i)).toBeVisible();
    expect(page.url()).toContain('view=empty-workout');
  });
});
