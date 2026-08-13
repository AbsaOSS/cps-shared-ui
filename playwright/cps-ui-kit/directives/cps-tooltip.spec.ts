import { test, expect, type Page, type Locator } from '@playwright/test';

function button(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function tooltip(page: Page): Locator {
  return page.getByTestId('cps-tooltip');
}

function gapBetween(
  targetBox: { x: number; y: number; width: number; height: number },
  tooltipBox: { x: number; y: number; width: number; height: number }
): number {
  const horizontalOverlap =
    tooltipBox.x < targetBox.x + targetBox.width &&
    tooltipBox.x + tooltipBox.width > targetBox.x;
  if (!horizontalOverlap) {
    return tooltipBox.x >= targetBox.x + targetBox.width
      ? tooltipBox.x - (targetBox.x + targetBox.width)
      : targetBox.x - (tooltipBox.x + tooltipBox.width);
  }
  return tooltipBox.y >= targetBox.y + targetBox.height
    ? tooltipBox.y - (targetBox.y + targetBox.height)
    : targetBox.y - (tooltipBox.y + tooltipBox.height);
}

test.describe('cps-tooltip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tooltip');
  });

  test.describe('Real click-trigger isolation from hover', () => {
    test('hovering does nothing, clicking shows the real tooltip', async ({
      page
    }) => {
      const target = button(page, 'click-open-tooltip');

      await target.hover();
      await expect(tooltip(page)).toHaveCount(0);

      await target.click();
      await expect(tooltip(page)).toBeVisible();
      await expect(tooltip(page)).toHaveText('Triggered on click');
    });
  });

  test.describe('Real focus-only-trigger isolation from hover', () => {
    test('hovering the target does not show the tooltip', async ({ page }) => {
      const target = button(page, 'focus-only-tooltip');

      await target.hover();
      await expect(tooltip(page)).toHaveCount(0);
    });

    test('real keyboard focus shows the real tooltip', async ({ page }) => {
      const target = button(page, 'focus-only-tooltip');
      const innerButton = target.getByTestId('cps-button');

      await innerButton.focus();
      const ownTooltip = page.getByRole('tooltip', {
        name: 'Triggered on focus only'
      });
      await expect(ownTooltip).toBeVisible();
    });
  });

  test.describe('Real custom open-delay timing', () => {
    test('the tooltip is not visible immediately after hover but appears within the configured delay', async ({
      page
    }) => {
      const target = button(page, 'open-delay-tooltip');

      await target.hover();
      await expect(tooltip(page)).not.toBeVisible({ timeout: 200 });
      await expect(tooltip(page)).toBeVisible({ timeout: 1500 });
    });
  });

  test.describe('Real custom close-delay timing', () => {
    test('the tooltip stays visible briefly after mouse-leave before disappearing', async ({
      page
    }) => {
      const target = button(page, 'close-delay-tooltip');

      await target.hover();
      await expect(tooltip(page)).toBeVisible();

      await page.mouse.move(0, 0);
      await expect(tooltip(page)).toBeVisible({ timeout: 200 });
      await expect(tooltip(page)).toHaveCount(0, { timeout: 1500 });
    });
  });

  test.describe('tooltipDisabled renders no popup at all', () => {
    test('hovering a disabled tooltip target creates no real tooltip node', async ({
      page
    }) => {
      const target = button(page, 'disabled-state-tooltip');

      await target.hover();
      await expect(tooltip(page)).toHaveCount(0);
    });
  });

  test.describe('Real tooltipMaxWidth enforcement', () => {
    test('the real rendered tooltip width respects the configured max width', async ({
      page
    }) => {
      const target = button(page, 'custom-offset-tooltip');

      await target.hover();
      const box = await tooltip(page).boundingBox();
      if (!box) throw new Error('boundingBox() returned null');

      const maxWidthPx = await page.evaluate(
        () =>
          parseFloat(getComputedStyle(document.documentElement).fontSize) * 8
      );
      expect(box.width).toBeLessThanOrEqual(maxWidthPx + 1);
    });
  });

  test.describe('Real tooltipOffset distance', () => {
    test('the real gap between target and tooltip matches the configured offset', async ({
      page
    }) => {
      const target = button(page, 'custom-offset-tooltip');

      await target.hover();
      const targetBox = await target.boundingBox();
      const tooltipBox = await tooltip(page).boundingBox();
      if (!targetBox || !tooltipBox)
        throw new Error('boundingBox() returned null');

      const rootFontSizePx = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).fontSize)
      );
      const gap = gapBetween(targetBox, tooltipBox);
      expect(gap).toBeGreaterThan(rootFontSizePx * 1.5);
      expect(gap).toBeLessThan(rootFontSizePx * 2.5);
    });
  });

  test.describe('Real click-trigger aria-live announce', () => {
    test('clicking creates a real self-removing aria-live region with the tooltip text', async ({
      page
    }) => {
      const target = button(page, 'click-open-tooltip');

      await target.click();
      const announce = page.locator('.cps-sr-only[aria-live="assertive"]');
      await expect(announce).toHaveText('Triggered on click');
    });
  });

  test.describe('Real destroy on scroll and resize', () => {
    test('a real scroll event immediately removes the tooltip with no lingering node', async ({
      page
    }) => {
      const target = button(page, 'bottom-position-tooltip');

      await target.hover();
      await expect(tooltip(page)).toBeVisible();

      await page.evaluate(() => window.dispatchEvent(new Event('scroll')));

      await expect(tooltip(page)).toHaveCount(0);
    });

    test('a real window resize immediately removes the tooltip with no lingering node', async ({
      page
    }) => {
      const target = button(page, 'bottom-position-tooltip');
      const originalSize = page.viewportSize();

      await target.hover();
      await expect(tooltip(page)).toBeVisible();

      await page.setViewportSize({
        width: (originalSize?.width ?? 1280) - 10,
        height: originalSize?.height ?? 720
      });

      await expect(tooltip(page)).toHaveCount(0);
    });
  });
});
