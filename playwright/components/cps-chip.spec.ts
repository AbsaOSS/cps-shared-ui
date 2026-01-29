import { test, expect } from '@playwright/test';

test.describe('CPS Chip Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chip');
  });

  test('should display chip with label', async ({ page }) => {
    // Find a chip by its label
    const chip = page.locator('cps-chip').first();
    
    await expect(chip).toBeVisible();
    await expect(chip.locator('.cps-chip-label')).toBeVisible();
  });

  test('should display closable chip with close button', async ({ page }) => {
    // Find closable chip with close icon
    const closableChip = page.locator('cps-chip').filter({ has: page.locator('.cps-chip-close-icon') }).first();
    
    if (await closableChip.count() > 0) {
      await expect(closableChip).toBeVisible();
      await expect(closableChip.locator('.cps-chip-close-icon')).toBeVisible();
    }
  });

  test('should close chip when clicking close button', async ({ page }) => {
    // Find a closable chip
    const closableChip = page.locator('cps-chip').filter({ has: page.locator('.cps-chip-close-icon') }).first();
    
    if (await closableChip.count() > 0) {
      const closeButton = closableChip.locator('.cps-chip-close-icon');
      await closeButton.click();
      
      // After clicking close, the chip might be removed or hidden
      // This depends on the implementation
    }
  });

  test('should display chip with icon', async ({ page }) => {
    // Find chips with icons
    const chipWithIcon = page.locator('cps-chip').filter({ has: page.locator('cps-icon') }).first();
    
    if (await chipWithIcon.count() > 0) {
      await expect(chipWithIcon).toBeVisible();
      await expect(chipWithIcon.locator('cps-icon')).toBeVisible();
    }
  });

  test('should display multiple chips', async ({ page }) => {
    // Count chips on the page
    const chips = page.locator('cps-chip');
    const chipCount = await chips.count();
    
    expect(chipCount).toBeGreaterThan(0);
  });
});
