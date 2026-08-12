import { test, expect, type Page, type Locator } from '@playwright/test';

function textareaEl(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-textarea');
}

function wrap(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-textarea-wrap');
}

function clearBtn(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-textarea-clear-btn');
}

function resizeHandle(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-textarea-resize-handle');
}

async function tabUntilFocused(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  for (let i = 0; i < 30; i++) {
    const isFocused = await target.evaluate(
      (el) => el === document.activeElement
    );
    if (isFocused) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Target was never reached via real Tab navigation');
}

test.describe('cps-textarea', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/textarea');
  });

  test.describe('Real keyboard-vs-mouse focus detection', () => {
    test('a real Tab into the textarea applies the keyboard-focused state, but a real mouse click does not', async ({
      page
    }) => {
      const target = textareaEl(page, 'required-textarea');
      const wrapEl = wrap(page, 'required-textarea');

      await tabUntilFocused(page, target);
      await expect(wrapEl).toHaveClass(/keyboard-focused/);

      await page.mouse.click(10, 10);
      await expect(target).not.toBeFocused();

      await target.click();
      await expect(target).toBeFocused();
      await expect(wrapEl).not.toHaveClass(/keyboard-focused/);
    });
  });

  test.describe('Real ARIA id-relationship for validation errors', () => {
    test('a real focus-then-blur on an empty required field wires a real error into aria-describedby', async ({
      page
    }) => {
      const target = textareaEl(page, 'required-textarea');
      const hint = page
        .getByTestId('required-textarea')
        .getByTestId('cps-textarea-hint');
      const error = page
        .getByTestId('required-textarea')
        .getByTestId('cps-textarea-error');

      const initialDescribedBy = await target.getAttribute('aria-describedby');
      expect(initialDescribedBy).toBeTruthy();
      await expect(hint).toHaveAttribute('id', initialDescribedBy!);

      await target.click();
      await page.keyboard.press('Tab');

      await expect(error).toHaveText('Field is required');
      const describedBy = await target.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(error).toHaveAttribute('id', describedBy!);
    });

    test('typing past the real maxLength swaps in the maxlength error message', async ({
      page
    }) => {
      const target = textareaEl(page, 'required-textarea');
      const error = page
        .getByTestId('required-textarea')
        .getByTestId('cps-textarea-error');

      await target.click();
      await target.pressSequentially('abcd');
      await page.keyboard.press('Tab');

      await expect(error).toHaveText('Field must contain 3 characters maximum');
    });
  });

  test.describe('Real clear button restores focus', () => {
    test('clicking the clear button on a real typed value empties it and synchronously restores focus', async ({
      page
    }) => {
      const target = textareaEl(page, 'clearable-textarea');
      const clear = clearBtn(page, 'clearable-textarea');

      await expect(target).toHaveValue('Clear me');

      await clear.click();

      await expect(target).toHaveValue('');
      await expect(target).toBeFocused();
    });
  });

  test.describe('Real resize-handle keyboard interaction', () => {
    test('pressing ArrowDown grows the textarea and caps at the real computed maxHeight, ArrowUp shrinks it back', async ({
      page
    }) => {
      const target = textareaEl(page, 'max-height-textarea');
      const handle = resizeHandle(page, 'max-height-textarea');

      const initialHeight = await target.evaluate(
        (el: HTMLTextAreaElement) => el.offsetHeight
      );

      await handle.focus();
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowDown');
      }

      const maxHeightPx = await target.evaluate((el) =>
        parseFloat(getComputedStyle(el).maxHeight)
      );
      const grownHeight = await target.evaluate(
        (el: HTMLTextAreaElement) => el.offsetHeight
      );
      expect(grownHeight).toBeGreaterThan(initialHeight);
      expect(grownHeight).toBeLessThanOrEqual(maxHeightPx);
      await page.keyboard.press('ArrowDown');
      const heightAfterExtraPress = await target.evaluate(
        (el: HTMLTextAreaElement) => el.offsetHeight
      );
      expect(heightAfterExtraPress).toBe(grownHeight);

      await page.keyboard.press('ArrowUp');
      const shrunkHeight = await target.evaluate(
        (el: HTMLTextAreaElement) => el.offsetHeight
      );
      expect(shrunkHeight).toBeLessThan(grownHeight);
    });
  });

  test.describe('hideDetails suppresses the hint/error row entirely', () => {
    test('no hint element is rendered when hideDetails is set', async ({
      page
    }) => {
      const hint = page
        .getByTestId('hide-details-textarea')
        .getByTestId('cps-textarea-hint');

      await expect(hint).toHaveCount(0);
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('a labeled textarea exposes its label as the real accessible name with the implicit textbox role', async ({
      page
    }) => {
      await expect(
        page.getByRole('textbox', {
          name: 'Required textarea with a tooltip',
          exact: true
        })
      ).toBeVisible();
    });

    test('an unlabeled textarea exposes its ariaLabel as the real accessible name', async ({
      page
    }) => {
      await expect(
        page.getByRole('textbox', {
          name: 'Additional comments',
          exact: true
        })
      ).toBeVisible();
    });
  });

  test.describe('Two-way binding - real readout', () => {
    test('typing into the textarea updates the visible bound value', async ({
      page
    }) => {
      const target = textareaEl(page, 'two-way-binding-textarea');
      const readout = page.getByTestId('two-way-binding-textarea-value');

      await expect(readout).toHaveText('');

      await target.click();
      await target.pressSequentially('hello');

      await expect(readout).toHaveText('hello');
    });
  });
});
