import { test, expect } from '@playwright/test';

/**
 * E2E Tests for New Features (Phase 3 & 4)
 * Tests Focus Mode and Enhanced Exercise History
 */

test.describe('New Features', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');

      // Seed history for "Pull-Up Ladders" (Day 1 exercise)
      const history = {
        "Pull-Up Ladders": [
          {
            date: new Date().toISOString(),
            week: 1,
            day: 1,
            sets: 3,
            weight: 10,
            prescription: "3x8 reps"
          },
          {
            date: new Date(Date.now() - 86400000).toISOString(),
            week: 1,
            day: 1,
            sets: 3,
            weight: 12,
            prescription: "3x8 reps"
          }
        ]
      };

      // Set both legacy and namespaced keys to be safe
      localStorage.setItem('tracker_exercise_history', JSON.stringify(history));
      localStorage.setItem('p:oneplus-12-pro-tracker-v1:exercise_history', JSON.stringify(history));
    });

    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
    await page.locator('button[aria-label="Train"]').click();
    await page.waitForTimeout(1000); // Wait for dashboard to load

    // Start Day 1 Workout
    const startButton = page.locator('button[aria-label="Start Day 1 workout"]');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Wait for workout player to load
    await page.waitForSelector('button[aria-label="Focus mode"]', { timeout: 10000 });
  });

  test('should toggle Focus Mode', async ({ page }) => {
    // Check if we are in List Mode by default (multiple exercise cards)
    // We can check for multiple "Sets" headers or multiple exercise names
    // But easier to check if Focus Mode toggle is present
    const focusToggle = page.locator('button[aria-label="Focus mode"]');
    await expect(focusToggle).toBeVisible();

    // Click toggle
    await focusToggle.click();

    // Should now be in Focus Mode
    // Check for "Exercise X of Y" text
    const progressText = page.locator('text=/Exercise \\d+ of \\d+/');
    await expect(progressText).toBeVisible();

    // Check for Navigation Buttons
    const prevBtn = page.locator('button:has(svg.lucide-chevron-left)');
    const nextBtn = page.locator('button:has(svg.lucide-chevron-right)');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // Previous should be disabled on first exercise
    await expect(prevBtn).toBeDisabled();

    // Click Next
    await nextBtn.click();

    // Previous should now be enabled
    await expect(prevBtn).toBeEnabled();

    // Toggle back to List Mode
    await focusToggle.click();

    // "Exercise X of Y" should be gone
    await expect(progressText).not.toBeVisible();
  });

  test('should open Exercise History modal', async ({ page }) => {
    // We seeded history for "Pull-Ups".
    // We need to find the exercise card for Pull-Ups.
    // If Pull-Ups is not in Day 1, this test might fail.
    // Let's check if any exercise has history indicator.

    // The aria-label format is "${name} - tap to view history"
    const historyButton = page.locator('button[aria-label*="tap to view history"]').first();

    // If no history button found, maybe the seeded name doesn't match the workout.
    // But let's try.
    await expect(historyButton).toBeVisible();

    await historyButton.click();

    // Check for Modal Content
    // The new modal has "Est. 1RM" and "Progress"
    await expect(page.locator('text=Est. 1RM')).toBeVisible();
    await expect(page.locator('text=Progress')).toBeVisible();

    // Close modal using icon selector if aria-label is tricky
    const closeButton = page.locator('button:has(svg.lucide-x)');
    await closeButton.click();

    await expect(page.locator('text=Est. 1RM')).not.toBeVisible();
  });
});
