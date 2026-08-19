import { test, expect, type Page, type Locator } from '@playwright/test';

function icon(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-info-circle');
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

test.describe('cps-info-circle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info-circle');
  });

  test.describe('Real hover shows and mouse-leave hides the tooltip', () => {
    test('hovering shows the real tooltip with the configured text, and moving away removes it', async ({
      page
    }) => {
      const target = icon(page, 'xsmall-top-info-circle');
      const tooltip = page.locator('.cps-tooltip');

      await target.hover();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveText('Provide any information here');
      await expect(target).not.toHaveAttribute('aria-description');

      await page.mouse.move(0, 0);
      await expect(tooltip).toHaveCount(0);
    });
  });

  test.describe('Real keyboard focus also shows the tooltip', () => {
    test('tabbing to the icon shows the real tooltip and sets a real aria-description', async ({
      page
    }) => {
      const target = icon(page, 'xsmall-top-info-circle');
      const tooltip = page.locator('.cps-tooltip');

      await tabUntilFocused(page, target);

      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveText('Provide any information here');
      await expect(target).toHaveAttribute(
        'aria-description',
        'Provide any information here'
      );
    });
  });

  test.describe('Real tooltip positioning', () => {
    test('the tooltip renders on the real configured side of the icon for each position', async ({
      page
    }) => {
      const tooltip = page.locator('.cps-tooltip');

      const top = icon(page, 'xsmall-top-info-circle');
      await top.hover();
      await expect(tooltip).toBeVisible();
      const topIconBox = await top.boundingBox();
      const topTooltipBox = await tooltip.boundingBox();
      if (!topIconBox || !topTooltipBox)
        throw new Error('boundingBox() returned null');
      expect(topTooltipBox.y + topTooltipBox.height).toBeLessThanOrEqual(
        topIconBox.y
      );
      await page.mouse.move(0, 0);
      await expect(tooltip).toHaveCount(0);

      const right = icon(page, 'small-right-info-circle');
      await right.hover();
      await expect(tooltip).toBeVisible();
      const rightIconBox = await right.boundingBox();
      const rightTooltipBox = await tooltip.boundingBox();
      if (!rightIconBox || !rightTooltipBox)
        throw new Error('boundingBox() returned null');
      expect(rightTooltipBox.x).toBeGreaterThanOrEqual(
        rightIconBox.x + rightIconBox.width
      );
      await page.mouse.move(0, 0);
      await expect(tooltip).toHaveCount(0);

      const left = icon(page, 'normal-left-info-circle');
      await left.hover();
      await expect(tooltip).toBeVisible();
      const leftIconBox = await left.boundingBox();
      const leftTooltipBox = await tooltip.boundingBox();
      if (!leftIconBox || !leftTooltipBox)
        throw new Error('boundingBox() returned null');
      expect(leftTooltipBox.x + leftTooltipBox.width).toBeLessThanOrEqual(
        leftIconBox.x
      );
      await page.mouse.move(0, 0);
      await expect(tooltip).toHaveCount(0);

      const bottom = icon(page, 'large-bottom-info-circle');
      await bottom.hover();
      await expect(tooltip).toBeVisible();
      const bottomIconBox = await bottom.boundingBox();
      const bottomTooltipBox = await tooltip.boundingBox();
      if (!bottomIconBox || !bottomTooltipBox)
        throw new Error('boundingBox() returned null');
      expect(bottomTooltipBox.y).toBeGreaterThanOrEqual(
        bottomIconBox.y + bottomIconBox.height
      );
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('the icon exposes its real accessible name from ariaLabel', async ({
      page
    }) => {
      await expect(
        page
          .getByTestId('xsmall-top-info-circle')
          .getByRole('img', { name: 'Information' })
      ).toBeVisible();
    });
  });

  test.describe('Real persistent tooltip', () => {
    test('stays open without hover, a click inside does not close it, and a click outside does', async ({
      page
    }) => {
      const target = icon(page, 'persistent-info-circle');
      const tooltip = page.getByRole('tooltip', {
        name: /This tooltip stays open/
      });

      await target.hover();
      await expect(tooltip).toBeVisible();

      await page.mouse.move(0, 0);
      await expect(tooltip).toBeVisible();

      const box = await tooltip.boundingBox();
      if (!box) throw new Error('boundingBox() returned null');
      await page.mouse.click(box.x + 5, box.y + 5);
      await expect(tooltip).toBeVisible();

      await page.mouse.click(10, 10);
      await expect(tooltip).toHaveCount(0);
    });
  });

  test.describe('Real Tab-trapping into persistent tooltip content', () => {
    test('tabbing from the icon moves focus into the tooltip real focusable content', async ({
      page
    }) => {
      const target = icon(page, 'persistent-info-circle');
      const tooltip = page.getByRole('tooltip', {
        name: /This tooltip stays open/
      });

      await tabUntilFocused(page, target);
      await expect(tooltip).toBeVisible();

      await page.keyboard.press('Tab');
      const link = tooltip.getByRole('link', { name: 'Learn more' });
      await expect(link).toBeFocused();
    });
  });
});
