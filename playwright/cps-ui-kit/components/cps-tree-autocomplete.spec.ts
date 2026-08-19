import { test, expect, type Page, type Locator } from '@playwright/test';

function example(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

async function open(wrapper: Locator): Promise<void> {
  await wrapper.getByTestId('cps-treeautocomplete-box').click();
}

test.describe('cps-tree-autocomplete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tree-autocomplete');
  });

  test.describe('Real keyboard navigation', () => {
    test('ArrowDown moves real focus between real treeitems', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      await open(wrapper);

      const attr2 = page.getByRole('treeitem', { name: 'Attr2_2' });
      const attr3 = page.getByRole('treeitem', { name: 'Attr3_2' });
      await attr2.focus();

      await page.keyboard.press('ArrowDown');
      await expect(attr3).toBeFocused();
    });

    test('Escape closes the real dropdown', async ({ page }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
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
      const wrapper = example(page, 'required-tree-autocomplete');
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
      const wrapper = example(page, 'required-tree-autocomplete');
      await open(wrapper);

      const leaf = page.getByRole('treeitem', { name: 'Attr2_2' });
      await leaf.focus();
      await page.keyboard.press('Enter');

      await expect(
        wrapper.getByTestId('cps-treeautocomplete-selected-value')
      ).toHaveText('Attr2_2');
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });

    test('Space selects a leaf node and closes the dropdown', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      await open(wrapper);

      const leaf = page.getByRole('treeitem', { name: 'Attr3_2' });
      await leaf.focus();
      await page.keyboard.press('Space');

      await expect(
        wrapper.getByTestId('cps-treeautocomplete-selected-value')
      ).toHaveText('Attr3_2');
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });
  });

  test.describe('Real Enter on a directory node', () => {
    test('expands the directory instead of selecting/closing', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
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
      const wrapper = example(page, 'virtual-scroll-tree-autocomplete');
      await open(wrapper);

      await expect(page.getByRole('treeitem').first()).toBeVisible();
    });
  });

  test.describe('Real chip removal', () => {
    test('clicking a chip close button removes it from the real selection', async ({
      page
    }) => {
      const wrapper = example(page, 'virtual-scroll-tree-autocomplete');
      const chips = wrapper
        .getByTestId('cps-treeautocomplete-chips-group')
        .locator('cps-chip');
      await expect(chips.first()).toBeVisible();
      const initialCount = await chips.count();
      expect(initialCount).toBeGreaterThan(0);

      await chips.first().getByRole('button').click();

      await expect(chips).toHaveCount(initialCount - 1);
    });

    test('double-Backspace removes the last chip', async ({ page }) => {
      const wrapper = example(page, 'virtual-scroll-tree-autocomplete');
      const chips = wrapper
        .getByTestId('cps-treeautocomplete-chips-group')
        .locator('cps-chip');
      await expect(chips.first()).toBeVisible();
      const initialCount = await chips.count();
      expect(initialCount).toBeGreaterThan(0);

      const input = wrapper.getByTestId('cps-treeautocomplete-input');
      await input.click();
      await expect(input).toBeFocused();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');

      await expect(chips).toHaveCount(initialCount - 1);
    });
  });

  test.describe('Real prefix icon', () => {
    test('the configured prefix icon renders in the real box', async ({
      page
    }) => {
      const wrapper = example(page, 'prefix-icon-tree-autocomplete');

      await expect(
        wrapper.getByTestId('cps-treeautocomplete-prefix-icon')
      ).toBeVisible();
    });
  });

  test.describe('Real required-field validation', () => {
    test('clearing the value and blurring shows a real required-field error', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      const input = wrapper.getByTestId('cps-treeautocomplete-input');

      await wrapper.getByTestId('cps-treeautocomplete-clear-icon').click();
      await input.focus();
      await page.keyboard.press('Tab');

      const error = wrapper.getByTestId('cps-treeautocomplete-error');
      await expect(error).toHaveText('Field is required');
      const describedBy = await input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(error).toHaveAttribute('id', describedBy!);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Real two-way binding - real readout', () => {
    test('selecting a node updates the visible bound value', async ({
      page
    }) => {
      const wrapper = example(page, 'two-way-binding-tree-autocomplete');
      const readout = page.getByTestId(
        'two-way-binding-tree-autocomplete-value'
      );

      await open(wrapper);
      await page.getByRole('treeitem', { name: 'Attr3_2' }).click();

      await expect(readout).toHaveText('Attr3_2');
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an unlabeled tree autocomplete exposes its ariaLabel as the real accessible name', async ({
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
      const hint = example(page, 'hide-details-tree-autocomplete').getByTestId(
        'cps-treeautocomplete-hint'
      );

      await expect(hint).toHaveCount(0);
    });
  });

  test.describe('openOnClear=false', () => {
    test('clearing a pre-filled tree autocomplete does not reopen the dropdown', async ({
      page
    }) => {
      const wrapper = example(page, 'open-on-clear-false-tree-autocomplete');

      await wrapper.getByTestId('cps-treeautocomplete-clear-icon').click();

      await expect(page.getByRole('treeitem')).toHaveCount(0);
      await expect(
        wrapper.getByTestId('cps-treeautocomplete-selected-value')
      ).toHaveCount(0);
    });
  });

  test.describe('Real typing filters the tree', () => {
    test('typing a leaf label narrows the real tree to matching nodes', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      const input = wrapper.getByTestId('cps-treeautocomplete-input');
      await input.click();
      await expect(page.getByRole('treeitem').first()).toBeVisible();

      await input.fill('AttrB');

      await expect(page.getByRole('treeitem', { name: 'AttrB' })).toBeVisible();
      await expect(
        page.getByRole('treeitem', { name: 'Dataset 2' })
      ).toHaveCount(0);
    });
  });

  test.describe('Real Enter confirms typed text', () => {
    test('Enter with text matching a node label exactly selects that node and closes the dropdown', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      const input = wrapper.getByTestId('cps-treeautocomplete-input');
      await input.click();
      await input.fill('AttrB');

      await page.keyboard.press('Enter');

      await expect(
        wrapper.getByTestId('cps-treeautocomplete-selected-value')
      ).toHaveText('AttrB');
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });

    test('Enter with text matching no node reverts the input to the current selection label', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      const input = wrapper.getByTestId('cps-treeautocomplete-input');
      const previousLabel = await wrapper
        .getByTestId('cps-treeautocomplete-selected-value')
        .textContent();
      await input.click();
      await input.fill('zzz-no-such-node-zzz');

      await page.keyboard.press('Enter');

      await expect(input).toHaveValue(previousLabel!);
      await expect(
        wrapper.getByTestId('cps-treeautocomplete-selected-value')
      ).toHaveText(previousLabel!);
    });
  });

  test.describe('Real expandAll()/collapseAll()', () => {
    test('Expand All reveals a two-level-deep node without any manual clicks', async ({
      page
    }) => {
      const wrapper = example(page, 'expand-collapse-tree-autocomplete');

      await page.getByTestId('expand-all-tree-autocomplete-btn').click();
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
      const wrapper = example(page, 'expand-collapse-tree-autocomplete');

      await open(wrapper);
      await page.getByRole('treeitem', { name: 'Dataset 1' }).click();
      await expect(
        page.getByRole('treeitem', { name: 'Attr1_1' })
      ).toBeVisible();
      await page.keyboard.press('Escape');

      await page.getByTestId('collapse-all-tree-autocomplete-btn').click();
      await open(wrapper);

      await expect(
        page.getByRole('treeitem', { name: 'Dataset 1' })
      ).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('treeitem', { name: 'Attr1_1' })).toHaveCount(
        0
      );
    });
  });

  test.describe('Real custom empty message', () => {
    test('typing text with no matches shows the configured emptyMessage', async ({
      page
    }) => {
      const wrapper = example(page, 'empty-message-tree-autocomplete');
      const input = wrapper.getByTestId('cps-treeautocomplete-input');
      await input.click();
      await expect(page.getByRole('treeitem').first()).toBeVisible();

      await input.fill('zzz-no-such-node-zzz');

      await expect(
        page
          .getByTestId('cps-treeautocomplete-options')
          .getByText('Nothing matches your search')
      ).toBeVisible();
      await expect(page.getByRole('treeitem')).toHaveCount(0);
    });
  });

  test.describe('Real focus behavior', () => {
    test('clicking the box moves real DOM focus to the input', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      await open(wrapper);

      await expect(
        wrapper.getByTestId('cps-treeautocomplete-input')
      ).toBeFocused();
    });

    test('clicking the box visually hides the selected-label span behind the now-active input', async ({
      page
    }) => {
      const wrapper = example(page, 'required-tree-autocomplete');
      const selectedValue = wrapper.getByTestId(
        'cps-treeautocomplete-selected-value'
      );
      await expect(selectedValue).toHaveCSS('opacity', '1');

      await open(wrapper);

      await expect(selectedValue).toHaveCSS('opacity', '0');
    });
  });
});
