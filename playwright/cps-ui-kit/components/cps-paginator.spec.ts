import { test, expect, type Page, type Locator } from '@playwright/test';

function paginatorByLabel(page: Page, name: string): Locator {
  return page.getByRole('navigation', { name });
}

function reportText(paginator: Locator): Locator {
  return paginator.locator('.p-paginator-current');
}

test.describe('cps-paginator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginator');
  });

  test.describe('Real ArrowRight/ArrowLeft keyboard navigation', () => {
    test('ArrowRight moves real focus to the next page button and real-changes the page', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Basic pagination');
      const page1 = paginator.getByRole('button', { name: '1', exact: true });
      await page1.focus();

      await page.keyboard.press('ArrowRight');

      const page2 = paginator.getByRole('button', { name: '2', exact: true });
      await expect(page2).toBeFocused();
      await expect(reportText(paginator)).toHaveText('11 - 20 of 120');
    });

    test('ArrowLeft moves real focus to the previous page button and real-changes the page', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Basic pagination');
      const page2 = paginator.getByRole('button', { name: '2', exact: true });
      await page2.click();
      await expect(reportText(paginator)).toHaveText('11 - 20 of 120');

      await page2.focus();
      await page.keyboard.press('ArrowLeft');

      const page1 = paginator.getByRole('button', { name: '1', exact: true });
      await expect(page1).toBeFocused();
      await expect(reportText(paginator)).toHaveText('1 - 10 of 120');
    });
  });

  test.describe('Real focus redirection when a boundary nav button becomes disabled', () => {
    test('activating Last real-moves focus to the real selected page button', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Basic pagination');

      await paginator.locator('.p-paginator-last').focus();
      await page.keyboard.press('Enter');

      await expect(reportText(paginator)).toHaveText('111 - 120 of 120');
      const selected = paginator.locator(
        '.p-paginator-page[aria-current="page"]'
      );
      await expect(selected).toBeFocused();
    });

    test('activating First real-moves focus to the real selected page button', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Basic pagination');

      await paginator.locator('.p-paginator-last').focus();
      await page.keyboard.press('Enter');
      await expect(reportText(paginator)).toHaveText('111 - 120 of 120');

      await paginator.locator('.p-paginator-first').focus();
      await page.keyboard.press('Enter');

      await expect(reportText(paginator)).toHaveText('1 - 10 of 120');
      const selected = paginator.locator(
        '.p-paginator-page[aria-current="page"]'
      );
      await expect(selected).toBeFocused();
    });
  });

  test.describe('Real aria-disabled/tabindex on the first button reflects real page state', () => {
    test('the first button is really disabled on page 1 and really enabled after navigating away', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Basic pagination');
      const firstBtn = paginator.locator('.p-paginator-first');
      await expect(firstBtn).toHaveAttribute('aria-disabled', 'true');
      await expect(firstBtn).toHaveAttribute('tabindex', '-1');

      await paginator.getByRole('button', { name: '2', exact: true }).click();

      await expect(firstBtn).not.toHaveAttribute('aria-disabled', 'true');
      await expect(firstBtn).toHaveAttribute('tabindex', '0');
    });
  });

  test.describe('Real rows-per-page change via the real nested cps-select dropdown', () => {
    test('picking a new value from the real dropdown real-updates the report', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Basic pagination');
      await expect(reportText(paginator)).toHaveText('1 - 10 of 120');

      await paginator.getByRole('combobox').click();
      await page.getByRole('option', { name: '25', exact: true }).click();

      await expect(reportText(paginator)).toHaveText('1 - 25 of 120');
    });
  });

  test.describe('Real alwaysShow=false hides the paginator with only one page', () => {
    test('a single-page paginator with alwaysShow=false real-collapses via display:none, and real-reappears once more records exist', async ({
      page
    }) => {
      const paginator = paginatorByLabel(page, 'Single-page pagination');
      const inner = paginator.getByTestId('cps-paginator');
      await expect(inner).toHaveCSS('display', 'none');

      const exampleBlock = page
        .locator('app-code-example')
        .filter({ has: paginator });
      await exampleBlock.getByTestId('cps-checkbox-label').click();

      await expect(inner).not.toHaveCSS('display', 'none');
      await expect(inner.locator('.p-paginator-current')).toHaveText(
        '1 - 10 of 120'
      );
    });
  });

  test.describe('Real resetPageOnRowsChange returns to page 1 via the real select', () => {
    test('changing rows-per-page through the real dropdown real-resets the page', async ({
      page
    }) => {
      const paginator = paginatorByLabel(
        page,
        'Custom rows-per-page pagination'
      );
      await paginator.getByRole('button', { name: '2', exact: true }).click();
      await expect(reportText(paginator)).toHaveText('6 - 10 of 120');

      await paginator.getByRole('combobox').click();
      await page.getByRole('option', { name: '15', exact: true }).click();

      await expect(reportText(paginator)).toHaveText('1 - 15 of 120');
    });
  });

  test.describe('Real backgroundColor applies as real CSS', () => {
    test('a custom backgroundColor real-renders as the computed background', async ({
      page
    }) => {
      const inner = paginatorByLabel(
        page,
        'Custom background pagination'
      ).getByTestId('cps-paginator');

      await expect(inner).toHaveCSS('background-color', 'rgb(240, 244, 255)');
    });
  });
});
