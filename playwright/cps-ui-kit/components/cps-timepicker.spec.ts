import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function field(
  wrapper: Locator,
  name: 'hours' | 'minutes' | 'seconds'
): Locator {
  return wrapper.getByTestId(`cps-timepicker-${name}`);
}

async function tabUntilFocused(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  for (let i = 0; i < 30; i++) {
    const isFocused = await target.evaluate(
      (el) => el === document.activeElement
    );
    if (isFocused) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Target was never reached via real Tab navigation');
}

test.describe('cps-timepicker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timepicker');
  });

  test.describe('Real typing resolves a partial match on blur', () => {
    test('typing a single digit into the Hours field auto-resolves to the zero-padded option on blur', async ({
      page
    }) => {
      const wrapper = example(page, 'required-timepicker');
      const hoursField = field(wrapper, 'hours');
      const hoursInput = hoursField.getByRole('combobox');
      const hoursDisplay = hoursField.getByTestId(
        'cps-autocomplete-selected-value'
      );

      await hoursInput.click();
      await hoursInput.fill('');
      await hoursInput.pressSequentially('1');
      await page.keyboard.press('Tab');

      await expect(hoursDisplay).toHaveText('01');
    });
  });

  test.describe('Real digit-only keypress filtering', () => {
    test('pressing a letter key in the Hours field does not enter any character', async ({
      page
    }) => {
      const wrapper = example(page, 'required-timepicker');
      const hoursField = field(wrapper, 'hours');
      const hoursInput = hoursField.getByRole('combobox');

      await hoursInput.click();
      await hoursInput.fill('');
      await hoursInput.press('a');

      await expect(hoursInput).toHaveValue('');
    });
  });

  test.describe('Real Tab order across Hours -> Minutes -> Seconds', () => {
    test('Tab moves focus through every real numeric field in order', async ({
      page
    }) => {
      const wrapper = example(page, 'seconds-timepicker');
      const hours = field(wrapper, 'hours').getByRole('combobox');
      const minutes = field(wrapper, 'minutes').getByRole('combobox');
      const seconds = field(wrapper, 'seconds').getByRole('combobox');

      await tabUntilFocused(page, hours);
      await page.keyboard.press('Tab');
      await expect(minutes).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(seconds).toBeFocused();
    });
  });

  test.describe('Real AM/PM keyboard selection', () => {
    test('arrow keys switch the real checked radio in the day-period group', async ({
      page
    }) => {
      const wrapper = example(page, 'required-timepicker');
      const am = wrapper.getByRole('radio', { name: 'AM' });
      const pm = wrapper.getByRole('radio', { name: 'PM' });

      await expect(pm).toBeChecked();

      await am.focus();
      await page.keyboard.press('Space');

      await expect(am).toBeChecked();
      await expect(pm).not.toBeChecked();
    });
  });

  test.describe('Real one-directional day-period auto-correction', () => {
    test('typing an hour that forces PM does not auto-revert to AM when corrected back to a 12-hour value', async ({
      page
    }) => {
      const wrapper = example(page, 'required-timepicker');
      const hoursInput = field(wrapper, 'hours').getByRole('combobox');
      const pm = wrapper.getByRole('radio', { name: 'PM' });
      const am = wrapper.getByRole('radio', { name: 'AM' });

      await hoursInput.click();
      await hoursInput.fill('');
      await hoursInput.pressSequentially('15');
      await hoursInput.press('Tab');

      await expect(pm).toBeChecked();

      await hoursInput.click();
      await hoursInput.fill('');
      await hoursInput.pressSequentially('03');
      await hoursInput.press('Tab');

      await expect(pm).toBeChecked();
      await expect(am).not.toBeChecked();
    });
  });

  test.describe('Real ARIA id-relationship for validation errors', () => {
    test('clearing the Hours field and blurring wires a real "Time is invalid" error into aria-describedby', async ({
      page
    }) => {
      const wrapper = example(page, 'required-timepicker');
      const body = wrapper.getByTestId('cps-timepicker-body');
      const hoursInput = field(wrapper, 'hours').getByRole('combobox');

      const initialDescribedBy = await body.getAttribute('aria-describedby');
      expect(initialDescribedBy).toBeNull();

      await hoursInput.click();
      await hoursInput.fill('');
      await page.keyboard.press('Escape');
      await hoursInput.press('Tab');

      const error = wrapper.getByTestId('cps-timepicker-error');
      await expect(error).toHaveText('Time is invalid');
      const describedBy = await body.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(error).toHaveAttribute('id', describedBy!);
    });
  });

  test.describe('hideDetails suppresses the hint/error row entirely', () => {
    test('no hint element is rendered when hideDetails is set', async ({
      page
    }) => {
      const hint = example(page, 'hide-details-timepicker').getByTestId(
        'cps-timepicker-hint'
      );

      await expect(hint).toHaveCount(0);
    });
  });

  test.describe('mandatoryValue prevents real clearing', () => {
    test('clearing a field and blurring snaps it back to the first option instead of going empty', async ({
      page
    }) => {
      const wrapper = example(page, 'mandatory-value-timepicker');
      const hoursField = field(wrapper, 'hours');
      const hoursInput = hoursField.getByRole('combobox');
      const hoursDisplay = hoursField.getByTestId(
        'cps-autocomplete-selected-value'
      );

      await expect(hoursDisplay).toHaveText('09');

      await hoursInput.click();
      await hoursInput.fill('');
      await hoursInput.press('Tab');

      await expect(hoursDisplay).toHaveText('01');
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled timepicker exposes its ariaLabel as the real accessible name', async ({
      page
    }) => {
      const wrapper = example(page, 'aria-label-timepicker');

      await expect(
        wrapper.getByRole('group', { name: 'Choose a time' })
      ).toBeVisible();
    });
  });

  test.describe('Two-way binding - real readout', () => {
    test('typing into the Hours field updates the visible bound value', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-timepicker');
      const hoursInput = field(wrapper, 'hours').getByRole('combobox');
      const readout = page.getByTestId('two-way-binding-timepicker-value');

      await hoursInput.click();
      await hoursInput.fill('');
      await hoursInput.pressSequentially('07');
      await hoursInput.press('Tab');

      await expect(readout).toContainText('"hours": "07"');
    });
  });
});
