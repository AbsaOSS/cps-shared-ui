import { test, expect, type Page, type Locator } from '@playwright/test';

function inputEl(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-input');
}

function displayEl(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-input-display');
}

function clearBtn(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-input-clear-btn');
}

function passwordToggleBtn(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-input-password-toggle-btn');
}

function prefixIconBtn(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-input-prefix-icon-btn');
}

function inputWrap(page: Page, testId: string): Locator {
  return page.getByTestId(testId).getByTestId('cps-input-wrap');
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

test.describe('cps-input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/input');
  });

  test.describe('Real keyboard-vs-mouse focus detection', () => {
    test('a real Tab into the input applies the keyboard-focused state, but a real mouse click does not', async ({
      page
    }) => {
      const target = inputEl(page, 'borderless-input');
      const wrap = inputWrap(page, 'borderless-input');

      await tabUntilFocused(page, target);
      await expect(wrap).toHaveClass(/keyboard-focused/);

      await page.mouse.click(10, 10);
      await expect(target).not.toBeFocused();

      await target.click();
      await expect(target).toBeFocused();
      await expect(wrap).not.toHaveClass(/keyboard-focused/);
    });
  });

  test.describe('Native number input filters non-numeric keystrokes', () => {
    test('typing letters and digits into a type=number input real-browser-rejects the letters', async ({
      page
    }) => {
      const target = inputEl(page, 'required-numeric-input');

      await target.click();
      await target.pressSequentially('abc12xyz3');

      await expect(target).toHaveValue('123');
    });
  });

  test.describe('Action buttons preserve real input focus', () => {
    test('clicking the password-toggle button unmasks the value and keeps focus on the input', async ({
      page
    }) => {
      const target = inputEl(page, 'password-input');
      const toggle = passwordToggleBtn(page, 'password-input');

      await target.click();
      await target.pressSequentially('S3cr3t!');
      await expect(target).toHaveAttribute('type', 'password');

      await toggle.click();
      await expect(target).toHaveAttribute('type', 'text');
      await expect(target).toHaveValue('S3cr3t!');
      await expect(target).toBeFocused();

      await toggle.click();
      await expect(target).toHaveAttribute('type', 'password');
      await expect(target).toBeFocused();
    });

    test('clicking the clear button on a real typed value empties it and synchronously restores focus', async ({
      page
    }) => {
      const target = inputEl(page, 'password-input');
      const clear = clearBtn(page, 'password-input');

      await target.click();
      await target.pressSequentially('hello');
      await expect(target).toHaveValue('hello');

      await clear.click();

      await expect(target).toHaveValue('');
      await expect(target).toBeFocused();
    });
  });

  test.describe('valueToDisplay renders a genuinely non-interactive display input', () => {
    test('the display-only input cannot be focused or edited', async ({
      page
    }) => {
      const target = displayEl(page, 'value-to-display-input');

      await expect(target).toBeDisabled();
      await expect(target).toHaveAttribute('readonly', '');
      await expect(target).toHaveValue('1,234,567');

      await target.click({ force: true });
      await expect(target).not.toBeFocused();

      await page.keyboard.type('X');
      await expect(target).toHaveValue('1,234,567');
    });
  });

  test.describe('Real ARIA id-relationships resolve to live DOM nodes', () => {
    test('a loading input has a real aria-describedby/hint relationship, real aria-busy, and a real progressbar', async ({
      page
    }) => {
      const target = inputEl(page, 'loading-input');
      const hint = page
        .getByTestId('loading-input')
        .getByTestId('cps-input-hint');
      const progressBar = page
        .getByTestId('loading-input')
        .getByTestId('cps-input-progress-bar');

      const describedBy = await target.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(hint).toHaveAttribute('id', describedBy!);
      await expect(hint).toHaveText(
        'This input is currently in a loading state'
      );

      await expect(target).toHaveAttribute('aria-busy', 'true');
      await expect(progressBar).toHaveAttribute('role', 'progressbar');
      await expect(progressBar).toBeVisible();
    });

    test('a real focus-then-blur on an empty required field wires a real error into aria-describedby', async ({
      page
    }) => {
      const target = inputEl(page, 'required-numeric-input');
      const error = page
        .getByTestId('required-numeric-input')
        .getByTestId('cps-input-error');

      await expect(target).not.toHaveAttribute('aria-describedby');

      await target.click();
      await page.keyboard.press('Tab');

      await expect(error).toHaveText('Field is required');
      const describedBy = await target.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(error).toHaveAttribute('id', describedBy!);
    });
  });

  test.describe('Real keyboard reachability of the clickable prefix icon', () => {
    test('the clickable prefix icon is a real Tab stop and receives visible focus', async ({
      page
    }) => {
      const target = prefixIconBtn(page, 'clickable-prefix-icon-input');

      await tabUntilFocused(page, target);

      await expect(target).toBeFocused();
    });
  });

  test.describe('hideDetails suppresses the hint/error row entirely', () => {
    test('no hint element is rendered when hideDetails is set', async ({
      page
    }) => {
      const hint = page
        .getByTestId('hide-details-input')
        .getByTestId('cps-input-hint');

      await expect(hint).toHaveCount(0);
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled input exposes its ariaLabel as the real accessible name', async ({
      page
    }) => {
      await expect(
        page.getByRole('textbox', { name: 'Search', exact: true })
      ).toBeVisible();
    });
  });
});
