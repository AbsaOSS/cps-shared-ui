import { test, expect } from '@playwright/test';

test.describe('cps-progress-linear', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/progress-linear');
  });

  test.describe('Real CSS custom-property color/bgColor resolve to actual colors', () => {
    test('color names real-resolve through the real stylesheet to their actual RGB values', async ({
      page
    }) => {
      const wrapper = page
        .getByRole('progressbar', { name: 'Energy progress linear' })
        .getByTestId('cps-progress-linear');

      await expect(wrapper).toHaveCSS('background-color', 'rgb(250, 236, 229)');
      await expect(wrapper.getByTestId('cps-progress-linear-inc')).toHaveCSS(
        'background-color',
        'rgb(255, 120, 15)'
      );
    });
  });

  test.describe('Real prefers-reduced-motion slows, not stops, both bars', () => {
    test('reduced motion real-slows both bars while keeping them running', async ({
      page
    }) => {
      const wrapper = page
        .getByRole('progressbar', { name: 'Energy progress linear' })
        .getByTestId('cps-progress-linear');
      const inc = wrapper.getByTestId('cps-progress-linear-inc');
      const dec = wrapper.getByTestId('cps-progress-linear-dec');

      await expect(inc).toHaveCSS('animation-duration', '2s');
      await expect(inc).toHaveCSS('animation-iteration-count', 'infinite');
      await expect(dec).toHaveCSS('animation-duration', '2s');
      await expect(dec).toHaveCSS('animation-iteration-count', 'infinite');

      await page.emulateMedia({ reducedMotion: 'reduce' });

      await expect(inc).toHaveCSS('animation-duration', '6s');
      await expect(inc).toHaveCSS('animation-iteration-count', 'infinite');
      await expect(dec).toHaveCSS('animation-duration', '6s');
      await expect(dec).toHaveCSS('animation-iteration-count', 'infinite');
    });
  });
});
