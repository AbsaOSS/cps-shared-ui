# Playwright E2E Tests

End-to-end tests for the CPS UI Kit components, using [Playwright](https://playwright.dev/).

## Structure

```
playwright/
├── cps-xxx.spec.ts            # Components tests
├── fixtures/                  # Test fixture files (e.g. expected xlsx exports)
└── tsconfig.json              # TypeScript config for editor support
```

Tests run against the composition app (`ng serve`) which showcases every component.

## Running Tests

```bash
# Headless (all browsers)
npm run test:playwright

# Single browser
npm run test:playwright:chromium
npm run test:playwright:firefox
npm run test:playwright:webkit

# Headed (see the browser)
npm run test:playwright:headed

# Interactive UI mode
npm run test:playwright:interactive

# View last HTML report
npm run test:playwright:report
```

Playwright auto-starts the dev server (`npm run start`) if it isn't already running. If you already have `ng serve` running on port 4200, it will reuse that.

## Configuration

All config lives in [`playwright.config.ts`](../playwright.config.ts) at the project root.

### Key settings

| Setting | Local | CI | Why |
|---|---|---|---|
| `retries` | 0 | 2 | Avoid masking flaky tests locally, tolerate infra flakiness in CI |
| `workers` | 50% of CPU cores | 1 | Speed locally, stability in CI |
| `forbidOnly` | false | true | Prevent `.only` from sneaking into PRs |
| `reuseExistingServer` | true | false | Reuse your running `ng serve`; CI always starts fresh |

### Timeouts

| Scope | Value |
|---|---|
| Test (`timeout`) | 30 s |
| Action (`actionTimeout`) | 10 s |
| Assertion (`expect.timeout`) | 5 s |
| Navigation (`navigationTimeout`) | 30 s |
| Dev server startup (`webServer.timeout`) | 120 s |

### Failure artifacts

| Artifact | When |
|---|---|
| Screenshot | On failure |
| Video | Retained on failure |
| Trace | On first retry |

These are written to `test-results/` and the HTML report goes to `playwright-report/`. Both directories are git-ignored.

### Browser projects

Three browser projects are configured: **Chromium**, **Firefox**, and **WebKit**. Running `npm run test:playwright` executes against all three. Use `--project=chromium` (or the npm script shortcuts) to target one.

### Web server

Playwright starts `npm run start` (Angular dev server) automatically and waits for `http://localhost:4200` before running tests. Locally, if the server is already running it's reused so you don't have to wait for a cold start.

## VS Code Extension

Install the [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension. It lets you run and debug individual tests directly from the editor, pick locators visually, and view traces — much faster than the command line for day-to-day work.

## CI

Playwright tests run as a separate job in the GitHub Actions workflow (`.github/workflows/cps-shared-ui-checkers.yml`). On failure, the HTML report and test artifacts (screenshots, videos) are uploaded as workflow artifacts.

## Writing Tests

- Test files go in `playwright/` and must end with `.spec.ts`
- Put test data files in `playwright/fixtures/`
