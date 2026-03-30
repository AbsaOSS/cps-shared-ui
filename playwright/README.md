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

### Issues with Firefox

Playwright's default Firefox is a custom Nightly build that is blocked by Absa's MDM policy: ~Library/Caches/ms-playwright/firefox-1509/firefox/Nightly.app
By default, Playwright downloads its own patched Firefox Nightly binary to control the browser via an internal protocol called Juggler. The MDM (Mobile Device Management) software blocks unsigned or Nightly-signed apps. When this happens you'll see:

```
This Bundle has been blocked by IT Support
```

**Use your system Firefox via WebDriver BiDi** — Playwright supports a `moz-firefox` channel that launches your regular system Firefox instead of the Nightly build. The config already supports this via environment variables:

```bash
PLAYWRIGHT_FIREFOX_CHANNEL=moz-firefox npm run test:playwright:firefox
```

If Firefox is not at the standard path (`/Applications/Firefox.app/Contents/MacOS/firefox`), also set the executable path:

```bash
PLAYWRIGHT_FIREFOX_CHANNEL=moz-firefox \
PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH=/your/path/to/firefox \
npm run test:playwright:firefox
```

You can export both in your shell profile (`~/.zshrc`) to make it permanent:

```bash
export PLAYWRIGHT_FIREFOX_CHANNEL=moz-firefox
export PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH=/your/path/to/firefox  # only if needed
```

The `moz-firefox` channel uses WebDriver BiDi instead of Juggler. It is experimental
and some Playwright features may behave differently. CI leaves this variable unset and uses
the default Nightly build, so any differences will be caught there.

**Fall back to Chromium + WebKit locally** — if none of the above work:

```bash
npm run test:playwright:chromium
npm run test:playwright:webkit
```

CI runs on Ubuntu where MDM restrictions don't apply, so Firefox is always tested there.

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
| Action (`actionTimeout`)                 | 10 s  |
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

### Browser projects

Three browser projects are configured: **Chromium**, **Firefox**, and **WebKit**. Running `npm run test:playwright` executes against all three. Use `--project=chromium` (or the npm script shortcuts) to target one.

### Web server

Playwright starts `npm run start` (Angular dev server) automatically and waits for `http://localhost:4200` before running tests. Locally, if the server is already running it's reused so you don't have to wait for a cold start.

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
