import { test, expect } from './fixtures/axe-test';
import type { Page } from '@playwright/test';
import type AxeBuilder from '@axe-core/playwright';

interface ComponentEntry {
  route: string;
  name: string;
  selector: string | string[];
  /** For overlay components: trigger them before scanning */
  setup?: (page: Page) => Promise<void>;
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
  // {
  //   route: '/dialog',
  //   name: 'Dialog',
  //   selector: '[role="dialog"]',
  //   setup: async (page) => {
  //     await page.waitForSelector('.example-content');
  //     await page
  //       .locator('.example-content cps-button')
  //       .filter({ hasText: /dialog/i })
  //       .first()
  //       .click();
  //   }
  // },
  // { route: '/divider', name: 'Divider', selector: 'cps-divider' },
  // {
  //   route: '/expansion-panel',
  //   name: 'Expansion panel',
  //   selector: 'cps-expansion-panel'
  // },
  { route: '/file-upload', name: 'File upload', selector: 'cps-file-upload' },
  // { route: '/icon', name: 'Icon', selector: 'cps-icon' },
  { route: '/info-circle', name: 'Info circle', selector: 'cps-info-circle' },
  // { route: '/input', name: 'Input', selector: 'cps-input' },
  // { route: '/loader', name: 'Loader', selector: 'cps-loader' },
  // {
  //   route: '/menu',
  //   name: 'Menu',
  //   selector: '.cps-menu-container',
  //   setup: async (page) => {
  //     await page.waitForSelector('.example-content');
  //     await page.locator('.example-content cps-button').first().click();
  //   }
  // },
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
  // { route: '/scheduler', name: 'Scheduler', selector: 'cps-scheduler' },
  // {
  //   route: '/select',
  //   name: 'Select',
  //   selector: ['cps-select', '.cps-select-options-menu'],
  //   setup: async (page) => {
  //     await page.waitForSelector('cps-select');
  //     await page.locator('cps-select').first().click();
  //   }
  // },
  // {
  //   route: '/sidebar-menu',
  //   name: 'Sidebar menu',
  //   selector: 'cps-sidebar-menu'
  // },
  // { route: '/switch', name: 'Switch', selector: 'cps-switch' },
  // { route: '/tab-group', name: 'Tab group', selector: 'cps-tab-group' },
  // { route: '/table', name: 'Table', selector: 'cps-table' },
  // { route: '/tag', name: 'Tag', selector: 'cps-tag' },
  // { route: '/textarea', name: 'Textarea', selector: 'cps-textarea' },
  // {
  //   route: '/timepicker',
  //   name: 'Timepicker',
  //   selector: ['cps-timepicker', '.cps-autocomplete-options-menu'],
  //   setup: async (page) => {
  //     await page.waitForSelector('cps-timepicker');
  //     await page.locator('cps-timepicker cps-autocomplete').first().click();
  //   }
  // },
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

test.describe('Accessibility - axe scan', () => {
  for (const { route, name, selector, setup } of components) {
    test(`${name} should have no violations`, async ({
      page,
      makeAxeBuilder
    }, testInfo) => {
      await page.goto(route);

      if (setup) {
        await setup(page);
      }

      await waitForSelectors(page, selector);

      const results = await buildAxeWithSelectors(
        makeAxeBuilder,
        selector
      ).analyze();

      await testInfo.attach('accessibility-scan-results', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json'
      });

      expectNoViolations(results.violations);
    });
  }
});

// ============================================================================
// axe-core at mobile viewport
// ============================================================================

test.describe('Accessibility - responsive axe scan', () => {
  for (const { route, name, selector, setup } of components) {
    test(`${name} should have no violations at mobile width`, async ({
      page,
      makeAxeBuilder
    }, testInfo) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);

      if (setup) {
        await setup(page);
      }

      await waitForSelectors(page, selector);

      const results = await buildAxeWithSelectors(
        makeAxeBuilder,
        selector
      ).analyze();

      await testInfo.attach('accessibility-scan-results', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json'
      });

      expectNoViolations(results.violations);
    });
  }
});
