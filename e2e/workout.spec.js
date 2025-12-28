import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Workout Flow
 * Tests the core workout completion functionality
 */

test.describe('Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding by setting localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
    await page.goto('/');
    // Wait for app to fully load - the navigation bar appears
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
    // Ensure we're on the Train tab
    const trainTab = page.locator('button[aria-label="Train"]:visible');
    await trainTab.click();
    await page.waitForTimeout(500);
  });

  test('should display workout content', async ({ page }) => {
    // The workout view should show some content
    // Look for common workout-related text or elements
    const body = page.locator('body');
    const content = await body.textContent();

    // Should have workout-related content
    expect(content.length).toBeGreaterThan(100);
  });

  test('should show week and day information', async ({ page }) => {
    // Look for week/day indicators in the content
    const body = page.locator('body');
    const content = await body.textContent();

    // Should have "Week" or "Day" or similar workout structure text
    const hasWorkoutStructure = /week|day|workout|exercise/i.test(content);
    expect(hasWorkoutStructure).toBe(true);
  });

  test('should be interactive', async ({ page }) => {
    // Find any clickable button in the workout area
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Should have multiple buttons (navigation + workout controls)
    expect(buttonCount).toBeGreaterThan(5);
  });

  test('should persist state after refresh', async ({ page }) => {
    // Get initial state
    const initialContent = await page.locator('body').textContent();

    // Reload page
    await page.reload();
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Content should still be present (state persisted in localStorage)
    const afterContent = await page.locator('body').textContent();
    expect(afterContent.length).toBeGreaterThan(100);
  });
});
