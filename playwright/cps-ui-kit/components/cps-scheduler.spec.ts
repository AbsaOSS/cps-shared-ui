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

    test('should generate cron expression for minute intervals and emit cronChange', async ({
      page
    }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => consoleLogs.push(msg.text()));

      await selectDropdownOption(page, 'minutes-input', '5');

      await expect
        .poll(() => consoleLogs)
        .toContainEqual('CRON expression 0/5 * 1/1 * ? *');

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

  test.describe('Hourly Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Hourly')
        .click();
      await expect(page.getByTestId('hourly-config')).toBeVisible();
    });

    test('should generate correct cron for every 3 hours at minute 30', async ({
      page
    }) => {
      await selectDropdownOption(page, 'hourly-hours-input', '3');
      await selectDropdownOption(page, 'hourly-minutes-input', '30');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('30 0/3 1/1 * ? *');
    });
  });

  test.describe('Daily Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('schedule-type-toggle').getByText('Daily').click();
      await expect(page.getByTestId('daily-config')).toBeVisible();
    });

    test('should generate correct cron for every 3 days at a chosen time', async ({
      page
    }) => {
      await selectDropdownOption(page, 'daily-every-days-input', '3');

      const timepicker = page.getByTestId('daily-timepicker');
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
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('45 14 1/3 * ? *');
    });

    test('should generate correct cron for every working day at a chosen time', async ({
      page
    }) => {
      await page
        .getByTestId('daily-subtab-everyWeekDay')
        .locator('input[type="radio"]')
        .click();

      const timepicker = page.getByTestId('daily-weekday-timepicker');
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
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('45 14 ? * MON-FRI *');
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

    test('should generate correct cron for a specific day of the month, and add a nearest-weekday suffix when toggled', async ({
      page
    }) => {
      await page
        .getByTestId('monthly-subtab-specificDay')
        .locator('input[type="radio"]')
        .click();

      await selectDropdownOption(page, 'monthly-day-select', '5th day');
      await selectDropdownOption(page, 'monthly-months-input', '2');

      const timepicker = page.getByTestId('monthly-day-timepicker');
      const minuteInput = timepicker.locator('input').nth(1);
      await minuteInput.clear();
      await minuteInput.fill('30');
      const hourInput = timepicker.locator('input').first();
      await hourInput.clear();
      await hourInput.fill('10');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      const cronInput = page
        .getByTestId('advanced-cron-input')
        .locator('input');
      await expect(cronInput).toHaveValue('30 10 5 1/2 ? *');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Monthly')
        .click();
      await page.getByTestId('monthly-weekday-toggle').locator('label').click();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(cronInput).toHaveValue('30 10 5W 1/2 ? *');
    });
  });

  test.describe('Yearly Schedule - Cron Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Yearly')
        .click();
      await expect(page.getByTestId('yearly-config')).toBeVisible();
    });

    test('should generate correct cron for a specific month and day (March 15th)', async ({
      page
    }) => {
      await selectDropdownOption(page, 'yearly-month-select', 'March');
      await selectDropdownOption(page, 'yearly-day-select', '15th day');

      const timepicker = page.getByTestId('yearly-specific-day-timepicker');
      const minuteInput = timepicker.locator('input').nth(1);
      await minuteInput.clear();
      await minuteInput.fill('00');
      const hourInput = timepicker.locator('input').first();
      await hourInput.clear();
      await hourInput.fill('9');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('0 9 15 3 ? *');
    });

    test('should add a nearest-weekday suffix to a specific month and day when toggled', async ({
      page
    }) => {
      await selectDropdownOption(page, 'yearly-month-select', 'March');
      await selectDropdownOption(page, 'yearly-day-select', '15th day');

      const timepicker = page.getByTestId('yearly-specific-day-timepicker');
      const minuteInput = timepicker.locator('input').nth(1);
      await minuteInput.clear();
      await minuteInput.fill('00');
      const hourInput = timepicker.locator('input').first();
      await hourInput.clear();
      await hourInput.fill('9');

      await page.getByTestId('yearly-weekday-toggle').locator('label').click();

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('0 9 15W 3 ? *');
    });

    test('should generate correct cron for a specific weekday in a month (Second Tuesday of June)', async ({
      page
    }) => {
      await page
        .getByTestId('yearly-subtab-specificMonthWeek')
        .locator('input[type="radio"]')
        .click();

      await selectDropdownOption(page, 'yearly-week-select', 'Second');
      await selectDropdownOption(page, 'yearly-weekday-select', 'Tuesday');
      await selectDropdownOption(
        page,
        'yearly-specific-week-month-select',
        'June'
      );

      const timepicker = page.getByTestId('yearly-specific-week-timepicker');
      const minuteInput = timepicker.locator('input').nth(1);
      await minuteInput.clear();
      await minuteInput.fill('15');
      const hourInput = timepicker.locator('input').first();
      await hourInput.clear();
      await hourInput.fill('8');

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();
      await expect(
        page.getByTestId('advanced-cron-input').locator('input')
      ).toHaveValue('15 8 ? 6 TUE#2 *');
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

      await expect(
        page.getByTestId('advanced-cron-input').getByTestId('cps-input-error')
      ).toHaveText(/Invalid cron expression format/);
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

    test('should select a real timezone option and emit the change', async ({
      page
    }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => consoleLogs.push(msg.text()));

      await page
        .getByTestId('schedule-type-toggle')
        .getByText('Advanced')
        .click();

      const timezoneInput = page
        .getByTestId('timezone-select')
        .locator('input');
      await timezoneInput.clear();
      await timezoneInput.fill('London');

      await page
        .getByTestId('cps-autocomplete-listbox')
        .getByText('Europe/London', { exact: true })
        .click();

      await expect(
        page
          .getByTestId('timezone-select')
          .getByTestId('cps-autocomplete-selected-value')
      ).toHaveText('Europe/London');

      await expect
        .poll(() => consoleLogs)
        .toContainEqual('Time zone Europe/London');
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
