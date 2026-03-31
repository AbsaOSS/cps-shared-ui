import { test, expect, type Page } from '@playwright/test';

async function selectDropdownOption(
  page: Page,
  testId: string,
  optionText: string
): Promise<void> {
  await page.getByTestId(testId).click();
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
      await expect(page.getByTestId('schedule-type-toggle')).toBeVisible();
      await expect(page.getByTestId('schedule-type-toggle')).toContainText(
        'Not set'
      );
    });
  });

  test.describe('Minutes Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Minutes')
        .click();
      await expect(page.getByTestId('minutes-config')).toBeVisible();
    });

    test('should generate cron expression for minute intervals', async ({
      page
    }) => {
      await selectDropdownOption(page, 'minutes-input', '5');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('0/5 * 1/1 * ? *');
    });

    test('should generate cron expression for 15-minute intervals', async ({
      page
    }) => {
      await selectDropdownOption(page, 'minutes-input', '15');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('0/15 * 1/1 * ? *');
    });
  });

  test.describe('Weekly Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Weekly')
        .click();
      await expect(page.getByTestId('weekly-config')).toBeVisible();
    });

    test('should generate correct cron for Monday and Wednesday', async ({
      page
    }) => {
      await page.getByTestId('weekly-WED').click();

      await expect(page.getByTestId('timezone-selector')).toBeVisible();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('0 0 ? * MON,WED *');
    });

    test('should generate correct cron for Friday only', async ({ page }) => {
      await page.getByTestId('weekly-MON').locator('label').click();
      await expect(
        page.getByTestId('weekly-MON').locator('input[type="checkbox"]')
      ).not.toBeChecked();
      await page.getByTestId('weekly-FRI').locator('label').click();

      await expect(page.getByTestId('timezone-selector')).toBeVisible();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('0 0 ? * FRI *');
    });
  });

  test.describe('Monthly Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Monthly')
        .click();
      await expect(page.getByTestId('monthly-config')).toBeVisible();
    });

    test('should generate correct cron for specific weekday (Second Tuesday of every month)', async ({
      page
    }) => {
      await selectDropdownOption(page, 'monthly-week-select', 'Second');
      await selectDropdownOption(page, 'monthly-weekday-select', 'Tuesday');
      await selectDropdownOption(
        page,
        'monthly-weekday-start-month-select',
        'April'
      );

      await expect(page.getByTestId('timezone-selector')).toBeVisible();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      const cronInput = page
        .getByTestId('advanced-cron-input')
        .locator('input');
      await expect(cronInput).toHaveValue(/30 9 \? 4\/4 TUE#2 \*/);
    });

    test('should generate correct cron for specific weekday (Fourth Sunday starting in October)', async ({
      page
    }) => {
      await selectDropdownOption(page, 'monthly-week-select', 'Fourth');
      await selectDropdownOption(page, 'monthly-weekday-select', 'Sunday');
      await selectDropdownOption(
        page,
        'monthly-weekday-start-month-select',
        'October'
      );

      const timepicker = page.getByTestId('monthly-weekday-timepicker');
      const minuteInput = timepicker.locator('input').nth(1);
      await minuteInput.clear();
      await minuteInput.fill('45');
      const hourInput = timepicker.locator('input').first();
      await hourInput.clear();
      await hourInput.fill('14');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      const cronInput = page
        .getByTestId('advanced-cron-input')
        .locator('input');
      await expect(cronInput).toHaveValue(/45 14 \? 10\/4 SUN#4 \*/);
    });
  });

  test.describe('Advanced Schedule - Direct Input', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(page.getByTestId('advanced-config')).toBeVisible();
    });

    test('should accept valid cron expressions', async ({ page }) => {
      const testCron = '0 30 14 ? * MON-FRI';

      const input = page
        .getByTestId('advanced-cron-input')
        .locator('input, textarea');
      await input.clear();
      await input.fill(testCron);

      await expect(input).toHaveValue(testCron);
    });

    test('should handle invalid cron expressions', async ({ page }) => {
      const input = page
        .getByTestId('advanced-cron-input')
        .locator('input, textarea');
      await input.clear();
      await input.fill('invalid cron');

      await expect(page.getByTestId('advanced-cron-input')).toBeVisible();

      await expect(
        page.locator('[data-testid="advanced-cron-input"].ng-invalid')
      ).toBeAttached();
    });
  });

  test.describe('State Management', () => {
    test('should maintain state when switching between schedule types', async ({
      page
    }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Weekly')
        .click();
      await page.getByTestId('weekly-MON').click();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input, textarea')
      ).not.toHaveValue('');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Weekly')
        .click();
      await expect(page.getByTestId('weekly-config')).toBeVisible();
    });

    test('should reset when selecting Not set', async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Weekly')
        .click();
      await page.getByTestId('weekly-MON').click();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Not set')
        .click();

      await expect(page.locator('cps-scheduler')).toBeVisible();
      await expect(page.getByTestId('schedule-type-toggle')).toContainText(
        'Not set'
      );
    });
  });

  test.describe('Timezone Functionality', () => {
    test('should allow timezone filtering and show autocomplete options', async ({
      page
    }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();

      const timezoneInput = page
        .getByTestId('timezone-select')
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
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();

      const timezoneInput = page
        .getByTestId('timezone-select')
        .locator('input');
      await timezoneInput.clear();
      await timezoneInput.fill('Europe/London');

      await expect(timezoneInput).toHaveValue('Europe/London');
      await expect(page.getByTestId('timezone-select')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle rapid type switching', async ({ page }) => {
      const types = ['Minutes', 'Hourly', 'Weekly', 'Advanced'] as const;

      for (const type of types) {
        await page.getByTestId('schedule-type-toggle').getByText(type).click();
      }

      await expect(page.getByTestId('advanced-config')).toBeVisible();
    });
  });
});
