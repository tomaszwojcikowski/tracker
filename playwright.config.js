import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Use multiple workers on CI for faster execution */
  workers: process.env.CI ? 4 : undefined,
  
  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL - app is served under /tracker/ path */
    baseURL: 'http://localhost:5173/tracker/',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport for PWA testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/tracker/',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Test timeout */
  timeout: 30 * 1000,
  
  /* Expect timeout */
  expect: {
    timeout: 5 * 1000,
  },
});
