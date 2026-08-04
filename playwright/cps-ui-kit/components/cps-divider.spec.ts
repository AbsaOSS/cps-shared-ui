import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-divider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/divider');
  });

  test.describe('Real horizontal border rendering', () => {
    test('the default divider renders a real top border and no right border', async ({
      page
    }) => {
      const divider = example(page, 'horizontal-divider-example').locator(
        'cps-divider'
      );

      await expect(divider).toHaveCSS('border-top-style', 'solid');
      await expect(divider).not.toHaveCSS('border-top-width', '0px');
      await expect(divider).toHaveCSS('border-right-style', 'none');
    });
  });

  test.describe('Real vertical border rendering', () => {
    test('a vertical divider renders a real right border and no top border', async ({
      page
    }) => {
      const divider = example(page, 'vertical-divider-example')
        .locator('cps-divider')
        .first();

      await expect(divider).toHaveCSS('border-right-style', 'solid');
      await expect(divider).not.toHaveCSS('border-right-width', '0px');
      await expect(divider).toHaveCSS('border-top-style', 'none');
    });
  });

  test.describe('Real color-resolution and thickness rendering', () => {
    test('a raw CSS color keyword renders literally, and thickness/type are reflected in the real computed border', async ({
      page
    }) => {
      const divider = example(page, 'dashed-thick-red-divider-example').locator(
        'cps-divider'
      );

      await expect(divider).toHaveCSS('border-top-style', 'dashed');
      await expect(divider).toHaveCSS('border-top-width', '4px');
      await expect(divider).toHaveCSS('border-top-color', 'rgb(255, 0, 0)');
    });
  });

  test.describe('Real dotted border rendering', () => {
    test('type="dotted" is reflected in the real computed border style', async ({
      page
    }) => {
      const divider = example(page, 'dotted-divider-example').locator(
        'cps-divider'
      );

      await expect(divider).toHaveCSS('border-top-style', 'dotted');
      await expect(divider).not.toHaveCSS('border-top-width', '0px');
    });
  });
});
