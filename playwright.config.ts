import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright',
  outputDir: 'test-results',
  /* Run tests in files in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. Default: false */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only. Default: 0 */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. Default: undefined (uses 50% of CPU cores) */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['json', { outputFile: 'test-results/report.json' }]],
  /* Maximum time one test can run for. Default: 30_000 */
  timeout: 30_000,
  /* Maximum time an expect() assertion can wait for the condition to be met. Default: 5_000 */
  expect: { timeout: 5_000 },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:4200',
    /* Maximum time each user action (click, fill, etc.) can take. Default: 0 (no limit) */
    actionTimeout: 30_000,
    /* Maximum time a navigation (goto, reload) can take. Default: 0 (no limit) */
    navigationTimeout: 30_000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer. Default: 'off' */
    trace: 'on-first-retry',
    /* Capture screenshot only when a test fails. Default: 'off' */
    screenshot: 'only-on-failure',
    /* Record video but only keep it for failed tests. Default: 'off' */
    video: 'retain-on-failure'
  },

  tsconfig: './tsconfig.playwright.json',

  /* Configure projects for major browsers. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        /*
         * On macOS, corporate MDM may block Playwright's patched Firefox Nightly.
         * Set these env vars locally to use your system Firefox via WebDriver BiDi:
         *   PLAYWRIGHT_FIREFOX_CHANNEL=moz-firefox
         *   PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH=/path/to/firefox  (optional, if not at standard location)
         * CI leaves these unset and uses the default Nightly build.
         */
        ...(!process.env.CI && process.env.PLAYWRIGHT_FIREFOX_CHANNEL
          ? {
              channel: process.env.PLAYWRIGHT_FIREFOX_CHANNEL,
              ...(process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH
                ? {
                    launchOptions: {
                      executablePath:
                        process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH
                    }
                  }
                : {})
            }
          : {})
      }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  /* Start the Angular dev server before running the tests */
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    /* In local dev, reuse an already-running server; in CI, always start fresh. Default: false */
    reuseExistingServer: !process.env.CI,
    /* Angular builds can be slow — allow up to 2 minutes. Default: 60_000 */
    timeout: 120_000
  }
});
