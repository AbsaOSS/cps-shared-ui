import { test, expect } from '@playwright/test';

test.describe('cps-progress-circular', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/progress-circular');
  });

  test.describe('Real CSS custom-property color resolves to an actual color', () => {
    test('a color name real-resolves through the real stylesheet to its actual RGB value', async ({
      page
    }) => {
      const circle = page
        .getByRole('progressbar', { name: 'Luxury progress circular' })
        .getByTestId('cps-progress-circular');

      await expect(circle).toHaveCSS('border-top-color', 'rgb(100, 0, 50)');
      await expect(circle).toHaveCSS('width', '120px');
    });
  });

  test.describe('Real prefers-reduced-motion slows, not stops, the spin animation', () => {
    test('reduced motion real-slows the animation while keeping it running', async ({
      page
    }) => {
      const circle = page
        .getByRole('progressbar', { name: 'Luxury progress circular' })
        .getByTestId('cps-progress-circular');

      await expect(circle).toHaveCSS('animation-duration', '0.8s');
      await expect(circle).toHaveCSS('animation-iteration-count', 'infinite');

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      const reducedCircle = page
        .getByRole('progressbar', { name: 'Luxury progress circular' })
        .getByTestId('cps-progress-circular');

      await expect(reducedCircle).toHaveCSS('animation-duration', '2.4s');
      await expect(reducedCircle).toHaveCSS(
        'animation-iteration-count',
        'infinite'
      );
    });
  });
});
