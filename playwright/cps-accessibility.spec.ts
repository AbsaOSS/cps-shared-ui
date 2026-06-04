import { test, expect } from './fixtures/axe-test';
import type { Page, TestInfo } from '@playwright/test';
import type AxeBuilder from '@axe-core/playwright';

interface ComponentState {
  label: string;
  setup: (page: Page) => Promise<void>;
}

interface ComponentEntry {
  route: string;
  name: string;
  selector: string | string[];
  /** For overlay components: trigger them before scanning */
  setup?: (page: Page) => Promise<void>;
  /** For components that need multiple scans (e.g., different states/tabs) */
  states?: ComponentState[];
}

const components: ComponentEntry[] = [
  {
    route: '/autocomplete',
    name: 'Autocomplete',
    selector: ['cps-autocomplete', '.cps-autocomplete-options-menu'],
    setup: async (page) => {
      await page.waitForSelector('cps-autocomplete');
      await page.locator('cps-autocomplete').first().click();
    }
  },
  { route: '/button', name: 'Button', selector: 'cps-button' },
  {
    route: '/button-toggle',
    name: 'Button toggle',
    selector: 'cps-button-toggle'
  },
  { route: '/checkbox', name: 'Checkbox', selector: 'cps-checkbox' },
  { route: '/chip', name: 'Chip', selector: 'cps-chip' },
  // {
  //   route: '/datepicker',
  //   name: 'Datepicker',
  //   selector: ['cps-datepicker', '.cps-datepicker-calendar-menu'],
  //   setup: async (page) => {
  //     await page.waitForSelector('cps-datepicker');
  //     await page.locator('cps-datepicker .cps-icon').first().click();
  //   }
  // },
  {
    route: '/dialog',
    name: 'Confirmation dialog',
    selector: '[role="dialog"]',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /Confirmation dialog/i })
        .click();
    }
  },
  {
    route: '/dialog',
    name: 'Regular dialog',
    selector: '[role="dialog"]',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /Regular dialog/i })
        .click();
    }
  },
  {
    route: '/dialog',
    name: 'Draggable dialog',
    selector: '[role="dialog"]',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /Draggable dialog/i })
        .click();
    }
  },
  {
    route: '/dialog',
    name: 'Resizable dialog',
    selector: '[role="dialog"]',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /Resizable dialog/i })
        .click();
    }
  },
  {
    route: '/dialog',
    name: 'Dialog with blurred background and container autofocus',
    selector: '[role="dialog"]',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /blurred background/i })
        .click();
    }
  },
  // { route: '/divider', name: 'Divider', selector: 'cps-divider' },
  // {
  //   route: '/expansion-panel',
  //   name: 'Expansion panel',
  //   selector: 'cps-expansion-panel'
  // },
  { route: '/file-upload', name: 'File upload', selector: 'cps-file-upload' },
  // { route: '/icon', name: 'Icon', selector: 'cps-icon' },
  { route: '/info-circle', name: 'Info circle', selector: 'cps-info-circle' },
  { route: '/input', name: 'Input', selector: '.example-content cps-input' },
  // { route: '/loader', name: 'Loader', selector: 'cps-loader' },
  {
    route: '/menu',
    name: 'Menu standard',
    selector: '.cps-menu-container',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page.locator('.example-content cps-button').first().click();
    }
  },
  {
    route: '/menu',
    name: 'Menu compressed',
    selector: '.cps-menu-container',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page.locator('.example-content cps-button').nth(2).click();
    }
  },
  // {
  //   route: '/notification',
  //   name: 'Notification',
  //   selector: '.cps-notification-container-mask',
  //   setup: async (page) => {
  //     await page.waitForSelector('.example-content');
  //     await page.locator('.example-content cps-button').first().click();
  //   }
  // },
  // { route: '/paginator', name: 'Paginator', selector: 'cps-paginator' },
  // {
  //   route: '/progress-circular',
  //   name: 'Progress circular',
  //   selector: 'cps-progress-circular'
  // },
  // {
  //   route: '/progress-linear',
  //   name: 'Progress linear',
  //   selector: 'cps-progress-linear'
  // },
  { route: '/radio-group', name: 'Radio', selector: 'cps-radio-group' },
  {
    route: '/scheduler',
    name: 'Scheduler',
    selector: 'cps-scheduler',
    states: [
      'Minutes',
      'Hourly',
      'Daily',
      'Weekly',
      'Monthly',
      'Yearly',
      'Advanced'
    ].map((tab) => ({
      label: tab,
      setup: async (page: Page) => {
        await page.getByTestId('schedule-type-toggle').getByText(tab).click();
        await page.waitForSelector('cps-scheduler');
      }
    }))
  },
  {
    route: '/select',
    name: 'Select',
    selector: ['cps-select', '.cps-select-options-menu'],
    setup: async (page) => {
      await page.waitForSelector('cps-select');
      await page.locator('cps-select').first().click();
    }
  },
  {
    route: '/sidebar-menu',
    name: 'Sidebar menu',
    selector: 'cps-sidebar-menu'
  },
  { route: '/switch', name: 'Switch', selector: 'cps-switch' },
  {
    route: '/tab-group',
    name: 'Tabs',
    selector: '.example-content cps-tab-group'
  },
  // { route: '/table', name: 'Table', selector: 'cps-table' },
  // { route: '/tag', name: 'Tag', selector: 'cps-tag' },
  { route: '/textarea', name: 'Textarea', selector: 'cps-textarea' },
  {
    route: '/timepicker',
    name: 'Timepicker',
    selector: ['cps-timepicker', '.cps-autocomplete-options-menu'],
    setup: async (page) => {
      await page.waitForSelector('cps-timepicker');
      await page.locator('cps-timepicker cps-autocomplete').first().click();
    }
  },
  {
    route: '/tooltip',
    name: 'Tooltip',
    selector: '.cps-tooltip',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page.locator('.example-content cps-button').first().hover();
    }
  }
  // {
  //   route: '/tree-autocomplete',
  //   name: 'Tree autocomplete',
  //   selector: ['cps-tree-autocomplete', '.cps-treeautocomplete-options-menu'],
  //   setup: async (page) => {
  //     await page.waitForSelector('cps-tree-autocomplete');
  //     await page.locator('cps-tree-autocomplete').first().click();
  //   }
  // },
  // {
  //   route: '/tree-select',
  //   name: 'Tree select',
  //   selector: ['cps-tree-select', '.cps-treeselect-options-menu'],
  //   setup: async (page) => {
  //     await page.waitForSelector('cps-tree-select');
  //     await page.locator('cps-tree-select').first().click();
  //   }
  // },
  // { route: '/tree-table', name: 'Tree table', selector: 'cps-tree-table' }
];

type Violations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

function formatViolations(violations: Violations): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.html}\n      ${n.failureSummary}`)
        .join('\n');
      return `\n[${v.impact}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n${nodes}`;
    })
    .join('\n');
}

function expectNoViolations(violations: Violations) {
  expect(violations, formatViolations(violations)).toHaveLength(0);
}

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
  // Wait for all animations/transitions to complete before scanning.
  // Without this, axe may capture intermediate states (e.g. mid-transition
  // background color) and report false-positive color contrast violations.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {}))
    )
  );
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
  for (const { route, name, selector, setup, states } of components) {
    test(`${name} should have no violations`, async ({
      page,
      makeAxeBuilder
    }, testInfo) => {
      await page.goto(route);

      if (states) {
        for (const state of states) {
          if (state.setup) await state.setup(page);
          await runScan(page, makeAxeBuilder, selector, state.label, testInfo);
        }
      } else {
        if (setup) await setup(page);
        await runScan(page, makeAxeBuilder, selector, 'default', testInfo);
      }
    });
  }
});

// ============================================================================
// axe-core at mobile viewport
// ============================================================================

test.describe('Accessibility - responsive axe scan', () => {
  for (const { route, name, selector, setup, states } of components) {
    test(`${name} should have no violations at mobile width`, async ({
      page,
      makeAxeBuilder
    }, testInfo) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);

      if (states) {
        for (const state of states) {
          if (state.setup) await state.setup(page);
          await runScan(page, makeAxeBuilder, selector, state.label, testInfo);
        }
      } else {
        if (setup) await setup(page);
        await runScan(page, makeAxeBuilder, selector, 'default', testInfo);
      }
    });
  }
});
