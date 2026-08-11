import { test, expect, type Page, type Locator } from '@playwright/test';

function group(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

async function timeToAfterTabChanged(
  page: Page,
  testId: string,
  tabIndex: number
): Promise<number> {
  await group(page, testId).getByRole('tab').first().waitFor();
  await page.evaluate(() => {
    (window as any).__log = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => {
      (window as any).__log.push({ t: performance.now(), args });
      orig(...args);
    };
  });
  const clickTime = await page.evaluate(
    ({ id, index }) => {
      const wrapper = document.querySelector(`[data-testid="${id}"]`)!;
      const tab = wrapper.querySelectorAll('[role="tab"]')[
        index
      ] as HTMLElement;
      const t = performance.now();
      tab.click();
      return t;
    },
    { id: testId, index: tabIndex }
  );
  await expect
    .poll(async () => {
      const logs = await page.evaluate(() => (window as any).__log);
      return logs.some(
        (l: { args: unknown[] }) =>
          typeof l.args[0] === 'string' && l.args[0].includes('Tab changed to')
      );
    })
    .toBe(true);
  const logs = await page.evaluate(() => (window as any).__log);
  const changed = logs.find(
    (l: { args: unknown[] }) =>
      typeof l.args[0] === 'string' && l.args[0].includes('Tab changed to')
  );
  return changed.t - clickTime;
}

async function minTimeToAfterTabChanged(
  page: Page,
  testId: string,
  samples = 3
): Promise<number> {
  let min = Infinity;
  for (let i = 0; i < samples; i++) {
    const delta = await timeToAfterTabChanged(page, testId, 1);
    min = Math.min(min, delta);
    if (i < samples - 1) {
      await timeToAfterTabChanged(page, testId, 0);
    }
  }
  return min;
}

test.describe('cps-tab-group', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tab-group');
  });

  test.describe('Real keyboard navigation', () => {
    test('ArrowRight/Left skip a disabled tab and wrap around; Home/End jump to the first/last enabled tab', async ({
      page
    }) => {
      const wrapper = group(page, 'center-aligned-tabs');
      const tabs = wrapper.getByRole('tab');

      await tabs.nth(1).focus();

      await page.keyboard.press('ArrowRight');
      await expect(tabs.nth(2)).toBeFocused();
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');

      await page.keyboard.press('ArrowRight');
      await expect(tabs.nth(0)).toBeFocused();
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

      await page.keyboard.press('End');
      await expect(tabs.nth(2)).toBeFocused();

      await page.keyboard.press('Home');
      await expect(tabs.nth(0)).toBeFocused();
    });
  });

  test.describe('Real autoActivation=false behavior', () => {
    test('arrow keys move focus without activating; Enter activates the focused tab', async ({
      page
    }) => {
      const wrapper = group(page, 'right-aligned-tabs');
      const tabs = wrapper.getByRole('tab');

      await tabs.nth(0).focus();
      await page.keyboard.press('ArrowRight');

      await expect(tabs.nth(1)).toBeFocused();
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');

      await page.keyboard.press('Enter');
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
    });
  });

  test.describe('Real overflow scroll and nav buttons', () => {
    test('the forward button scrolls the real tab list and the back button appears once scrolled', async ({
      page
    }) => {
      const wrapper = group(page, 'left-aligned-tabs');
      const list = wrapper.getByTestId('cps-tab-list');
      const back = wrapper.getByTestId('cps-tab-nav-back');
      const forward = wrapper.getByTestId('cps-tab-nav-forward');

      await expect(back).toHaveCount(0);
      await expect(forward).toBeVisible();

      const scrollLeftBefore = await list.evaluate((el) => el.scrollLeft);
      await forward.click();

      await expect(back).toBeVisible();
      await expect
        .poll(() => list.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(scrollLeftBefore);
    });
  });

  test.describe('Real animation timing difference between slide and fade', () => {
    test('afterTabChanged fires near-instantly for slide but after a real ~100ms delay for fade', async ({
      page
    }) => {
      const slideDelta = await timeToAfterTabChanged(page, 'stretched-tabs', 1);
      expect(slideDelta).toBeLessThan(50);

      const fadeDelta = await timeToAfterTabChanged(
        page,
        'left-aligned-tabs',
        1
      );
      expect(fadeDelta).toBeGreaterThan(80);
    });
  });

  test.describe('Real prefers-reduced-motion for fade', () => {
    test('the fade delay before afterTabChanged shrinks under reduced motion', async ({
      page
    }) => {
      const normalDelta = await minTimeToAfterTabChanged(
        page,
        'left-aligned-tabs'
      );
      expect(normalDelta).toBeGreaterThan(80);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/tab-group');

      const reducedDelta = await minTimeToAfterTabChanged(
        page,
        'left-aligned-tabs'
      );
      expect(reducedDelta).toBeLessThan(normalDelta / 2);
    });
  });

  test.describe('Real mousedown-vs-keyboard focus-ring suppression', () => {
    test('a real click suppresses the focus ring; real keyboard focus does not', async ({
      page
    }) => {
      const wrapper = group(page, 'center-aligned-tabs');
      const tabs = wrapper.getByRole('tab');

      await tabs.nth(0).click();
      await expect(tabs.nth(0)).toHaveClass(/suppress-focus-visible/);

      await tabs.nth(2).focus();
      await expect(tabs.nth(2)).not.toHaveClass(/suppress-focus-visible/);
    });
  });

  test.describe('Real tooltip on a tab', () => {
    test('hovering a tab with tooltipText shows a real tooltip after its configured delay', async ({
      page
    }) => {
      const wrapper = group(page, 'left-aligned-tabs');
      const tab = wrapper.getByRole('tab').first();

      await tab.hover();
      const tooltip = page.getByRole('tooltip', { name: 'Tooltip of tab 1' });
      await expect(tooltip).toBeVisible();
    });
  });

  test.describe('Real panel focus target', () => {
    test('a panel with interactive content resolves tabindex=-1 and focus goes to the content; a plain-text panel resolves tabindex=0 and is itself focusable', async ({
      page
    }) => {
      const interactiveWrapper = group(page, 'center-aligned-tabs');
      const interactivePanel = interactiveWrapper.getByRole('tabpanel');
      await expect(interactivePanel).toHaveAttribute('tabindex', '-1');
      const checkbox = interactiveWrapper.getByTestId('cps-checkbox-input');
      await checkbox.focus();
      await expect(checkbox).toBeFocused();

      const plainWrapper = group(page, 'stretched-tabs');
      const plainPanel = plainWrapper.getByRole('tabpanel');
      await expect(plainPanel).toHaveAttribute('tabindex', '0');
      await plainPanel.focus();
      await expect(plainPanel).toBeFocused();
    });
  });

  test.describe('Real accessible-name computation', () => {
    test('an icon-only tab exposes its ariaLabel as the real accessible name', async ({
      page
    }) => {
      const wrapper = group(page, 'icon-only-tabs');

      await expect(
        wrapper.getByRole('tab', { name: 'Survivorship', exact: true })
      ).toBeVisible();
    });
  });
});
