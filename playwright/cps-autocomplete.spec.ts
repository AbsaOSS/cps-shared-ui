import { test, expect } from '@playwright/test';

test.describe('cps-autocomplete page', () => {
  test.describe('required single autocomplete with a tooltip', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/autocomplete');
    });

    test('should select items properly', async ({ page }) => {
      await page.getByTestId('required-autocomplete').click();
      await page.getByText('Rome').locator('visible=true').click();
      await expect(
        page
          .getByTestId('required-autocomplete')
          .locator('.single-item-selection')
      ).toHaveText('Rome');

      await page.getByTestId('required-autocomplete').click();
      await page.getByText('Prague').locator('visible=true').first().click();
      await expect(
        page
          .getByTestId('required-autocomplete')
          .locator('.single-item-selection')
      ).toHaveText('Prague');
    });

    test('should clear items', async ({ page }) => {
      await expect(
        page
          .getByTestId('required-autocomplete')
          .locator('.single-item-selection')
      ).toHaveText('Prague');

      await page
        .getByTestId('required-autocomplete')
        .locator('.cps-autocomplete-box-clear-icon')
        .click();

      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await expect(page.getByText('Field is required')).toBeVisible();
      await expect(
        page
          .getByTestId('required-autocomplete')
          .locator('.single-item-selection')
      ).toHaveCount(0);
    });
  });
});
