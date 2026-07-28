import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function calendar(page: Page): Locator {
  return page.getByTestId('cps-datepicker-calendar');
}

test.describe('cps-datepicker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/datepicker');
  });

  test.describe('Real calendar open via click', () => {
    test('opening the calendar via the prefix icon links aria-expanded/aria-controls to the real portaled dialog', async ({
      page
    }) => {
      const wrapper = example(page, 'restricted-datepicker');
      const input = wrapper.locator('input');

      await expect(input).toHaveAttribute('aria-expanded', 'false');

      await wrapper.getByRole('button', { name: 'Open calendar' }).click();

      const dialog = calendar(page);
      await expect(dialog).toBeVisible();
      await expect(input).toHaveAttribute('aria-expanded', 'true');

      const ariaControls = await input.getAttribute('aria-controls');
      const dialogId = await dialog.getAttribute('id');
      expect(ariaControls).toBe(dialogId);
    });
  });

  test.describe('Real calendar open via focus', () => {
    test('focusing the input opens the calendar when openOnInputFocus is set', async ({
      page
    }) => {
      const wrapper = example(page, 'dropdown-on-focus-datepicker');

      await wrapper.locator('input').focus();

      await expect(calendar(page)).toBeVisible();
    });
  });

  test.describe('Real min-date boundary enforcement', () => {
    test('a day outside minDate is rendered disabled and a real click does not change the value', async ({
      page
    }) => {
      const wrapper = example(page, 'restricted-datepicker');
      const input = wrapper.locator('input');
      const valueBefore = await input.inputValue();

      await wrapper.getByRole('button', { name: 'Open calendar' }).click();
      const dialog = calendar(page);
      await expect(dialog).toBeVisible();

      const prevBtn = dialog.getByRole('button', { name: 'Previous Month' });
      await prevBtn.click(); // March 2023 -> February 2023
      await prevBtn.click(); // -> January 2023 (minDate's own month)
      await prevBtn.click(); // -> December 2022 (fully before minDate)

      const outOfRangeDay = dialog.locator('[data-date="2022-11-15"]');
      await expect(outOfRangeDay).toHaveClass(/p-disabled/);

      await outOfRangeDay.click({ force: true });

      await expect(input).toHaveValue(valueBefore);
    });
  });

  test.describe('Real required-field validation', () => {
    test('clearing the value and blurring shows a real required-field error', async ({
      page
    }) => {
      const wrapper = example(page, 'required-datepicker');
      const input = wrapper.locator('input');

      await wrapper.getByRole('button', { name: 'Open calendar' }).click();
      const dialog = calendar(page);
      await expect(dialog).toBeVisible();
      await dialog
        .locator('.p-datepicker-day:not(.p-disabled)', { hasText: /^10$/ })
        .first()
        .click();

      await expect(input).not.toHaveValue('');
      await expect(wrapper.locator('.cps-input-error')).toHaveCount(0);

      await wrapper.getByRole('button', { name: 'Clear' }).click();
      await input.blur();

      await expect(wrapper.locator('.cps-input-error')).toHaveText(
        'Field is required'
      );
    });
  });

  test.describe('Real two-way binding - real readout', () => {
    test('selecting a day in the real calendar updates the visible readout', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-datepicker');
      const readout = page.getByTestId('two-way-binding-datepicker-value');

      await expect(readout).toHaveText('');

      await wrapper.getByRole('button', { name: 'Open calendar' }).click();
      const dialog = calendar(page);
      await expect(dialog).toBeVisible();
      await dialog
        .locator('.p-datepicker-day:not(.p-disabled)', { hasText: /^10$/ })
        .first()
        .click();

      await expect(readout).not.toHaveText('');
      await expect(readout).toContainText('10');
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled datepicker exposes its aria-label as the real accessible name', async ({
      page
    }) => {
      const wrapper = example(page, 'aria-label-datepicker');

      await expect(
        wrapper.getByRole('combobox', { name: 'Choose a date' })
      ).toBeVisible();
    });
  });

  test.describe('Real hideDetails / persistentClear rendering', () => {
    test('hideDetails hides the hint row and persistentClear keeps the clear button visible without a value', async ({
      page
    }) => {
      const wrapper = example(page, 'hide-details-persistent-clear-datepicker');

      await expect(wrapper.locator('.cps-input-hint')).toHaveCount(0);

      const clearBtn = wrapper.getByRole('button', { name: 'Clear' });
      await expect(clearBtn).toBeVisible();
      await expect(clearBtn).toHaveCSS('visibility', 'visible');
    });
  });

  test.describe('Real focus restoration on Escape', () => {
    test('pressing Escape closes the calendar and returns focus to the input', async ({
      page
    }) => {
      const wrapper = example(page, 'restricted-datepicker');
      const input = wrapper.locator('input');

      await wrapper.getByRole('button', { name: 'Open calendar' }).click();
      const dialog = calendar(page);
      await expect(dialog).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(dialog).not.toBeVisible();
      await expect(input).toBeFocused();
    });
  });
});
