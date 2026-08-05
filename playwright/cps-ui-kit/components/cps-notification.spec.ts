import { test, expect, type Page, type Locator } from '@playwright/test';

function toasts(page: Page): Locator {
  return page.getByTestId('cps-toast');
}

function masks(page: Page): Locator {
  return page.getByTestId('cps-notification-container-mask');
}

function trigger(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function closeButton(toast: Locator): Locator {
  return toast.getByTestId('cps-toast-close-button').locator('button');
}

async function waitForTotalToastCount(
  page: Page,
  count: number
): Promise<void> {
  await page.waitForFunction(
    (n) => document.querySelectorAll('[data-testid="cps-toast"]').length === n,
    count
  );
}

test.describe('cps-notification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notification');
  });

  test.describe('Real portal attachment to document.body', () => {
    test("a triggered toast's container is a real direct child of document.body", async ({
      page
    }) => {
      await trigger(page, 'info-notification-trigger').click();
      const mask = masks(page).first();
      await expect(mask).toBeVisible();

      const hostParentIsBody = await mask.evaluate(
        (el) =>
          el.closest('cps-notification-container')?.parentElement ===
          document.body
      );
      expect(hostParentIsBody).toBe(true);
    });
  });

  test.describe('Real container reuse vs. separate creation across positions', () => {
    test('same-position triggers reuse one real container; a different position gets its own', async ({
      page
    }) => {
      await trigger(page, 'info-notification-trigger').click();
      await trigger(page, 'info-notification-trigger').click();
      await trigger(page, 'bottom-info-notification-trigger').click();

      await expect(masks(page)).toHaveCount(2);

      const topRight = page.locator(
        '[data-testid="cps-notification-container-mask"][aria-label="Notifications: top-right"]'
      );
      const bottom = page.locator(
        '[data-testid="cps-notification-container-mask"][aria-label="Notifications: bottom"]'
      );
      await expect(topRight.getByTestId('cps-toast')).toHaveCount(2);
      await expect(bottom.getByTestId('cps-toast')).toHaveCount(1);
    });
  });

  test.describe('Real maxAmount truncates the live DOM', () => {
    test('a 4th notification in a max-3 container real-pops the oldest', async ({
      page
    }) => {
      const button = trigger(page, 'error-max3-notification-trigger');
      for (let i = 0; i < 4; i++) {
        await button.click();
      }

      await expect(toasts(page)).toHaveCount(3);
      await expect(
        page.getByTestId('cps-toast-message-header').last()
      ).toHaveText('Notification message 1');
    });
  });

  test.describe('Real un-faked auto-dismiss timing', () => {
    test('a 2-second-timeout toast real-dismisses on its own, on a real clock', async ({
      page
    }) => {
      await trigger(page, 'timeout-warning-notification-trigger').click();

      const toast = toasts(page).first();
      await expect(toast).toBeVisible();
      await expect(toast).toHaveCount(0, { timeout: 4000 });
    });
  });

  test.describe('Real persistent notification never auto-dismisses', () => {
    test('a timeout:0 toast survives while a real 2-second toast dismisses around it', async ({
      page
    }) => {
      await trigger(page, 'persistent-notification-trigger').click();
      const persistentToast = toasts(page).first();
      await expect(persistentToast).toBeVisible();

      await trigger(page, 'timeout-warning-notification-trigger').click();
      await expect(toasts(page)).toHaveCount(2);

      await waitForTotalToastCount(page, 1);
      await expect(persistentToast).toBeVisible();
    });
  });

  test.describe('Real hover pauses and resumes the dismiss timer', () => {
    test('hovering a toast keeps it alive past its real timeout; leaving lets it dismiss', async ({
      page
    }) => {
      await trigger(page, 'timeout-warning-notification-trigger').click();
      const hoveredToast = toasts(page).first();
      await expect(hoveredToast).toBeVisible();
      await hoveredToast.hover();

      await trigger(page, 'info-notification-trigger').click();
      await waitForTotalToastCount(page, 1);

      await expect(hoveredToast).toBeVisible();

      await page.mouse.move(0, 0);
      await expect(hoveredToast).toHaveCount(0, { timeout: 8000 });
    });
  });

  test.describe('Real keyboard focus pauses and resumes the dismiss timer', () => {
    test("focusing a toast's close button keeps it alive past its real timeout; blurring lets it dismiss", async ({
      page
    }) => {
      await trigger(page, 'timeout-warning-notification-trigger').click();
      const focusedToast = toasts(page).first();
      await expect(focusedToast).toBeVisible();
      await closeButton(focusedToast).focus();
      await expect(closeButton(focusedToast)).toBeFocused();

      await trigger(page, 'info-notification-trigger').click();
      await waitForTotalToastCount(page, 1);

      await expect(focusedToast).toBeVisible();

      await page.evaluate(() =>
        (document.activeElement as HTMLElement | null)?.blur()
      );
      await expect(focusedToast).toHaveCount(0, { timeout: 8000 });
    });
  });

  test.describe('Real close button removes exactly that toast and tears down the empty container', () => {
    test('closing each toast in turn real-removes it, then the whole container', async ({
      page
    }) => {
      const button = trigger(page, 'info-notification-trigger');
      await button.click();
      await button.click();
      await expect(toasts(page)).toHaveCount(2);

      await closeButton(toasts(page).first()).click();
      await expect(toasts(page)).toHaveCount(1);
      await expect(masks(page)).toHaveCount(1);

      await closeButton(toasts(page).first()).click();
      await expect(toasts(page)).toHaveCount(0);
      await expect(masks(page)).toHaveCount(0);
    });
  });

  test.describe('Real animation actually runs', () => {
    test('a triggered toast has a real running enter animation, then settles to full opacity', async ({
      page
    }) => {
      await trigger(page, 'info-notification-trigger').click();
      const toast = toasts(page).first();

      await page.waitForFunction(() => {
        const el = document.querySelector(
          '[data-testid="cps-toast"]'
        ) as HTMLElement | null;
        return !!el && el.getAnimations().length > 0;
      });

      await expect(toast).toHaveCSS('opacity', '1');
    });
  });

  test.describe('Real prefers-reduced-motion shortens real removal time', () => {
    test('closing a toast under reduced motion resolves much faster than the normal transition', async ({
      page
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/notification');

      await trigger(page, 'info-notification-trigger').click();
      const toast = toasts(page).first();
      await expect(toast).toBeVisible();
      await closeButton(toast).click();
      await expect(toast).toHaveCount(0, { timeout: 400 });
    });
  });

  test.describe('Real aria-live announcement content and role', () => {
    test('a polite (info) toast announces its real message and details with role=status', async ({
      page
    }) => {
      await trigger(page, 'bottom-info-notification-trigger').click();
      const announcement = page.getByTestId('cps-toast-announcement');
      await expect(announcement).toHaveText(
        'info: Notification message 0. Notification details'
      );
      await expect(announcement).toHaveAttribute('role', 'status');
    });

    test('a non-polite (error) toast announces with role=alert', async ({
      page
    }) => {
      await trigger(page, 'error-notification-trigger').click();
      const announcement = page.getByTestId('cps-toast-announcement');
      await expect(announcement).not.toHaveText('');
      await expect(announcement).toHaveAttribute('role', 'alert');
    });
  });

  test.describe('Real relative z-index cascading between simultaneous containers', () => {
    test('two containers in different positions get distinct, correctly-ordered real z-indexes', async ({
      page
    }) => {
      await trigger(page, 'info-notification-trigger').click();
      await trigger(page, 'bottom-info-notification-trigger').click();
      await expect(masks(page)).toHaveCount(2);

      const zIndexes = await masks(page).evaluateAll((els) =>
        els.map((el) => {
          const container = el.querySelector(
            '[data-testid="cps-notification-container"]'
          ) as HTMLElement | null;
          return {
            maskZ: Number(el.style.zIndex),
            containerZ: Number(container?.style.zIndex)
          };
        })
      );

      expect(zIndexes).toHaveLength(2);
      for (const { maskZ, containerZ } of zIndexes) {
        expect(containerZ).toBeGreaterThan(0);
        expect(maskZ).toBe(containerZ - 1);
      }
      expect(zIndexes[0].containerZ).not.toBe(zIndexes[1].containerZ);
    });
  });

  test.describe('Real duplicate suppression', () => {
    test('clicking the same message repeatedly real-suppresses duplicates by default', async ({
      page
    }) => {
      const button = trigger(page, 'duplicate-notification-trigger');
      await button.click();
      await button.click();
      await button.click();

      await expect(toasts(page)).toHaveCount(1);
    });
  });

  test.describe('Real clear() removes all real toasts across all real containers', () => {
    test('clicking "Clear all notifications" real-tears-down every active container', async ({
      page
    }) => {
      await trigger(page, 'info-notification-trigger').click();
      await trigger(page, 'bottom-info-notification-trigger').click();
      await expect(masks(page)).toHaveCount(2);
      await expect(toasts(page)).toHaveCount(2);

      await trigger(page, 'clear-notifications-trigger').click();

      await expect(toasts(page)).toHaveCount(0);
      await expect(masks(page)).toHaveCount(0);
    });
  });
});
