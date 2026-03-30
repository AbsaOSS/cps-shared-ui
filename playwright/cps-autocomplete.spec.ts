import { test, expect } from '@playwright/test';

test.describe('cps-autocomplete page', () => {
  test.describe('required single autocomplete with a tooltip', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/autocomplete');
    });

    test('should select items properly', async ({ page }) => {
      await page.locator('[data-cy="required-autocomplete"]').click();
      await page.getByText('Rome').click();
      await expect(
        page.locator('[data-cy="required-autocomplete"] .single-item-selection')
      ).toHaveText('Rome');

      await page.locator('[data-cy="required-autocomplete"]').click();
      await page.getByText('Prague').first().click();
      await expect(
        page.locator('[data-cy="required-autocomplete"] .single-item-selection')
      ).toHaveText('Prague');
    });

    test('should clear items', async ({ page }) => {
      await expect(
        page.locator('[data-cy="required-autocomplete"] .single-item-selection')
      ).toHaveText('Prague');

      await page
        .locator(
          '[data-cy="required-autocomplete"] .cps-autocomplete-box-clear-icon'
        )
        .click();

      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await expect(page.getByText('Field is required')).toBeVisible();
      await expect(
        page.locator('[data-cy="required-autocomplete"] .single-item-selection')
      ).toHaveCount(0);
    });
  });
});
