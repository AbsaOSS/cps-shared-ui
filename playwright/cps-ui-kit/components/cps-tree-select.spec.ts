import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

async function open(wrapper: Locator): Promise<void> {
  await wrapper.getByTestId('cps-treeselect-box').click();
}

test.describe('cps-tree-select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tree-select');
  });

  test.describe('Real keyboard navigation', () => {
    test('ArrowDown moves real focus between real treeitems', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');
      await open(wrapper);

      const attr2 = page.getByRole('treeitem', { name: 'Attr2_2' });
      const attr3 = page.getByRole('treeitem', { name: 'Attr3_2' });
      await attr2.focus();

      await page.keyboard.press('ArrowDown');
      await expect(attr3).toBeFocused();
    });

    test('Escape closes the real dropdown', async ({ page }) => {
      const wrapper = example(page, 'required-tree-select');
      await open(wrapper);

      await expect(page.getByRole('treeitem').first()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });
  });

  test.describe('Real directory expand/collapse via click', () => {
    test('clicking a directory row toggles its real aria-expanded state and reveals its children', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');
      await open(wrapper);

      const directory = page.getByRole('treeitem', { name: 'Dataset 1' });
      await expect(directory).toHaveAttribute('aria-expanded', 'false');

      await directory.click();

      await expect(directory).toHaveAttribute('aria-expanded', 'true');
      await expect(
        page.getByRole('treeitem', { name: 'Attr1_1' })
      ).toBeVisible();
    });
  });

  test.describe('Real Enter/Space on a leaf node', () => {
    test('Enter selects a leaf node and closes the dropdown despite the keydown handler calling preventDefault', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');
      await open(wrapper);

      const leaf = page.getByRole('treeitem', { name: 'Attr2_2' });
      await leaf.focus();
      await page.keyboard.press('Enter');

      await expect(
        wrapper.getByTestId('cps-treeselect-selected-value')
      ).toHaveText('Attr2_2');
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });

    test('Space selects a leaf node and closes the dropdown', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');
      await open(wrapper);

      const leaf = page.getByRole('treeitem', { name: 'Attr3_2' });
      await leaf.focus();
      await page.keyboard.press('Space');

      await expect(
        wrapper.getByTestId('cps-treeselect-selected-value')
      ).toHaveText('Attr3_2');
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });
  });

  test.describe('Real Enter on a directory node', () => {
    test('expands the directory instead of selecting/closing', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');
      await open(wrapper);

      const directory = page.getByRole('treeitem', { name: 'Dataset 3' });
      await directory.focus();
      await expect(directory).toHaveAttribute('aria-expanded', 'false');

      await page.keyboard.press('Enter');

      await expect(directory).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('treeitem')).not.toHaveCount(0);
    });
  });

  test.describe('Real virtual scroll rendering', () => {
    test('a virtualized tree renders real treeitem nodes on open', async ({
      page
    }) => {
      const wrapper = example(page, 'virtual-scroll-tree-select');
      await open(wrapper);

      await expect(page.getByRole('treeitem').first()).toBeVisible();
    });
  });

  test.describe('Real chip removal', () => {
    test('clicking a chip close button removes it from the real selection', async ({
      page
    }) => {
      const wrapper = example(page, 'virtual-scroll-tree-select');
      const chips = wrapper
        .getByTestId('cps-treeselect-chips-group')
        .locator('cps-chip');
      await expect(chips.first()).toBeVisible();
      const initialCount = await chips.count();
      expect(initialCount).toBeGreaterThan(0);

      await chips.first().getByRole('button').click();

      await expect(chips).toHaveCount(initialCount - 1);
    });
  });

  test.describe('Real prefix icon', () => {
    test('the configured prefix icon renders in the real box', async ({
      page
    }) => {
      const wrapper = example(page, 'prefix-icon-tree-select');

      await expect(
        wrapper.getByTestId('cps-treeselect-prefix-icon')
      ).toBeVisible();
    });
  });

  test.describe('Real required-field validation', () => {
    test('clearing the value and blurring shows a real required-field error', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');
      const container = wrapper.getByTestId('cps-treeselect-container');

      await wrapper.getByTestId('cps-treeselect-clear-icon').click();
      await container.focus();
      await page.keyboard.press('Tab');

      const error = wrapper.getByTestId('cps-treeselect-error');
      await expect(error).toHaveText('Field is required');
      const describedBy = await container.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(error).toHaveAttribute('id', describedBy!);
    });
  });

  test.describe('Real two-way binding - real readout', () => {
    test('selecting a node updates the visible bound value', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-tree-select');
      const readout = page.getByTestId('two-way-binding-tree-select-value');

      await open(wrapper);
      await page.getByRole('treeitem', { name: 'Attr3_2' }).click();

      await expect(readout).toHaveText('Attr3_2');
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled tree select exposes its ariaLabel as the real accessible name', async ({
      page
    }) => {
      await expect(
        page.getByRole('combobox', { name: 'Select an item', exact: true })
      ).toBeVisible();
    });
  });

  test.describe('hideDetails suppresses the hint/error row entirely', () => {
    test('no hint element is rendered when hideDetails is set', async ({
      page
    }) => {
      const hint = example(page, 'hide-details-tree-select').getByTestId(
        'cps-treeselect-hint'
      );

      await expect(hint).toHaveCount(0);
    });
  });

  test.describe('Real expandAll()/collapseAll()', () => {
    test('Expand All reveals a two-level-deep node without any manual clicks', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-select');

      await page.getByTestId('expand-all-tree-select-btn').click();
      await open(wrapper);

      await expect(
        page.getByRole('treeitem', { name: 'Dataset 1' })
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(
        page.getByRole('treeitem', { name: 'Attr1_1' })
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('treeitem', { name: 'AttrA' })).toBeVisible();
    });

    test('Collapse All hides a previously-expanded node', async ({ page }) => {
      const wrapper = example(page, 'required-tree-select');

      await open(wrapper);
      await page.getByRole('treeitem', { name: 'Dataset 1' }).click();
      await expect(
        page.getByRole('treeitem', { name: 'Attr1_1' })
      ).toBeVisible();
      await page.keyboard.press('Escape');

      await page.getByTestId('collapse-all-tree-select-btn').click();
      await open(wrapper);

      await expect(
        page.getByRole('treeitem', { name: 'Dataset 1' })
      ).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('treeitem', { name: 'Attr1_1' })).toHaveCount(
        0
      );
    });
  });

  test.describe('openOnClear=false', () => {
    test('clearing a pre-filled tree select does not reopen the dropdown', async ({
      page
    }) => {
      const wrapper = example(page, 'open-on-clear-false-tree-select');

      await wrapper.getByTestId('cps-treeselect-clear-icon').click();

      await expect(page.getByRole('treeitem')).toHaveCount(0);
      await expect(
        wrapper.getByTestId('cps-treeselect-placeholder')
      ).toBeVisible();
    });
  });
});
