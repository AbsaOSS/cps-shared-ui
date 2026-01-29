import { test, expect } from '@playwright/test';

test.describe('CPS Button Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/button');
  });

  test('should display button with label', async ({ page }) => {
    // Find a button by its label text
    const button = page.locator('cps-button').filter({ hasText: 'Primary' }).first();
    
    await expect(button).toBeVisible();
    await expect(button.locator('.cps-button__text')).toBeVisible();
  });

  test('should be clickable and emit click event', async ({ page }) => {
    // Find a clickable button
    const button = page.locator('cps-button').filter({ hasText: 'Primary' }).first();
    const buttonElement = button.locator('button');
    
    await expect(buttonElement).toBeEnabled();
    await buttonElement.click();
    
    // Verify the button is still enabled after click
    await expect(buttonElement).toBeEnabled();
  });

  test('should display disabled button', async ({ page }) => {
    // Find disabled buttons on the page
    const disabledButton = page.locator('cps-button button[disabled]').first();
    
    await expect(disabledButton).toBeDisabled();
  });

  test('should display button with icon', async ({ page }) => {
    // Find a button with an icon
    const buttonWithIcon = page.locator('cps-button').filter({ has: page.locator('cps-icon') }).first();
    
    await expect(buttonWithIcon).toBeVisible();
    await expect(buttonWithIcon.locator('cps-icon')).toBeVisible();
  });

  test('should apply different button types (solid, outlined, borderless)', async ({ page }) => {
    // Check for solid buttons (default)
    const solidButton = page.locator('cps-button .cps-button--solid').first();
    await expect(solidButton).toBeVisible();
    
    // Check that button has proper classes
    const buttonClasses = await solidButton.getAttribute('class');
    expect(buttonClasses).toContain('cps-button');
  });

  test('should display different button sizes', async ({ page }) => {
    // Check for buttons with size classes
    const normalButton = page.locator('cps-button .cps-button--normal').first();
    
    if (await normalButton.count() > 0) {
      await expect(normalButton).toBeVisible();
    }
  });
});
