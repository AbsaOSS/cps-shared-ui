import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/switch');
  });

  test.describe('Disabled state', () => {
    test('the native input reports its real disabled and checked state', async ({
      page
    }) => {
      const checkedInput = example(page, 'disabled-checked-switch').getByTestId(
        'cps-switch-input'
      );
      const uncheckedInput = example(
        page,
        'disabled-unchecked-switch'
      ).getByTestId('cps-switch-input');

      await expect(checkedInput).toBeDisabled();
      await expect(uncheckedInput).toBeDisabled();
      await expect(checkedInput).toBeChecked();
      await expect(uncheckedInput).not.toBeChecked();
    });
  });

  test.describe('Real click-through via label text', () => {
    test('clicking the visible label text toggles the switch', async ({
      page
    }) => {
      const wrapper = example(page, 'tooltip-switch');
      const input = wrapper.getByTestId('cps-switch-input');
      const labelText = wrapper.getByTestId('cps-switch-label');

      await expect(input).not.toBeChecked();

      await labelText.click();

      await expect(input).toBeChecked();
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled switch exposes its aria-label as the real accessible name', async ({
      page
    }) => {
      await expect(
        page.getByRole('switch', { name: 'Unlabeled switch' })
      ).toBeVisible();
    });
  });

  test.describe('Two-way binding - real readout', () => {
    test('a real click toggles the visible value via a real click', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-switch');
      const readout = page.getByTestId('two-way-binding-switch-value');

      await expect(readout).toHaveText('Is checked: true');

      await wrapper.click();
      await expect(readout).toHaveText('Is checked: false');

      await wrapper.click();
      await expect(readout).toHaveText('Is checked: true');
    });
  });

  test.describe('Real valueChanged event', () => {
    test('a real click emits valueChanged and updates the visible readout', async ({
      page
    }) => {
      const wrapper = example(page, 'value-changed-switch');
      const readout = page.getByTestId('value-changed-switch-value');

      await expect(readout).toHaveText('Value changed to: false');

      await wrapper.click();
      await expect(readout).toHaveText('Value changed to: true');

      await wrapper.click();
      await expect(readout).toHaveText('Value changed to: false');
    });
  });

  test.describe('Real keyboard Space-key toggle', () => {
    test('focusing the input and pressing Space toggles it natively', async ({
      page
    }) => {
      const input = example(page, 'tooltip-switch').getByTestId(
        'cps-switch-input'
      );

      await expect(input).not.toBeChecked();

      await input.focus();
      await page.keyboard.press('Space');

      await expect(input).toBeChecked();
    });
  });

  test.describe('Real no-transition-on-initial-render', () => {
    test('a pre-checked switch never runs its slide/color transition on reload, but a real toggle still does', async ({
      page
    }) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __transitions: string[] };
        w.__transitions = [];
        document.addEventListener(
          'transitionrun',
          (e) => {
            const target = e.target as HTMLElement;
            if (target.classList?.contains('cps-switch-slider')) {
              w.__transitions.push(target.className);
            }
          },
          true
        );
      });

      await page.reload({ waitUntil: 'networkidle' });

      const readTransitions = () =>
        page.evaluate(
          () => (window as unknown as { __transitions: string[] }).__transitions
        );

      const preCheckedInput = example(
        page,
        'disabled-checked-switch'
      ).getByTestId('cps-switch-input');
      await expect(preCheckedInput).toBeChecked();

      const twoWayBoundInput = example(
        page,
        'two-way-binding-switch'
      ).getByTestId('cps-switch-input');
      await expect(twoWayBoundInput).toBeChecked();

      expect(await readTransitions()).toEqual([]);

      const tooltipInput = example(page, 'tooltip-switch').getByTestId(
        'cps-switch-input'
      );
      await tooltipInput.focus();
      await page.keyboard.press('Space');

      await expect.poll(readTransitions).not.toEqual([]);
    });
  });
});
