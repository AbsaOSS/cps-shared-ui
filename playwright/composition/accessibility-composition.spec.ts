import { type Page, type TestInfo, expect } from '@playwright/test';
import type AxeBuilder from '@axe-core/playwright';
import { pageRoutes } from '../fixtures/composition-components';
import {
  test,
  expectNoViolations,
  waitForAnimationsToFinish
} from '../fixtures/axe-helpers';

const toggle = (page: Page) =>
  page.getByRole('button', { name: 'Toggle navigation sidebar' });
const nav = (page: Page) =>
  page.getByRole('navigation', { name: 'Main navigation' });
const mainContent = (page: Page) => page.locator('#main-content');
const backdrop = (page: Page) => page.locator('.sidebar-backdrop');

async function runFullPageScan(
  page: Page,
  makeAxeBuilder: () => AxeBuilder,
  label: string,
  testInfo: TestInfo
) {
  await page.waitForSelector('#main-content');
  await waitForAnimationsToFinish(page);
  // No .include() — scans the whole rendered document (header + sidebar + main),
  // unlike accessibility-cps-ui-kit.spec.ts which scopes scans to individual components.
  const results = await makeAxeBuilder().analyze();
  await testInfo.attach(`${label}-full-page-accessibility-scan`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json'
  });
  expectNoViolations(results.violations);
}

// ============================================================================
// axe-core WCAG AA — full page scans, one per composition app route
// ============================================================================

test.describe('Accessibility - full page axe scan', () => {
  for (const route of pageRoutes) {
    test(`${route} should have no violations (full page)`, async ({
      page,
      makeAxeBuilder
    }, testInfo) => {
      await page.goto(route);
      await runFullPageScan(page, makeAxeBuilder, route, testInfo);
    });
  }
});

// ============================================================================
// axe-core at mobile viewport
// ============================================================================

test.describe('Accessibility - responsive full page axe scan', () => {
  for (const route of pageRoutes) {
    test(`${route} should have no violations at mobile width (full page)`, async ({
      page,
      makeAxeBuilder
    }, testInfo) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);
      await runFullPageScan(page, makeAxeBuilder, route, testInfo);
    });
  }
});

// ============================================================================
// app shell interactive states not covered by the resting-state scans above
// ============================================================================

test.describe('Accessibility - app shell interactive states', () => {
  test('sidebar collapsed (desktop) has no violations', async ({
    page,
    makeAxeBuilder
  }, testInfo) => {
    await page.goto('/colors');
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await runFullPageScan(
      page,
      makeAxeBuilder,
      'sidebar-collapsed-desktop',
      testInfo
    );
  });

  test('sidebar open on mobile (with backdrop) has no violations', async ({
    page,
    makeAxeBuilder
  }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/colors');
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await page.waitForSelector('.sidebar-backdrop');
    await runFullPageScan(
      page,
      makeAxeBuilder,
      'sidebar-open-mobile',
      testInfo
    );
  });

  test('sidebar collapsed/inert on mobile has no violations', async ({
    page,
    makeAxeBuilder
  }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/colors');
    await runFullPageScan(
      page,
      makeAxeBuilder,
      'sidebar-collapsed-mobile',
      testInfo
    );
  });
});

// ============================================================================
// app shell focus flows not covered by the resting-state scans above
// ============================================================================

test.describe('Composition app shell - sidebar & focus flows', () => {
  test.describe('desktop viewport', () => {
    test('sidebar toggle has correct aria-expanded and the nav landmark exists', async ({
      page
    }) => {
      await page.goto('/colors');
      await expect(nav(page)).toBeVisible();
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
      await toggle(page).click();
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(nav(page)).toHaveAttribute('inert', '');
      await toggle(page).click();
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    });

    test('focus moves to #main-content after direct navigation', async ({
      page
    }) => {
      await page.goto('/button');
      await expect(mainContent(page)).toBeFocused();
    });

    test('focus moves to #main-content after clicking a sidebar nav link', async ({
      page
    }) => {
      await page.goto('/colors');
      await nav(page)
        .getByRole('link', { name: 'Button', exact: true })
        .click();
      await expect(page).toHaveURL(/\/button(\/examples)?$/);
      await expect(mainContent(page)).toBeFocused();
    });

    test('active nav link has aria-current="page"', async ({ page }) => {
      await page.goto('/button');
      await expect(
        nav(page).getByRole('link', { name: 'Button', exact: true })
      ).toHaveAttribute('aria-current', 'page');
    });

    test('Shift+Tab from main content redirects focus to the active nav link', async ({
      page
    }) => {
      await page.goto('/button');
      await expect(mainContent(page)).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(
        nav(page).getByRole('link', { name: 'Button', exact: true })
      ).toBeFocused();
    });
  });

  test.describe('mobile viewport (375x812)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
    });

    test('sidebar starts closed on mobile', async ({ page }) => {
      await page.goto('/colors');
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(backdrop(page)).toHaveCount(0);
    });

    test('opening the sidebar shows the backdrop', async ({ page }) => {
      await page.goto('/colors');
      await toggle(page).click();
      await expect(backdrop(page)).toBeVisible();
    });

    test('clicking a nav link closes the sidebar and focuses main content', async ({
      page
    }) => {
      await page.goto('/colors');
      await toggle(page).click();
      await nav(page)
        .getByRole('link', { name: 'Button', exact: true })
        .click();
      await expect(page).toHaveURL(/\/button(\/examples)?$/);
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(backdrop(page)).toHaveCount(0);
      await expect(mainContent(page)).toBeFocused();
    });

    test('Escape closes the sidebar and returns focus to the toggle button', async ({
      page
    }) => {
      await page.goto('/colors');
      await toggle(page).click();
      await expect(backdrop(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(backdrop(page)).toHaveCount(0);
      await expect(toggle(page)).toBeFocused();
    });
  });
});
