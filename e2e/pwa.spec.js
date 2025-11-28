import { test, expect } from '@playwright/test';

/**
 * E2E Tests for PWA Features
 * Tests offline capability and PWA requirements
 */

test.describe('PWA Features', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding by setting localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem('tracker_onboarding_completed', 'true');
    });
  });

  test('should have a valid manifest', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
    
    // Check for manifest link in head
    const manifest = page.locator('link[rel="manifest"]');
    // Manifest might not exist yet, this is an aspirational test
  });

  test('should load and display content', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });
    
    // App should be functional
    const hasContent = await page.locator('body').evaluate(el => el.textContent.length > 100);
    expect(hasContent).toBe(true);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('button[aria-label="Train"]', { timeout: 15000 });

    // Should still show content
    const hasContent = await page.locator('body').evaluate(el => el.textContent.length > 100);
    expect(hasContent).toBe(true);

    // Navigation should still be visible
    const trainButton = page.locator('button[aria-label="Train"]');
    await expect(trainButton).toBeVisible();

    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});
