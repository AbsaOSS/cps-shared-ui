import { test, expect, type Page, type Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

test.describe('cps-table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/table');
    await page.addStyleTag({
      content: '* { scroll-behavior: auto !important; }'
    });
  });

  test.describe('Real sort on the default-rendered header (Table 2)', () => {
    test('clicking a sortable+filterable header cycles real aria-sort through ascending/descending/none', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 2', exact: true }).click();
      const wrapper = example(page, 'table-2-virtual-default-render');
      const header = wrapper.getByTestId('cps-table-header-cell-a');
      await expect(header).toBeVisible();

      await expect(header).toHaveAttribute('aria-sort', 'none');
      await header.click({ position: { x: 5, y: 5 } });
      await expect(header).toHaveAttribute('aria-sort', 'ascending');
      await header.click({ position: { x: 5, y: 5 } });
      await expect(header).toHaveAttribute('aria-sort', 'descending');
      await header.click({ position: { x: 5, y: 5 } });
      await expect(header).toHaveAttribute('aria-sort', 'none');
    });
  });

  test.describe('Real multi-sort badge (Table 1)', () => {
    test('sorting a second column shows the real order-2 badge on its sort icon', async ({
      page
    }) => {
      const wrapper = example(page, 'table-1-paginated-filters');
      const headerA = wrapper.locator('th[cpstcolsortable="a"]');
      const headerC = wrapper.locator('th[cpstcolsortable="c"]');

      await headerA.click({ position: { x: 5, y: 5 } });
      await headerC.click({ position: { x: 5, y: 5 } });

      await expect(wrapper.getByTestId('cps-table-sort-icon-c')).toHaveText(
        '2'
      );
      await expect(headerA).toHaveAttribute('aria-sort', 'ascending');
      await expect(headerC).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  test.describe('Real per-column filtering (Table 1)', () => {
    test('a text filter real-narrows the rendered rows', async ({ page }) => {
      const wrapper = example(page, 'table-1-paginated-filters');

      await wrapper.getByTestId('cps-table-col-filter-btn-a').click();
      const constraint = page.getByTestId(
        'cps-table-col-filter-constraint-a-0'
      );
      await expect(constraint).toBeVisible();
      await constraint.locator('input').first().fill('a13');
      await page.getByTestId('cps-table-col-filter-apply-btn').click();

      await expect(wrapper.locator('tbody tr')).toHaveCount(1);
      await expect(wrapper.locator('tbody tr')).toHaveText(/A13/);
    });
  });

  test.describe('Real empty state (Table 8)', () => {
    test('shows the configured message and real emptyBodyHeight layout, with no toolbar', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 8', exact: true }).click();
      const wrapper = example(page, 'table-8-empty');
      const emptyMessage = wrapper.getByTestId('cps-table-empty-message');

      await expect(emptyMessage).toBeVisible();
      await expect(emptyMessage).toHaveText('No records match your criteria');

      const box = await emptyMessage.boundingBox();
      expect(box?.height).toBeCloseTo(352, 0); // 22rem

      await expect(wrapper.locator('.p-datatable-header')).toHaveCount(0);
    });
  });

  test.describe('Real loading state (Table 9)', () => {
    test('shows aria-busy and a real visible loading spinner', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 9', exact: true }).click();
      const wrapper = example(page, 'table-9-loading');

      await expect(wrapper.getByTestId('cps-table')).toHaveAttribute(
        'aria-busy',
        'true'
      );
      await expect(
        wrapper
          .getByTestId('cps-table-loading')
          .getByTestId('cps-loader-spinner')
      ).toBeVisible();
    });
  });

  test.describe('Real HTML rendering and sanitization (Table 10)', () => {
    test('safe HTML renders unescaped, and an injected <script> is stripped and never executes', async ({
      page
    }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => consoleLogs.push(msg.text()));

      await page.getByRole('tab', { name: 'Table 10', exact: true }).click();
      const wrapper = example(page, 'table-10-html');

      const safeCell = wrapper.getByTestId('cps-table-cell-0-a');
      await expect(safeCell.locator('h1')).toHaveText('hello');

      const maliciousCell = wrapper.getByTestId('cps-table-cell-1-a');
      await expect(maliciousCell).toHaveText('this is sanitized');
      await expect(maliciousCell.locator('script')).toHaveCount(0);
      expect(consoleLogs).not.toContain('pwned');
    });
  });

  test.describe('Real virtual scroll rendering (Table 2)', () => {
    test('a virtualized ~1000-row table renders a real bounded subset of rows', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 2', exact: true }).click();
      const wrapper = example(page, 'table-2-virtual-default-render');

      await expect(wrapper.locator('.p-virtualscroller')).toBeVisible();
      await expect(async () => {
        const rowCount = await wrapper.locator('tbody tr').count();
        expect(rowCount).toBeGreaterThan(0);
        expect(rowCount).toBeLessThan(100);
      }).toPass();
    });
  });

  test.describe('Real checkbox selection (Table 4)', () => {
    test('clicking a row checkbox real-selects it, reflected in the real p-datatable-row-selected class', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');

      const row = wrapper.getByTestId('cps-table-row-a1');
      const checkbox = wrapper
        .getByTestId('cps-table-row-select-cell-a1')
        .getByRole('checkbox');

      await expect(checkbox).not.toBeChecked();
      await checkbox.click();

      await expect(checkbox).toBeChecked();
      await expect(row).toHaveClass(/cps-table-row-selected/);
    });

    test('select-all checkbox real-checks/unchecks every row', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');
      const selectAll = wrapper
        .getByTestId('cps-table-header-select-all-cell')
        .getByRole('checkbox');
      const firstCheckbox = wrapper
        .getByTestId('cps-table-row-select-cell-a1')
        .getByRole('checkbox');

      await selectAll.click();
      await expect(selectAll).toBeChecked();
      await expect(firstCheckbox).toBeChecked();

      await selectAll.click();
      await expect(selectAll).not.toBeChecked();
      await expect(firstCheckbox).not.toBeChecked();
    });

    test("a checked row checkbox's icon stays white while hovered", async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');
      const cell = wrapper.getByTestId('cps-table-row-select-cell-a1');
      const checkbox = cell.getByRole('checkbox');
      const input = cell.locator('.p-checkbox-input');
      const icon = cell.locator('.p-checkbox-icon');

      await checkbox.check();
      await expect(icon).toHaveCSS('color', 'rgb(255, 255, 255)');

      await input.hover();
      await expect(icon).toHaveCSS('color', 'rgb(255, 255, 255)');
    });

    test("an unchecked checkbox's border reverts once the mouse moves away, even though a real click leaves it focused", async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');
      const cell = wrapper.getByTestId('cps-table-row-select-cell-a1');
      const checkbox = cell.getByRole('checkbox');
      const box_ = cell.locator('.p-checkbox-box');

      const baseline = await box_.evaluate(
        (el) => getComputedStyle(el).borderColor
      );

      await checkbox.click();
      await expect(checkbox).toBeChecked();
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();

      await page.mouse.move(0, 0);
      await expect(box_).toHaveCSS('border-color', baseline);
    });
  });

  test.describe('Real header-selectable checkbox on a custom nested header (Table 5)', () => {
    test('select-all real-checks/unchecks every row', async ({ page }) => {
      await page.getByRole('tab', { name: 'Table 5', exact: true }).click();
      const wrapper = example(page, 'table-5-nested-header');
      const selectAll = wrapper
        .getByTestId('cps-table-header-selectable-checkbox')
        .getByRole('checkbox');
      const firstCheckbox = wrapper
        .getByTestId('cps-table-row-select-cell-0')
        .getByRole('checkbox');

      await selectAll.click();
      await expect(selectAll).toBeChecked();
      await expect(firstCheckbox).toBeChecked();

      await selectAll.click();
      await expect(selectAll).not.toBeChecked();
      await expect(firstCheckbox).not.toBeChecked();
    });
  });

  test.describe('Real row expansion (Table 4)', () => {
    test('clicking the chevron real-toggles aria-expanded and reveals real projected content', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');
      const expandBtn = wrapper.getByTestId('cps-table-row-expand-btn-a1');

      await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
      await expandBtn.click();
      await expect(expandBtn).toHaveAttribute('aria-expanded', 'true');

      const expandedContent = wrapper.getByTestId(
        'cps-table-row-expanded-content-a1'
      );
      await expect(expandedContent).toBeVisible();
      await expect(expandedContent).toContainText('id: 1');
    });
  });

  test.describe('Real row menu (Table 3)', () => {
    test('the Edit action opens the real menu without it closing prematurely', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 3', exact: true }).click();
      const wrapper = example(page, 'table-3-reorder-menu');
      const menuBtn = wrapper
        .getByTestId('cps-table-row-menu-0')
        .getByTestId('cps-table-row-menu-btn');

      await menuBtn.click();
      const editItem = page
        .getByTestId(/cps-menu-item-\d+/)
        .filter({ hasText: 'Edit' });
      await expect(editItem).toBeVisible();
      await editItem.click();

      await expect(page.getByTestId('cps-toast-message-header')).toContainText(
        'Edit row button clicked'
      );
    });

    test('clicking Remove (once shown) real-shrinks the rendered row count', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 3', exact: true }).click();
      const wrapper = example(page, 'table-3-reorder-menu');
      const rows = wrapper.locator('tbody tr');
      const initialCount = await rows.count();

      await wrapper
        .getByRole('button', { name: /Show Remove buttons/ })
        .click();

      const menuBtn = wrapper
        .getByTestId('cps-table-row-menu-0')
        .getByTestId('cps-table-row-menu-btn');
      await menuBtn.click();
      const removeItem = page
        .getByTestId(/cps-menu-item-\d+/)
        .filter({ hasText: 'Remove' });
      await expect(removeItem).toBeVisible();
      await removeItem.click();

      await expect(rows).toHaveCount(initialCount - 1);
    });
  });

  test.describe('Real toolbar action button (Table 3)', () => {
    test('shows a real cps-notification toast reflecting the new state', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 3', exact: true }).click();
      const wrapper = example(page, 'table-3-reorder-menu');
      const actionBtn = wrapper.getByRole('button', {
        name: /Show Remove buttons/
      });

      await actionBtn.click();

      await expect(page.getByTestId('cps-toast-message-header')).toHaveText(
        "'Remove' buttons are now visible"
      );
    });
  });

  test.describe('Real row reorder via keyboard (Table 3)', () => {
    test('Enter picks up, ArrowDown moves, Enter confirms a real position swap', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 3', exact: true }).click();
      const wrapper = example(page, 'table-3-reorder-menu');
      const rows = wrapper.locator('tbody tr');
      const firstRowTextBefore = await rows.first().textContent();
      const secondRowTextBefore = await rows.nth(1).textContent();

      const handle = wrapper.getByTestId('cps-table-row-drag-handle-0');
      await handle.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await expect(rows.first()).toHaveText(secondRowTextBefore!);
      await expect(rows.nth(1)).toHaveText(firstRowTextBefore!);
    });

    test('Escape cancels a real in-progress reorder, leaving row order unchanged', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 3', exact: true }).click();
      const wrapper = example(page, 'table-3-reorder-menu');
      const rows = wrapper.locator('tbody tr');
      const firstRowTextBefore = await rows.first().textContent();

      const handle = wrapper.getByTestId('cps-table-row-drag-handle-0');
      await handle.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Escape');

      await expect(rows.first()).toHaveText(firstRowTextBefore!);
    });
  });

  test.describe('Real global filter (Table 2)', () => {
    test('typing real-narrows the rendered rows', async ({ page }) => {
      await page.getByRole('tab', { name: 'Table 2', exact: true }).click();
      const wrapper = example(page, 'table-2-virtual-default-render');
      const filterInput = wrapper
        .getByTestId('cps-table-tbar-global-filter')
        .locator('input');
      await expect(filterInput).toBeVisible();

      await filterInput.fill('Panda');

      await expect(wrapper.locator('tbody tr')).toHaveCount(1);
    });
  });

  test.describe('Real remove-on-select toolbar button (Table 4)', () => {
    test('appears only once a real selection exists', async ({ page }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');
      const removeBtn = wrapper.getByTestId('cps-table-tbar-remove-btn');

      await expect(removeBtn).toHaveCount(0);

      await wrapper
        .getByTestId('cps-table-row-select-cell-a1')
        .getByRole('checkbox')
        .click();

      await expect(removeBtn).toBeVisible();
    });
  });

  test.describe('Real columns visibility toggle', () => {
    test('the internal toggle real-removes a column from the rendered table (Table 2)', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 2', exact: true }).click();
      const wrapper = example(page, 'table-2-virtual-default-render');

      await wrapper.getByTestId('cps-table-coltoggle-btn').click();
      const item = page.getByTestId('cps-table-coltoggle-item-String');
      await expect(item).toBeVisible();

      await expect(wrapper.getByTestId('cps-table-header-cell-a')).toHaveCount(
        1
      );
      await item.click();
      await expect(wrapper.getByTestId('cps-table-header-cell-a')).toHaveCount(
        0
      );
    });

    test('the externally-consumed variant real-opens with every column listed (Table 4)', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 4', exact: true }).click();
      const wrapper = example(page, 'table-4-select-expand');

      await wrapper.getByTestId('cps-table-coltoggle-btn').click();
      const listbox = page.getByTestId('cps-table-coltoggle-listbox');
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole('option')).toHaveCount(6);
    });
  });

  test.describe('Real column resize via keyboard (Table 2)', () => {
    test('ArrowRight on the resize handle real-widens the column', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 2', exact: true }).click();
      const wrapper = example(page, 'table-2-virtual-default-render');
      const header = wrapper.getByTestId('cps-table-header-cell-a');
      const separator = header.getByTestId('cps-table-col-resizer');

      const before = (await header.boundingBox())!.width;
      await separator.focus();
      for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');

      const after = (await header.boundingBox())!.width;
      expect(after).toBeGreaterThan(before);
    });
  });

  test.describe('Real lazy loading (Table 11)', () => {
    async function waitForInitialLazyLoad(wrapper: Locator) {
      await expect(wrapper.locator('tbody tr').first()).toBeVisible();
      await expect(
        wrapper
          .getByTestId('cps-table-loading')
          .getByTestId('cps-loader-spinner')
      ).toBeHidden();
    }

    test('fires on init and real-swaps rendered rows on a real page change', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 11', exact: true }).click();
      const wrapper = example(page, 'table-11-lazy');
      await waitForInitialLazyLoad(wrapper);

      const firstRowTextBefore = await wrapper
        .locator('tbody tr')
        .first()
        .textContent();

      await wrapper.locator('.p-paginator-next').click();

      const loader = wrapper.getByTestId('cps-table-loading');
      const spinner = loader.getByTestId('cps-loader-spinner');
      await expect(spinner).toBeVisible();
      await expect(loader.getByTestId('cps-loader-label')).toHaveText(
        'Fetching...'
      );
      await expect(spinner).toBeHidden();

      await expect(wrapper.locator('tbody tr').first()).not.toHaveText(
        firstRowTextBefore!
      );
    });

    test('clicking the already-active page again does not re-trigger a real fetch', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 11', exact: true }).click();
      const wrapper = example(page, 'table-11-lazy');
      await waitForInitialLazyLoad(wrapper);

      const firstRowTextBefore = await wrapper
        .locator('tbody tr')
        .first()
        .textContent();

      const spinner = wrapper
        .getByTestId('cps-table-loading')
        .getByTestId('cps-loader-spinner');
      let sawSpinner = false;
      const spinnerWatch = spinner
        .waitFor({ state: 'visible', timeout: 900 })
        .then(() => {
          sawSpinner = true;
        })
        .catch(() => {});

      await wrapper.getByRole('button', { name: '1' }).click();
      await spinnerWatch;

      expect(sawSpinner).toBe(false);
      await expect(wrapper.locator('tbody tr').first()).toHaveText(
        firstRowTextBefore!
      );
    });
  });

  test.describe('Real alwaysShowPaginator=false (Table 12)', () => {
    test('the real paginator hides once everything fits on one page, and reappears with more rows', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 12', exact: true }).click();
      const wrapper = example(page, 'table-12-always-show-paginator-false');

      await expect(wrapper.locator('.p-paginator')).toBeHidden();

      await page.getByTestId('cps-switch-label').click();

      await expect(wrapper.locator('.p-paginator')).toBeVisible();
    });
  });

  test.describe('Real additional toolbar button on select (Table 13)', () => {
    test('appears alongside Remove only once a real selection exists, and fires its real output', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 13', exact: true }).click();
      const wrapper = example(page, 'table-13-additional-btn-on-select');
      const additionalBtn = wrapper.getByTestId(
        'cps-table-tbar-additional-btn'
      );

      await expect(additionalBtn).toHaveCount(0);

      await wrapper
        .getByTestId('cps-table-row-select-cell-0')
        .getByRole('checkbox')
        .click();

      await expect(additionalBtn).toBeVisible();

      await additionalBtn.click();
      await expect(page.getByTestId('cps-toast-message-header')).toHaveText(
        'Archive clicked for 1 row(s)'
      );
    });
  });

  test.describe('Real custom sort (Table 14)', () => {
    for (const [column, nthChild] of [
      ['name', 1],
      ['city', 2]
    ] as const) {
      test(`sorts the ${column} column by real string length instead of alphabetically`, async ({
        page
      }) => {
        await page.getByRole('tab', { name: 'Table 14', exact: true }).click();
        const wrapper = example(page, 'table-14-custom-sort');
        const header = wrapper.getByTestId(`cps-table-header-cell-${column}`);

        await header.click({ position: { x: 5, y: 5 } });

        const values = await wrapper
          .locator(`tbody tr td:nth-child(${nthChild})`)
          .allTextContents();
        const lengths = values.map((v) => v.trim().length);
        const sortedLengths = [...lengths].sort((a, b) => a - b);
        expect(lengths).toEqual(sortedLengths);
      });
    }
  });

  test.describe('Real initialColumns (Table 15)', () => {
    test('renders only the configured subset, and the columns toggle real-reveals the rest', async ({
      page
    }) => {
      await page.getByRole('tab', { name: 'Table 15', exact: true }).click();
      const wrapper = example(page, 'table-15-initial-columns');

      await expect(wrapper.locator('thead th')).toHaveCount(3);

      await wrapper.getByTestId('cps-table-coltoggle-btn').click();
      const items = page.locator('[data-testid^="cps-table-coltoggle-item-"]');
      await expect(items.nth(3)).toBeVisible();
      await items.nth(3).click();

      await expect(wrapper.locator('thead th')).toHaveCount(4);
    });
  });
});

test.describe('cps-table page', () => {
  test.describe('export to xlsx', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/table');
      await page.addStyleTag({
        content: '* { scroll-behavior: auto !important; }'
      });
    });

    test('should properly download valid xlsx', async ({ page }) => {
      await page.getByRole('tab', { name: 'Table 6', exact: true }).click();
      const wrapper = page.getByTestId('table-6-export');
      await wrapper.getByTestId('cps-table-tbar-export-btn').click();

      const xlsxItem = page
        .getByTestId(/cps-menu-item-\d+/)
        .filter({ hasText: 'XLSX' });
      await expect(xlsxItem).toBeVisible();

      const downloadPromise = page.waitForEvent('download');
      await xlsxItem.click({ force: true });
      const download = await downloadPromise;

      const downloadedPath = await download.path();
      expect(downloadedPath).toBeTruthy();

      const downloadedContent = fs.readFileSync(downloadedPath!);
      const fixturePath = path.join(
        __dirname,
        '..',
        '..',
        'fixtures',
        'table_6_fixture.xlsx'
      );
      const fixtureContent = fs.readFileSync(fixturePath);

      expect(downloadedContent.equals(fixtureContent)).toBe(true);
    });
  });
});
