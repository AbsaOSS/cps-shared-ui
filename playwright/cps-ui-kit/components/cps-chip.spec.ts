import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-chip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chip');
  });

  test.describe('Disabled state', () => {
    test('the chip and its close button block real interaction', async ({
      page
    }) => {
      const chip = example(page, 'disabled-closable-chip');
      const chipInner = chip.getByTestId('cps-chip');
      const closeBtn = chip.getByTestId('cps-chip-close-btn');

      await expect(chipInner).toHaveCSS('pointer-events', 'none');
      await expect(closeBtn).toBeDisabled();

      await closeBtn.focus();
      await expect(closeBtn).not.toBeFocused();
    });
  });

  test.describe('Real layout - icon position', () => {
    test('the icon renders before the label when iconPosition is before, and after when after', async ({
      page
    }) => {
      const beforeChip = example(page, 'icon-before-chip');
      const beforeIconBox = await beforeChip
        .getByTestId('cps-chip-icon')
        .boundingBox();
      const beforeLabelBox = await beforeChip
        .getByTestId('cps-chip-label')
        .boundingBox();
      if (!beforeIconBox || !beforeLabelBox) {
        throw new Error('boundingBox() returned null for icon-before-chip');
      }
      expect(beforeIconBox.x).toBeLessThan(beforeLabelBox.x);

      const afterChip = example(page, 'icon-after-chip');
      const afterIconBox = await afterChip
        .getByTestId('cps-chip-icon')
        .boundingBox();
      const afterLabelBox = await afterChip
        .getByTestId('cps-chip-label')
        .boundingBox();
      if (!afterIconBox || !afterLabelBox) {
        throw new Error('boundingBox() returned null for icon-after-chip');
      }
      expect(afterIconBox.x).toBeGreaterThan(afterLabelBox.x);
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('the chip and its close button expose real accessible names', async ({
      page
    }) => {
      await expect(
        page.getByRole('group', { name: 'Basic chip' })
      ).toBeVisible();

      const closeBtn = example(page, 'closable-chip').getByRole('button', {
        name: 'Close'
      });
      await expect(closeBtn).toBeVisible();

      const closeBtnWithCustomCloseLabel = example(
        page,
        'closable-chip-with-custom-close-label'
      ).getByRole('button', {
        name: 'Dismiss'
      });
      await expect(closeBtnWithCustomCloseLabel).toBeVisible();
    });
  });
});
