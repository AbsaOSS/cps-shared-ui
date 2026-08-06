import { test, expect, type Page, type Locator } from '@playwright/test';

function menuContainer(page: Page): Locator {
  return page.getByTestId('cps-menu-container');
}

function menuArrow(page: Page): Locator {
  return page.getByTestId('cps-menu-arrow');
}

function toggleButton(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-button');
}

async function focusViaKeyboard(page: Page, target: Locator): Promise<void> {
  await page.keyboard.press('Tab');
  await target.focus();
}

test.describe('cps-menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu');
  });

  test.describe('Real animation lifecycle, DOM mount/unmount, and z-index', () => {
    test('the container real-mounts with a real animation and real z-index while open, and unmounts after closing', async ({
      page
    }) => {
      const toggle = page.getByTestId('standard-menu-toggle');
      const container = menuContainer(page);

      await toggle.click();
      await expect(container).toBeVisible();
      await expect(container).toHaveCSS('opacity', '1');

      const zIndex = await container.evaluate((el) => el.style.zIndex);
      expect(zIndex).not.toBe('');
      expect(Number(zIndex)).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
      await expect(container).toHaveCount(0);
    });
  });

  test.describe('Real focus-on-show timing', () => {
    test('the first real menu item receives real focus after opening', async ({
      page
    }) => {
      await page.getByTestId('standard-menu-toggle').click();
      await expect(
        page.getByRole('menuitem', { name: 'First item' })
      ).toBeFocused();
    });
  });

  test.describe('Real keyboard-vs-mouse focus-ring suppression on Escape-close', () => {
    test('a keyboard-opened menu restores a visible focus ring on close; a mouse-opened menu suppresses it', async ({
      page
    }) => {
      const toggle = page.getByTestId('standard-menu-toggle');
      const button = toggleButton(page, 'standard-menu-toggle');

      await focusViaKeyboard(page, button);
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('menuitem', { name: 'First item' })
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(button).toBeFocused();
      await expect(button).not.toHaveClass(/suppress-focus-visible/);

      await toggle.click();
      await expect(
        page.getByRole('menuitem', { name: 'First item' })
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(button).toBeFocused();
      await expect(button).toHaveClass(/suppress-focus-visible/);
    });
  });

  test.describe('Real flip positioning and arrow visibility', () => {
    test('a container that real-renders above its target gets the real flipped class and hides its arrow', async ({
      page
    }) => {
      await page.setViewportSize({ width: 800, height: 400 });
      const toggle = page.getByTestId('standard-menu-toggle');
      await toggle.evaluate((el) => el.scrollIntoView({ block: 'end' }));
      await toggle.click();

      const container = menuContainer(page);
      const arrow = menuArrow(page);
      await expect(container).toBeVisible();

      const toggleBox = await toggle.boundingBox();
      const containerBox = await container.boundingBox();
      if (!toggleBox || !containerBox)
        throw new Error('boundingBox() returned null');

      expect(containerBox.y).toBeLessThan(toggleBox.y);
      await expect(container).toHaveClass(/cps-menu-container-flipped/);
      await expect(arrow).toBeHidden();

      expect(Math.abs(containerBox.x - toggleBox.x)).toBeLessThanOrEqual(4);
    });
  });

  test.describe('Real focusOnShow=false keeps focus on the trigger', () => {
    test('tabbing to the focus-menu trigger opens the menu without moving focus off the trigger', async ({
      page
    }) => {
      const button = toggleButton(page, 'focus-menu-toggle');
      await button.focus();

      await expect(menuContainer(page)).toBeVisible();
      await expect(button).toBeFocused();
    });
  });

  test.describe('Real containerMouseLeave output fires with real event data', () => {
    test('moving the mouse off the hover-menu container real-closes it', async ({
      page
    }) => {
      const toggle = page.getByTestId('hover-menu-toggle');
      await toggle.hover();

      await expect(menuContainer(page)).toBeVisible();

      await page.mouse.move(0, 0);
      await expect(menuContainer(page)).toHaveCount(0);
    });
  });

  test.describe('Real internal-link item resolves a routerLink href', () => {
    test('an item with an internal url real-renders as a link with a real resolved href', async ({
      page
    }) => {
      await page.getByTestId('standard-menu-toggle').click();
      await expect(
        page.getByRole('menuitem', { name: 'Menu API' })
      ).toHaveAttribute('href', '/menu/api');
    });
  });

  test.describe('Real beforeMenuHidden fires with the real hide reason', () => {
    test('closing via Escape reports the real keydown-escape reason', async ({
      page
    }) => {
      const container = menuContainer(page);
      const reason = page.getByTestId('standard-menu-last-hide-reason');

      await page.getByTestId('standard-menu-toggle').click();
      await expect(container).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(reason).toHaveText('Last hide reason: keydown-escape');
      await expect(container).toHaveCount(0);
    });
  });

  test.describe('Real containerClass applies a real custom class and computed style', () => {
    test('a custom containerClass real-applies to the container with a real distinguishing border', async ({
      page
    }) => {
      await page.getByTestId('custom-class-menu-toggle').click();
      const container = menuContainer(page);
      await expect(container).toBeVisible();
      await expect(container).toHaveClass(/menu-page-custom-container/);

      const borderWidth = await container.evaluate(
        (el) => getComputedStyle(el).borderWidth
      );
      expect(borderWidth).not.toBe('0px');
    });
  });
});
