import { test, expect } from '@playwright/test';

test.describe('cps-loader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/loader');
  });

  test.describe('Real fullScreen vs relative positioning', () => {
    test('fullScreen covers the real viewport, relative fills its real parent container', async ({
      page
    }) => {
      const relativeOverlay = page
        .getByTestId('relative-loader')
        .getByTestId('cps-loader-overlay');
      const containerBox = await page
        .getByTestId('relative-loader-container')
        .boundingBox();
      const relativeBox = await relativeOverlay.boundingBox();
      if (!containerBox || !relativeBox)
        throw new Error('boundingBox() returned null');
      expect(
        Math.abs(relativeBox.width - containerBox.width)
      ).toBeLessThanOrEqual(4);
      expect(
        Math.abs(relativeBox.height - containerBox.height)
      ).toBeLessThanOrEqual(4);

      await page.getByTestId('fullscreen-loader-toggle').click();
      const fullscreenOverlay = page
        .getByTestId('fullscreen-loader')
        .getByTestId('cps-loader-overlay');
      await expect(fullscreenOverlay).toBeVisible();

      const viewport = page.viewportSize();
      const fullscreenBox = await fullscreenOverlay.boundingBox();
      if (!viewport || !fullscreenBox)
        throw new Error('boundingBox() returned null');

      expect(Math.abs(fullscreenBox.x)).toBeLessThanOrEqual(4);
      expect(Math.abs(fullscreenBox.y)).toBeLessThanOrEqual(4);
      expect(
        Math.abs(fullscreenBox.width - viewport.width)
      ).toBeLessThanOrEqual(4);
      expect(
        Math.abs(fullscreenBox.height - viewport.height)
      ).toBeLessThanOrEqual(4);
    });
  });

  test.describe('Real screen-reader live announcement on mount and destroy', () => {
    test('mounting announces the label and destroying announces doneAriaLabel through the real live region', async ({
      page
    }) => {
      const politeRegion = page.locator('.cps-polite-live-announcer-element');

      await page.getByTestId('fullscreen-loader-toggle').click();
      await expect(politeRegion).toHaveText('Loading...');

      await expect(politeRegion).toHaveText('Loading complete', {
        timeout: 10000
      });
    });

    test('a custom label is really announced through the same live region on mount, not just the default', async ({
      page
    }) => {
      const politeRegion = page.locator('.cps-polite-live-announcer-element');

      await expect(politeRegion).toHaveText('Uploading files...');
      await expect(
        page.getByTestId('custom-labels-loader').getByTestId('cps-loader-label')
      ).toHaveText('Uploading files...');
    });

    test('when showLabel is false, no visible label is rendered', async ({
      page
    }) => {
      await expect(
        page.getByTestId('no-label-loader').getByTestId('cps-loader-label')
      ).toHaveCount(0);
    });
  });

  test.describe('Real prefers-reduced-motion alters computed animations', () => {
    test('the spinner and label animations change under a real reduced-motion media query', async ({
      page
    }) => {
      const label = page
        .getByTestId('relative-loader')
        .getByTestId('cps-loader-label');
      const circle = page
        .getByTestId('relative-loader')
        .getByTestId('cps-loader-spinner')
        .locator('.cps-sp1');

      const normalLabelAnim = await label.evaluate(
        (el) => getComputedStyle(el).animationName
      );
      const normalCircleDuration = await circle.evaluate(
        (el) => getComputedStyle(el).animationDuration
      );
      expect(normalLabelAnim).toContain('cps-loader-text-animation');
      expect(normalCircleDuration).toBe('1s');

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();

      const reducedLabel = page
        .getByTestId('relative-loader')
        .getByTestId('cps-loader-label');
      const reducedCircle = page
        .getByTestId('relative-loader')
        .getByTestId('cps-loader-spinner')
        .locator('.cps-sp1');

      const reducedLabelAnim = await reducedLabel.evaluate(
        (el) => getComputedStyle(el).animationName
      );
      const reducedCircleDuration = await reducedCircle.evaluate(
        (el) => getComputedStyle(el).animationDuration
      );
      expect(reducedLabelAnim).toBe('none');
      expect(reducedCircleDuration).toBe('3s');
    });
  });

  test.describe('Real labelColor CSS-validity fallback resolves to a real color', () => {
    test('a bare color token that is not valid CSS on its own is wrapped in a real CSS variable that really resolves', async ({
      page
    }) => {
      const label = page
        .getByTestId('themed-label-color-loader')
        .getByTestId('cps-loader-label');

      const inlineColor = await label.evaluate((el) => el.style.color);
      expect(inlineColor).toBe('var(--cps-color-energy)');

      const resolvedColor = await label.evaluate(
        (el) => getComputedStyle(el).color
      );

      expect(resolvedColor).toMatch(
        /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/
      );
    });
  });
});
