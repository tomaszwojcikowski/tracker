import { test, expect } from '@playwright/test';

test.describe('Dashboard Details Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding and seed a completed workout
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');

      const programId = 'integrated-strength-v26-9';

      // Mark Week 1 Day 1 as completed in session storage
      localStorage.setItem(`p:${programId}:session_w1d1`, JSON.stringify({ completed: true }));

      // Add global history entry for the modal to display something
      const historyKey = `p:${programId}:global_history`;
      const history = [
        {
          date: new Date().toISOString(),
          week: 1,
          day: 1,
          workoutNotes: "Test workout notes",
          exercises: [
            {
              name: "Seeded Exercise",
              prescription: "3x8 reps",
              completedSets: 3,
              totalSets: 3,
              weight: "50",
              rpe: { "0": "8", "1": "8", "2": "9" }
            }
          ],
          programId: programId
        }
      ];
      localStorage.setItem(historyKey, JSON.stringify(history));

      // Register the program
      const registry = [
        {
          "id": programId,
          "name": "The 20-Week Integrated Strength Program (V26.9: Longevity Update)",
          "version": "26.9.1",
          "durationWeeks": 21,
          "isActive": true,
          "installedAt": new Date().toISOString()
        }
      ];
      localStorage.setItem('tracker_program_registry', JSON.stringify(registry));
      localStorage.setItem('tracker_active_program', programId);
    });

    await page.goto('./');
    // Ensure we are on the dashboard - look for the "Workouts" heading (use first() because there are multiple for each week)
    await expect(page.getByRole('heading', { name: 'Workouts' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should open workout details modal when clicking Details on a completed day', async ({ page }) => {
    // Find the Day 1 card which is marked completed
    // There are multiple "Day 1" cards (one per week), so we take the first one (Week 1)
    const day1Card = page.locator('.day-card-enhanced').filter({ hasText: 'Day 1' }).first();

    // Check it shows 'Completed' status
    await expect(day1Card.getByText('Completed')).toBeVisible();

    // Find and click the 'Details' button
    const detailsBtn = day1Card.getByText('Details');
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // Verify the modal opens
    // The modal uses a h3 with the date. Since we used the current date:
    const modal = page.locator('h3:has-text("Workout Details"), h3:has-text("' + new Date().toLocaleDateString('en-US', { month: 'long' }) + '")');
    await expect(modal).toBeVisible();

    // Check for content seeded in history
    await expect(page.getByText('Seeded Exercise')).toBeVisible();
    await expect(page.getByText('Test workout notes')).toBeVisible();
    await expect(page.getByText('50 kg')).toBeVisible();

    // Close the modal - Use the specific aria-label
    const closeBtn = page.getByLabel('Close workout details');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify modal is gone
    await expect(modal).not.toBeVisible();
  });
});
