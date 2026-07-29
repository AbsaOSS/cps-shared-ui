import { test, expect, type Page, type Locator } from '@playwright/test';

function panel(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function resolveCssColorVar(page: Page, varName: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, varName);
}

test.describe('cps-expansion-panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/expansion-panel');
  });

  test.describe('Real click toggle reaches the real final post-animation state', () => {
    test('clicking the header expands and collapses the real content, past the AnimationBuilder pipeline', async ({
      page
    }) => {
      const header = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-header'
      );
      const content = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-content'
      );

      await expect(content).toHaveCSS('visibility', 'hidden');
      await expect(content).toHaveAttribute('aria-hidden', 'true');

      await header.click();

      await expect(content).toHaveCSS('visibility', 'visible');
      await expect(content).toHaveAttribute('aria-hidden', 'false');
      await expect(content).not.toHaveCSS('height', '0px');
      await expect(content).not.toHaveCSS('overflow', 'hidden');

      await header.click();

      await expect(content).toHaveCSS('visibility', 'hidden');
      await expect(content).toHaveAttribute('aria-hidden', 'true');
      await expect(content).toHaveCSS('height', '0px');
    });
  });

  test.describe('Real keyboard toggle', () => {
    test('Enter expands and Space collapses the real content', async ({
      page
    }) => {
      const header = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-header'
      );
      const content = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-content'
      );

      await header.focus();
      await page.keyboard.press('Enter');

      await expect(content).toHaveCSS('visibility', 'visible');
      await expect(header).toHaveAttribute('aria-expanded', 'true');
      await expect(content).not.toHaveCSS('overflow', 'hidden');

      await page.keyboard.press('Space');

      await expect(content).toHaveCSS('visibility', 'hidden');
      await expect(header).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test.describe('Real header border-bottom animation', () => {
    test('the bordered header gets a real border-bottom once expanded, and loses it once collapsed', async ({
      page
    }) => {
      const header = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-header'
      );
      const content = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-content'
      );

      await expect(header).toHaveCSS('border-bottom-style', 'none');

      await header.click();

      await expect(header).toHaveCSS('border-bottom-style', 'solid');
      await expect(content).not.toHaveCSS('overflow', 'hidden');

      await header.click();

      await expect(header).toHaveCSS('border-bottom-style', 'none');
    });
  });

  test.describe('Real disabled panel blocks interaction', () => {
    test('the disabled header blocks real pointer interaction and is removed from the tab order', async ({
      page
    }) => {
      const header = panel(page, 'disabled-panel').getByTestId(
        'cps-expansion-panel-header'
      );
      const content = panel(page, 'disabled-panel').getByTestId(
        'cps-expansion-panel-content'
      );

      await expect(header).toHaveAttribute('tabindex', '-1');
      await expect(header).toHaveCSS('pointer-events', 'none');

      await expect(content).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test.describe('Real color resolution - default token borderColor', () => {
    test('the default borderColor token resolves through a real CSS variable', async ({
      page
    }) => {
      const header = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-header'
      );
      const content = panel(page, 'bordered-transparent-panel').getByTestId(
        'cps-expansion-panel-content'
      );

      await header.click();
      await expect(content).not.toHaveCSS('overflow', 'hidden');

      const expectedTokenColor = await resolveCssColorVar(
        page,
        '--cps-color-line-light'
      );
      await expect(header).toHaveCSS('border-bottom-color', expectedTokenColor);
    });
  });

  test.describe('Real color resolution - raw CSS keyword backgroundColor', () => {
    test('a raw CSS keyword backgroundColor renders literally', async ({
      page
    }) => {
      const whitePanelRoot = panel(page, 'borderless-white-panel').getByTestId(
        'cps-expansion-panel'
      );
      await expect(whitePanelRoot).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)'
      );
    });
  });

  test.describe('Real color resolution - custom token borderColor', () => {
    test('a custom borderColor token resolves through a real CSS variable', async ({
      page
    }) => {
      const customColorHeader = panel(
        page,
        'custom-border-color-panel'
      ).getByTestId('cps-expansion-panel-header');

      await customColorHeader.click();

      const expectedCustomColor = await resolveCssColorVar(
        page,
        '--cps-color-calm'
      );
      await expect(customColorHeader).toHaveCSS(
        'border-bottom-color',
        expectedCustomColor
      );
    });
  });
});
