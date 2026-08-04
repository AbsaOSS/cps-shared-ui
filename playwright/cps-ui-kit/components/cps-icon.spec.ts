import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

const UNRESOLVED_VAR_SENTINEL = 'rgb(1, 2, 3)';

async function resolveCssColorVar(
  page: Page,
  varName: string
): Promise<string> {
  const resolved = await page.evaluate(
    ({ name, sentinel }) => {
      const probe = document.createElement('div');
      probe.style.color = `var(${name}, ${sentinel})`;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    },
    { name: varName, sentinel: UNRESOLVED_VAR_SENTINEL }
  );

  if (resolved === UNRESOLVED_VAR_SENTINEL) {
    throw new Error(
      `CSS variable ${varName} is not defined on this page (resolved to the fallback sentinel instead of a real value).`
    );
  }
  return resolved;
}

test.describe('cps-icon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/icon');
  });

  test.describe('Real color resolution - raw CSS value', () => {
    test('a raw var() expression renders literally as the real computed color', async ({
      page
    }) => {
      const icon = example(page, 'basic-icon').getByTestId('cps-icon');

      const expectedColor = await resolveCssColorVar(
        page,
        '--cps-text-primary'
      );
      await expect(icon).toHaveCSS('color', expectedColor);
    });
  });

  test.describe('Real color resolution - design-token color', () => {
    test('a design-token color name resolves through a real CSS variable', async ({
      page
    }) => {
      const icon = example(page, 'token-color-icon').getByTestId('cps-icon');

      const expectedColor = await resolveCssColorVar(page, '--cps-color-error');
      await expect(icon).toHaveCSS('color', expectedColor);
    });
  });

  test.describe('Real SVG sprite rendering', () => {
    test('the icon sprite asset resolves and renders real geometry', async ({
      page
    }) => {
      const icon = example(page, 'basic-icon');
      const use = icon.locator('svg use');

      await expect(use).toHaveAttribute('href', /icons\.svg#like$/);

      const bbox = await use.evaluate((el: SVGUseElement) => {
        const box = el.getBBox();
        return { width: box.width, height: box.height };
      });
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });
  });

  test.describe('Real computed size dimensions', () => {
    test('each size variant renders its real pixel dimensions', async ({
      page
    }) => {
      const rootFontSizePx = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).fontSize)
      );

      const sizes: { testId: string; rem: number }[] = [
        { testId: 'xsmall-icon', rem: 0.75 },
        { testId: 'small-icon', rem: 1 },
        { testId: 'normal-icon', rem: 1.5 },
        { testId: 'large-icon', rem: 2 }
      ];

      for (const { testId, rem } of sizes) {
        const box = await example(page, testId)
          .getByTestId('cps-icon')
          .boundingBox();
        if (!box) throw new Error('boundingBox() returned null');

        expect(box.width).toBeCloseTo(rem * rootFontSizePx, 0);
        expect(box.height).toBeCloseTo(rem * rootFontSizePx, 0);
      }
    });
  });
});
