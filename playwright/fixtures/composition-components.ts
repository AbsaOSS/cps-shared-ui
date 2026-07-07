import type { Page } from '@playwright/test';

export interface ComponentEntry {
  route: string;
  name: string;
  selector: string | string[];
  /** For overlay components: trigger them before scanning */
  setup?: (page: Page) => Promise<void>;
  /** Nests this entry's test under a shared test.describe(group) with other
   * entries that share the same group.
   */
  group?: string;
}

export const components: ComponentEntry[] = [
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
  {
    route: '/datepicker',
    name: 'Datepicker',
    selector: ['cps-datepicker', '.cps-datepicker-calendar-menu'],
    setup: async (page) => {
      await page.waitForSelector('cps-datepicker');
      await page
        .locator('cps-datepicker .cps-input-prefix-icon')
        .first()
        .click();
    }
  },
  {
    route: '/dialog',
    name: 'Confirmation dialog',
    selector: '[role="dialog"]',
    group: 'Dialog',
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
    group: 'Dialog',
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
    group: 'Dialog',
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
    group: 'Dialog',
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
    group: 'Dialog',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /blurred background/i })
        .click();
    }
  },
  {
    route: '/divider',
    name: 'Divider',
    selector: '.example-content cps-divider'
  },
  {
    route: '/expansion-panel',
    name: 'Expansion panel',
    selector: '.example-content cps-expansion-panel'
  },
  { route: '/file-upload', name: 'File upload', selector: 'cps-file-upload' },
  { route: '/icon', name: 'Icon', selector: '.example-content cps-icon' },
  { route: '/info-circle', name: 'Info circle', selector: 'cps-info-circle' },
  { route: '/input', name: 'Input', selector: '.example-content cps-input' },
  {
    route: '/loader',
    name: 'Loader',
    selector: '.example-content cps-loader',
    group: 'Loader'
  },
  {
    route: '/loader',
    name: 'Loader fullscreen',
    selector: '.example-content cps-loader',
    group: 'Loader',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page
        .locator('.example-content cps-button')
        .filter({ hasText: /Toggle fullscreen loader/i })
        .click();
      await page.waitForSelector(
        '.cps-loader-overlay[style*="position: fixed"]'
      );
    }
  },
  {
    route: '/menu',
    name: 'Menu standard',
    selector: '.cps-menu-container',
    group: 'Menu',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page.locator('.example-content cps-button').first().click();
    }
  },
  {
    route: '/menu',
    name: 'Menu compressed',
    selector: '.cps-menu-container',
    group: 'Menu',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      await page.locator('.example-content cps-button').nth(2).click();
    }
  },
  {
    route: '/notification',
    name: 'Notification',
    selector: '.cps-notification-container-mask',
    setup: async (page) => {
      await page.waitForSelector('.example-content');
      const buttons = page
        .locator('.example-content cps-button')
        .filter({ hasNotText: /clear all/i });
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        await buttons.nth(i).click();
      }
    }
  },
  { route: '/paginator', name: 'Paginator', selector: 'cps-paginator' },
  {
    route: '/progress-circular',
    name: 'Progress circular',
    selector: 'cps-progress-circular'
  },
  {
    route: '/progress-linear',
    name: 'Progress linear',
    selector: 'cps-progress-linear'
  },
  { route: '/radio-group', name: 'Radio', selector: 'cps-radio-group' },
  ...[
    'Minutes',
    'Hourly',
    'Daily',
    'Weekly',
    'Monthly',
    'Yearly',
    'Advanced'
  ].map(
    (tab): ComponentEntry => ({
      route: '/scheduler',
      name: tab,
      selector: 'cps-scheduler',
      group: 'Scheduler',
      setup: async (page) => {
        await page.getByTestId('schedule-type-toggle').getByText(tab).click();
        await page.waitForSelector('cps-scheduler');
      }
    })
  ),
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
  ...[
    'Table 1',
    'Table 2',
    'Table 3',
    'Table 4',
    'Table 5',
    'Table 6',
    'Table 7',
    'Table 8',
    'Table 9',
    'Table 10'
  ].map(
    (tab): ComponentEntry => ({
      route: '/table',
      name: tab,
      selector: 'cps-table',
      group: 'Table',
      setup: async (page) => {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.waitForSelector('cps-table');
      }
    })
  ),
  { route: '/tag', name: 'Tag', selector: 'cps-tag' },
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
  },
  {
    route: '/tree-autocomplete',
    name: 'Tree autocomplete',
    selector: ['cps-tree-autocomplete', '.cps-treeautocomplete-options-menu'],
    setup: async (page) => {
      await page.waitForSelector('cps-tree-autocomplete');
      await page.locator('cps-tree-autocomplete').first().click();
    }
  },
  {
    route: '/tree-select',
    name: 'Tree select',
    selector: ['cps-tree-select', '.cps-treeselect-options-menu'],
    setup: async (page) => {
      await page.waitForSelector('cps-tree-select');
      await page.locator('cps-tree-select').first().click();
    }
  },
  ...[
    'Tree table 1',
    'Tree table 2',
    'Tree table 3',
    'Tree table 4',
    'Tree table 5',
    'Tree table 6',
    'Tree table 7',
    'Tree table 8',
    'Tree table 9',
    'Tree table 10'
  ].map(
    (tab): ComponentEntry => ({
      route: '/tree-table',
      name: tab,
      selector: 'cps-tree-table',
      group: 'Tree table',
      setup: async (page) => {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.waitForSelector('cps-tree-table');
      }
    })
  )
];

const EXTRA_PAGE_ROUTES = [
  '/colors' // default `**` redirect target; has no entry in `components`
];

export const pageRoutes: string[] = [
  ...new Set([...components.map((c) => c.route), ...EXTRA_PAGE_ROUTES])
].sort();
