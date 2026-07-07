import type { Page, TestInfo } from '@playwright/test';
import type AxeBuilder from '@axe-core/playwright';
import {
  components,
  type ComponentEntry
} from '../fixtures/composition-components';
import {
  test,
  expectNoViolations,
  waitForAnimationsToFinish
} from '../fixtures/axe-helpers';

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
 * Groups consecutive entries sharing the same `group` so their tests can be
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
