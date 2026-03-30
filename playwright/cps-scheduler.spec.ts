import { test, expect, type Page } from '@playwright/test';

async function selectDropdownOption(
  page: Page,
  selector: string,
  optionText: string
): Promise<void> {
  await page.locator(selector).click();
  await page.locator('body').getByText(optionText, { exact: true }).click();
}

test.describe('CPS Scheduler Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scheduler/examples');
    await expect(page.locator('cps-scheduler')).toBeVisible();
  });

  test.describe('Core Functionality', () => {
    test('should display scheduler with proper initialization', async ({
      page
    }) => {
      await expect(
        page.locator('[data-cy="schedule-type-toggle"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-cy="schedule-type-toggle"]')
      ).toContainText('Not set');
    });
  });

  test.describe('Minutes Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Minutes')
        .click();
      await expect(page.locator('[data-cy="minutes-config"]')).toBeVisible();
    });

    test('should generate cron expression for minute intervals', async ({
      page
    }) => {
      await selectDropdownOption(page, '[data-cy="minutes-input"]', '5');

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      await expect(
        page.locator('[data-cy="advanced-cron-input"]').locator('input')
      ).toHaveValue('0/5 * 1/1 * ? *');
    });

    test('should generate cron expression for 15-minute intervals', async ({
      page
    }) => {
      await selectDropdownOption(page, '[data-cy="minutes-input"]', '15');

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      await expect(
        page.locator('[data-cy="advanced-cron-input"]').locator('input')
      ).toHaveValue('0/15 * 1/1 * ? *');
    });
  });

  test.describe('Weekly Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Weekly')
        .click();
      await expect(page.locator('[data-cy="weekly-config"]')).toBeVisible();
    });

    test('should generate correct cron for Monday and Wednesday', async ({
      page
    }) => {
      await page.locator('[data-cy="weekly-MON"]').click();
      await page.locator('[data-cy="weekly-WED"]').click();

      await expect(page.locator('[data-cy="timezone-selector"]')).toBeVisible();

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      await expect(
        page.locator('[data-cy="advanced-cron-input"]').locator('input')
      ).toHaveValue('0 0 ? * MON,WED *');
    });

    test('should generate correct cron for Friday only', async ({ page }) => {
      await page
        .locator('[data-cy="weekly-MON"]')
        .locator('input[type="checkbox"]')
        .uncheck({ force: true });

      await page
        .locator('[data-cy="weekly-FRI"]')
        .locator('input[type="checkbox"]')
        .check({ force: true });

      await expect(page.locator('[data-cy="timezone-selector"]')).toBeVisible();

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      await expect(
        page.locator('[data-cy="advanced-cron-input"]').locator('input')
      ).toHaveValue('0 0 ? * FRI *');
    });
  });

  test.describe('Monthly Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Monthly')
        .click();
      await expect(page.locator('[data-cy="monthly-config"]')).toBeVisible();
    });

    test('should generate correct cron for specific weekday (Second Tuesday of every month)', async ({
      page
    }) => {
      await selectDropdownOption(
        page,
        '[data-cy="monthly-week-select"]',
        'Second'
      );
      await selectDropdownOption(
        page,
        '[data-cy="monthly-weekday-select"]',
        'Tuesday'
      );
      await selectDropdownOption(
        page,
        '[data-cy="monthly-weekday-start-month-select"]',
        'April'
      );

      await expect(page.locator('[data-cy="timezone-selector"]')).toBeVisible();

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      const cronInput = page
        .locator('[data-cy="advanced-cron-input"]')
        .locator('input');
      await expect(cronInput).toHaveValue(/30 9 \? 4\/4 TUE#2 \*/);
    });

    test('should generate correct cron for specific weekday (Fourth Sunday starting in October)', async ({
      page
    }) => {
      await selectDropdownOption(
        page,
        '[data-cy="monthly-week-select"]',
        'Fourth'
      );
      await selectDropdownOption(
        page,
        '[data-cy="monthly-weekday-select"]',
        'Sunday'
      );
      await selectDropdownOption(
        page,
        '[data-cy="monthly-weekday-start-month-select"]',
        'October'
      );

      const timepicker = page.locator('[data-cy="monthly-weekday-timepicker"]');
      const minuteInput = timepicker.locator('input').nth(1);
      await minuteInput.clear();
      await minuteInput.fill('45');
      const hourInput = timepicker.locator('input').first();
      await hourInput.clear();
      await hourInput.fill('14');

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      const cronInput = page
        .locator('[data-cy="advanced-cron-input"]')
        .locator('input');
      await expect(cronInput).toHaveValue(/45 14 \? 10\/4 SUN#4 \*/);
    });
  });

  test.describe('Advanced Schedule - Direct Input', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      await expect(page.locator('[data-cy="advanced-config"]')).toBeVisible();
    });

    test('should accept valid cron expressions', async ({ page }) => {
      const testCron = '0 30 14 ? * MON-FRI';

      const input = page
        .locator('[data-cy="advanced-cron-input"]')
        .locator('input, textarea');
      await input.clear();
      await input.fill(testCron);

      await expect(input).toHaveValue(testCron);
    });

    test('should handle invalid cron expressions', async ({ page }) => {
      const input = page
        .locator('[data-cy="advanced-cron-input"]')
        .locator('input, textarea');
      await input.clear();
      await input.fill('invalid cron');

      await expect(
        page.locator('[data-cy="advanced-cron-input"]')
      ).toBeVisible();

      await expect(page.locator('.ng-invalid, .error')).toBeAttached();
    });
  });

  test.describe('State Management', () => {
    test('should maintain state when switching between schedule types', async ({
      page
    }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Weekly')
        .click();
      await page.locator('[data-cy="weekly-MON"]').click();

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();
      await expect(
        page
          .locator('[data-cy="advanced-cron-input"]')
          .locator('input, textarea')
      ).not.toHaveValue('');

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Weekly')
        .click();
      await expect(page.locator('[data-cy="weekly-config"]')).toBeVisible();
    });

    test('should reset when selecting Not set', async ({ page }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Weekly')
        .click();
      await page.locator('[data-cy="weekly-MON"]').click();

      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Not set')
        .click();

      await expect(page.locator('cps-scheduler')).toBeVisible();
      await expect(
        page.locator('[data-cy="schedule-type-toggle"]')
      ).toContainText('Not set');
    });
  });

  test.describe('Timezone Functionality', () => {
    test('should allow timezone filtering and show autocomplete options', async ({
      page
    }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();

      const timezoneInput = page
        .locator('[data-cy="timezone-select"]')
        .locator('input');
      await timezoneInput.clear();
      await timezoneInput.fill('UTC');

      await expect(
        page.locator('.cps-autocomplete-options, .cps-autocomplete-option')
      ).toBeAttached();

      await expect(timezoneInput).toHaveValue('UTC');
    });

    test('should maintain typed text in timezone input', async ({ page }) => {
      await page
        .locator('[data-cy="schedule-type-toggle"]')
        .getByText('Advanced')
        .click();

      const timezoneInput = page
        .locator('[data-cy="timezone-select"]')
        .locator('input');
      await timezoneInput.clear();
      await timezoneInput.fill('Europe/London');

      await expect(timezoneInput).toHaveValue('Europe/London');
      await expect(page.locator('[data-cy="timezone-select"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle rapid type switching', async ({ page }) => {
      const types = ['Minutes', 'Hourly', 'Weekly', 'Advanced'] as const;

      for (const type of types) {
        await page
          .locator('[data-cy="schedule-type-toggle"]')
          .getByText(type)
          .click();
      }

      await expect(page.locator('[data-cy="advanced-config"]')).toBeVisible();
    });
  });
});
