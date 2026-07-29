import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-file-upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/file-upload');
  });

  test.describe('Real file selection accepts a matching file', () => {
    test('a real file picked through the hidden input is uploaded and announced', async ({
      page
    }) => {
      const panel = example(page, 'extension-dependent-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image data')
      });

      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toBeVisible();
      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file-name')
      ).toHaveText('photo.jpg');
      await expect(panel.locator('.cps-sr-only')).toHaveText(
        'File successfully uploaded'
      );
    });
  });

  test.describe('Real extension validation rejects a mismatched file', () => {
    test('a real file with an unsupported extension shows a real error and is announced', async ({
      page
    }) => {
      const panel = example(page, 'extension-dependent-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('nope')
      });

      const errorBox = panel.getByTestId('cps-file-upload-error');
      await expect(errorBox).toBeVisible();
      await expect(errorBox).toContainText('Unsupported file type');
      await expect(panel.locator('.cps-sr-only')).toHaveText(
        'Unsupported file type'
      );
    });
  });

  test.describe('Real dragover visual state', () => {
    test('a real dragenter highlights the dropzone, and dragleave reverts it', async ({
      page
    }) => {
      const panel = example(page, 'extension-dependent-file-upload');
      const dropzone = panel.getByTestId('cps-file-upload-dropzone');

      await expect(dropzone).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

      await dropzone.dispatchEvent('dragenter');
      await expect(dropzone).toHaveCSS(
        'background-color',
        'rgb(239, 228, 231)'
      );

      await dropzone.dispatchEvent('dragleave');
      await expect(dropzone).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    });
  });

  test.describe('Real disabled dropzone blocks interaction', () => {
    test('the disabled dropzone is genuinely disabled and blocks real pointer interaction', async ({
      page
    }) => {
      const panel = example(page, 'disabled-file-upload');

      await expect(
        panel.getByTestId('cps-file-upload-dropzone')
      ).toBeDisabled();
      await expect(panel.getByTestId('cps-file-upload')).toHaveCSS(
        'pointer-events',
        'none'
      );
    });
  });

  test.describe('Real focus restoration after removing an uploaded file', () => {
    test('clicking remove restores real focus to the dropzone', async ({
      page
    }) => {
      const panel = example(page, 'extension-dependent-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('data')
      });
      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toBeVisible();

      const dropzone = panel.getByTestId('cps-file-upload-dropzone');
      await panel.getByTestId('cps-file-upload-remove-btn').click();

      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toHaveCount(0);
      await expect(dropzone).toBeFocused();
    });
  });

  test.describe('Real async processing pipeline reaches its true completion', () => {
    test('the real progress bar shows while processing and the real success outcome lands after the real async callback resolves', async ({
      page
    }) => {
      const panel = example(page, 'extra-info-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('data')
      });

      const progressBar = panel.getByTestId('cps-file-upload-progress-bar');
      const dropzone = panel.getByTestId('cps-file-upload-dropzone');
      await expect(progressBar).toBeVisible();
      await expect(dropzone).toHaveCSS('pointer-events', 'none');
      await expect(panel.locator('.cps-sr-only')).toHaveText(
        'File is being processed'
      );

      await expect(progressBar).toBeHidden({ timeout: 8000 });
      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toBeVisible();
      await expect(dropzone).not.toHaveCSS('pointer-events', 'none');
    });
  });

  test.describe('Real cancel stops a real pending async operation', () => {
    test('cancelling before the real callback resolves removes the file well before the delay elapses', async ({
      page
    }) => {
      const panel = example(page, 'extra-info-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('data')
      });

      const cancelBtn = panel.getByTestId('cps-file-upload-cancel-btn');
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();

      const dropzone = panel.getByTestId('cps-file-upload-dropzone');
      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toHaveCount(0, { timeout: 1000 });
      await expect(dropzone).toBeFocused();
    });
  });

  test.describe('Real async processing pipeline reaches its true failure outcome', () => {
    test('a real failing processing callback shows the real failure error and removes the file', async ({
      page
    }) => {
      const panel = example(page, 'failing-processing-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('data')
      });

      const progressBar = panel.getByTestId('cps-file-upload-progress-bar');
      await expect(progressBar).toBeVisible();

      await expect(progressBar).toBeHidden({ timeout: 3000 });
      const errorBox = panel.getByTestId('cps-file-upload-error');
      await expect(errorBox).toBeVisible();
      await expect(errorBox).toContainText('File processing failed');
      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toHaveCount(0);
      await expect(panel.locator('.cps-sr-only')).toHaveText(
        'File processing failed'
      );
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('a custom ariaLabel exposes the real accessible name on the dropzone', async ({
      page
    }) => {
      const panel = example(page, 'extra-info-file-upload');

      await expect(
        panel.getByRole('button', { name: 'Upload pictures or PDFs' })
      ).toBeVisible();
    });
  });

  test.describe('Real tooltip on hover', () => {
    test('hovering the uploaded file name shows the real tooltip with the full file name', async ({
      page
    }) => {
      const panel = example(page, 'extra-info-file-upload');
      const input = panel.getByTestId('cps-file-upload-input');

      await input.setInputFiles({
        name: 'a-fairly-long-file-name-for-tooltip.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('data')
      });
      await expect(
        panel.getByTestId('cps-file-upload-uploaded-file')
      ).toBeVisible();

      await panel.getByTestId('cps-file-upload-uploaded-file-name').hover();

      const tooltip = page.locator('.cps-tooltip');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveText(
        'a-fairly-long-file-name-for-tooltip.jpg'
      );
    });
  });
});
