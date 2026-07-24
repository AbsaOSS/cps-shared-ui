import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * The async demo examples wait on a 500ms input debounce plus a 1000ms
 * fake network delay (`_getOptionsFromServer` in
 * autocomplete-page.component.ts) - 1500ms total. This is a 4x margin
 * over that for CI/slower-browser headroom.
 */
const ASYNC_FETCH_TIMEOUT_MS = 6000;

/**
 * The async-validation demo example simulates a 3000ms validation delay
 * (see onOptionSelected's delay(3000) in autocomplete-page.component.ts).
 * This is a 2x margin over that for CI/slower-browser headroom.
 */
const ASYNC_VALIDATION_TIMEOUT_MS = 6000;

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

/** Opens the dropdown and clicks an option by its visible name. */
async function selectOption(
  wrapper: Locator,
  page: Page,
  optionName: string
): Promise<void> {
  await wrapper.click();
  await page.getByRole('option', { name: optionName }).click();
}

/**
 * Fills an autocomplete's input and waits for a specific fetched option
 * to appear. Playwright's bundled WebKit build can occasionally close
 * the dropdown itself right as async-loaded options render - a quirk
 * confirmed specific to that test-runner engine (manually verified not
 * to reproduce in real Safari, and never observed in Chromium). On
 * other browsers this is a plain wait, so a real regression there still
 * fails fast and clearly instead of being masked by the WebKit-only
 * reopen-and-retry fallback below.
 */
async function fillAndWaitForOption(
  wrapper: Locator,
  page: Page,
  browserName: string,
  query: string,
  optionName: string
): Promise<void> {
  await wrapper.getByTestId('cps-autocomplete-input').fill(query);

  const option = page.getByRole('option', { name: optionName });

  if (browserName !== 'webkit') {
    await option.waitFor({
      state: 'visible',
      timeout: ASYNC_FETCH_TIMEOUT_MS
    });
    return;
  }

  const listbox = page.getByTestId('cps-autocomplete-listbox');

  await Promise.race([
    option.waitFor({ state: 'visible', timeout: ASYNC_FETCH_TIMEOUT_MS }),
    listbox.waitFor({ state: 'hidden', timeout: ASYNC_FETCH_TIMEOUT_MS })
  ]).catch(() => {});

  if (!(await option.isVisible())) {
    await wrapper.click();
    await option.waitFor({ state: 'visible', timeout: 2000 });
  }
}

test.describe('cps-autocomplete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/autocomplete');
  });

  test.describe('Required single-select with tooltip', () => {
    test('selects and re-selects an option', async ({ page }) => {
      const wrapper = example(page, 'required-autocomplete');
      const input = wrapper.getByTestId('cps-autocomplete-input');

      await expect(input).toHaveAttribute('role', 'combobox');
      await expect(input).toHaveAttribute('aria-expanded', 'false');

      await wrapper.click();
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      await expect(
        page.getByTestId('cps-autocomplete-listbox')
      ).toHaveAttribute('role', 'listbox');
      await expect(
        page.getByTestId('cps-autocomplete-option').first()
      ).toHaveAttribute('role', 'option');

      await page.getByRole('option', { name: 'Rome' }).click();
      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-value')
      ).toHaveText('Rome');

      await selectOption(wrapper, page, 'Prague');
      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-value')
      ).toHaveText('Prague');
    });

    test('clearing shows the required error and marks the input invalid', async ({
      page
    }) => {
      const wrapper = example(page, 'required-autocomplete');

      await selectOption(wrapper, page, 'Rome');

      await wrapper.getByTestId('cps-autocomplete-clear-icon').click();
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await expect(wrapper.getByTestId('cps-autocomplete-error')).toHaveText(
        'Field is required'
      );
      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-value')
      ).toHaveCount(0);
      await expect(
        wrapper.getByTestId('cps-autocomplete-input')
      ).toHaveAttribute('aria-invalid', 'true');
      await expect(
        wrapper.getByTestId('cps-autocomplete-input')
      ).toHaveAttribute('aria-required', 'true');
    });
  });

  test.describe('Async single-select', () => {
    test('shows a loading state, then populates fetched options', async ({
      page
    }) => {
      const wrapper = example(page, 'single-async-autocomplete');

      await wrapper.getByTestId('cps-autocomplete-input').fill('lon');
      await expect(page.getByTestId('cps-autocomplete-loading')).toHaveText(
        'Loading cities...'
      );
      await expect(page.getByRole('option', { name: 'London' })).toBeVisible({
        timeout: ASYNC_FETCH_TIMEOUT_MS
      });
    });

    test('shows the empty message when no results match', async ({ page }) => {
      const wrapper = example(page, 'single-async-autocomplete');

      await wrapper.getByTestId('cps-autocomplete-input').fill('zzz-none');
      await expect(page.getByTestId('cps-autocomplete-empty')).toHaveText(
        'No cities found',
        { timeout: ASYNC_FETCH_TIMEOUT_MS }
      );
    });
  });

  test.describe('Async multi-select', () => {
    test('selects multiple options as chips and removes one', async ({
      page,
      browserName
    }) => {
      const wrapper = example(page, 'multiple-async-autocomplete');

      await fillAndWaitForOption(wrapper, page, browserName, 'o', 'London');
      await page.getByRole('option', { name: 'London' }).click();
      await page.getByRole('option', { name: 'Oslo' }).click();
      await expect(wrapper.locator('cps-chip')).toHaveCount(2);

      await wrapper
        .locator('cps-chip')
        .filter({ hasText: 'London' })
        .getByRole('button')
        .click();
      await expect(wrapper.locator('cps-chip')).toHaveCount(1);
      await expect(wrapper.locator('cps-chip')).toContainText('Oslo');
    });

    test('select all toggles every currently fetched option', async ({
      page,
      browserName
    }) => {
      const wrapper = example(page, 'multiple-async-autocomplete');

      await fillAndWaitForOption(wrapper, page, browserName, 'o', 'London');
      const selectAll = page.getByTestId('cps-autocomplete-select-all');
      await expect(selectAll).toBeVisible();

      const optionCount = await page
        .getByTestId('cps-autocomplete-option')
        .count();
      await selectAll.click();
      await expect(wrapper.locator('cps-chip')).toHaveCount(optionCount);
      await expect(selectAll).toHaveAttribute('aria-selected', 'true');

      await selectAll.click();
      await expect(wrapper.locator('cps-chip')).toHaveCount(0);
    });
  });

  test.describe('Disabled', () => {
    test('does not open the dropdown', async ({ page }) => {
      const wrapper = example(page, 'disabled-autocomplete');

      await wrapper.getByTestId('cps-autocomplete-input').click({
        force: true
      });
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeHidden();
      await expect(
        wrapper.getByTestId('cps-autocomplete-input')
      ).toBeDisabled();
    });
  });

  test.describe('Multiple, not clearable, plain text', () => {
    test('renders comma-separated text instead of chips and hides the clear icon', async ({
      page
    }) => {
      const wrapper = example(page, 'multiple-not-clearable-autocomplete');

      await expect(wrapper.locator('cps-chip')).toHaveCount(0);
      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-text-item')
      ).toHaveText('Capetown');
      await expect(
        wrapper.getByTestId('cps-autocomplete-clear-icon')
      ).toHaveCount(0);
    });
  });

  test.describe('Virtual scroll', () => {
    test('opens with a virtualized list and always shows the clear icon', async ({
      page
    }) => {
      const wrapper = example(page, 'virtual-scroll-autocomplete');

      await expect(
        wrapper.getByTestId('cps-autocomplete-clear-icon')
      ).toBeVisible();

      await wrapper.click();
      await expect(page.locator('.p-virtualscroller')).toBeVisible();
      await expect(page.getByTestId('cps-autocomplete-select-all')).toHaveCount(
        0
      );
    });

    test('arrow keys highlight options', async ({ page }) => {
      const wrapper = example(page, 'virtual-scroll-autocomplete');

      await wrapper.click();
      await expect(page.locator('.p-virtualscroller')).toBeVisible();
      await page.keyboard.press('ArrowDown');
      await expect(
        page.locator('[data-testid="cps-autocomplete-option"].highlighten')
      ).toHaveCount(1);
    });
  });

  test.describe('Multiple with non-closable chips', () => {
    test('chips have no remove button and the chevron is hidden', async ({
      page
    }) => {
      const wrapper = example(page, 'non-closable-chips-autocomplete');

      await expect(wrapper.locator('cps-chip')).toHaveCount(2);
      await expect(
        wrapper.locator('cps-chip').first().getByRole('button')
      ).toHaveCount(0);
      await expect(wrapper.getByTestId('cps-autocomplete-chevron')).toHaveCount(
        0
      );
    });
  });

  test.describe('Multiple with prefix icon', () => {
    test('shows the prefix icon', async ({ page }) => {
      const wrapper = example(page, 'prefix-icon-autocomplete');

      await expect(
        wrapper.getByTestId('cps-autocomplete-prefix-icon')
      ).toBeVisible();
    });
  });

  test.describe('Two-way ngModel binding', () => {
    test('selection reflects into the bound model and keeps initial order', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-autocomplete');

      await selectOption(wrapper, page, 'Tesla');
      await selectOption(wrapper, page, 'Amazon');

      await expect(page.locator('.sync-val')).toHaveText('AMZN,TSLA');
      const chipTexts = await wrapper.locator('cps-chip').allTextContents();
      expect(chipTexts).toEqual(['Amazon', 'Tesla']);
    });
  });

  test.describe('Async validation', () => {
    test('shows a busy/validating state after selection that clears once resolved', async ({
      page
    }) => {
      const wrapper = example(page, 'async-validation-autocomplete');

      await selectOption(wrapper, page, 'Rome');

      await expect(
        wrapper.getByTestId('cps-autocomplete-input')
      ).toHaveAttribute('aria-busy', 'true');
      await expect(wrapper.locator('cps-progress-linear')).toBeVisible();

      await expect(
        wrapper.getByTestId('cps-autocomplete-input')
      ).not.toHaveAttribute('aria-busy', 'true', {
        timeout: ASYNC_VALIDATION_TIMEOUT_MS
      });
      await expect(wrapper.locator('cps-progress-linear')).toHaveCount(0);
    });
  });

  test.describe('Alias filtering', () => {
    test('matches an option by alias when the label does not match', async ({
      page
    }) => {
      const wrapper = example(page, 'alias-filtering-autocomplete');

      await wrapper.getByTestId('cps-autocomplete-input').fill('prg');
      await expect(page.getByRole('option', { name: 'Prague' })).toBeVisible();
      await expect(page.getByTestId('cps-autocomplete-option')).toHaveCount(1);
    });
  });

  test.describe('Custom empty option index', () => {
    test('clearing resolves to the configured empty option instead of nothing', async ({
      page
    }) => {
      const wrapper = example(page, 'empty-option-index-autocomplete');

      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-value')
      ).toHaveText('New York');

      await wrapper.getByTestId('cps-autocomplete-clear-icon').click();

      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-value')
      ).toHaveText('Capetown');
    });
  });

  test.describe('Clear without reopening', () => {
    test('does not reopen the dropdown after clearing', async ({ page }) => {
      const wrapper = example(page, 'open-on-clear-false-autocomplete');

      await wrapper.getByTestId('cps-autocomplete-clear-icon').click();
      await expect(wrapper.getByTestId('cps-autocomplete-input')).toBeFocused();
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeHidden();
    });
  });

  test.describe('Hidden hint and error details', () => {
    test('never renders hint or error text', async ({ page }) => {
      const wrapper = example(page, 'hide-details-autocomplete');

      await expect(wrapper.getByTestId('cps-autocomplete-hint')).toHaveCount(0);

      await wrapper.click();
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await expect(wrapper.getByTestId('cps-autocomplete-error')).toHaveCount(
        0
      );
    });
  });

  test.describe('Multiple without select all', () => {
    test('does not show a select-all row', async ({ page }) => {
      const wrapper = example(page, 'select-all-false-autocomplete');

      await selectOption(wrapper, page, 'Rome');

      await expect(page.getByTestId('cps-autocomplete-option')).not.toHaveCount(
        0
      );
      await expect(page.getByTestId('cps-autocomplete-select-all')).toHaveCount(
        0
      );
    });
  });

  test.describe('Keyboard navigation', () => {
    test('ArrowDown/ArrowUp highlight options and wrap around', async ({
      page
    }) => {
      const wrapper = example(page, 'alias-filtering-autocomplete');
      const input = wrapper.getByTestId('cps-autocomplete-input');
      const firstOption = page.getByTestId('cps-autocomplete-option').first();
      const lastOption = page.getByTestId('cps-autocomplete-option').last();

      await wrapper.click();
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeVisible();
      await page.keyboard.press('ArrowDown');
      await expect(firstOption).toHaveClass(/highlighten/);

      const activeDescendant = await input.getAttribute(
        'aria-activedescendant'
      );
      expect(activeDescendant).toBeTruthy();
      await expect(page.locator(`#${activeDescendant}`)).toHaveAttribute(
        'aria-selected',
        'false'
      );

      await page.keyboard.press('ArrowUp');
      await expect(lastOption).toHaveClass(/highlighten/);
      await expect(firstOption).not.toHaveClass(/highlighten/);
    });

    test('Enter selects the highlighted option', async ({ page }) => {
      const wrapper = example(page, 'alias-filtering-autocomplete');

      await wrapper.click();
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeVisible();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await expect(
        wrapper.getByTestId('cps-autocomplete-selected-value')
      ).toHaveText('New York');
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeHidden();
    });

    test('Escape closes the dropdown', async ({ page }) => {
      const wrapper = example(page, 'required-autocomplete');

      await wrapper.click();
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('cps-autocomplete-listbox')).toBeHidden();
    });

    test('double Backspace removes the last chip in multi-select', async ({
      page
    }) => {
      const wrapper = example(page, 'non-closable-chips-autocomplete');
      const input = wrapper.getByTestId('cps-autocomplete-input');

      await expect(wrapper.locator('cps-chip')).toHaveCount(2);
      await input.click();
      await expect(input).toBeFocused();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');

      await expect(wrapper.locator('cps-chip')).toHaveCount(1);
    });
  });
});
