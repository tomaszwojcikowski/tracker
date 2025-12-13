import { test, expect } from '@playwright/test';

/**
 * E2E Tests for HistoryView Time Filter Feature
 * Tests the filter chip buttons (This Week, This Month, All Time)
 * 
 * Note: These tests verify the UI interaction of filter chips when history data exists.
 * The filtering logic itself is comprehensively tested in historyViewTimeFilter.test.tsx
 */

test.describe('HistoryView Time Filter UI', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding and seed history data
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');

      // Create realistic global history entries across different time periods
      const now = new Date();
      const createEntry = (daysAgo) => ({
        date: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        week: 1,
        day: 1,
        exercises: [{
          name: 'Squat',
          prescription: '3x8 reps',
          completedSets: 3,
          totalSets: 3,
          weight: 100,
          rpe: { '0': '8', '1': '8', '2': '9' }
        }]
      });

      const globalHistory = [
        createEntry(1),   // Recent - in week and month
        createEntry(5),   // Recent - in week and month  
        createEntry(15),  // in month only
        createEntry(45),  // all time only
      ];

      // Store with the correct namespaced key
      localStorage.setItem('p:oneplus-12-pro-tracker-v1:global_history', JSON.stringify(globalHistory));
    });

    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
    
    // Navigate to History view
    await page.locator('button[aria-label="History"]').click();
    
    // Wait for view to load - Calendar button should be visible
    await expect(page.getByRole('button', { name: /Calendar/i })).toBeVisible();
  });

  test('should display filter chips when history exists', async ({ page }) => {
    // Filter chips should be visible when there's history data
    const weekChip = page.getByRole('button', { name: /This Week/i });
    const monthChip = page.getByRole('button', { name: /This Month/i });
    const allChip = page.getByRole('button', { name: /All Time/i });

    // Wait for at least one chip to be visible (indicates history loaded)
    await expect(allChip).toBeVisible({ timeout: 10000 });
    
    // All chips should be present
    await expect(weekChip).toBeVisible();
    await expect(monthChip).toBeVisible();
  });

  test('should have "All Time" selected by default', async ({ page }) => {
    const allChip = page.getByRole('button', { name: /All Time/i });
    await expect(allChip).toBeVisible({ timeout: 10000 });
    
    // Should be in pressed state
    await expect(allChip).toHaveAttribute('aria-pressed', 'true');
  });

  test('should toggle between filters', async ({ page }) => {
    // Wait for chips to load
    const weekChip = page.getByRole('button', { name: /This Week/i });
    const monthChip = page.getByRole('button', { name: /This Month/i });
    const allChip = page.getByRole('button', { name: /All Time/i });
    
    await expect(allChip).toBeVisible({ timeout: 10000 });

    // Click Week filter
    await weekChip.click();
    await expect(weekChip).toHaveAttribute('aria-pressed', 'true');
    await expect(allChip).toHaveAttribute('aria-pressed', 'false');

    // Click Month filter  
    await monthChip.click();
    await expect(monthChip).toHaveAttribute('aria-pressed', 'true');
    await expect(weekChip).toHaveAttribute('aria-pressed', 'false');

    // Back to All Time
    await allChip.click();
    await expect(allChip).toHaveAttribute('aria-pressed', 'true');
    await expect(monthChip).toHaveAttribute('aria-pressed', 'false');
  });

  test('should display filter chips with icons', async ({ page }) => {
    const weekChip = page.getByRole('button', { name: /This Week/i });
    await expect(weekChip).toBeVisible({ timeout: 10000 });
    
    // Each chip should contain an SVG icon
    await expect(weekChip.locator('svg')).toBeVisible();
    await expect(page.getByRole('button', { name: /This Month/i }).locator('svg')).toBeVisible();
    await expect(page.getByRole('button', { name: /All Time/i }).locator('svg')).toBeVisible();
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    const weekChip = page.getByRole('button', { name: /This Week/i });
    await expect(weekChip).toBeVisible({ timeout: 10000 });
    
    // All chips should have aria-pressed attribute
    await expect(weekChip).toHaveAttribute('aria-pressed', /true|false/);
    await expect(page.getByRole('button', { name: /This Month/i })).toHaveAttribute('aria-pressed', /true|false/);
    await expect(page.getByRole('button', { name: /All Time/i })).toHaveAttribute('aria-pressed', /true|false/);
  });
});

test.describe('HistoryView with Empty History', () => {
  test('should not display filter chips when history is empty', async ({ page }) => {
    // Override with empty history
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
      localStorage.setItem('p:oneplus-12-pro-tracker-v1:global_history', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });

    // Navigate to History view
    await page.locator('button[aria-label="History"]').click();
    
    // Should show empty state message
    await expect(page.getByText(/No Workouts Yet/i)).toBeVisible();
    
    // Calendar/Stats toggle should still be visible
    await expect(page.getByRole('button', { name: /Calendar/i })).toBeVisible();
    
    // Filter chips should NOT be visible
    const weekChip = page.getByRole('button', { name: /This Week/i });
    await expect(weekChip).not.toBeVisible();
  });
});
