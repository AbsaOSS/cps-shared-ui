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
    const closableChips = page
      .locator('cps-chip')
      .filter({ has: page.locator('.cps-chip-close-icon') });

    // Verify at least one closable chip exists
    await expect(closableChips.first()).toBeVisible();
    await expect(
      closableChips.first().locator('.cps-chip-close-icon')
    ).toBeVisible();
  });

  test('should display chip with icon', async ({ page }) => {
    // Find chips with icons
    const chipsWithIcon = page
      .locator('cps-chip')
      .filter({ has: page.locator('cps-icon') });

    // Verify at least one chip with icon exists
    await expect(chipsWithIcon.first()).toBeVisible();
    await expect(chipsWithIcon.first().locator('cps-icon')).toBeVisible();
  });

  test('should display multiple chips', async ({ page }) => {
    // Count chips on the page
    const chips = page.locator('cps-chip');
    const chipCount = await chips.count();

    expect(chipCount).toBeGreaterThan(0);
  });
});
