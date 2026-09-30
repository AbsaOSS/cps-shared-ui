import {
  test as base,
  expect,
  type Page,
  type TestInfo
} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Violations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];
type Incomplete = Awaited<ReturnType<AxeBuilder['analyze']>>['incomplete'];

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22a',
        'wcag22aa',
        'best-practice'
      ]);
    await use(makeAxeBuilder);
  }
});

export function formatViolations(violations: Violations): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.html}\n      ${n.failureSummary}`)
        .join('\n');
      return `\n[${v.impact}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n${nodes}`;
    })
    .join('\n');
}

export function expectNoViolations(violations: Violations) {
  expect(violations, formatViolations(violations)).toHaveLength(0);
}

/**
 * Surfaces axe's "incomplete" results (things it couldn't automatically
 * confirm as pass/fail, e.g. combobox `aria-controls` or occluded-element
 * color-contrast checks) as a non-blocking annotation, visible in the HTML
 * report, without failing the test.
 */
export function annotateIncomplete(testInfo: TestInfo, incomplete: Incomplete) {
  if (incomplete.length === 0) return;
  testInfo.annotations.push({
    type: 'warning',
    description: incomplete
      .map(
        (r) => `[${r.impact ?? 'unknown'}] ${r.id} (${r.nodes.length} node(s))`
      )
      .join('; ')
  });
}

/**
 * Wait for all animations/transitions to complete before scanning.
 * Without this, axe may capture intermediate states (e.g. mid-transition
 * background color) and report false-positive color contrast violations.
 */
export async function waitForAnimationsToFinish(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {}))
    )
  );
}
