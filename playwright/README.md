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

| Setting               | Local            | CI    | Why                                                               |
| --------------------- | ---------------- | ----- | ----------------------------------------------------------------- |
| `retries`             | 0                | 2     | Avoid masking flaky tests locally, tolerate infra flakiness in CI |
| `workers`             | 50% of CPU cores | 1     | Speed locally, stability in CI                                    |
| `forbidOnly`          | false            | true  | Prevent `.only` from sneaking into PRs                            |
| `reuseExistingServer` | true             | false | Reuse your running `ng serve`; CI always starts fresh             |

### Timeouts

| Scope                                    | Value |
| ---------------------------------------- | ----- |
| Test (`timeout`)                         | 30 s  |
| Action (`actionTimeout`)                 | 30 s  |
| Assertion (`expect.timeout`)             | 5 s   |
| Navigation (`navigationTimeout`)         | 30 s  |
| Dev server startup (`webServer.timeout`) | 120 s |

### Failure artifacts

| Artifact   | When                |
| ---------- | ------------------- |
| Screenshot | On failure          |
| Video      | Retained on failure |
| Trace      | On first retry      |

These are written to `test-results/` and the HTML report goes to `playwright-report/`. Both directories are git-ignored.

### CI reporting

The GitHub Actions workflow uploads artifacts and posts a PR comment summarising results:

| Artifact / action          | Condition | Retention |
| -------------------------- | --------- | --------- |
| HTML report                | Always    | 10 days   |
| Test results (screenshots, videos, traces) | On failure | 10 days |
| PR comment (via `daun/playwright-report-summary`) | Always | — |

The PR comment includes direct download links to the uploaded artifacts.

### Browser projects

Two browser projects are configured: **Chromium** and **WebKit**. Running `npm run test:playwright` executes against both. Use `--project=chromium` (or the npm script shortcuts) to target one.

### Web server

Playwright starts `npm run start` (Angular dev server) automatically and waits for `http://localhost:4200` before running tests. Locally, if the server is already running it's reused so you don't have to wait for a cold start.

### Why is parallelism disabled in CI?

CI runners (GitHub Actions `ubuntu-latest`) have limited resources. Running multiple browser instances in parallel on that hardware might cause:

- **Resource contention** — browsers compete for CPU/memory, leading to slow rendering and timeouts
- **Non-deterministic failures** — a test that passes alone may fail when running alongside others due to timing differences
- **Harder debugging** — when multiple tests fail simultaneously, it's hard to tell if it's a real bug or a resource issue

With 1 worker, tests run one at a time — slower but predictable. If CI runs become too slow as the test suite grows, we can consider bumping `workers` value and see if tests remain stable.

## VS Code Extension

Install the [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension — it makes working with Playwright much more convenient than the command line:

- **Run/debug individual tests** directly from the gutter icons next to each `test()` block
- **Pick locators** visually by clicking elements in the browser, so you don't have to guess selectors
- **View traces** inline when a test fails, with DOM snapshots, network requests, and action logs
- **Watch mode** that re-runs tests automatically as you edit them
- **Browser preview** to see exactly what the test sees in real time
- **Auto-detects** the project by finding `playwright.config.ts` in the workspace root — no extra setup needed

## CI

Playwright tests run as a separate job in the GitHub Actions workflow (`.github/workflows/cps-shared-ui-checkers.yml`). On failure, the HTML report and test artifacts (screenshots, videos) are uploaded as workflow artifacts.

## Writing Tests

- Test files go in `playwright/` and must end with `.spec.ts`
- Put test data files in `playwright/fixtures/`
