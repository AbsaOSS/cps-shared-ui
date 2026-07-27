import { test, expect, type Page, type Locator } from '@playwright/test';

const LOADING_TOGGLE_TIMEOUT_MS = 4000;

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/button');
  });

  test.describe('Disabled state', () => {
    test('cannot be focused and blocks pointer events', async ({ page }) => {
      const button = example(page, 'solid-disabled-button').getByTestId(
        'cps-button'
      );

      await expect(button).toBeDisabled();
      await expect(button).toHaveCSS('pointer-events', 'none');

      await button.focus();
      await expect(button).not.toBeFocused();
    });
  });

  test.describe('Enter/Space keyboard activation', () => {
    test('Enter shows the key-active class while held and fires a real click', async ({
      page
    }) => {
      const button = example(page, 'native-types-plain-button').getByTestId(
        'cps-button'
      );
      await button.focus();

      await page.keyboard.down('Enter');
      await expect(button).toHaveClass(/cps-button--key-active/);
      await page.keyboard.up('Enter');
      await expect(button).not.toHaveClass(/cps-button--key-active/);

      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Plain button clicked (no form action).'
      );
    });

    test('Space fires a real click via native button semantics without the key-active class', async ({
      page
    }) => {
      const button = example(page, 'native-types-plain-button').getByTestId(
        'cps-button'
      );
      await button.focus();

      await page.keyboard.down(' ');
      await expect(button).not.toHaveClass(/cps-button--key-active/);
      await page.keyboard.up(' ');

      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Plain button clicked (no form action).'
      );
      await expect(button).not.toHaveClass(/cps-button--key-active/);
    });
  });

  test.describe('Loading state - real timing and interaction gating', () => {
    test('a real click starts loading and hides content behind the spinner', async ({
      page
    }) => {
      const wrapper = example(page, 'misc-loading-toggle-button');
      const button = wrapper.getByTestId('cps-button');

      await wrapper.click();

      await expect(button).toHaveAttribute('aria-busy', 'true');
      await expect(
        wrapper
          .getByTestId('cps-button-spinner')
          .locator('cps-progress-circular')
      ).toBeVisible();
      await expect(wrapper.getByTestId('cps-button-content')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      await expect(button).toHaveCSS('pointer-events', 'none');
    });

    test('Enter while loading does not throw and the button stays loading', async ({
      page
    }) => {
      const wrapper = example(page, 'misc-loading-toggle-button');
      const button = wrapper.getByTestId('cps-button');

      await wrapper.click();
      await expect(button).toHaveAttribute('aria-busy', 'true');

      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toHaveAttribute('aria-busy', 'true');
    });

    test('loading auto-clears and the button becomes interactive again', async ({
      page
    }) => {
      const wrapper = example(page, 'misc-loading-toggle-button');
      const button = wrapper.getByTestId('cps-button');

      await wrapper.click();
      await expect(button).toHaveAttribute('aria-busy', 'true');

      await expect(button).not.toHaveAttribute('aria-busy', 'true', {
        timeout: LOADING_TOGGLE_TIMEOUT_MS
      });
      await expect(button).toHaveCSS('pointer-events', /^(?!none$).*/);

      await wrapper.click();
      await expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  test.describe('Icon-only buttons', () => {
    test('expose their aria-label as the real accessible name', async ({
      page
    }) => {
      await expect(page.getByRole('button', { name: 'Like' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'View' })).toBeVisible();
    });
  });

  test.describe('Custom sizing - real rendered layout', () => {
    test('renders the configured width and height', async ({ page }) => {
      const button = example(page, 'misc-custom-size-button').getByTestId(
        'cps-button'
      );
      const box = await button.boundingBox();

      expect(box?.width).toBeGreaterThan(250);
      expect(box?.width).toBeLessThan(350);
      expect(box?.height).toBeGreaterThan(50);
      expect(box?.height).toBeLessThan(70);
      await expect(button).not.toHaveCSS('border-radius', '4px');
    });

    test('a full-width button tracks its container rather than staying intrinsic width', async ({
      page
    }) => {
      const button = example(page, 'misc-block-button').getByTestId(
        'cps-button'
      );
      const box = await button.boundingBox();

      expect(box?.width).toBeGreaterThan(600);
    });
  });

  test.describe('Native form integration', () => {
    test('a plain button never submits, regardless of field validity', async ({
      page
    }) => {
      await expect(page).toHaveURL(/\/button\/examples$/);
      const urlBefore = page.url();

      await example(page, 'native-types-plain-button').click();

      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Plain button clicked (no form action).'
      );
      expect(page.url()).toBe(urlBefore);
    });

    test('submitting with an empty required field shows an invalid message and does not navigate', async ({
      page
    }) => {
      await expect(page).toHaveURL(/\/button\/examples$/);
      const urlBefore = page.url();

      await example(page, 'native-types-submit-button').click();

      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Form is invalid.'
      );
      expect(page.url()).toBe(urlBefore);
    });

    test('submitting with the field filled shows the submitted value', async ({
      page
    }) => {
      const form = page.getByTestId('native-types-form');
      await form.getByRole('textbox', { name: 'Name' }).fill('Ada');

      await example(page, 'native-types-submit-button').click();

      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Form submitted with name: "Ada"'
      );
    });

    test('reset clears both the field and the message via the native reset event', async ({
      page
    }) => {
      const form = page.getByTestId('native-types-form');
      const nameInput = form.getByRole('textbox', { name: 'Name' });

      await nameInput.fill('Ada');
      await example(page, 'native-types-submit-button').click();
      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Form submitted with name: "Ada"'
      );

      await example(page, 'native-types-reset-button').click();

      await expect(nameInput).toHaveValue('');
      await expect(page.getByTestId('native-types-message')).toHaveText('');
    });

    test('pressing Enter in the field implicitly submits the form', async ({
      page
    }) => {
      const form = page.getByTestId('native-types-form');
      const nameInput = form.getByRole('textbox', { name: 'Name' });

      await nameInput.fill('Grace');
      await nameInput.press('Enter');

      await expect(page.getByTestId('native-types-message')).toHaveText(
        'Form submitted with name: "Grace"'
      );
    });
  });
});
