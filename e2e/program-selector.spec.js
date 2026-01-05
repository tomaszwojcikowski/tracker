import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Multi-Program Support (Phase 3)
 * Tests program selection, switching, and URL routing with program context
 */

test.describe('Program Selector', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding and set up test state
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
  });

  test.describe('Dashboard Program Card', () => {
    test('should display program selector card on dashboard', async ({ page }) => {
      // The dashboard should show the program selector card
      const programCard = page.locator('text=Current Program');
      await expect(programCard).toBeVisible();
    });

    test('should show program name in the card', async ({ page }) => {
      // The program card button should contain program information
      const programCard = page.locator('button:has-text("Current Program")');
      await expect(programCard).toBeVisible();

      // Verify the card has substantive content beyond just the "Current Program" label
      // Should contain program name and metadata like duration (e.g., "21 weeks")
      await expect(programCard).toContainText('Current Program');
      await expect(programCard).toContainText(/\d+\s+weeks?/i); // Should have duration info like "21 weeks"
    });

    // NOTE: Sample program (template) import tests removed.
    // This test suite now focuses on installed/active program behaviors only.
  });
});

test.describe('URL Routing with Program ID', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
  });

  test('should load app with program ID in URL', async ({ page }) => {
    // Navigate with program parameter
    await page.goto('/?program=test-program&tab=train');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });

    // App should load successfully
    const trainButton = page.locator('button[aria-label="Train"]:visible');
    await expect(trainButton).toBeVisible();
  });

  test('should preserve program ID in URL when navigating', async ({ page }) => {
    // Start with program in URL
    await page.goto('/?program=my-program&tab=train');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });

    // Navigate to Library
    const libraryTab = page.locator('button[aria-label="Library"]:visible');
    await libraryTab.click();
    await page.waitForTimeout(500);

    // URL should still contain program parameter
    const url = page.url();
    expect(url).toContain('program=my-program');
  });

  test('should handle workout view URL with program ID', async ({ page }) => {
    // Navigate directly to workout view with program
    await page.goto('/?program=strength-program&view=workout&week=5&day=1');
    await page.waitForTimeout(1000);

    // Should load the workout view with exercises
    // Look for workout-specific elements (exercise cards, set tracking, etc.)
    const body = page.locator('body');
    await expect(body).toContainText(/Sets|Exercise|Workout/i);
  });

  test('should persist program ID to localStorage', async ({ page }) => {
    // Navigate with program
    await page.goto('/?program=saved-program&tab=train');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Check localStorage
    const savedState = await page.evaluate(() => {
      const state = localStorage.getItem('tracker_app_state');
      return state ? JSON.parse(state) : null;
    });

    // Program ID should be saved
    expect(savedState?.programId).toBe('saved-program');
  });

  test('should restore program ID from localStorage on refresh', async ({ page }) => {
    // Set up localStorage with program ID
    await page.addInitScript(() => {
      localStorage.setItem('tracker_app_state', JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 3,
        activeDay: 1,
        programId: 'restored-program'
      }));
    });

    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Check that program ID was restored
    const savedState = await page.evaluate(() => {
      const state = localStorage.getItem('tracker_app_state');
      return state ? JSON.parse(state) : null;
    });

    expect(savedState?.programId).toBe('restored-program');
  });

  test('should prioritize URL program ID over localStorage', async ({ page }) => {
    // Set up localStorage with one program
    await page.addInitScript(() => {
      localStorage.setItem('tracker_app_state', JSON.stringify({
        viewMode: 'tab',
        activeTab: 'train',
        currentWeek: 1,
        activeDay: 1,
        programId: 'old-program'
      }));
    });

    // Navigate with different program in URL
    await page.goto('/?program=new-program&tab=train');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
    await page.waitForTimeout(500);

    // URL program should take precedence
    const savedState = await page.evaluate(() => {
      const state = localStorage.getItem('tracker_app_state');
      return state ? JSON.parse(state) : null;
    });

    expect(savedState?.programId).toBe('new-program');
  });
});

test.describe('Program-Aware Week Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });
  });

  test('should display week progress on dashboard', async ({ page }) => {
    // Dashboard should show week progress
    const body = page.locator('body');

    // Should have week indicator
    await expect(body).toContainText(/W\d+|Week \d+/i);
  });

  test('should have week navigation controls', async ({ page }) => {
    // Should have previous/next week buttons
    const prevButton = page.locator('button[aria-label="Previous week"]');
    const nextButton = page.locator('button[aria-label="Next week"]');

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('should navigate to next week', async ({ page }) => {
    // Get current week text - matches "Week 1", "Week 2", etc.
    const weekDisplay = page.locator('text=/Week \\d+/');
    const initialWeek = await weekDisplay.first().textContent();

    // Click next week
    const nextButton = page.locator('button[aria-label="Next week"]');
    await nextButton.click();
    await page.waitForTimeout(300);

    // Week should have changed
    const newWeek = await weekDisplay.first().textContent();
    expect(newWeek).not.toBe(initialWeek);
  });

  test('should navigate to previous week', async ({ page }) => {
    // First navigate to week 2
    const nextButton = page.locator('button[aria-label="Next week"]');
    await nextButton.click();
    await page.waitForTimeout(300);

    // Get current week - matches "Week 1", "Week 2", etc.
    const weekDisplay = page.locator('text=/Week \\d+/');
    const currentWeek = await weekDisplay.first().textContent();

    // Click previous week
    const prevButton = page.locator('button[aria-label="Previous week"]');
    await prevButton.click();
    await page.waitForTimeout(300);

    // Week should have changed
    const newWeek = await weekDisplay.first().textContent();
    expect(newWeek).not.toBe(currentWeek);
  });

  test('should disable previous week button on week 1', async ({ page }) => {
    // Navigate to week 1 via URL
    await page.goto('/?tab=train&week=1');
    await page.waitForSelector('button[aria-label="Train"]:visible', { timeout: 15000 });

    // Previous week button should be disabled
    const prevButton = page.locator('button[aria-label="Previous week"]');
    await expect(prevButton).toBeDisabled();
  });
});

test.describe('Deep Linking with Program Context', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
  });

  test('should share program context in URL for bookmarking', async ({ page }) => {
    // Navigate with full state
    await page.goto('/?program=my-program&view=workout&week=3&day=2');
    await page.waitForTimeout(1000);

    // URL should be shareable
    const url = page.url();
    expect(url).toContain('program=my-program');
    expect(url).toContain('week=3');
    expect(url).toContain('day=2');
  });

  test('should restore full state from deep link', async ({ page }) => {
    // Navigate with deep link
    await page.goto('/?program=deep-link-program&tab=history&week=5');
    await page.waitForSelector('button[aria-label="History"]:visible', { timeout: 15000 });
    await page.waitForTimeout(500);

    // History tab should be active
    const historyTab = page.locator('button[aria-label="History"]:visible');
    await expect(historyTab).toHaveAttribute('aria-current', 'page');

    // Program ID should be saved
    const savedState = await page.evaluate(() => {
      const state = localStorage.getItem('tracker_app_state');
      return state ? JSON.parse(state) : null;
    });

    expect(savedState?.programId).toBe('deep-link-program');
    expect(savedState?.currentWeek).toBe(5);
  });
});

test.describe('Settings Programs Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
    await page.goto('/');
    await page.waitForSelector('button[aria-label="Settings"]:visible', { timeout: 15000 });

    // Navigate to Settings
    const settingsTab = page.locator('button[aria-label="Settings"]:visible');
    await settingsTab.click();
    await page.waitForTimeout(500);
  });

  test('should have General and Programs tabs in settings', async ({ page }) => {
    // Check for tab buttons
    const generalTab = page.locator('button:has-text("General")');
    const programsTab = page.locator('button:has-text("Programs")');

    await expect(generalTab).toBeVisible();
    await expect(programsTab).toBeVisible();
  });

  test('should switch to Programs tab when clicked', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Programs tab should be active (has active class for MD3 styling)
    await expect(programsTab).toHaveClass(/active/);
  });
});
