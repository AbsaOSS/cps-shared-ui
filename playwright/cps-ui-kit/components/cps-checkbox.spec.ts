import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-checkbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkbox');
  });

  test.describe('Disabled state', () => {
    test('the native input reports its real disabled and checked state', async ({
      page
    }) => {
      const checkedInput = example(
        page,
        'disabled-checked-checkbox'
      ).getByTestId('cps-checkbox-input');
      const uncheckedInput = example(
        page,
        'disabled-unchecked-checkbox'
      ).getByTestId('cps-checkbox-input');

      await expect(checkedInput).toBeDisabled();
      await expect(uncheckedInput).toBeDisabled();
      await expect(checkedInput).toBeChecked();
      await expect(uncheckedInput).not.toBeChecked();
    });
  });

  test.describe('Real click-through via label text', () => {
    test('clicking the visible label text toggles the checkbox via native label association', async ({
      page
    }) => {
      const wrapper = example(page, 'tooltip-checkbox');
      const input = wrapper.getByTestId('cps-checkbox-input');
      const labelText = wrapper.getByTestId('cps-checkbox-label');

      await expect(input).not.toBeChecked();

      await labelText.click();

      await expect(input).toBeChecked();
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled checkbox exposes its aria-label as the real accessible name', async ({
      page
    }) => {
      await expect(
        page.getByRole('checkbox', { name: 'Unlabeled checkbox' })
      ).toBeVisible();
    });
  });

  test.describe('Real valueChanged event', () => {
    test('a real click emits valueChanged and updates the visible readout', async ({
      page
    }) => {
      const wrapper = example(page, 'value-changed-checkbox');
      const readout = page.getByTestId('value-changed-checkbox-value');

      await expect(readout).toHaveText('Value changed to: false');

      await wrapper.click();
      await expect(readout).toHaveText('Value changed to: true');

      await wrapper.click();
      await expect(readout).toHaveText('Value changed to: false');
    });
  });

  test.describe('Two-way binding - real readout', () => {
    test('a real click toggles the visible value via a real click', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-checkbox');
      const readout = page.getByTestId('two-way-binding-checkbox-value');

      await expect(readout).toHaveText('Is checked: true');

      await wrapper.click();
      await expect(readout).toHaveText('Is checked: false');

      await wrapper.click();
      await expect(readout).toHaveText('Is checked: true');
    });
  });
});
