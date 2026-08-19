import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

async function selectOption(
  wrapper: Locator,
  page: Page,
  optionName: string
): Promise<void> {
  await wrapper.click();
  await page.getByRole('option', { name: optionName }).click();
}

test.describe('cps-select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select');
  });

  test.describe('Required single select with tooltip', () => {
    test('selects and re-selects an option', async ({ page }) => {
      const wrapper = example(page, 'required-select');
      const container = wrapper.getByTestId('cps-select-container');

      await expect(container).toHaveAttribute('role', 'combobox');
      await expect(container).toHaveAttribute('aria-expanded', 'false');

      await wrapper.click();
      await expect(container).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByTestId('cps-select-listbox')).toHaveAttribute(
        'role',
        'listbox'
      );
      await expect(
        page.getByTestId('cps-select-option').first()
      ).toHaveAttribute('role', 'option');

      await page.getByRole('option', { name: 'Rome' }).click();
      await expect(wrapper.getByTestId('cps-select-selected-value')).toHaveText(
        'Rome'
      );

      await selectOption(wrapper, page, 'Prague');
      await expect(wrapper.getByTestId('cps-select-selected-value')).toHaveText(
        'Prague'
      );
    });

    test('clearing shows the required error and marks the control invalid', async ({
      page
    }) => {
      const wrapper = example(page, 'required-select');

      await wrapper.getByTestId('cps-select-clear-icon').click();
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await expect(wrapper.getByTestId('cps-select-error')).toHaveText(
        'Field is required'
      );
      await expect(
        wrapper.getByTestId('cps-select-selected-value')
      ).toHaveCount(0);
      await expect(wrapper.getByTestId('cps-select-container')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      await expect(wrapper.getByTestId('cps-select-container')).toHaveAttribute(
        'aria-required',
        'true'
      );
    });
  });

  test.describe('Loading select', () => {
    test('shows a loading bar and still opens', async ({ page }) => {
      const wrapper = example(page, 'loading-select');

      await expect(wrapper.getByTestId('cps-select-loading-bar')).toBeVisible();

      await wrapper.click();
      await expect(page.getByTestId('cps-select-listbox')).toBeVisible();
    });
  });

  test.describe('Disabled select', () => {
    test('does not open the dropdown', async ({ page }) => {
      const wrapper = example(page, 'disabled-select');

      await wrapper.click({ force: true });
      await expect(page.getByTestId('cps-select-listbox')).toBeHidden();
      await expect(wrapper.getByTestId('cps-select-container')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });
  });

  test.describe('Multiple, not clearable, plain text', () => {
    test('renders combined text instead of chips and hides the clear icon', async ({
      page
    }) => {
      const wrapper = example(page, 'multiple-select');

      await expect(wrapper.locator('cps-chip')).toHaveCount(0);
      await expect(
        wrapper.getByTestId('cps-select-selected-text-item')
      ).toBeVisible();
      await expect(wrapper.getByTestId('cps-select-clear-icon')).toHaveCount(0);
    });
  });

  test.describe('Virtual scroll', () => {
    test('opens with a virtualized list, always shows the clear icon, and hides select-all', async ({
      page
    }) => {
      const wrapper = example(page, 'virtual-scroll-select');

      await expect(wrapper.getByTestId('cps-select-clear-icon')).toBeVisible();

      await wrapper.click();
      await expect(page.locator('.p-virtualscroller')).toBeVisible();
      await expect(page.getByTestId('cps-select-select-all')).toHaveCount(0);
    });

    test('arrow keys highlight a real virtualized option', async ({ page }) => {
      const wrapper = example(page, 'virtual-scroll-select');

      await wrapper.click();
      await expect(page.locator('.p-virtualscroller')).toBeVisible();
      await page.keyboard.press('ArrowDown');
      await expect(
        page.locator('[data-testid="cps-select-option"].highlighten')
      ).toHaveCount(1);
    });
  });

  test.describe('Multiple with non-closable chips', () => {
    test('chips have no remove button and the chevron is hidden', async ({
      page
    }) => {
      const wrapper = example(page, 'non-closable-chips-select');

      await expect(wrapper.locator('cps-chip')).toHaveCount(2);
      await expect(
        wrapper.locator('cps-chip').first().getByRole('button')
      ).toHaveCount(0);
      await expect(wrapper.getByTestId('cps-select-chevron')).toHaveCount(0);
    });

    test('select all toggles every option as a chip', async ({ page }) => {
      const wrapper = example(page, 'non-closable-chips-select');

      await wrapper.click();
      const selectAll = page.getByTestId('cps-select-select-all');
      await expect(selectAll).toBeVisible();

      const optionCount = await page.getByTestId('cps-select-option').count();
      await selectAll.click();
      await expect(wrapper.locator('cps-chip')).toHaveCount(optionCount);
      await expect(selectAll).toHaveAttribute('aria-selected', 'true');

      await selectAll.click();
      await expect(wrapper.locator('cps-chip')).toHaveCount(0);
    });
  });

  test.describe('Multiple with prefix icon', () => {
    test('shows the prefix icon', async ({ page }) => {
      const wrapper = example(page, 'prefix-icon-select');

      await expect(wrapper.getByTestId('cps-select-prefix-icon')).toBeVisible();
    });
  });

  test.describe('Single select with option icons', () => {
    test('selecting an option renders its real icon', async ({ page }) => {
      const wrapper = example(page, 'icons-select');

      await selectOption(wrapper, page, 'Success');
      await expect(wrapper.getByTestId('cps-select-selected-value')).toHaveText(
        'Success'
      );

      await wrapper.click();
      await expect(
        page
          .getByTestId('cps-select-option')
          .filter({ hasText: 'Warning' })
          .locator('cps-icon')
      ).toBeVisible();
    });
  });

  test.describe('Two-way ngModel binding', () => {
    test('selection reflects into the bound model and keeps initial order', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-select');

      await selectOption(wrapper, page, 'Tesla');
      await selectOption(wrapper, page, 'Amazon');

      await expect(page.locator('.sync-val')).toHaveText('AMZN,TSLA');
      const chipTexts = await wrapper.locator('cps-chip').allTextContents();
      expect(chipTexts).toEqual(['Amazon', 'Tesla']);
    });
  });

  test.describe('Appearance variants', () => {
    test('underlined and borderless apply their respective classes', async ({
      page
    }) => {
      await expect(
        example(page, 'underlined-select').getByTestId('cps-select-container')
      ).toHaveClass(/underlined/);
      await expect(
        example(page, 'borderless-select').getByTestId('cps-select-container')
      ).toHaveClass(/borderless/);
    });
  });

  test.describe('Clear without reopening', () => {
    test('does not reopen the dropdown after clearing', async ({ page }) => {
      const wrapper = example(page, 'open-on-clear-false-select');

      await wrapper.getByTestId('cps-select-clear-icon').click();
      await expect(wrapper.getByTestId('cps-select-container')).toBeFocused();
      await expect(page.getByTestId('cps-select-listbox')).toBeHidden();
    });
  });

  test.describe('Hidden hint and error details', () => {
    test('never renders hint or error text', async ({ page }) => {
      const wrapper = example(page, 'hide-details-select');

      await expect(wrapper.getByTestId('cps-select-hint')).toHaveCount(0);

      await wrapper.click();
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await expect(wrapper.getByTestId('cps-select-error')).toHaveCount(0);
    });
  });

  test.describe('Keyboard navigation', () => {
    test('ArrowDown opens, then ArrowDown/ArrowUp highlight and wrap around', async ({
      page
    }) => {
      const wrapper = example(page, 'icons-select');
      const container = wrapper.getByTestId('cps-select-container');
      const firstOption = page.getByTestId('cps-select-option').first();
      const lastOption = page.getByTestId('cps-select-option').last();

      await container.focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('cps-select-listbox')).toBeVisible();

      await page.keyboard.press('ArrowDown');
      await expect(firstOption).toHaveClass(/highlighten/);

      await page.keyboard.press('ArrowUp');
      await expect(lastOption).toHaveClass(/highlighten/);
      await expect(firstOption).not.toHaveClass(/highlighten/);
    });

    test('Enter selects the highlighted option and closes the dropdown', async ({
      page
    }) => {
      const wrapper = example(page, 'icons-select');
      const container = wrapper.getByTestId('cps-select-container');

      await container.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await expect(wrapper.getByTestId('cps-select-selected-value')).toHaveText(
        'Success'
      );
      await expect(page.getByTestId('cps-select-listbox')).toBeHidden();
    });

    test('Space also opens the dropdown when closed', async ({ page }) => {
      const wrapper = example(page, 'icons-select');
      const container = wrapper.getByTestId('cps-select-container');

      await container.focus();
      await page.keyboard.press('Space');
      await expect(page.getByTestId('cps-select-listbox')).toBeVisible();
    });

    test('Escape closes the dropdown', async ({ page }) => {
      const wrapper = example(page, 'required-select');

      await wrapper.click();
      await expect(page.getByTestId('cps-select-listbox')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('cps-select-listbox')).toBeHidden();
    });
  });
});
