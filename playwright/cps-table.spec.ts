import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('cps-table page', () => {
  test.describe('export to xlsx', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/table');
    });

    test('should properly download valid xlsx', async ({ page }) => {
      await page.getByText('Table 6').click({ force: true });
      await page.locator('.cps-table-tbar-export-btn cps-icon').click();

      const downloadPromise = page.waitForEvent('download');
      await page.getByText('XLSX').click();
      const download = await downloadPromise;

      const downloadedPath = await download.path();
      expect(downloadedPath).toBeTruthy();

      const downloadedContent = fs.readFileSync(downloadedPath!);
      const fixturePath = path.join(
        __dirname,
        'fixtures',
        'table_6_fixture.xlsx'
      );
      const fixtureContent = fs.readFileSync(fixturePath);

      expect(downloadedContent.equals(fixtureContent)).toBe(true);
    });
  });
});
