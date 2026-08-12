import { test, expect, type Page, type Locator } from '@playwright/test';

function wrapper(page: Page): Locator {
  return page.getByTestId('default-sidebar-menu');
}

function item(page: Page, index: number): Locator {
  return wrapper(page).getByTestId(`cps-sidebar-menu-item-${index}`);
}

function menuContainer(page: Page): Locator {
  return page.getByTestId('cps-menu-container');
}

test.describe('cps-sidebar-menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sidebar-menu');
    await expect(wrapper(page)).toBeVisible();
  });

  test.describe('Real hover-open flyout', () => {
    test('hovering a group trigger opens its real nested menu content', async ({
      page
    }) => {
      const trigger = item(page, 3); // Access menu
      await trigger.hover();

      await expect(menuContainer(page)).toBeVisible();
      await expect(page.getByTestId('cps-menu-header')).toHaveText(
        /Access menu/
      );
      await expect(page.getByTestId('cps-menu-item-0')).toContainText(
        'Requests'
      );
      await expect(page.getByTestId('cps-menu-item-1')).toContainText(
        'Approval'
      );
    });

    test('opening a second flyout closes the first', async ({ page }) => {
      const trigger1 = item(page, 3); // Access menu
      const trigger2 = item(page, 4); // Community menu

      await trigger1.hover();
      await expect(page.getByTestId('cps-menu-header')).toHaveText(
        /Access menu/
      );

      await trigger2.hover();
      await expect(menuContainer(page)).toHaveCount(1);
      await expect(page.getByTestId('cps-menu-header')).toHaveText(
        /Community menu/
      );
    });
  });

  test.describe('Real click-toggle', () => {
    test('a first click opens the flyout, a second click closes it', async ({
      page
    }) => {
      const trigger = item(page, 3);

      await trigger.click();
      await expect(menuContainer(page)).toBeVisible();

      await trigger.click();
      await expect(menuContainer(page)).toBeHidden();
    });
  });

  test.describe('Real keyboard flow', () => {
    test('focusing a trigger previews its flyout; focusing the next trigger switches it', async ({
      page
    }) => {
      const trigger1 = item(page, 3); // Access menu
      const trigger2 = item(page, 4); // Community menu

      await trigger1.focus();
      await expect(trigger1).toBeFocused();
      await expect(page.getByTestId('cps-menu-header')).toHaveText(
        /Access menu/
      );

      await trigger2.focus();
      await expect(trigger2).toBeFocused();
      await expect(menuContainer(page)).toHaveCount(1);
      await expect(page.getByTestId('cps-menu-header')).toHaveText(
        /Community menu/
      );
    });

    test('moving focus to a disabled trigger closes the previous flyout', async ({
      page
    }) => {
      const trigger2 = item(page, 4); // Community menu
      const disabledTrigger = item(page, 5); // Bookmarks menu disabled

      await trigger2.focus();
      await expect(menuContainer(page)).toBeVisible();

      await disabledTrigger.focus();
      await expect(disabledTrigger).toBeFocused();
      await expect(menuContainer(page)).toBeHidden();
    });
  });

  test.describe('Disabled items', () => {
    test('a disabled group trigger never opens on hover or click', async ({
      page
    }) => {
      const trigger = item(page, 5); // Bookmarks menu disabled

      await trigger.hover();
      await expect(menuContainer(page)).toBeHidden();

      await trigger.click({ force: true });
      await expect(menuContainer(page)).toBeHidden();
    });

    test('a disabled link does not navigate', async ({ page }) => {
      const link = item(page, 2); // Categories disabled
      const urlBefore = page.url();

      await link.click({ force: true });
      await expect(page).toHaveURL(urlBefore);
    });
  });

  test.describe('Real active-route highlighting', () => {
    test('the item matching the current route is active on load, others are not', async ({
      page
    }) => {
      const favourites = item(page, 1); // points at /sidebar-menu/examples
      const dashboard = item(page, 0); // points at /

      await expect(favourites).toHaveClass(/active/);
      await expect(favourites).toHaveAttribute('aria-current', 'page');
      await expect(dashboard).not.toHaveClass(/active/);
    });
  });

  test.describe('Real target="_blank" navigation', () => {
    test('opens the item in a real new tab', async ({ page }) => {
      const dashboard = item(page, 0); // Dashboard, target="_blank"

      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        dashboard.click()
      ]);
      await popup.waitForLoadState();
      expect(popup.url()).not.toBe(page.url());
      await popup.close();
    });
  });

  test.describe('Expand/collapse toggle', () => {
    test('collapsing hides labels and updates aria state; expanding reverses it', async ({
      page
    }) => {
      const btn = wrapper(page).getByTestId('cps-sidebar-menu-expand-btn');
      const root = wrapper(page).getByTestId('cps-sidebar-menu');
      const label = wrapper(page)
        .getByTestId('cps-sidebar-menu-item-label')
        .first();

      await expect(btn).toHaveAttribute('aria-label', 'Collapse sidebar');
      await expect(btn).toHaveAttribute('aria-expanded', 'true');
      await expect(root).not.toHaveClass(/cps-sidebar-menu-collapsed/);

      await btn.click();
      await expect(root).toHaveClass(/cps-sidebar-menu-collapsed/);
      await expect(btn).toHaveAttribute('aria-label', 'Expand sidebar');
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
      await expect(label).toHaveCSS('visibility', 'hidden');

      await btn.click();
      await expect(root).not.toHaveClass(/cps-sidebar-menu-collapsed/);
      await expect(btn).toHaveAttribute('aria-label', 'Collapse sidebar');
      await expect(label).toHaveCSS('visibility', 'visible');
    });

    test('still functionally collapses under prefers-reduced-motion', async ({
      page
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const btn = wrapper(page).getByTestId('cps-sidebar-menu-expand-btn');
      const root = wrapper(page).getByTestId('cps-sidebar-menu');

      await btn.click();
      await expect(root).toHaveClass(/cps-sidebar-menu-collapsed/);
    });
  });

  test.describe('Real computed-style background inheritance', () => {
    test('the expand button resolves a real, non-transparent background color', async ({
      page
    }) => {
      const btn = wrapper(page).getByTestId('cps-sidebar-menu-expand-btn');
      const bg = await btn.evaluate(
        (el) => getComputedStyle(el).backgroundColor
      );
      expect(bg).not.toBe('');
      expect(bg).not.toBe('transparent');
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    });
  });
});
