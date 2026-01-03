import { defineConfig, devices } from '@playwright/test';

const webServerCommand =
  process.platform === 'win32'
    ? 'set NODE_OPTIONS=&& set VSCODE_INSPECTOR_OPTIONS=&& node scripts/start-vite-no-autoattach.mjs'
    : 'NODE_OPTIONS= VSCODE_INSPECTOR_OPTIONS= node scripts/start-vite-no-autoattach.mjs';

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
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL - app is served under /tracker/ path */
    baseURL: 'http://localhost:5173/tracker/',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Action timeout - prevent individual actions from hanging indefinitely */
    actionTimeout: 10 * 1000, // 10 seconds for any single action

    /* Navigation timeout - prevent page loads from hanging */
    navigationTimeout: 15 * 1000, // 15 seconds for page navigation
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
    command: webServerCommand,
    url: 'http://localhost:5173/tracker/',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start the dev server
  },

  /* Test timeout - set to 30s to prevent tests from hanging */
  timeout: 30 * 1000,

  /* Expect timeout - reduced to 5s for faster failure feedback */
  expect: {
    timeout: 5 * 1000,
  },

  /* Global timeout for entire test run - prevent indefinite hanging */
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : 15 * 60 * 1000, // 10 min on CI, 15 min locally
});
