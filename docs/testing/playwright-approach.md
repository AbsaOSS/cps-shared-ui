# Playwright Testing Approach

## Overview

This document outlines the approach for implementing Playwright tests for the CPS Shared UI component library. Playwright has been chosen as a complementary testing tool to provide robust end-to-end (E2E) and integration testing capabilities alongside our existing Jest unit tests and Cypress E2E tests.

## Runner Choice & Rationale

### Why Playwright?

We selected Playwright for the following reasons:

1. **Modern Architecture**: Playwright provides a modern, actively maintained testing framework with excellent TypeScript support.

2. **Multi-Browser Support**: Native support for Chromium, Firefox, and WebKit, ensuring cross-browser compatibility.

3. **Reliability**: Playwright's auto-waiting and retry mechanisms reduce flakiness in tests.

4. **Performance**: Tests run in parallel by default, providing faster test execution.

5. **Developer Experience**: 
   - Excellent debugging tools including UI mode and trace viewer
   - Built-in test generation and codegen tools
   - Rich assertion library with async/await support

6. **Complementary to Existing Tools**:
   - **Jest**: Continues to handle unit tests for isolated component logic
   - **Cypress**: Remains for full E2E workflow testing
   - **Playwright**: Focuses on component-level integration and UI interaction testing
   - **pa11y-ci**: Continues to handle accessibility testing

## Component Testing Approach

### Testing Strategy

Playwright tests in this project focus on:

1. **Component Integration**: Testing how components render and behave in the actual documentation/composition application
2. **User Interactions**: Validating click handlers, input changes, and other user interactions
3. **Visual Verification**: Ensuring components are visible and properly styled
4. **Accessibility**: Complementing pa11y-ci with interactive accessibility testing

### Component Mounting Approach

Rather than using component testing (which would require experimental packages), we leverage the existing **composition application** as a test harness:

- Tests navigate to actual component pages (e.g., `/button`, `/chip`)
- Components are tested in their real rendering context
- This approach:
  - Requires no additional mounting infrastructure
  - Tests components as users see them
  - Validates the documentation app alongside components
  - Simplifies setup and maintenance

## Directory Structure

```
cps-shared-ui/
├── playwright/                    # Playwright test directory
│   ├── components/               # Component-level tests
│   │   ├── cps-button.spec.ts   # Button component tests
│   │   ├── cps-chip.spec.ts     # Chip component tests
│   │   └── ...                   # Additional component tests
│   └── integration/              # Integration tests (future)
│       └── ...
├── playwright.config.ts          # Playwright configuration
├── docs/
│   └── testing/
│       └── playwright-approach.md # This document
└── package.json                  # Updated with Playwright scripts
```

### File Naming Conventions

- Component tests: `cps-{component-name}.spec.ts`
- Integration tests: `{feature-name}.spec.ts`
- Use `.spec.ts` extension (consistent with Jest)

## Example Tests

### Button Component Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('CPS Button Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/button');
  });

  test('should display button with label', async ({ page }) => {
    const button = page.locator('cps-button').filter({ hasText: 'Normal button' }).first();
    await expect(button).toBeVisible();
  });

  test('should be clickable and emit click event', async ({ page }) => {
    const button = page.locator('cps-button').filter({ hasText: 'Normal button' }).first();
    await button.locator('button').click();
    await expect(button.locator('button')).toBeEnabled();
  });
});
```

### Chip Component Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('CPS Chip Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chip');
  });

  test('should display chip with label', async ({ page }) => {
    const chip = page.locator('cps-chip').first();
    await expect(chip).toBeVisible();
  });

  test('should display closable chip with close button', async ({ page }) => {
    const closableChip = page.locator('cps-chip')
      .filter({ has: page.locator('.cps-chip-close-icon') })
      .first();
    await expect(closableChip).toBeVisible();
  });
});
```

## Test Patterns & Best Practices

### Locator Strategies

1. **Semantic Selectors**: Use component selectors (`cps-button`, `cps-chip`)
2. **Text-based**: Filter by visible text for better readability
3. **Data Attributes**: Use `data-testid` when semantic selectors aren't sufficient
4. **Class Selectors**: For internal component structure (use sparingly)

### Async/Await Pattern

All Playwright actions are asynchronous:
```typescript
await page.goto('/button');
await button.click();
await expect(element).toBeVisible();
```

### Test Organization

- Group related tests with `test.describe()`
- Use `test.beforeEach()` for common setup
- Keep tests focused on single behaviors
- Aim for descriptive test names

## Visual Testing Plan

### Current Approach

Visual testing is handled through:
1. Playwright's built-in screenshot capabilities (on-demand)
2. Manual visual review during development
3. Existing accessibility checks via pa11y-ci

### Future Enhancements

Potential visual testing improvements:

1. **Snapshot Testing**: Add visual regression testing using Playwright's screenshot comparison
2. **Percy Integration**: Consider Percy or similar visual testing platforms
3. **Responsive Testing**: Add viewport variations for mobile/tablet/desktop
4. **Theme Testing**: Validate components across different color schemes

Implementation recommendations:
```typescript
// Example: Visual regression test (future)
test('button should match visual snapshot', async ({ page }) => {
  await page.goto('/button');
  await expect(page).toHaveScreenshot('button-page.png');
});
```

## Running Tests

### Local Development

```bash
# Run all Playwright tests
npm run playwright

# Run tests in UI mode (interactive)
npm run playwright:ui

# Run tests in headed mode (see browser)
npm run playwright:headed

# View test report
npm run playwright:report
```

### Debugging

```bash
# Run in UI mode for debugging
npm run playwright:ui

# Run specific test file
npx playwright test playwright/components/cps-button.spec.ts

# Run with debug mode
PWDEBUG=1 npx playwright test
```

## CI Integration Approach

### GitHub Actions Workflow

Add a new job to `.github/workflows/cps-shared-ui-checkers.yml`:

```yaml
playwright:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: npm

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium

    - name: Run Playwright tests
      run: npm run playwright

    - name: Upload Playwright Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### CI Configuration

The `playwright.config.ts` already includes CI-specific settings:

- **Retries**: Tests retry 2 times on CI (0 locally)
- **Workers**: Single worker on CI for stability
- **Web Server**: Auto-starts dev server before tests
- **Fail on `.only`**: Prevents accidentally committed focused tests

### Test Artifacts

On CI, Playwright automatically generates:
- HTML test report
- Screenshots on failure
- Test traces for debugging

These are uploaded as GitHub Actions artifacts for review.

## Migration Strategy

### Phase 1: PoC (Current)
- ✅ Install and configure Playwright
- ✅ Create 2 example tests (button, chip)
- ✅ Document approach
- ✅ Verify local test execution

### Phase 2: Expand Coverage
- Add tests for 5-10 most critical components
- Establish test patterns and conventions
- Add CI integration
- Train team on Playwright usage

### Phase 3: Full Integration
- Comprehensive component coverage
- Visual regression testing
- Performance benchmarks
- Integration with existing testing workflows

## Maintenance & Best Practices

### When to Use Each Testing Tool

| Tool | Use Case |
|------|----------|
| **Jest** | Unit tests, isolated component logic, service testing |
| **Playwright** | Component integration, UI interactions, visual verification |
| **Cypress** | Full E2E workflows, multi-page user journeys |
| **pa11y-ci** | Automated accessibility compliance checking |

### Code Review Checklist

- [ ] Tests use semantic locators
- [ ] Test names clearly describe behavior
- [ ] No hardcoded waits (use Playwright's auto-waiting)
- [ ] Tests are independent (no shared state)
- [ ] Appropriate use of `.first()`, `.nth()` for multiple elements

### Performance Considerations

- Run tests in parallel (default)
- Use `fullyParallel: true` for faster execution
- Limit unnecessary page navigations
- Reuse test context when possible

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Angular Testing Guide](https://angular.dev/guide/testing)

## Conclusion

Playwright provides a robust, modern testing solution that complements our existing test infrastructure. By leveraging the composition application as a test harness, we can efficiently test component behavior without complex setup. This approach balances comprehensive testing with maintainability and developer experience.
