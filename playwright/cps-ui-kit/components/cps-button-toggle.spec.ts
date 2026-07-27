import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function option(page: Page, exampleTestId: string, index: number): Locator {
  return example(page, exampleTestId).getByTestId(
    `cps-button-toggle-option-${index}`
  );
}

function optionInput(
  page: Page,
  exampleTestId: string,
  index: number
): Locator {
  return example(page, exampleTestId).getByTestId(
    `cps-button-toggle-option-${index}-input`
  );
}

test.describe('cps-button-toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/button-toggle');
  });

  test.describe('Disabled state', () => {
    test('the whole group cannot be focused', async ({ page }) => {
      const input = optionInput(page, 'disabled-toggle', 0);

      await expect(input).toBeDisabled();

      await input.focus();
      await expect(input).not.toBeFocused();
    });
  });

  test.describe('Real click-through selection - radio mode', () => {
    test('clicking a label moves selection via the hidden native radio input', async ({
      page
    }) => {
      const previouslySelected = option(page, 'basic-toggle', 1);
      const target = option(page, 'basic-toggle', 2);

      await expect(previouslySelected).toHaveClass(/is-selected/);
      await expect(optionInput(page, 'basic-toggle', 1)).toBeChecked();

      await target.click();

      await expect(target).toHaveClass(/is-selected/);
      await expect(optionInput(page, 'basic-toggle', 2)).toBeChecked();
      await expect(previouslySelected).not.toHaveClass(/is-selected/);
      await expect(optionInput(page, 'basic-toggle', 1)).not.toBeChecked();
    });
  });

  test.describe('Real keyboard navigation - radio group', () => {
    test('ArrowRight moves selection to the next option in the group', async ({
      page
    }) => {
      await optionInput(page, 'basic-toggle', 1).focus();

      await page.keyboard.press('ArrowRight');

      await expect(option(page, 'basic-toggle', 2)).toHaveClass(/is-selected/);
      await expect(optionInput(page, 'basic-toggle', 2)).toBeChecked();
      await expect(option(page, 'basic-toggle', 1)).not.toHaveClass(
        /is-selected/
      );
    });
  });

  test.describe('Real click-through selection - multi-select mode', () => {
    test('clicking an unselected option adds it', async ({ page }) => {
      const added = option(page, 'multiple-toggle', 2);

      await expect(added).not.toHaveClass(/is-selected/);

      await added.click();

      await expect(added).toHaveAttribute('aria-pressed', 'true');
      await expect(option(page, 'multiple-toggle', 1)).toHaveClass(
        /is-selected/
      );
    });

    test('mandatory blocks removing the last selected option', async ({
      page
    }) => {
      const onlySelected = option(page, 'multiple-toggle', 1);

      await expect(onlySelected).toHaveClass(/is-selected/);

      await onlySelected.click();

      await expect(onlySelected).toHaveClass(/is-selected/);
      await expect(onlySelected).toHaveAttribute('aria-pressed', 'true');
    });

    test('non-mandatory allows clearing the last selected option', async ({
      page
    }) => {
      const onlySelected = option(page, 'multiple-non-mandatory-toggle', 1);

      await expect(onlySelected).toHaveClass(/is-selected/);

      await onlySelected.click();

      await expect(onlySelected).not.toHaveClass(/is-selected/);
      await expect(onlySelected).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test.describe('radioNavigation disabled - real keyboard behavior', () => {
    test('a real click still selects an option, but ArrowRight does not move selection', async ({
      page
    }) => {
      const previouslySelected = option(page, 'no-radio-navigation-toggle', 1);
      const target = option(page, 'no-radio-navigation-toggle', 2);

      await target.click();
      await expect(target).toHaveClass(/is-selected/);
      await expect(previouslySelected).not.toHaveClass(/is-selected/);

      await target.focus();
      await page.keyboard.press('ArrowRight');
      await expect(target).toHaveClass(/is-selected/);
    });
  });

  test.describe('Disabled options within an otherwise-enabled group', () => {
    test('a disabled option cannot be interacted with, an enabled sibling stays clickable', async ({
      page
    }) => {
      const disabledOption = option(page, 'partially-disabled-toggle', 0);
      const currentlySelected = option(page, 'partially-disabled-toggle', 1);
      const enabledSibling = option(page, 'partially-disabled-toggle', 3);

      await expect(disabledOption).toBeDisabled();

      await enabledSibling.click();
      await expect(enabledSibling).toHaveClass(/is-selected/);
      await expect(currentlySelected).not.toHaveClass(/is-selected/);
    });
  });

  test.describe('Real equalWidths layout', () => {
    test('option widths match when equalWidths is enabled', async ({
      page
    }) => {
      const widths = await Promise.all(
        [0, 1, 2].map(async (index) => {
          const box = await option(
            page,
            'icons-equal-widths-toggle',
            index
          ).boundingBox();
          return box?.width ?? 0;
        })
      );

      const max = Math.max(...widths);
      const min = Math.min(...widths);
      expect(max - min).toBeLessThan(1);
    });

    test('option widths differ when equalWidths is disabled', async ({
      page
    }) => {
      const widths = await Promise.all(
        [0, 1, 2].map(async (index) => {
          const box = await option(
            page,
            'icons-unequal-widths-toggle',
            index
          ).boundingBox();
          return box?.width ?? 0;
        })
      );

      const max = Math.max(...widths);
      const min = Math.min(...widths);
      expect(max - min).toBeGreaterThan(5);
    });
  });

  test.describe('Icon-only options - accessible name', () => {
    test('expose their aria-label as the real accessible name', async ({
      page
    }) => {
      const group = example(page, 'icons-only-toggle');

      await expect(
        group.getByRole('radio', { name: 'Succeeded' })
      ).toBeVisible();
      await expect(group.getByRole('radio', { name: 'Failed' })).toBeVisible();
      await expect(group.getByRole('radio', { name: 'Pending' })).toBeVisible();
    });
  });

  test.describe('Group label - aria-label without a visible caption', () => {
    test('exposes aria-label as the real accessible name for the group, with no visible caption', async ({
      page
    }) => {
      const group = example(page, 'aria-label-toggle');

      await expect(
        group.getByRole('radiogroup', { name: 'Choose an option' })
      ).toBeVisible();
      await expect(group.getByTestId('cps-button-toggle-label')).toHaveCount(0);
    });
  });

  test.describe('Reactive form integration - real readout', () => {
    test('a real click updates the bound form control and the visible readout', async ({
      page
    }) => {
      const readout = page.getByTestId('reactive-form-value');

      await expect(readout).toHaveText('Selected value: second');

      await option(page, 'reactive-form-toggle', 3).click();
      await expect(readout).toHaveText('Selected value: fourth');
    });
  });

  test.describe('Two-way binding - real readout', () => {
    test('single selection updates the visible value via a real click', async ({
      page
    }) => {
      const readout = page.getByTestId('two-way-binding-value');

      await expect(readout).toHaveText('Selected value: first');

      await option(page, 'two-way-binding-toggle', 1).click();
      await expect(readout).toHaveText('Selected value: second');

      await option(page, 'two-way-binding-toggle', 1).click();
      await expect(readout).toHaveText('Selected value:');
    });

    test('multiple selection updates the visible values via a real click', async ({
      page
    }) => {
      const readout = page.getByTestId('two-way-binding-multiple-value');

      await expect(readout).toHaveText('Selected values: third,fourth');

      await option(page, 'two-way-binding-multiple-toggle', 1).click();
      await expect(readout).toHaveText('Selected values: second,third,fourth');
    });
  });
});
