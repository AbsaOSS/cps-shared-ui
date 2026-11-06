# Playwright E2E Tests

End-to-end and accessibility tests for the CPS UI Kit components and the composition app, using [Playwright](https://playwright.dev/).

## Structure

```
playwright/
├── cps-ui-kit/
│   ├── accessibility-cps-ui-kit.spec.ts   # axe-core scans, per cps-ui-kit component
│   └── components/                        # Functional/behavioral component tests
│       ├── cps-autocomplete.spec.ts
│       ├── cps-scheduler.spec.ts
│       └── cps-table.spec.ts
├── composition/
│   └── accessibility-composition.spec.ts  # axe-core scans across composition app routes
├── fixtures/
│   ├── axe-helpers.ts                     # Shared axe-core Playwright fixture + assertion helpers
│   ├── composition-components.ts          # Component/page registry used to drive scans
│   └── table_6_fixture.xlsx               # Test data (e.g. expected xlsx exports)
└── tsconfig.json                          # TypeScript config for editor support
```

Tests run against the composition app (`ng serve`) which showcases every component.

Accessibility coverage is split from functional coverage by filename: any spec file with `accessibility` in its name is routed to the dedicated `accessibility` project (see [Browser projects](#browser-projects)); everything else runs under `chromium`/`webkit`.

### Temporary accessibility rule exception

The shared [axe fixture](./fixtures/axe-helpers.ts) temporarily disables
`label-content-name-mismatch`, enabled by default in axe-core 4.14.0. All other
configured rules remain active.

This leaves WCAG 2.5.3 (Label in Name) unchecked by this rule. Follow-up work must
address the reported file-upload, datepicker, tab badge, tree-autocomplete, and
tree-select mismatches, add regression coverage, and remove the exception.

## Running Tests

```bash
# Headless (all projects: chromium, webkit, accessibility)
npm run test:playwright

# Single browser (functional tests only, accessibility spec files excluded)
npm run test:playwright:chromium
npm run test:playwright:webkit

# Headed (see the browser)
npm run test:playwright:headed
npm run test:playwright:chromium:headed
npm run test:playwright:webkit:headed

# Interactive UI mode
npm run test:playwright:interactive

# View last HTML report
npm run test:playwright:report

# Accessibility scans only (Desktop Chrome, both cps-ui-kit and composition)
npm run test:playwright:accessibility

# Scoped slices
npm run test:playwright:cps-ui-kit:all             # cps-ui-kit: components + accessibility, chromium+webkit+accessibility
npm run test:playwright:cps-ui-kit:accessibility   # cps-ui-kit accessibility scans only
npm run test:playwright:cps-ui-kit:components       # cps-ui-kit functional component tests only, chromium+webkit
npm run test:playwright:composition:all             # composition: accessibility, chromium+webkit+accessibility
npm run test:playwright:composition:accessibility   # composition accessibility scans only
```

Playwright auto-starts the dev server (`npm run start`) if it isn't already running. If you already have `ng serve` running on port 4200, it will reuse that.

## Configuration

All config lives in [`playwright.config.ts`](../playwright.config.ts) at the project root.

### Key settings

| Setting               | Local            | CI                           | Why                                                               |
| --------------------- | ---------------- | ---------------------------- | ----------------------------------------------------------------- |
| `retries`             | 0                | 2                            | Avoid masking flaky tests locally, tolerate infra flakiness in CI |
| `workers`             | 50% of CPU cores | 50% of CPU cores (per shard) | Playwright default; not overridden in config                      |
| `forbidOnly`          | false            | true                         | Prevent `.only` from sneaking into PRs                            |
| `reuseExistingServer` | true             | false                        | Reuse your running `ng serve`; CI always starts fresh             |

### Timeouts

| Scope                                    | Value |
| ---------------------------------------- | ----- |
| Test (`timeout`)                         | 30 s  |
| Action (`actionTimeout`)                 | 5 s   |
| Assertion (`expect.timeout`)             | 5 s   |
| Navigation (`navigationTimeout`)         | 5 s   |
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

| Artifact / action                                    | Condition  | Retention |
| ---------------------------------------------------- | ---------- | --------- |
| HTML report (merged across shards)                   | Always     | 10 days   |
| Test results per shard (screenshots, videos, traces) | On failure | 10 days   |
| Blob report per shard (input for merging)            | Always     | 1 day     |
| PR comment (via `daun/playwright-report-summary`)    | Always     | —         |

The PR comment includes a direct download link to the merged HTML report and, on failure, a link to the run's artifacts.

### Browser projects

Three projects are configured in `playwright.config.ts`:

| Project         | Browser        | Runs                                                |
| --------------- | -------------- | --------------------------------------------------- |
| `chromium`      | Desktop Chrome | Any spec file _without_ `accessibility` in its name |
| `webkit`        | Desktop Safari | Any spec file _without_ `accessibility` in its name |
| `accessibility` | Desktop Chrome | Any spec file _with_ `accessibility` in its name    |

Running `npm run test:playwright` executes all three. Accessibility (axe-core) scans only run once, on Chrome — there's no need for cross-browser variation there since axe evaluates rendered DOM/ARIA state, not browser-specific rendering quirks. Functional/behavioral tests run on both `chromium` and `webkit`. Use `--project=<name>` (or the npm script shortcuts above) to target one.

### Web server

Playwright starts `npm run start` (Angular dev server) automatically and waits for `http://localhost:4200` before running tests. Locally, if the server is already running it's reused so you don't have to wait for a cold start.

### Parallelism in CI

CI parallelizes on two levels: the suite is split across 4 shard jobs (see [CI](#ci)), and each shard runs its slice with Playwright's default worker count (half the runner's CPU cores). With `fullyParallel: true`, individual tests within a file are distributed across workers too.

## VS Code Extension

Install the [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension — it makes working with Playwright much more convenient than the command line:

- **Run/debug individual tests** directly from the gutter icons next to each `test()` block
- **Pick locators** visually by clicking elements in the browser, so you don't have to guess selectors
- **View traces** inline when a test fails, with DOM snapshots, network requests, and action logs
- **Watch mode** that re-runs tests automatically as you edit them
- **Browser preview** to see exactly what the test sees in real time
- **Auto-detects** the project by finding `playwright.config.ts` in the workspace root — no extra setup needed

## CI

Playwright tests run in the GitHub Actions workflow (`.github/workflows/cps-shared-ui-checkers.yml`), [sharded](https://playwright.dev/docs/test-sharding) across 4 parallel `playwright` jobs (`--shard=N/4`). Each shard writes a blob report; the `playwright-report` job then merges them with `npx playwright merge-reports` into a single HTML report plus `summary.json` for the PR comment. To change the shard count, update both `shardIndex` and `shardTotal` in the job matrix.

The shard jobs run inside the official [Playwright Docker image](https://playwright.dev/docs/docker) (`mcr.microsoft.com/playwright`), which ships with browsers and their system dependencies preinstalled, so there is no `playwright install` step. `@playwright/test` is pinned to an exact version in `package.json`, and **the image tag must be bumped together with it**; a mismatch fails the run with a message asking to update the Docker image.

The merged HTML report is always uploaded as a workflow artifact (so passing runs stay discoverable too, e.g. to check the new accessibility warning annotations); on failure, each failing shard additionally uploads its test artifacts (screenshots, videos).

## Writing Tests

- Functional/behavioral test files go in `playwright/cps-ui-kit/components/` or alongside the relevant app area, and must end with `.spec.ts`
- Accessibility scan files must have `accessibility` in their filename so they're routed to the `accessibility` project — see `accessibility-cps-ui-kit.spec.ts` and `accessibility-composition.spec.ts` for the existing pattern
- Put test data files in `playwright/fixtures/`
- Use the `makeAxeBuilder` fixture from `playwright/fixtures/axe-helpers.ts` for any new axe-core scan, so the WCAG tag set (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa`, `best-practice`) stays consistent across the suite
