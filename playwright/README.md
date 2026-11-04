# Playwright E2E Tests

End-to-end and accessibility tests for the CPS UI Kit components and the composition app, using [Playwright](https://playwright.dev/).

## Structure

```
playwright/
├── cps-ui-kit/
│   ├── accessibility-cps-ui-kit.spec.ts   # axe-core scans and reflow / 200% text checks, per cps-ui-kit component
│   └── components/                        # Functional/behavioral component tests
│       ├── cps-autocomplete.spec.ts
│       ├── cps-scheduler.spec.ts
│       └── cps-table.spec.ts
├── composition/
│   └── accessibility-composition.spec.ts  # axe-core scans across composition app routes
├── fixtures/
│   ├── axe-helpers.ts                     # Shared axe-core Playwright fixture + assertion helpers
│   ├── composition-components.ts          # Component/page registry used to drive scans
│   ├── layout-helpers.ts                  # Reflow and text resize measurements + assertion helpers
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

### Reflow and text resize (WCAG 1.4.10, 1.4.4)

axe-core doesn't cover these criteria. It has no rule for 1.4.10 Reflow, its only 1.4.4 Resize Text rule (`meta-viewport`) checks that pinch zoom isn't blocked rather than that text grows, and it never resizes the page. So `accessibility-cps-ui-kit.spec.ts` measures the layout itself, for every entry in `components` (same `route`, `selector` and `setup` as the axe scans, so overlays are checked while open):

| Test                                  | Viewport    | Equivalent                                                    |
| ------------------------------------- | ----------- | ------------------------------------------------------------- |
| `Accessibility - reflow at 640px`     | 640 × 512   | 1280 × 1024 window at 200% zoom                               |
| `Accessibility - reflow at 320px`     | 320 × 256   | 1280 × 1024 window at 400% zoom                               |
| `Accessibility - text resize to 200%` | 1280 × 1024 | Browser font size set to 32px (200% of Chrome's 16px default) |

The 200% test enlarges text the way a user does in the browser settings, through Chrome DevTools (`Page.setFontSizes`), before the page loads. It doesn't inject a CSS root font size. That matters for two reasons. Media queries in `rem` or `em` follow the browser font size but ignore a CSS root font size, and the kit uses them to reflow only on narrow screens. And an app that fixes its root font size in `px` doesn't follow the browser setting, which the test then reports.

With 32px text, the 1280px viewport is exactly `40rem`, the breakpoint of the kit's narrow-screen rules (`@media (max-width: 40rem)`), so they apply as they do at 200% zoom in the same window. Keep the viewport at 1280px: one pixel wider and they stop applying. A wider window with 200% text gets the desktop layout, which these tests don't cover.

The measuring code is in [`fixtures/layout-helpers.ts`](./fixtures/layout-helpers.ts). Each test checks:

1. **The page doesn't scroll sideways.** `document.documentElement.scrollWidth <= clientWidth`, and no part of the component sticks out of a scroll or clip container around it. Content laid out directly in a scroll container (a child, or inline content in its lines) must also stay out of the container's end padding, because the browser scrolls that padding with it; other content may reach into it. The composition app scrolls inside `#main-content`, `.composition-page` and `.code-example__preview` rather than the document, so the document check alone would rarely fail.
2. **Nothing is off-screen.** Every visible element inside the entry's selector(s) lies within the viewport horizontally.
3. **No content is cut off.** Containers that hide part of their content in either direction (`scrollWidth > clientWidth` or `scrollHeight > clientHeight` with `overflow: hidden`/`clip`) are reported, as are containers that scroll sideways inside the component. So is text or a control cut off past a container's left or top edge, which `scrollWidth` leaves out, and a box squeezed to 0px wide that clips its content. Scrolling vertically inside a container is fine. Text truncated with an ellipsis passes only with an allowance.
4. **Text doubles** (200% test only). Every visible text element's computed font size must be double its size at the default browser font size; one that isn't is sized in `px` (on the element, an ancestor or the root) instead of `rem` or `em`. The narrow-screen rules apply only to the 200% reading, so a font size set in them shows up here too. Text removed between the two readings (a toast closing on its timer) is read once more.

Each failure message names the component, the element (tag, classes, text) and the measured sizes; the full report is attached to the test as JSON. Measurements allow 1px for sub-pixel rounding, ignore visually hidden elements (`clip: rect(0 0 0 0)`, e.g. `.cps-sr-only`), wait for the layout to settle (a `warning` annotation notes when it's still changing after 3s), and run with `prefers-reduced-motion: reduce` (the kit only shortens animations under it) with infinite animations such as spinners measured at their first frame.

The checks run only in the `accessibility` project (Desktop Chrome). Layout can differ in WebKit, so verify layout fixes there by hand.

Run only these tests:

```bash
npx playwright test playwright/cps-ui-kit/accessibility-cps-ui-kit.spec.ts --project=accessibility --grep "should (reflow|scale)"
```

#### Allowances

All exceptions live in named lists at the top of the reflow section of `accessibility-cps-ui-kit.spec.ts`. `component` matches an entry's `name` or `group`. Never skip a whole component, and don't loosen a check to make a test pass.

- **`REFLOW_SCROLL_ALLOWANCES`**: content that needs two dimensions (data tables, a single-row tab list with prev/next buttons) may scroll sideways inside its own container. Add `{ component, scrollContainer, reason }`, where `scrollContainer` is the selector of that container. Content it scrolls is then exempt from the off-screen and page checks; content positioned outside it (escaping it) isn't. The container itself is still measured: it must not cut off content vertically or past its left edge, and the page must still not scroll.
- **`ELLIPSIS_ALLOWANCES`**: text may be truncated with an ellipsis only where the full text is available another way. Add `{ component, selector, fullTextVia }`, e.g. `fullTextVia: 'title attribute'`.

#### Known failures

A component whose fix is too large for the change that found it gets its own issue and an entry in **`KNOWN_FAILURES`**: `{ checks, components, issue }`, with a comment saying what fails. The matching tests are marked with `test.fail()`, so they keep passing while the problem exists and fail ("expected to fail, but passed") once the component is fixed; then remove the entry. The mark is applied only after navigation and `setup`, so a broken setup (a renamed tab, a timeout) still fails the test.

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

| Artifact / action                                 | Condition  | Retention |
| ------------------------------------------------- | ---------- | --------- |
| HTML report                                       | Always     | 10 days   |
| Test results (screenshots, videos, traces)        | On failure | 10 days   |
| PR comment (via `daun/playwright-report-summary`) | Always     | —         |

The PR comment includes direct download links to the uploaded artifacts.

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

Playwright tests run as a separate job in the GitHub Actions workflow (`.github/workflows/cps-shared-ui-checkers.yml`). The HTML report is always uploaded as a workflow artifact (so passing runs stay discoverable too, e.g. to check the new accessibility warning annotations); on failure, test artifacts (screenshots, videos) are additionally uploaded.

## Writing Tests

- Functional/behavioral test files go in `playwright/cps-ui-kit/components/` or alongside the relevant app area, and must end with `.spec.ts`
- Accessibility scan files must have `accessibility` in their filename so they're routed to the `accessibility` project — see `accessibility-cps-ui-kit.spec.ts` and `accessibility-composition.spec.ts` for the existing pattern
- Put test data files in `playwright/fixtures/`
- Use the `makeAxeBuilder` fixture from `playwright/fixtures/axe-helpers.ts` for any new axe-core scan, so the WCAG tag set (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa`, `best-practice`) stays consistent across the suite
