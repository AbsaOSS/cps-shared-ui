import { readFileSync } from 'node:fs';
import { type Page, expect, test } from '@playwright/test';

/**
 * The telemetry diagnostics popup (ngx-ui-watchtower/diagnostics), driven the
 * way a developer uses it: the real shortcut, the real app generating
 * events beside the non-modal popup, then filter, download, clear, close.
 */

// Active on every platform, so one combination works in all browsers here.
const SHORTCUT = 'Control+Alt+Shift+Digit8';

const popup = (page: Page) => page.locator('uwt-diagnostics-dialog');
const section = (page: Page, title: string) =>
  page.locator('uwt-diagnostics-section', {
    has: page.locator('[data-testid="cps-expansion-panel-title"]', {
      hasText: title
    })
  });
const rows = (page: Page, title: string) =>
  section(page, title).locator('td.uwt-diagnostics-section__time');

async function openPopup(page: Page) {
  await page.keyboard.press(SHORTCUT);
  await expect(popup(page)).toBeVisible();
}

test.describe('Telemetry diagnostics popup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#main-content');
  });

  test('opens on the shortcut, empty, with focus in the search field', async ({
    page
  }) => {
    // Activity before opening must not appear: history starts at open.
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();

    await openPopup(page);

    await expect(page.getByText('Capturing from now.')).toBeVisible();
    await expect(rows(page, 'BI telemetry')).toHaveCount(0);
    await expect(
      page.getByRole('textbox', { name: 'Search BI telemetry events' })
    ).toBeFocused();
  });

  test('shows events from all three concerns live, while the app stays usable', async ({
    page
  }) => {
    await openPopup(page);

    // The popup is non-modal: these are ordinary clicks on the app.
    await page.locator('a[href="/button"]').first().click();
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();

    await expect(rows(page, 'Scenario telemetry').first()).toBeVisible();
    await expect(section(page, 'Scenario telemetry')).toContainText(
      'route-navigation'
    );
    await expect(section(page, 'BI telemetry')).toContainText(
      'sidebar_toggled'
    );
  });

  test('shows log records as they are handed to the log provider', async ({
    page,
    browserName
  }) => {
    test.skip(
      browserName === 'webkit',
      "WebKit grants clipboard writes, so the app's copy-failure log can't be triggered"
    );
    await page.locator('a[href="/button"]').first().click();
    await page.waitForSelector('app-code-example');
    await openPopup(page);

    // Clipboard access is not granted, so copying fails and the app logs a
    // warning through its `docs` logger. The button can sit under the
    // popup, so it is activated directly rather than by pointer position.
    await page
      .locator('app-code-example button:has-text("HTML")')
      .first()
      .dispatchEvent('click');
    await page
      .locator('.code-example__copy:visible button')
      .first()
      .dispatchEvent('click');

    const logging = section(page, 'Logging');
    await expect(logging).toContainText('Failed to copy code to clipboard');
    await expect(logging).toContainText('docs');
    await expect(logging).toContainText('warn');
  });

  test('shows the full payload of an expanded row', async ({ page }) => {
    await openPopup(page);
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();

    const bi = section(page, 'BI telemetry');
    await bi.getByRole('button', { name: 'Expand row' }).first().click();

    const payload = bi.locator('pre').first();
    await expect(payload).toBeVisible();
    expect(JSON.parse((await payload.textContent()) ?? '')).toMatchObject({
      eventName: 'sidebar_toggled',
      application: 'composition'
    });
  });

  test('filters one section by any field, leaving the others alone', async ({
    page
  }) => {
    await openPopup(page);
    await page.locator('a[href="/button"]').first().click();
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await expect(rows(page, 'BI telemetry')).toHaveCount(1);
    await expect(rows(page, 'Scenario telemetry').first()).toBeVisible();

    await page
      .getByRole('textbox', { name: 'Search Scenario telemetry events' })
      .fill('no scenario has this text');

    await expect(rows(page, 'Scenario telemetry')).toHaveCount(0);
    await expect(
      section(page, 'Scenario telemetry').locator(
        '[data-testid="cps-expansion-panel-title"]'
      )
    ).toContainText(' of ');
    // BI keeps its own, empty filters.
    await expect(rows(page, 'BI telemetry')).toHaveCount(1);
  });

  test("downloads one section's events as JSON", async ({ page }) => {
    await openPopup(page);
    await page.locator('a[href="/button"]').first().click();
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await expect(rows(page, 'BI telemetry')).toHaveCount(1);
    // A filter hiding BI's events must not remove them from BI's download.
    await page
      .getByRole('textbox', { name: 'Search BI telemetry events' })
      .fill('no event has this text');
    await expect(rows(page, 'BI telemetry')).toHaveCount(0);

    const download = page.waitForEvent('download');
    await page
      .getByRole('button', { name: /^Download BI telemetry events/ })
      .click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      /^ngx-ui-watchtower-diagnostics-composition-bi-\d{8}-\d{6}\.json$/
    );

    const doc = JSON.parse(readFileSync(await file.path(), 'utf8'));
    expect(doc.format).toBe('ngx-ui-watchtower-diagnostics');
    expect(doc.section).toBe('bi');
    expect(doc.app.application).toBe('composition');
    expect(doc.activeFilters.text).toBe('no event has this text');
    const kinds = doc.events.map((e: { kind: string }) => e.kind);
    expect(kinds).toEqual(['bi']);
  });

  test('clears history but keeps capturing', async ({ page }) => {
    await openPopup(page);
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await expect(rows(page, 'BI telemetry')).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear captured events' }).click();
    await expect(rows(page, 'BI telemetry')).toHaveCount(0);

    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await expect(rows(page, 'BI telemetry')).toHaveCount(1);
  });

  test('returns focus to the popup, closes, and starts empty when reopened', async ({
    page
  }) => {
    await openPopup(page);
    await page
      .getByRole('button', { name: 'Toggle navigation sidebar' })
      .click();
    await expect(rows(page, 'BI telemetry')).toHaveCount(1);

    // Focus is on the app: the shortcut brings it back to the popup.
    await page.keyboard.press(SHORTCUT);
    await expect(
      page.getByRole('textbox', { name: 'Search BI telemetry events' })
    ).toBeFocused();

    // Focus is in the popup: the shortcut closes it.
    await page.keyboard.press(SHORTCUT);
    await expect(popup(page)).toHaveCount(0);

    await openPopup(page);
    await expect(rows(page, 'BI telemetry')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(popup(page)).toHaveCount(0);
  });
});
