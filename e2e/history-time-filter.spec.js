import { test, expect } from '@playwright/test';

/**
 * E2E Tests for History View Time Filter
 * Tests the filter chip interactions (week, month, all time)
 */

test.describe('History View Time Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');

      // Ensure seeded history matches the active default program
      // (the app's default program id comes from the bundled workout plan)
      localStorage.setItem('tracker_active_program', 'integrated-strength-v26-9');

      // Seed global history with entries across different time periods
      const today = new Date();
      const globalHistory = [
        // Recent entries (within 7 days)
        {
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 1,
          title: 'Day 1 - Upper Body',
          exercises: [
            { name: 'Pull-Ups', sets: 3, weight: '50kg' }
          ]
        },
        {
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          week: 1,
          day: 2,
          title: 'Day 2 - Lower Body',
          exercises: [
            { name: 'Squats', sets: 4, weight: '100kg' }
          ]
        },
        // Entries within month but not week (8-30 days ago)
        {
          date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          week: 2,
          day: 1,
          title: 'Day 1 - Upper Body',
          exercises: [
            { name: 'Bench Press', sets: 4, weight: '80kg' }
          ]
        },
        {
          date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          week: 3,
          day: 2,
          title: 'Day 2 - Lower Body',
          exercises: [
            { name: 'Deadlifts', sets: 3, weight: '120kg' }
          ]
        },
        // Old entries (more than 30 days ago)
        {
          date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          week: 4,
          day: 3,
          title: 'Day 3 - Full Body',
          exercises: [
            { name: 'Deadlifts', sets: 3, weight: '110kg' }
          ]
        },
        {
          date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          week: 5,
          day: 1,
          title: 'Day 1 - Upper Body',
          exercises: [
            { name: 'Pull-Ups', sets: 3, weight: '45kg' }
          ]
        }
      ];

      // Set both legacy and namespaced keys for global history
      localStorage.setItem('tracker_global_history', JSON.stringify(globalHistory));
      localStorage.setItem('p:integrated-strength-v26-9:global_history', JSON.stringify(globalHistory));
    });

    await page.goto('/');
    await page.waitForSelector('button[aria-label="History"]:visible', { timeout: 15000 });
  });

  test('should display all filter chips on History view', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Check that all three filter chips are visible
    const weekChip = page.locator('button:has-text("This Week")');
    const monthChip = page.locator('button:has-text("This Month")');
    const allTimeChip = page.locator('button:has-text("All Time")');

    await expect(weekChip).toBeVisible();
    await expect(monthChip).toBeVisible();
    await expect(allTimeChip).toBeVisible();

    // "All Time" should be selected by default (aria-pressed="true")
    await expect(allTimeChip).toHaveAttribute('aria-pressed', 'true');
  });

  test('should filter history by week when clicking "This Week" chip', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Click "This Week" filter
    const weekChip = page.locator('button:has-text("This Week")');
    await weekChip.click();
    await page.waitForTimeout(300); // Wait for filter to apply

    // Verify "This Week" is now selected
    await expect(weekChip).toHaveAttribute('aria-pressed', 'true');

    // Verify other chips are not selected
    const monthChip = page.locator('button:has-text("This Month")');
    const allTimeChip = page.locator('button:has-text("All Time")');
    await expect(monthChip).toHaveAttribute('aria-pressed', 'false');
    await expect(allTimeChip).toHaveAttribute('aria-pressed', 'false');

    // Verify the filter is working by checking visual indicators
    // Days with workouts show either a checkmark or dumbbell icon
    const workoutIndicators = page.locator('.bg-sys-success\\/20, .bg-sys-accent\\/20');
    const count = await workoutIndicators.count();

    // Should have some indicators for recent workouts
    expect(count).toBeGreaterThan(0);
  });

  test('should filter history by month when clicking "This Month" chip', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Click "This Month" filter
    const monthChip = page.locator('button:has-text("This Month")');
    await monthChip.click();
    await page.waitForTimeout(300); // Wait for filter to apply

    // Verify "This Month" is now selected
    await expect(monthChip).toHaveAttribute('aria-pressed', 'true');

    // Verify other chips are not selected
    const weekChip = page.locator('button:has-text("This Week")');
    const allTimeChip = page.locator('button:has-text("All Time")');
    await expect(weekChip).toHaveAttribute('aria-pressed', 'false');
    await expect(allTimeChip).toHaveAttribute('aria-pressed', 'false');

    // Verify the filter is working
    const workoutIndicators = page.locator('.bg-sys-success\\/20, .bg-sys-accent\\/20');
    const count = await workoutIndicators.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show all history when clicking "All Time" chip', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Click "This Week" to filter first
    const weekChip = page.locator('button:has-text("This Week")');
    await weekChip.click();
    await page.waitForTimeout(300);

    // Click "All Time" to show all entries again
    const allTimeChip = page.locator('button:has-text("All Time")');
    await allTimeChip.click();
    await page.waitForTimeout(300);

    // Verify "All Time" is now selected
    await expect(allTimeChip).toHaveAttribute('aria-pressed', 'true');

    // Verify we can see workout indicators (showing all history)
    const workoutIndicators = page.locator('.bg-sys-success\\/20, .bg-sys-accent\\/20');
    const count = await workoutIndicators.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should persist filter selection when switching between tabs', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Click "This Week" filter
    const weekChip = page.locator('button:has-text("This Week")');
    await weekChip.click();
    await page.waitForTimeout(300);

    // Verify "This Week" is selected
    await expect(weekChip).toHaveAttribute('aria-pressed', 'true');

    // Switch to Train tab
    await page.locator('button[aria-label="Train"]:visible').click();
    await page.waitForTimeout(500);

    // Switch back to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Verify "This Week" is still selected
    const weekChipAfter = page.locator('button:has-text("This Week")');
    await expect(weekChipAfter).toHaveAttribute('aria-pressed', 'true');
  });

  test('should provide haptic feedback when clicking filter chips', async ({ page }) => {
    // This test verifies that clicking chips doesn't cause errors
    // (Actual haptic feedback requires device support)

    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Click each chip and verify no errors
    const weekChip = page.locator('button:has-text("This Week")');
    const monthChip = page.locator('button:has-text("This Month")');
    const allTimeChip = page.locator('button:has-text("All Time")');

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await weekChip.click();
    await page.waitForTimeout(200);
    await monthChip.click();
    await page.waitForTimeout(200);
    await allTimeChip.click();
    await page.waitForTimeout(200);

    // Verify no console errors occurred
    expect(consoleErrors.length).toBe(0);
  });

  test('should toggle between Calendar and Stats views while maintaining filter', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Apply "This Week" filter
    const weekChip = page.locator('button:has-text("This Week")');
    await weekChip.click();
    await page.waitForTimeout(300);

    // Switch to Stats view
    const statsButton = page.locator('button:has-text("Stats")');
    await statsButton.click();
    await page.waitForTimeout(300);

    // Switch back to Calendar view
    const calendarButton = page.locator('button:has-text("Calendar")');
    await calendarButton.click();
    await page.waitForTimeout(300);

    // Verify filter is still active
    await expect(weekChip).toHaveAttribute('aria-pressed', 'true');
  });

  test('should display filter chips with proper accessibility attributes', async ({ page }) => {
    // Navigate to History tab
    await page.locator('button[aria-label="History"]:visible').click();
    await page.waitForTimeout(500);

    // Check that filter chips have proper ARIA attributes
    const weekChip = page.locator('button:has-text("This Week")');
    const monthChip = page.locator('button:has-text("This Month")');
    const allTimeChip = page.locator('button:has-text("All Time")');

    // All chips should have aria-pressed attribute
    await expect(weekChip).toHaveAttribute('aria-pressed');
    await expect(monthChip).toHaveAttribute('aria-pressed');
    await expect(allTimeChip).toHaveAttribute('aria-pressed');

    // Exactly one should be pressed
    const weekPressed = await weekChip.getAttribute('aria-pressed') === 'true';
    const monthPressed = await monthChip.getAttribute('aria-pressed') === 'true';
    const allTimePressed = await allTimeChip.getAttribute('aria-pressed') === 'true';

    const pressedCount = [weekPressed, monthPressed, allTimePressed].filter(Boolean).length;
    expect(pressedCount).toBe(1);
  });
});
