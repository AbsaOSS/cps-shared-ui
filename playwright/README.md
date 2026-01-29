# Playwright Tests

This directory contains Playwright tests for the CPS Shared UI component library.

## Structure

```
playwright/
├── components/          # Component-level tests
│   ├── cps-button.spec.ts
│   ├── cps-chip.spec.ts
│   └── ...
└── integration/         # Integration tests (future)
```

## Running Tests

```bash
# Run all tests
npm run playwright

# Run tests in UI mode (interactive debugging)
npm run playwright:ui

# Run tests in headed mode (see browser)
npm run playwright:headed

# View test report
npm run playwright:report

# Run specific test file
npx playwright test playwright/components/cps-button.spec.ts

# Debug tests
PWDEBUG=1 npx playwright test
```

## Writing Tests

Tests should follow these patterns:

1. **Use semantic selectors**: Target components by their selectors (e.g., `cps-button`)
2. **Filter by visible text**: Use `.filter({ hasText: 'text' })` for readability
3. **Keep tests focused**: Each test should verify a single behavior
4. **Use descriptive names**: Test names should clearly describe what is being tested

Example:

```typescript
test('should display button with label', async ({ page }) => {
  await page.goto('/button');
  const button = page.locator('cps-button').filter({ hasText: 'Normal button' }).first();
  await expect(button).toBeVisible();
});
```

## Test Coverage

Currently covered components:
- ✅ Button
- ✅ Chip

See `/docs/testing/playwright-approach.md` for comprehensive documentation.
