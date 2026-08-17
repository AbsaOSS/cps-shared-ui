import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

function visibleByTestId(scope: Locator, testId: string): Locator {
  return scope.locator(`[data-testid="${testId}"]:visible`);
}

test.describe('cps-tree-table', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15000);
    await page.goto('/tree-table');
    await page.addStyleTag({
      content: '* { scroll-behavior: auto !important; }'
    });
  });

  test.describe('Real sort on the default-rendered header (Tree table 2)', () => {
    test('clicking a sortable+filterable header cycles real aria-sort through ascending/descending/none', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 2', exact: true })
        .click();
      const wrapper = example(page, 'treetable-2-virtual-default-render');
      const header = visibleByTestId(wrapper, 'cps-treetable-header-cell-name');
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

  test.describe('Real multi-sort badge on a custom header (Tree table 1)', () => {
    test('sorting a second column shows the real order-2 badge on its sort icon', async ({
      page
    }) => {
      const wrapper = example(page, 'treetable-1-paginated-filters');
      const headerName = wrapper.locator('th[cpsttcolsortable="name"]');
      const headerSize = wrapper.locator('th[cpsttcolsortable="size"]');

      await headerName.click({ position: { x: 5, y: 5 } });
      await headerSize.click({ position: { x: 5, y: 5 } });

      await expect(wrapper.getByTestId('cps-table-sort-icon-size')).toHaveText(
        '2'
      );
      await expect(headerName).toHaveAttribute('aria-sort', 'ascending');
      await expect(headerSize).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  test.describe('Real per-column filtering (Tree table 1)', () => {
    test('a text filter real-narrows the rendered root rows', async ({
      page
    }) => {
      const wrapper = example(page, 'treetable-1-paginated-filters');

      await wrapper.getByTestId('cps-table-col-filter-btn-name').click();
      const constraint = page.getByTestId(
        'cps-table-col-filter-constraint-name-0'
      );
      await expect(constraint).toBeVisible();
      await constraint.locator('input').first().fill('Cloud');
      await page.getByTestId('cps-table-col-filter-apply-btn').click();

      await expect(wrapper.locator('tbody tr')).toHaveCount(1);
      await expect(wrapper.locator('tbody tr')).toHaveText(/Cloud/);
    });
  });

  test.describe('Real empty state (Tree table 8)', () => {
    test('shows the configured message and real emptyBodyHeight layout', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 8', exact: true })
        .click();
      const wrapper = example(page, 'treetable-8-empty');
      const emptyMessage = visibleByTestId(
        wrapper,
        'cps-treetable-empty-message'
      );

      await expect(emptyMessage).toBeVisible();
      await expect(emptyMessage).toHaveText('No data');

      const box = await emptyMessage.boundingBox();
      expect(box?.height).toBe(368);
    });
  });

  test.describe('Real loading state (Tree table 9)', () => {
    test('shows aria-busy and a real visible loading spinner with the default label', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 9', exact: true })
        .click();
      const wrapper = example(page, 'treetable-9-loading');

      await expect(wrapper.getByTestId('cps-treetable')).toHaveAttribute(
        'aria-busy',
        'true'
      );
      const loader = wrapper.getByTestId('cps-treetable-loading');
      await expect(loader.getByTestId('cps-loader-spinner')).toBeVisible();
      await expect(loader.getByTestId('cps-loader-label')).toHaveText(
        'Loading...'
      );
    });
  });

  test.describe('Real HTML rendering and sanitization (Tree table 10)', () => {
    test('safe HTML renders unescaped, and an injected <script> is stripped and never executes', async ({
      page
    }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => consoleLogs.push(msg.text()));

      await page
        .getByRole('tab', { name: 'Tree table 10', exact: true })
        .click();
      const wrapper = example(page, 'treetable-10-html');

      const rootRow = wrapper.getByTestId('cps-treetable-row-0');
      const safeCell = rootRow.locator('.cps-treetable-html-cell').first();
      await expect(safeCell.locator('strong')).toHaveText('hello');

      const toggler = rootRow.getByRole('button', {
        name: /Row (Expanded|Collapsed)/
      });
      await toggler.click();

      const childRow = wrapper.getByTestId('cps-treetable-row-1');
      const maliciousCell = childRow
        .locator('.cps-treetable-html-cell')
        .first();
      await expect(maliciousCell).toHaveText('this is sanitized');
      await expect(maliciousCell.locator('script')).toHaveCount(0);
      expect(consoleLogs).not.toContain('pwned');
    });
  });

  test.describe('Real virtual scroll rendering (Tree table 2)', () => {
    test('a virtualized ~1000-node tree renders a real bounded subset of rows', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 2', exact: true })
        .click();
      const wrapper = example(page, 'treetable-2-virtual-default-render');

      await expect(wrapper.locator('.p-virtualscroller')).toBeVisible();
      await expect(async () => {
        const rowCount = await wrapper.locator('tbody tr').count();
        expect(rowCount).toBeGreaterThan(0);
        expect(rowCount).toBeLessThan(100);
      }).toPass();
    });
  });

  test.describe('Real column resize via keyboard (Tree table 1)', () => {
    test('ArrowRight on the resize handle real-widens the column', async ({
      page
    }) => {
      const wrapper = example(page, 'treetable-1-paginated-filters');
      const header = wrapper.locator('th[cpsttcolsortable="name"]');
      const resizer = header.getByTestId('cps-treetable-col-resizer');

      const before = (await header.boundingBox())!.width;
      await resizer.focus();
      for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');

      const after = (await header.boundingBox())!.width;
      expect(after).toBeGreaterThan(before);
    });
  });

  test.describe('Real checkbox selection (Tree table 4)', () => {
    test('clicking a row checkbox real-selects it, reflected in the real cps-treetable-row-selected class', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');

      const row = wrapper.getByTestId('cps-treetable-row-0');
      const checkbox = wrapper
        .getByTestId('cps-treetable-row-select-cell-0')
        .getByRole('checkbox');

      await expect(checkbox).not.toBeChecked();
      await checkbox.click();

      await expect(checkbox).toBeChecked();
      await expect(row).toHaveClass(/cps-treetable-row-selected/);
    });

    test('select-all checkbox on the default header real-checks/unchecks every root row', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');
      const selectAll = wrapper
        .getByTestId('cps-treetable-header-select-all-cell')
        .getByRole('checkbox');
      const firstCheckbox = wrapper
        .getByTestId('cps-treetable-row-select-cell-0')
        .getByRole('checkbox');

      await selectAll.click();
      await expect(selectAll).toBeChecked();
      await expect(firstCheckbox).toBeChecked();

      await selectAll.click();
      await expect(selectAll).not.toBeChecked();
      await expect(firstCheckbox).not.toBeChecked();
    });

    test("selecting one child under a multi-child parent real-shows a partial-selection icon in the parent's checkbox", async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');

      const root = wrapper.getByTestId('cps-treetable-row-0');
      const toggler = root.getByRole('button', {
        name: /Row (Expanded|Collapsed)/
      });
      await toggler.click();

      const childCheckbox = wrapper
        .getByTestId('cps-treetable-row-select-cell-2')
        .getByRole('checkbox');
      await childCheckbox.click();

      const parentIcon = wrapper
        .getByTestId('cps-treetable-row-select-cell-0')
        .locator('[data-p-icon="minus"]');
      await expect(parentIcon).toHaveCSS('color', 'rgb(135, 10, 60)');
    });
  });

  test.describe('Real header-selectable checkbox on a custom nested header (Tree table 5)', () => {
    test('select-all real-checks/unchecks every root row', async ({ page }) => {
      await page
        .getByRole('tab', { name: 'Tree table 5', exact: true })
        .click();
      const wrapper = example(page, 'treetable-5-nested-header');
      const selectAll = wrapper
        .getByTestId('cps-treetable-header-selectable-checkbox')
        .getByRole('checkbox');
      const firstCheckbox = wrapper
        .getByTestId('cps-treetable-row-select-cell-0')
        .getByRole('checkbox');

      await selectAll.click();
      await expect(selectAll).toBeChecked();
      await expect(firstCheckbox).toBeChecked();

      await selectAll.click();
      await expect(selectAll).not.toBeChecked();
      await expect(firstCheckbox).not.toBeChecked();
    });
  });

  test.describe('Real row expansion (Tree table 4)', () => {
    test('clicking the toggler real-expands the node and reveals real child rows, with a real aria-label reflecting current state', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');
      const root = wrapper.getByTestId('cps-treetable-row-0');
      const toggler = root.getByRole('button', {
        name: /Row (Expanded|Collapsed)/
      });

      const collapsedRowCount = await wrapper.locator('tbody tr').count();
      await expect(toggler).toHaveAttribute('aria-label', 'Row Collapsed');

      await toggler.click();

      await expect(toggler).toHaveAttribute('aria-label', 'Row Expanded');
      await expect(root).toHaveAttribute('aria-expanded', 'true');
      const expandedRowCount = await wrapper.locator('tbody tr').count();
      expect(expandedRowCount).toBeGreaterThan(collapsedRowCount);
      await expect(wrapper.locator('tbody tr').nth(1)).toContainText('Angular');

      await toggler.click();

      await expect(toggler).toHaveAttribute('aria-label', 'Row Collapsed');
      await expect(wrapper.locator('tbody tr')).toHaveCount(collapsedRowCount);
    });
  });

  test.describe('Real row menu (Tree table 4)', () => {
    test('the Edit action opens the real menu without it closing prematurely', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');
      const menuBtn = wrapper
        .getByTestId('cps-treetable-row-menu-cell-0')
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
  });

  test.describe('Real toolbar action button (Tree table 3)', () => {
    test('shows a real cps-notification toast reflecting the new state', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 3', exact: true })
        .click();
      const wrapper = example(page, 'treetable-3-menu-actions');
      const actionBtn = wrapper.getByRole('button', {
        name: /Show Remove buttons/
      });

      await actionBtn.click();

      await expect(page.getByTestId('cps-toast-message-header')).toHaveText(
        "'Remove' buttons are now visible"
      );
    });
  });

  test.describe('Real reload button (Tree table 3)', () => {
    test('shows a real cps-notification toast', async ({ page }) => {
      await page
        .getByRole('tab', { name: 'Tree table 3', exact: true })
        .click();
      const wrapper = example(page, 'treetable-3-menu-actions');

      await wrapper.getByTestId('cps-treetable-tbar-reload-btn').click();

      await expect(page.getByTestId('cps-toast-message-header')).toHaveText(
        'Data reload button clicked'
      );
    });
  });

  test.describe('Real row menu with custom items (Tree table 6)', () => {
    test('renders the configured custom menu items alongside the defaults', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 6', exact: true })
        .click();
      const wrapper = example(page, 'treetable-6-custom-menu');
      const menuBtn = wrapper
        .getByTestId('cps-treetable-row-menu-cell-0')
        .getByTestId('cps-table-row-menu-btn');

      await menuBtn.click();

      await expect(
        page
          .getByTestId(/cps-menu-item-\d+/)
          .filter({ hasText: 'Custom menu item' })
      ).toBeVisible();
      await expect(
        page.getByTestId(/cps-menu-item-\d+/).filter({ hasText: 'Edit row' })
      ).toBeVisible();
    });
  });

  test.describe('Real remove-on-select toolbar button (Tree table 4)', () => {
    test('appears only once a real selection exists', async ({ page }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');
      const removeBtn = wrapper.getByTestId('cps-treetable-tbar-remove-btn');

      await expect(removeBtn).toHaveCount(0);

      await wrapper
        .getByTestId('cps-treetable-row-select-cell-0')
        .getByRole('checkbox')
        .click();

      await expect(removeBtn).toBeVisible();
    });
  });

  test.describe('Real columns visibility toggle', () => {
    test('the internal toggle real-removes a column from the rendered tree table (Tree table 2)', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 2', exact: true })
        .click();
      const wrapper = example(page, 'treetable-2-virtual-default-render');

      await wrapper.getByTestId('cps-table-coltoggle-btn').click();
      const item = page.getByTestId(
        'cps-table-coltoggle-item-String (only 5 distinct values)'
      );
      await expect(item).toBeVisible();

      await expect(
        wrapper.getByTestId('cps-treetable-header-cell-type')
      ).toHaveCount(1);
      await item.click();
      await expect(
        wrapper.getByTestId('cps-treetable-header-cell-type')
      ).toHaveCount(0);
    });

    test('the externally-consumed variant real-opens with every column listed (Tree table 4)', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 4', exact: true })
        .click();
      const wrapper = example(page, 'treetable-4-select-expand');

      await wrapper.getByTestId('cps-table-coltoggle-btn').click();
      const listbox = page.getByTestId('cps-table-coltoggle-listbox');
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole('option')).toHaveCount(6);
    });
  });

  test.describe('Real borderless, no-row-hover styling (Tree table 6)', () => {
    test('renders without gridlines and without a row-hover class', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 6', exact: true })
        .click();
      const wrapper = example(page, 'treetable-6-custom-menu');

      await expect(wrapper.locator('.p-treetable-gridlines')).toHaveCount(0);
      await expect(wrapper.locator('.p-treetable-hoverable-rows')).toHaveCount(
        0
      );
    });
  });

  test.describe('Real custom toolbar template and size toggle (Tree table 7)', () => {
    test('renders the projected custom toolbar content and real-switches size classes', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 7', exact: true })
        .click();
      const wrapper = example(page, 'treetable-7-toolbar-sizes');

      await expect(
        wrapper.getByText('Tree table with custom toolbar and different sizes')
      ).toBeVisible();

      await expect(wrapper.locator('.p-treetable-sm')).toHaveCount(1);

      await wrapper.getByText('Large', { exact: true }).click();
      await expect(wrapper.locator('.p-treetable-lg')).toHaveCount(1);
    });
  });

  test.describe('Real lazy loading (Tree table 11)', () => {
    async function waitForInitialLazyLoad(wrapper: Locator) {
      await expect(wrapper.locator('tbody tr').first()).toBeVisible();
      await expect(
        wrapper
          .getByTestId('cps-treetable-loading')
          .getByTestId('cps-loader-spinner')
      ).toBeHidden();
    }

    test('fires on init and real-swaps rendered rows on a real page change', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 11', exact: true })
        .click();
      const wrapper = example(page, 'treetable-11-lazy');
      await waitForInitialLazyLoad(wrapper);

      const firstRowTextBefore = await wrapper
        .locator('tbody tr')
        .first()
        .textContent();

      const loader = wrapper.getByTestId('cps-treetable-loading');
      const spinner = loader.getByTestId('cps-loader-spinner');
      let sawSpinner = false;
      const spinnerWatch = spinner
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => {
          sawSpinner = true;
        })
        .catch(() => {});

      await wrapper.locator('.p-paginator-next').click();
      await spinnerWatch;
      expect(sawSpinner).toBe(true);

      await expect(wrapper.locator('tbody tr').first()).not.toHaveText(
        firstRowTextBefore!
      );
    });

    test('clicking the already-active page again does not re-trigger a real fetch', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 11', exact: true })
        .click();
      const wrapper = example(page, 'treetable-11-lazy');
      await waitForInitialLazyLoad(wrapper);

      const firstRowTextBefore = await wrapper
        .locator('tbody tr')
        .first()
        .textContent();

      const spinner = wrapper
        .getByTestId('cps-treetable-loading')
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

  test.describe('Real alwaysShowPaginator=false (Tree table 12)', () => {
    test('the real paginator hides once everything fits on one page, and reappears with more rows', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 12', exact: true })
        .click();
      const wrapper = example(page, 'treetable-12-always-show-paginator-false');

      await expect(wrapper.locator('.p-paginator')).toBeHidden();

      await page.getByTestId('cps-switch-label').click();

      await expect(wrapper.locator('.p-paginator')).toBeVisible();
    });
  });

  test.describe('Real additional toolbar button on select (Tree table 13)', () => {
    test('appears alongside Remove only once a real selection exists, and fires its real output', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 13', exact: true })
        .click();
      const wrapper = example(page, 'treetable-13-additional-btn-on-select');
      const additionalBtn = wrapper.getByTestId(
        'cps-treetable-tbar-additional-btn'
      );

      await expect(additionalBtn).toHaveCount(0);

      await wrapper
        .getByTestId('cps-treetable-row-select-cell-1')
        .getByRole('checkbox')
        .click();

      await expect(additionalBtn).toBeVisible();

      await additionalBtn.click();
      await expect(page.getByTestId('cps-toast-message-header')).toHaveText(
        'Archive clicked for 1 row(s)'
      );
    });
  });

  test.describe('Real custom sort (Tree table 14)', () => {
    for (const [column, nthChild] of [
      ['name', 1],
      ['city', 2]
    ] as const) {
      test(`sorts the ${column} column by real string length instead of alphabetically`, async ({
        page
      }) => {
        await page
          .getByRole('tab', { name: 'Tree table 14', exact: true })
          .click();
        const wrapper = example(page, 'treetable-14-custom-sort');
        const header = visibleByTestId(
          wrapper,
          `cps-treetable-header-cell-${column}`
        );

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

  test.describe('Real initialColumns (Tree table 15)', () => {
    test('renders only the configured subset, and the columns toggle real-reveals the rest', async ({
      page
    }) => {
      await page
        .getByRole('tab', { name: 'Tree table 15', exact: true })
        .click();
      const wrapper = example(page, 'treetable-15-initial-columns');

      await expect(wrapper.locator('thead th')).toHaveCount(3);

      await wrapper.getByTestId('cps-table-coltoggle-btn').click();
      const items = page.locator('[data-testid^="cps-table-coltoggle-item-"]');
      await expect(items.nth(3)).toBeVisible();
      await items.nth(3).click();

      await expect(wrapper.locator('thead th')).toHaveCount(4);
    });
  });
});
