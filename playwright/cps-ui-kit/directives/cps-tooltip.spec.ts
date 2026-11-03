import { test, expect, type Page, type Locator } from '@playwright/test';

function button(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function tooltip(page: Page): Locator {
  return page.getByTestId('cps-tooltip');
}

// Counts the Esc presses that reach window listeners, where notifications listen
async function countWindowEscapes(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(() => {
    const w = window as any;
    w.__escapes = 0;
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') w.__escapes++;
    });
  });
  return () => page.evaluate(() => (window as any).__escapes);
}

// Focuses like a keyboard user, so the focus counts as focus-visible. Scrolls
// first: focus would otherwise smooth-scroll the page, which closes tooltips
async function keyboardFocus(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await page.keyboard.press('Shift');
  await locator.focus();
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

  test.describe('Real Esc dismissal (WCAG 1.4.13)', () => {
    test('Esc closes a hover tooltip and it stays closed while the pointer rests on the target', async ({
      page
    }) => {
      const target = button(page, 'hover-open-tooltip');

      await target.hover();
      await expect(tooltip(page)).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(tooltip(page)).toHaveCount(0);

      await page.waitForTimeout(600);
      await expect(tooltip(page)).toHaveCount(0);
    });

    test('Esc closes a focus tooltip and focus stays on the target', async ({
      page
    }) => {
      const innerButton = button(page, 'focus-only-tooltip').getByTestId(
        'cps-button'
      );

      await innerButton.focus();

      await expect(tooltip(page)).toHaveCSS('opacity', '1');

      await page.keyboard.press('Escape');

      await expect(tooltip(page)).toHaveCount(0);
      await expect(innerButton).toBeFocused();
    });

    test('Esc closes a click tooltip and focus stays on the target', async ({
      page
    }) => {
      const innerButton = button(page, 'click-open-tooltip').getByTestId(
        'cps-button'
      );

      await innerButton.focus();
      await page.keyboard.press('Enter');
      await expect(tooltip(page)).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(tooltip(page)).toHaveCount(0);
      await expect(innerButton).toBeFocused();
    });

    test('Esc inside a persistent tooltip closes it and sends focus back to the target', async ({
      page
    }) => {
      const innerButton = button(page, 'persistent-tooltip').getByTestId(
        'cps-button'
      );

      await innerButton.scrollIntoViewIfNeeded();
      await innerButton.focus();
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      await tooltip(page).getByRole('link', { name: 'Google' }).focus();

      await page.keyboard.press('Escape');

      await expect(tooltip(page)).toHaveCount(0);
      await expect(innerButton).toBeFocused();
    });

    test('the Esc that closes a tooltip is handled: it does not reach window listeners', async ({
      page
    }) => {
      const escapes = await countWindowEscapes(page);

      await button(page, 'hover-open-tooltip').hover();
      await expect(tooltip(page)).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(tooltip(page)).toHaveCount(0);
      expect(await escapes()).toBe(0);

      await page.keyboard.press('Escape');
      expect(await escapes()).toBe(1);
    });

    test('Esc during the open delay cancels the tooltip and is left to the page', async ({
      page
    }) => {
      const escapes = await countWindowEscapes(page);

      await button(page, 'open-delay-tooltip').hover();
      await page.keyboard.press('Escape');
      expect(await escapes()).toBe(1);

      await page.waitForTimeout(1500);
      await expect(tooltip(page)).toHaveCount(0);
    });
  });

  test.describe('Real hovering over the tooltip (WCAG 1.4.13)', () => {
    async function moveOnto(page: Page, locator: Locator): Promise<void> {
      const box = await locator.boundingBox();
      if (!box) throw new Error('boundingBox() returned null');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 10
      });
    }

    test('the pointer can move from the target onto the tooltip and rest there', async ({
      page
    }) => {
      const target = button(page, 'hover-open-tooltip');

      await target.hover();
      await expect(tooltip(page)).toBeVisible();

      await moveOnto(page, tooltip(page));

      await page.waitForTimeout(600);
      await expect(tooltip(page)).toHaveCSS('opacity', '1');

      await page.mouse.move(0, 0);
      await expect(tooltip(page)).toHaveCount(0);
    });

    test('the tooltip closes after the close delay once the pointer leaves it', async ({
      page
    }) => {
      const target = button(page, 'close-delay-tooltip');

      await target.hover();
      await expect(tooltip(page)).toBeVisible();
      await moveOnto(page, tooltip(page));

      await page.mouse.move(0, 0);

      await page.waitForTimeout(500);
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      await expect(tooltip(page)).toHaveCount(0, { timeout: 1500 });
    });

    test('a keyboard-focused tooltip stays open when the pointer passes over it', async ({
      page
    }) => {
      const innerButton = button(page, 'hover-open-tooltip').getByTestId(
        'cps-button'
      );

      await innerButton.focus();
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      const box = await tooltip(page).boundingBox();
      if (!box) throw new Error('boundingBox() returned null');

      const below = { x: box.x + box.width / 2, y: box.y + box.height + 40 };
      await page.mouse.move(below.x, below.y);
      await page.mouse.move(below.x, box.y + box.height / 2, { steps: 5 });
      await page.mouse.move(below.x, below.y, { steps: 5 });

      await page.waitForTimeout(600);
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      await expect(innerButton).toBeFocused();
    });

    test('a keyboard-focused tooltip stays open when the pointer crosses its target', async ({
      page
    }) => {
      const target = button(page, 'hover-open-tooltip');
      const innerButton = target.getByTestId('cps-button');

      await innerButton.focus();
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      const box = await target.boundingBox();
      if (!box) throw new Error('boundingBox() returned null');
      const y = box.y + box.height / 2;
      await page.mouse.move(box.x - 20, y);
      await page.mouse.move(box.x + box.width / 2, y, { steps: 5 });
      await page.mouse.move(box.x - 20, y, { steps: 5 });

      await page.waitForTimeout(600);
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      await expect(innerButton).toBeFocused();
    });

    test('with no close delay, the tooltip stays open when the pointer moves straight onto it', async ({
      page
    }) => {
      await button(page, 'no-close-delay-tooltip').hover();
      await expect(tooltip(page)).toBeVisible();

      await moveOnto(page, tooltip(page));
      // A closing tooltip fades to opacity 0 first, which toBeVisible() would accept
      await page.waitForTimeout(300);
      await expect(tooltip(page)).toHaveCSS('opacity', '1');

      await page.mouse.move(0, 0);
      await expect(tooltip(page)).toHaveCount(0, { timeout: 1000 });
    });
  });

  test.describe('Real multiple tooltips', () => {
    test('moving from one target to the next closes the first tooltip and opens the next', async ({
      page
    }) => {
      const bottom = page.getByRole('tooltip', { name: 'Bottom tooltip' });
      const left = page.getByRole('tooltip', { name: 'Left tooltip' });

      await button(page, 'bottom-position-tooltip').hover();
      await expect(bottom).toHaveCSS('opacity', '1');
      await button(page, 'left-position-tooltip').hover();

      await expect(left).toHaveCSS('opacity', '1');
      await expect(bottom).toHaveCount(0);
      await expect(tooltip(page)).toHaveCount(1);
    });

    test('one Esc closes every open tooltip', async ({ page }) => {
      // Kept open by keyboard focus while the pointer opens a second one
      await keyboardFocus(
        page,
        button(page, 'focus-only-tooltip').getByTestId('cps-button')
      );
      await expect(tooltip(page)).toHaveCSS('opacity', '1');
      await button(page, 'hover-open-tooltip').hover();
      await expect(tooltip(page)).toHaveCount(2);

      await page.keyboard.press('Escape');

      await expect(tooltip(page)).toHaveCount(0);
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

// These load the page with the other overlay, so no /tooltip beforeEach
test.describe('cps-tooltip with menus, dialogs and notifications', () => {
  test('Esc closes the tooltip in an open dialog, and the next Esc closes the dialog', async ({
    page
  }) => {
    await page.goto('/dialog');
    await page
      .getByRole('button', { name: 'Resizable dialog', exact: true })
      .click();
    const dialog = page.getByTestId('cps-dialog');
    await expect(dialog).toBeVisible();
    await page
      .getByTestId('cps-dialog-header-info-circle')
      .getByTestId('cps-info-circle')
      .hover();
    await expect(tooltip(page)).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('with keyboard focus in a dialog, Esc closes the tooltip, focus stays, the dialog stays open', async ({
    page
  }) => {
    await page.goto('/dialog');
    await keyboardFocus(
      page,
      page.getByRole('button', { name: 'Resizable dialog', exact: true })
    );
    await page.keyboard.press('Enter');
    const dialog = page.getByTestId('cps-dialog');
    // The dialog focuses its first focusable element, the header icon
    const icon = page
      .getByTestId('cps-dialog-header-info-circle')
      .getByTestId('cps-info-circle');
    await expect(icon).toBeFocused();
    await expect(tooltip(page)).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');

    await expect(tooltip(page)).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(icon).toBeFocused();
  });

  test('Esc closes the tooltip while a notification is open, and the next Esc closes the notification', async ({
    page
  }) => {
    await page.goto('/notification');
    await page
      .getByTestId('persistent-notification-trigger')
      .locator('button')
      .click();
    const toast = page.getByTestId('cps-toast');
    await expect(toast).toHaveCount(1);
    // Notifications stay open across in-app navigation
    await page.locator('a[href$="/tooltip"]').first().click();
    await button(page, 'hover-open-tooltip').hover();
    await expect(tooltip(page)).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toHaveCount(0);
    await expect(toast).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(toast).toHaveCount(0);
  });

  test('a menu opened after the tooltip takes the Esc first, and the next Esc closes the tooltip', async ({
    page
  }) => {
    await page.goto('/select');
    const select = page.getByTestId('required-select');
    await select.getByTestId('cps-info-circle').hover();
    await expect(tooltip(page)).toHaveCSS('opacity', '1');
    await keyboardFocus(page, select.getByTestId('cps-select-container'));
    await page.keyboard.press('ArrowDown');
    const menu = page.getByTestId('cps-menu-container');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(tooltip(page)).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toHaveCount(0);
  });
});
