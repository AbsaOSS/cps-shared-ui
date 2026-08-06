import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function radioGroup(page: Page, testId: string): Locator {
  return example(page, testId).getByRole('radiogroup');
}

test.describe('cps-radio-group', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/radio-group');
  });

  test.describe('Real native keyboard navigation skips disabled radios', () => {
    test('ArrowDown from an enabled radio real-skips a disabled one via native grouping', async ({
      page
    }) => {
      const group = example(page, 'partially-disabled-radio-group');
      const option2 = group.getByRole('radio', { name: 'Option 2' });
      const option4 = group.getByRole('radio', { name: 'Option 4' });

      await option2.focus();
      await page.keyboard.press('ArrowDown');

      await expect(option4).toBeFocused();
      await expect(option4).toBeChecked();
    });
  });

  test.describe('Real form validation shows and clears a real error', () => {
    test('selecting the wrong option shows a real error; selecting the right one clears it', async ({
      page
    }) => {
      const group = radioGroup(page, 'required-radio-group');
      const errorEl = group.getByTestId('cps-radio-group-error');

      const option1 = group.getByRole('radio', { name: 'Option 1' });
      await option1.focus();
      await page.keyboard.press('Space');
      await page.evaluate(() =>
        (document.activeElement as HTMLElement)?.blur()
      );

      await expect(errorEl).toBeVisible();
      await expect(errorEl).toHaveText('Only third option must be selected');
      await expect(group).toHaveAttribute(
        'aria-describedby',
        (await errorEl.getAttribute('id')) ?? ''
      );

      const option3 = group.getByRole('radio', { name: 'Option 3' });
      await option3.focus();
      await page.keyboard.press('Space');
      await page.evaluate(() =>
        (document.activeElement as HTMLElement)?.blur()
      );

      await expect(errorEl).toHaveCount(0);
    });
  });

  test.describe('Real inert blocks focus on unselected custom content', () => {
    test('the nested control real-refuses focus until its radio is selected', async ({
      page
    }) => {
      const group = example(page, 'custom-content-radio-group');
      const customRadio = group.getByRole('radio', {
        name: 'Custom option with inline selectors'
      });
      const nestedCombobox = group.getByRole('combobox', {
        name: 'Select day'
      });

      await expect(customRadio).not.toBeChecked();

      await nestedCombobox.focus();
      await expect(nestedCombobox).not.toBeFocused();

      await customRadio.click();
      await expect(customRadio).toBeChecked();

      await nestedCombobox.focus();
      await expect(nestedCombobox).toBeFocused();
    });
  });

  test.describe('Real hideDetails suppresses both a real hint and a real validation error', () => {
    test('a hint stays real-absent untouched, and a real error stays real-absent once invalid', async ({
      page
    }) => {
      const group = radioGroup(page, 'required-hidden-radio-group');

      await expect(group.getByTestId('cps-radio-group-hint')).toHaveCount(0);

      const option1 = group.getByRole('radio', { name: 'Option 1' });
      await option1.focus();
      await page.keyboard.press('Space');
      await page.evaluate(() =>
        (document.activeElement as HTMLElement)?.blur()
      );

      await expect(group).toHaveAttribute('aria-invalid', 'true');
      await expect(group).not.toHaveAttribute('aria-describedby', /.+/);
      await expect(group.getByTestId('cps-radio-group-error')).toHaveCount(0);
    });
  });
});
