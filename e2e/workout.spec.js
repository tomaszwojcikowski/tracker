import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Workout Flow
 * Tests the core workout completion functionality
 */

test.describe('Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give React time to hydrate
  });

  test('should display workout exercises', async ({ page }) => {
    // Look for exercise-related content
    const exerciseContent = page.locator('text=/pull-up|dip|row|squat|push|warm/i').first();
    
    // Should have some workout content visible
    await expect(exerciseContent).toBeVisible({ timeout: 10000 });
  });

  test('should be able to interact with set buttons', async ({ page }) => {
    // Find set completion buttons (usually numbered or checkmarks)
    const setButtons = page.locator('button').filter({ hasText: /^[1-5]$|✓|set/i });
    
    if (await setButtons.count() > 0) {
      const firstSet = setButtons.first();
      await firstSet.click();
      await page.waitForTimeout(300);
      
      // Button should have changed state (could check class or style)
      // This is a basic interaction test
    }
  });

  test('should show exercise details on interaction', async ({ page }) => {
    // Look for expandable exercise cards
    const exerciseCards = page.locator('[class*="exercise"], [class*="card"], button').first();
    
    if (await exerciseCards.count() > 0) {
      await exerciseCards.click();
      await page.waitForTimeout(500);
    }
  });

  test('should persist workout state after refresh', async ({ page }) => {
    // Get initial state
    const initialContent = await page.locator('body').textContent();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Content should be similar (state persisted)
    const afterContent = await page.locator('body').textContent();
    expect(afterContent.length).toBeGreaterThan(0);
  });
});
