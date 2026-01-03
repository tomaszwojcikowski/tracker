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
      // Use the correct namespaced key for the current program
      const historyKey = 'p:integrated-strength-v26-9:exercise_history';
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

      localStorage.setItem(historyKey, JSON.stringify(history));

      // Pre-initialize program registry with the default program
      // This ensures the program is registered before the app tries to load it
      const registry = {
        "tracker_program_registry": [
          {
            "id": "integrated-strength-v26-9",
            "name": "The 20-Week Integrated Strength Program (V26.9: Longevity Update)",
            "version": "26.9.1",
            "description": "Build elite pulling strength while maintaining all-around capacity and joint health.",
            "author": "V26.9 Program",
            "durationWeeks": 21,
            "targetLevel": "advanced",
            "goals": ["elite-pulling-strength", "max-pull-ups"],
            "equipment": ["pull-up-bar", "rings", "dumbbells"],
            "dataPath": "/tracker/workout-plan-v2.5.json",
            "isActive": true,
            "installedAt": new Date().toISOString()
          }
        ],
        "tracker_active_program": "integrated-strength-v26-9"
      };

      localStorage.setItem('tracker_program_registry', JSON.stringify(registry['tracker_program_registry']));
      localStorage.setItem('tracker_active_program', registry['tracker_active_program']);
    });

    // Go directly to the workout view for Week 1 Day 1
    await page.goto('/?view=workout&week=1&day=1&program=integrated-strength-v26-9');

    // Wait for workout player to load - look for the workout title in h1
    // App.tsx getTitle() returns "Day 1" for workout view on Day 1
    await expect(page.locator('h1')).toContainText('Day 1', { timeout: 15000 });

    // Wait for the Focus Mode toggle button to be visible
    // This indicates that the workout player has fully rendered
    await expect(page.locator('button[aria-label="Focus mode"]')).toBeVisible({ timeout: 10000 });

    // Wait for exercise cards to render - look for the workout view controls
    // (View Mode Toggle buttons) which appear when exercises are available
    await expect(page.locator('button[aria-label="Card view"]')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle Focus Mode', async ({ page }) => {
    // Find the Focus Mode toggle button
    const focusToggle = page.locator('button[aria-label="Focus mode"]');
    await expect(focusToggle).toBeVisible();

    // Click toggle to enter Focus Mode
    await focusToggle.click();

    // Wait for focus mode to activate (aria-pressed should be true)
    await expect(focusToggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });

    // Check for progress dots (Focus progress)
    const progressDotsContainer = page.getByLabel('Focus progress');
    await expect(progressDotsContainer).toBeVisible({ timeout: 10000 });

    // Check for Navigation Buttons
    const prevBtn = page.locator('button[aria-label="Previous"]');
    const nextBtn = page.locator('button[aria-label="Next"]');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // Previous should be disabled on first exercise
    await expect(prevBtn).toBeDisabled();

    // Click Next to go to the second exercise
    await nextBtn.click();

    // Previous should now be enabled
    await expect(prevBtn).toBeEnabled();

    // Toggle back to List Mode
    await focusToggle.click();

    // Navigation buttons (prev/next) should be gone
    await expect(prevBtn).not.toBeVisible();
    await expect(nextBtn).not.toBeVisible();
  });

  test('should open Exercise History modal', async ({ page }) => {
    // In List Mode, find the history button for "Pull-Up Ladders"
    // The button has aria-label="View details and history for Pull-Up Ladders"
    const historyButton = page.locator('button[aria-label*="Pull-Up Ladders"]').first();

    await expect(historyButton).toBeVisible({ timeout: 10000 });
    await historyButton.click();

    // Check for Modal Content using the ID for the title
    const modalTitle = page.locator('#exercise-modal-title');
    await expect(modalTitle).toBeVisible({ timeout: 10000 });
    await expect(modalTitle).toContainText('Pull-Up Ladders');

    // Check for close button to confirm modal is open
    const closeButton = page.locator('button[aria-label="Close exercise details"]');
    await expect(closeButton).toBeVisible();

    // Close modal
    await closeButton.click();

    // Confirm modal is closed
    await expect(modalTitle).not.toBeVisible();
  });
});
