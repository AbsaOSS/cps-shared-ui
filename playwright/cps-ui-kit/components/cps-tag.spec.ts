import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-tag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tag');
  });

  test.describe('Real click-to-toggle', () => {
    test('a real click toggles the checkbox role state', async ({ page }) => {
      const tag = example(page, 'selectable-tag').getByTestId('cps-tag');

      await expect(tag).toHaveAttribute('aria-checked', 'true');

      await tag.click();

      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
  });

  test.describe('Real keyboard Enter toggle', () => {
    test('focusing the tag and pressing Enter toggles it natively', async ({
      page
    }) => {
      const tag = example(page, 'selectable-tag').getByTestId('cps-tag');

      await expect(tag).toHaveAttribute('aria-checked', 'true');

      await tag.focus();
      await page.keyboard.press('Enter');

      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
  });

  test.describe('Real keyboard Space toggle', () => {
    test('focusing the tag and pressing Space toggles it via a real keydown+keyup sequence', async ({
      page
    }) => {
      const tag = example(page, 'selectable-tag').getByTestId('cps-tag');

      await expect(tag).toHaveAttribute('aria-checked', 'true');

      await tag.focus();
      await page.keyboard.press('Space');

      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('a selectable tag exposes its label as the real accessible name with role="checkbox"', async ({
      page
    }) => {
      await expect(
        page.getByRole('checkbox', { name: 'Selectable tag', exact: true })
      ).toBeVisible();
    });
  });

  test.describe('Two-way binding - real readout', () => {
    test('a real click toggles the visible value via a real click', async ({
      page
    }) => {
      const tag = example(page, 'selectable-tag');
      const readout = page.getByTestId('selectable-tag-value');

      await expect(readout).toHaveText('Is selected: true');

      await tag.click();
      await expect(readout).toHaveText('Is selected: false');

      await tag.click();
      await expect(readout).toHaveText('Is selected: true');
    });
  });

  test.describe('Real valueChanged event', () => {
    test('a real click emits valueChanged and updates the visible readout', async ({
      page
    }) => {
      const tag = example(page, 'value-changed-tag');
      const readout = page.getByTestId('value-changed-tag-value');

      await expect(readout).toHaveText('Value changed to: false');

      await tag.click();
      await expect(readout).toHaveText('Value changed to: true');

      await tag.click();
      await expect(readout).toHaveText('Value changed to: false');
    });
  });
});
