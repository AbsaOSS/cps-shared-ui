import { test, expect, type Page, type Locator } from '@playwright/test';

function dialogs(page: Page): Locator {
  return page.getByTestId('cps-dialog');
}

function trigger(page: Page, name: string): Locator {
  return page.getByRole('button', { name, exact: true });
}

test.describe('cps-dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dialog');
  });

  test.describe('Real open, focus management, close and focus restoration', () => {
    test('opening the dialog moves real focus inside it, and closing it restores focus to the trigger', async ({
      page
    }) => {
      const openTrigger = trigger(page, 'Regular dialog');
      await openTrigger.focus();
      await page.keyboard.press('Enter');

      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();

      const closeBtn = page
        .getByTestId('cps-dialog-close-btn')
        .locator('button');
      await expect(closeBtn).toBeFocused();

      await closeBtn.click();

      await expect(dialog).toBeHidden();
      await expect(openTrigger).toBeFocused();
    });
  });

  test.describe('Real Escape closes only the topmost dialog', () => {
    test('pressing Escape with two dialogs open closes only the one opened last', async ({
      page
    }) => {
      await trigger(page, 'Non-modal dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toHaveCount(1);

      await trigger(page, 'Bottom-right positioned dialog').click();
      await expect(dialog).toHaveCount(2);

      await page.keyboard.press('Escape');

      await expect(dialog).toHaveCount(1);
      await expect(dialog.getByTestId('cps-dialog-header-title')).toHaveText(
        'Non-modal dialog'
      );
    });
  });

  test.describe('Real backdrop click closes a modal dialog', () => {
    test('clicking the mask outside the dialog box closes it', async ({
      page
    }) => {
      await trigger(page, 'Regular dialog').click();
      const mask = page.getByTestId('cps-dialog-mask');
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();

      await mask.click({ position: { x: 5, y: 5 } });

      await expect(dialog).toBeHidden();
    });
  });

  test.describe('Real non-modal dialog does not block the page behind it', () => {
    test('a real click reaches a trigger button behind the non-modal mask', async ({
      page
    }) => {
      await trigger(page, 'Non-modal dialog').click();
      const mask = page.getByTestId('cps-dialog-mask');
      await expect(mask).toHaveCSS('pointer-events', 'none');

      await trigger(page, 'Bottom-right positioned dialog').click();

      await expect(dialogs(page)).toHaveCount(2);
    });
  });

  test.describe('Real focus trap', () => {
    test('Tab and Shift+Tab wrap focus between the first and last focusable elements', async ({
      page
    }) => {
      await trigger(page, 'Maximizable dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();

      const maximizeBtn = page
        .getByTestId('cps-dialog-maximize-btn')
        .locator('button');
      await expect(maximizeBtn).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      const lastFocusable = page.getByRole('button', {
        name: 'Disable closing'
      });
      await expect(lastFocusable).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(maximizeBtn).toBeFocused();
    });
  });

  test.describe('Real keyboard drag', () => {
    test('pressing ArrowRight on the drag handle moves the dialog by one real step', async ({
      page
    }) => {
      await trigger(page, 'Draggable dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(':focus')).toBeVisible();

      const before = await dialog.boundingBox();
      if (!before) throw new Error('boundingBox() returned null');

      const dragHandle = page.getByTestId('cps-dialog-drag-handle');
      await dragHandle.focus();
      await page.keyboard.press('ArrowRight');

      const after = await dialog.boundingBox();
      if (!after) throw new Error('boundingBox() returned null');

      expect(after.x - before.x).toBeGreaterThan(10);
      expect(after.y).toBeCloseTo(before.y, 0);
    });
  });

  test.describe('Real keyboard resize', () => {
    test('pressing ArrowDown on the resize handle grows the dialog by one real step', async ({
      page
    }) => {
      await trigger(page, 'Resizable dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(':focus')).toBeVisible();

      const before = await dialog.boundingBox();
      if (!before) throw new Error('boundingBox() returned null');

      const resizeHandle = page.getByTestId('cps-dialog-resize-handle');
      await resizeHandle.focus();
      await page.keyboard.press('ArrowDown');

      const after = await dialog.boundingBox();
      if (!after) throw new Error('boundingBox() returned null');

      expect(after.height - before.height).toBeGreaterThan(10);
    });
  });

  test.describe('Real maximize toggle', () => {
    test('maximizing fills the real viewport and minimizing restores the original size', async ({
      page
    }) => {
      await trigger(page, 'Maximizable dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(':focus')).toBeVisible();

      const before = await dialog.boundingBox();
      if (!before) throw new Error('boundingBox() returned null');

      const maximizeBtn = page
        .getByTestId('cps-dialog-maximize-btn')
        .locator('button');
      await maximizeBtn.click();

      const viewport = page.viewportSize();
      if (!viewport) throw new Error('viewportSize() returned null');
      await expect(dialog).toHaveClass(/cps-dialog-maximized/);
      const afterMax = await dialog.boundingBox();
      if (!afterMax) throw new Error('boundingBox() returned null');
      expect(afterMax.width).toBeCloseTo(viewport.width, 0);
      expect(afterMax.height).toBeCloseTo(viewport.height, 0);

      await maximizeBtn.click();

      await expect(dialog).not.toHaveClass(/cps-dialog-maximized/);
      const afterMin = await dialog.boundingBox();
      if (!afterMin) throw new Error('boundingBox() returned null');
      expect(afterMin.width).toBeCloseTo(before.width, 0);
      expect(afterMin.height).toBeCloseTo(before.height, 0);
    });
  });

  test.describe('Real mouse drag', () => {
    test('a real mousedown/move/up sequence on the header moves the dialog', async ({
      page
    }) => {
      await trigger(page, 'Draggable dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(':focus')).toBeVisible();

      const before = await dialog.boundingBox();
      if (!before) throw new Error('boundingBox() returned null');

      const title = page.getByTestId('cps-dialog-header-title');
      const titleBox = await title.boundingBox();
      if (!titleBox) throw new Error('boundingBox() returned null');
      const startX = titleBox.x + titleBox.width / 2;
      const startY = titleBox.y + titleBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 80, startY + 40, { steps: 5 });
      await page.mouse.up();

      const after = await dialog.boundingBox();
      if (!after) throw new Error('boundingBox() returned null');

      const tolerancePx = 2;
      expect(Math.abs(after.x - before.x - 80)).toBeLessThanOrEqual(
        tolerancePx
      );
      expect(Math.abs(after.y - before.y - 40)).toBeLessThanOrEqual(
        tolerancePx
      );
    });
  });

  test.describe('Real mouse resize', () => {
    test('a real mousedown/move/up sequence on the resize handle grows the dialog', async ({
      page
    }) => {
      await trigger(page, 'Resizable dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(':focus')).toBeVisible();

      const before = await dialog.boundingBox();
      if (!before) throw new Error('boundingBox() returned null');

      const resizeHandle = page.getByTestId('cps-dialog-resize-handle');
      const handleBox = await resizeHandle.boundingBox();
      if (!handleBox) throw new Error('boundingBox() returned null');
      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 60, startY + 60, { steps: 5 });
      await page.mouse.up();

      const after = await dialog.boundingBox();
      if (!after) throw new Error('boundingBox() returned null');

      expect(after.width).toBeGreaterThan(before.width);
      expect(after.height).toBeGreaterThan(before.height);
    });
  });

  test.describe('Real disableClose blocks every close path', () => {
    test('Escape, backdrop click and the close button all become no-ops once closing is disabled', async ({
      page
    }) => {
      await trigger(page, 'Regular dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();

      await page.getByRole('button', { name: 'Disable closing' }).click();

      const closeBtn = page
        .getByTestId('cps-dialog-close-btn')
        .locator('button');
      await expect(closeBtn).toBeDisabled();

      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();

      const mask = page.getByTestId('cps-dialog-mask');
      await mask.click({ position: { x: 5, y: 5 } });
      await expect(dialog).toBeVisible();
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('a header-less dialog exposes its aria-label as the real accessible name', async ({
      page
    }) => {
      await trigger(page, 'Header-less dialog with an aria-label').click();

      await expect(page.getByTestId('cps-dialog-header')).toHaveCount(0);
      await expect(
        page.getByRole('dialog', { name: 'Dialog without a visible header' })
      ).toBeVisible();
    });
  });

  test.describe('Real confirmation dialog round trip', () => {
    test('clicking Yes closes the confirmation dialog', async ({ page }) => {
      await trigger(page, 'Confirmation dialog').click();
      const dialog = dialogs(page);
      await expect(dialog).toBeVisible();

      await page
        .getByTestId('cps-confirmation-yes-btn')
        .locator('button')
        .click();

      await expect(dialog).toBeHidden();
    });
  });
});
