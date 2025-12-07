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
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
  });

  test.describe('Dashboard Program Card', () => {
    test('should display program selector card on dashboard', async ({ page }) => {
      // The dashboard should show the program selector card
      const programCard = page.locator('text=Current Program');
      await expect(programCard).toBeVisible();
    });

    test('should show program name in the card', async ({ page }) => {
      // Should display the current program name
      // Wait for the "Current Program" label to be visible
      const currentProgramText = page.locator('text=Current Program');
      await expect(currentProgramText).toBeVisible();
      
      // Verify a program name is displayed (any non-empty text after the label)
      // The program card button should contain program information
      const programCard = page.locator('button:has-text("Current Program")');
      await expect(programCard).toBeVisible();
      
      // Verify the card has substantive content (more than just the label)
      const cardText = await programCard.textContent();
      expect(cardText.length).toBeGreaterThan(20); // Should have program name, duration, etc.
    });

    test('should open program selector modal when card is clicked', async ({ page }) => {
      // Find and click the program selector card
      const programCard = page.locator('button:has-text("Current Program")');
      await programCard.click();

      // Wait for modal to appear
      await page.waitForTimeout(300);

      // Modal should be visible with "Select Program" title
      const modalTitle = page.locator('text=Select Program');
      await expect(modalTitle).toBeVisible();
    });

    test('should close modal when clicking outside', async ({ page }) => {
      // Open modal
      const programCard = page.locator('button:has-text("Current Program")');
      await programCard.click();
      await page.waitForTimeout(300);

      // Verify modal is open
      const modalTitle = page.locator('text=Select Program');
      await expect(modalTitle).toBeVisible();

      // Click on the backdrop (outside the modal content)
      // Use a position that avoids the Navigation Rail (80px wide) on desktop
      await page.locator('.bg-black\\/60').click({ position: { x: 200, y: 100 } });
      await page.waitForTimeout(300);

      // Modal should be closed
      await expect(modalTitle).not.toBeVisible();
    });

    test('should close modal when clicking X button', async ({ page }) => {
      // Open modal
      const programCard = page.locator('button:has-text("Current Program")');
      await programCard.click();
      await page.waitForTimeout(300);

      // Click the close button
      const closeButton = page.locator('[class*="rounded-t-3xl"] button').first();
      await closeButton.click();
      await page.waitForTimeout(300);

      // Modal should be closed
      const modalTitle = page.locator('text=Select Program');
      await expect(modalTitle).not.toBeVisible();
    });
  });

  test.describe('Program Selection Modal', () => {
    test('should display available programs in modal', async ({ page }) => {
      // Open modal
      const programCard = page.locator('button:has-text("Current Program")');
      await programCard.click();
      await page.waitForTimeout(300);

      // Should show program list or empty state
      const modal = page.locator('[class*="rounded-t-3xl"]');
      await expect(modal).toBeVisible();

      // Check for program cards or empty state message
      const content = await modal.textContent();
      const hasPrograms = /weeks|Active|Import Program/i.test(content);
      expect(hasPrograms).toBe(true);
    });

    test('should show program details in modal', async ({ page }) => {
      // Open modal
      const programCard = page.locator('button:has-text("Current Program")');
      await programCard.click();
      await page.waitForTimeout(300);

      // Modal should contain program details
      const modal = page.locator('[class*="rounded-t-3xl"]');
      const content = await modal.textContent();

      // Should have duration info (weeks) or empty state
      const hasDetails = /weeks|No programs available/i.test(content);
      expect(hasDetails).toBe(true);
    });

    test('should show Add New Program button', async ({ page }) => {
      // Open modal
      const programCard = page.locator('button:has-text("Current Program")');
      await programCard.click();
      await page.waitForTimeout(300);

      // Should have add new program button
      const addButton = page.locator('button:has-text("Add New Program")');
      await expect(addButton).toBeVisible();
    });
  });

  test.describe('Settings Program Management', () => {
    test('should display Programs tab in settings', async ({ page }) => {
      // Navigate to Settings tab
      const settingsTab = page.locator('button[aria-label="Settings"]');
      await settingsTab.click();
      await page.waitForTimeout(500);

      // Should show Programs tab button
      const programsTab = page.locator('button:has-text("Programs")');
      await expect(programsTab).toBeVisible();
    });

    test('should show program list when Programs tab is clicked', async ({ page }) => {
      // Navigate to Settings tab
      const settingsTab = page.locator('button[aria-label="Settings"]');
      await settingsTab.click();
      await page.waitForTimeout(500);

      // Click on Programs tab
      const programsTab = page.locator('button:has-text("Programs")');
      await programsTab.click();
      await page.waitForTimeout(300);

      // Should display program selector with available programs
      const body = page.locator('body');
      const content = await body.textContent();

      // Should have program content (sample programs or installed programs)
      const hasProgramContent = /weeks|Beginner|Intermediate|Available Programs/i.test(content);
      expect(hasProgramContent).toBe(true);
    });
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
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });

    // App should load successfully
    const trainButton = page.locator('button[aria-label="Train"]');
    await expect(trainButton).toBeVisible();
  });

  test('should preserve program ID in URL when navigating', async ({ page }) => {
    // Start with program in URL
    await page.goto('/?program=my-program&tab=train');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });

    // Navigate to Library
    const libraryTab = page.locator('button[aria-label="Library"]');
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

    // Should load the workout view
    const body = page.locator('body');
    const content = await body.textContent();

    // Should have workout content
    expect(content.length).toBeGreaterThan(50);
  });

  test('should persist program ID to localStorage', async ({ page }) => {
    // Navigate with program
    await page.goto('/?program=saved-program&tab=train');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
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
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
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
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
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
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
  });

  test('should display week progress on dashboard', async ({ page }) => {
    // Dashboard should show week progress
    const body = page.locator('body');
    const content = await body.textContent();

    // Should have week indicator
    const hasWeekIndicator = /W\d+|Week \d+/i.test(content);
    expect(hasWeekIndicator).toBe(true);
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
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });

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
    await page.waitForSelector('button[aria-label="History"]', { timeout: 15000 });
    await page.waitForTimeout(500);

    // History tab should be active
    const historyTab = page.locator('button[aria-label="History"]');
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
    await page.waitForSelector('button[aria-label="Settings"]', { timeout: 15000 });

    // Navigate to Settings
    const settingsTab = page.locator('button[aria-label="Settings"]');
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

    // Programs tab should be active (has accent background)
    await expect(programsTab).toHaveClass(/bg-sys-accent/);
  });

  test('should show available sample programs in Programs tab', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Should show sample programs section
    const content = await page.locator('body').textContent();

    // Check for sample program names
    const hasSamplePrograms =
      /Beginner Bodyweight|Pull-Up Builder|Strength Fundamentals|Mobility|Flexibility/i.test(content);
    expect(hasSamplePrograms).toBe(true);
  });

  test('should show "Available Programs" label when there are uninstalled programs', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Should show "Available Programs" section
    const availableLabel = page.locator('text=Available Programs');
    await expect(availableLabel).toBeVisible();
  });

  test('should show program duration in weeks for sample programs', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Should show duration for programs (e.g., "4 weeks", "6 weeks", "8 weeks")
    const content = await page.locator('body').textContent();
    const hasDuration = /\d+ weeks/i.test(content);
    expect(hasDuration).toBe(true);
  });

  test('should show difficulty level badges for sample programs', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Should show difficulty badges
    const content = await page.locator('body').textContent();
    const hasLevelBadges = /Beginner|Intermediate|Advanced/i.test(content);
    expect(hasLevelBadges).toBe(true);
  });

  test('should import and activate a sample program when clicked', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Find a sample program to import (look for one with a + icon)
    const sampleProgram = page.locator('button:has-text("2-Week Mobility")').first();

    if (await sampleProgram.isVisible()) {
      await sampleProgram.click();
      await page.waitForTimeout(1000);

      // After import, the program should show "Active" badge
      const activeIndicator = page.locator('text=Active');
      await expect(activeIndicator).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist selected program after page reload', async ({ page }) => {
    // Click on Programs tab
    const programsTab = page.locator('button:has-text("Programs")');
    await programsTab.click();
    await page.waitForTimeout(300);

    // Import a sample program
    const sampleProgram = page.locator('button:has-text("2-Week Mobility")').first();

    if (await sampleProgram.isVisible()) {
      await sampleProgram.click();
      await page.waitForTimeout(1000);

      // Reload the page
      await page.reload();
      await page.waitForSelector('button[aria-label="Settings"]', { timeout: 15000 });

      // Navigate back to Settings > Programs
      await page.locator('button[aria-label="Settings"]').click();
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Programs")').click();
      await page.waitForTimeout(300);

      // The imported program should show as Active
      const activeIndicator = page.locator('text=Active');
      await expect(activeIndicator).toBeVisible();
    }
  });
});
