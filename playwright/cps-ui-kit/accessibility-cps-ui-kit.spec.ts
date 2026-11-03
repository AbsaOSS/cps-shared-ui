import type { Page, TestInfo } from '@playwright/test';
import type AxeBuilder from '@axe-core/playwright';
import {
  components,
  type ComponentEntry
} from '../fixtures/composition-components';
import {
  test,
  expectNoViolations,
  annotateIncomplete,
  waitForAnimationsToFinish
} from '../fixtures/axe-helpers';
import {
  measureLayout,
  measureTextScaling,
  setBrowserFontSize,
  TEXT_200_FONT_SIZE,
  waitForStableLayout,
  expectNoLayoutIssues,
  expectTextScales,
  type LayoutAllowances
} from '../fixtures/layout-helpers';

function buildAxeWithSelectors(
  makeAxeBuilder: () => AxeBuilder,
  selector: string | string[]
) {
  const selectors = Array.isArray(selector) ? selector : [selector];
  let builder = makeAxeBuilder();
  for (const s of selectors) {
    builder = builder.include(s);
  }
  return builder;
}

async function waitForSelectors(page: Page, selector: string | string[]) {
  const selectors = Array.isArray(selector) ? selector : [selector];
  await Promise.all(selectors.map((s) => page.waitForSelector(s)));
}

/**
 * Groups entries sharing the same `group` so their tests can be
 * nested under a shared test.describe block.
 */
function groupComponents(entries: ComponentEntry[]) {
  const groups = new Map<string, ComponentEntry[]>();
  const items: { group?: string; entries: ComponentEntry[] }[] = [];

  for (const entry of entries) {
    if (entry.group) {
      let bucket = groups.get(entry.group);
      if (!bucket) {
        bucket = [];
        groups.set(entry.group, bucket);
        items.push({ group: entry.group, entries: bucket });
      }
      bucket.push(entry);
    } else {
      items.push({ entries: [entry] });
    }
  }

  return items;
}

function registerScanTests(
  buildTitle: (name: string) => string,
  registerTest: (entry: ComponentEntry, title: string) => void
) {
  for (const item of groupComponents(components)) {
    if (item.group) {
      test.describe(item.group, () => {
        for (const entry of item.entries) {
          registerTest(entry, buildTitle(entry.name));
        }
      });
    } else {
      registerTest(item.entries[0], buildTitle(item.entries[0].name));
    }
  }
}

// ============================================================================
// axe-core WCAG AA — all component pages
// ============================================================================

async function runScan(
  page: Page,
  makeAxeBuilder: () => AxeBuilder,
  selector: string | string[],
  label: string,
  testInfo: TestInfo
) {
  await waitForSelectors(page, selector);
  await waitForAnimationsToFinish(page);
  const results = await buildAxeWithSelectors(
    makeAxeBuilder,
    selector
  ).analyze();
  await testInfo.attach(`${label}-accessibility-scan`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json'
  });
  annotateIncomplete(testInfo, results.incomplete);
  expectNoViolations(results.violations);
}

test.describe('Accessibility - axe scan', () => {
  registerScanTests(
    (name) => `${name} should have no violations`,
    (entry, title) => {
      test(title, async ({ page, makeAxeBuilder }, testInfo) => {
        await page.goto(entry.route);
        if (entry.setup) await entry.setup(page);
        await runScan(
          page,
          makeAxeBuilder,
          entry.selector,
          'default',
          testInfo
        );
      });
    }
  );
});

// ============================================================================
// axe-core at mobile viewport
// ============================================================================

test.describe('Accessibility - responsive axe scan', () => {
  registerScanTests(
    (name) => `${name} should have no violations at mobile width`,
    (entry, title) => {
      test(title, async ({ page, makeAxeBuilder }, testInfo) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(entry.route);
        if (entry.setup) await entry.setup(page);
        await runScan(
          page,
          makeAxeBuilder,
          entry.selector,
          'default',
          testInfo
        );
      });
    }
  );
});

// ============================================================================
// Reflow (WCAG 1.4.10) and text resize (WCAG 1.4.4) — not covered by axe
// ============================================================================

const ALL_LAYOUT_CHECKS = ['reflow-640', 'reflow-320', 'text-200'] as const;
type LayoutCheck = (typeof ALL_LAYOUT_CHECKS)[number];

/**
 * Content that needs two dimensions (WCAG 1.4.10 exception) may scroll
 * sideways inside its own container. The page itself must still not scroll.
 * Descendants of the container are exempt from the off-screen check; the
 * container itself is still measured. `component` matches an entry's name or group.
 */
const REFLOW_SCROLL_ALLOWANCES: {
  component: string;
  scrollContainer: string;
  reason: string;
}[] = [
  {
    component: 'Table',
    scrollContainer:
      'cps-table .p-datatable-table-container, cps-table .p-virtualscroller',
    reason:
      'Data table: rows and columns need two dimensions (the virtual scroller is the container with virtualScroll)'
  },
  {
    component: 'Tree table',
    scrollContainer:
      'cps-tree-table .p-treetable-scrollable-body, cps-tree-table .p-treetable-scrollable-header, cps-tree-table .p-treetable-wrapper',
    reason:
      'Data table: rows and columns need two dimensions; the header scrolls with the body (the wrapper is the container with scrollable=false)'
  },
  {
    component: 'Tabs',
    scrollContainer: '.example-content cps-tab-group .cps-tabs-list',
    reason: 'Single-row tab list scrolls with prev/next buttons, like a toolbar'
  }
];

/**
 * Text truncated with an ellipsis, allowed only where the full text is
 * available another way.
 */
const ELLIPSIS_ALLOWANCES: {
  component: string;
  selector: string;
  fullTextVia: string;
}[] = [];

/**
 * Entries that fail a check and need a larger fix, each tracked in its own
 * issue. test.fail() makes the test report once the component is fixed;
 * then remove the entry. `components` match an entry's name or group.
 * `platformDependent` entries are within a pixel of failing, so the result
 * depends on the platform's text rendering (they fail on Linux CI, pass on
 * macOS): test.fixme() skips them instead.
 */
const KNOWN_FAILURES: {
  checks: readonly LayoutCheck[];
  components: string[];
  issue: string;
  platformDependent?: true;
}[] = [
  // Options row doesn't wrap and every option is as wide as the widest one
  {
    checks: ALL_LAYOUT_CHECKS,
    components: ['Button toggle'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/909'
  },
  // 8-option schedule type toggle and fixed-width rows don't fit
  {
    checks: ALL_LAYOUT_CHECKS,
    components: ['Scheduler'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/910'
  },
  // Fields and AM/PM selector stay on one row
  {
    checks: ALL_LAYOUT_CHECKS,
    components: ['Timepicker'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/911'
  },
  // Toolbar scrolls sideways instead of wrapping
  {
    checks: ['text-200'],
    components: ['Table 3'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/912'
  },
  {
    checks: ['reflow-640'],
    components: ['Table 3', 'Table 10'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/912',
    platformDependent: true
  },
  {
    checks: ALL_LAYOUT_CHECKS,
    components: ['Table 7', 'Tree table 3', 'Tree table 7'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/912'
  },
  // Columns shrink to the container width and cut off cell text
  {
    checks: ALL_LAYOUT_CHECKS,
    components: [
      'Tree table 2',
      'Tree table 3',
      'Tree table 4',
      'Tree table 5',
      'Tree table 6',
      'Tree table 7',
      'Tree table 8',
      'Tree table 9',
      'Tree table 10',
      'Tree table 11',
      'Tree table 12',
      'Tree table 13'
    ],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/913'
  },
  {
    checks: ['reflow-640'],
    components: ['Tree table 14'],
    issue: 'https://github.com/AbsaOSS/cps-shared-ui/issues/913',
    platformDependent: true
  }
];

const REFLOW_VIEWPORTS: {
  check: LayoutCheck;
  width: number;
  height: number;
}[] = [
  { check: 'reflow-640', width: 640, height: 512 }, // 1280×1024 window at 200% zoom
  { check: 'reflow-320', width: 320, height: 256 } // 1280×1024 window at 400% zoom
];

// With 32px text, 1280px is exactly 40rem, so the kit's narrow-screen rules
// (max-width: 40rem) apply as they do at 200% zoom. A wider window with 200%
// text gets the desktop layout, which isn't tested.
const TEXT_RESIZE_VIEWPORT = { width: 1280, height: 1024 };

function appliesTo(component: string, entry: ComponentEntry) {
  return component === entry.name || component === entry.group;
}

function allowancesFor(entry: ComponentEntry): LayoutAllowances {
  return {
    scrollContainers: REFLOW_SCROLL_ALLOWANCES.filter((a) =>
      appliesTo(a.component, entry)
    ).map((a) => a.scrollContainer),
    ellipsis: ELLIPSIS_ALLOWANCES.filter((a) =>
      appliesTo(a.component, entry)
    ).map((a) => a.selector)
  };
}

/**
 * Call right before measuring: errors thrown earlier (navigation, a renamed
 * tab in setup, a timeout) then still fail the test instead of counting as
 * the expected failure.
 */
function markKnownFailure(check: LayoutCheck, entry: ComponentEntry) {
  const known = KNOWN_FAILURES.filter(
    (f) =>
      f.checks.includes(check) && f.components.some((c) => appliesTo(c, entry))
  );
  const skipped = known.filter((f) => f.platformDependent).map((f) => f.issue);
  test.fixme(skipped.length > 0, skipped.join(', '));
  const issues = known.filter((f) => !f.platformDependent).map((f) => f.issue);
  test.fail(issues.length > 0, issues.join(', '));
}

async function waitForLayout(
  page: Page,
  entry: ComponentEntry,
  testInfo: TestInfo
) {
  if (!(await waitForStableLayout(page, entry.selector)))
    testInfo.annotations.push({
      type: 'warning',
      description: 'The layout was still changing after 3s; measured anyway'
    });
}

async function attachReport(testInfo: TestInfo, label: string, report: object) {
  await testInfo.attach(`${label}-layout-report`, {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json'
  });
}

// The kit only shortens animations under reduced motion, so the final layout
// is the same; without it, slide animations (e.g. cps-tab-group panels) can
// be measured mid-way or leave stale scroll overflow behind in Chromium.
const LAYOUT_TEST_OPTIONS = { reducedMotion: 'reduce' } as const;

for (const viewport of REFLOW_VIEWPORTS) {
  test.describe(`Accessibility - reflow at ${viewport.width}px`, () => {
    test.use(LAYOUT_TEST_OPTIONS);
    registerScanTests(
      (name) => `${name} should reflow at ${viewport.width}px`,
      (entry, title) => {
        test(title, async ({ page }, testInfo) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height
          });
          await page.goto(entry.route);
          if (entry.setup) await entry.setup(page);
          await waitForSelectors(page, entry.selector);
          await waitForAnimationsToFinish(page);
          await waitForLayout(page, entry, testInfo);
          markKnownFailure(viewport.check, entry);
          const report = await measureLayout(
            page,
            entry.selector,
            allowancesFor(entry)
          );
          await attachReport(testInfo, viewport.check, report);
          expectNoLayoutIssues(report, `${entry.name} at ${viewport.width}px`);
        });
      }
    );
  });
}

test.describe('Accessibility - text resize to 200%', () => {
  test.use(LAYOUT_TEST_OPTIONS);
  registerScanTests(
    (name) => `${name} should scale with 200% text`,
    (entry, title) => {
      test(title, async ({ page }, testInfo) => {
        await page.setViewportSize(TEXT_RESIZE_VIEWPORT);
        // Enlarged before the page loads, as a user does in the browser settings
        await setBrowserFontSize(page, TEXT_200_FONT_SIZE);
        await page.goto(entry.route);
        if (entry.setup) await entry.setup(page);
        await waitForSelectors(page, entry.selector);
        await waitForAnimationsToFinish(page);
        await waitForLayout(page, entry, testInfo);
        markKnownFailure('text-200', entry);
        const report = await measureLayout(
          page,
          entry.selector,
          allowancesFor(entry)
        );
        // Last: it switches to the default font size and back.
        const unscaled = await measureTextScaling(page, entry.selector);
        await attachReport(testInfo, 'text-200', { unscaled, ...report });
        const label = `${entry.name} with 200% text`;
        expectTextScales(unscaled, label);
        expectNoLayoutIssues(report, label);
      });
    }
  );
});
