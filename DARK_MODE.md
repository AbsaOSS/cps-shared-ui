# Dark Mode Implementation

This document describes the dark mode feature implemented in the cps-ui-kit library.

## Overview

The dark mode system provides a seamless way to switch between light and dark themes with smooth CSS transitions. It leverages Angular signals for reactive state management and CSS custom properties for theming.

## Features

- ✅ **Light and Dark Themes**: Toggle between light and dark color schemes
- ✅ **Smooth Transitions**: Beautiful 750ms crossfade animation when switching themes
- ✅ **Persistence**: Theme preference saved to localStorage
- ✅ **System Preference Detection**: Automatically detects OS dark mode preference
- ✅ **Type-Safe**: Full TypeScript support with proper types
- ✅ **Reactive**: Built with Angular signals for reactive state management
- ✅ **Accessible**: Proper ARIA labels and keyboard support

## Architecture

### Core Components

1. **CpsThemeService** - Central service managing theme state
2. **CSS Variables** - Color system using CSS custom properties
3. **Theme Transition Styles** - Smooth crossfade animations
4. **Component Dark Mode Support** - Individual component dark mode overrides

### File Structure

```
projects/cps-ui-kit/
├── src/lib/services/cps-theme/
│   ├── cps-theme.service.ts           # Theme management service
│   └── cps-theme.service.spec.ts      # Unit tests
├── styles/
│   ├── _colors.scss                   # Light theme colors (existing)
│   ├── _colors-dark.scss              # Dark theme color overrides
│   ├── _theme-transition.scss         # Transition animations
│   └── styles.scss                    # Main styles file (imports all)
└── public-api.ts                       # Exports CpsThemeService
```

## Usage

### Basic Implementation

#### 1. Import the Service

```typescript
import { Component, inject } from '@angular/core';
import { CpsThemeService } from 'cps-ui-kit';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="toggleTheme()">
      {{ isDark() ? 'Light' : 'Dark' }} Mode
    </button>
  `
})
export class AppComponent {
  private themeService = inject(CpsThemeService);

  isDark = this.themeService.isDark;

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

#### 2. Set a Specific Theme

```typescript
// Set to dark mode with animation
this.themeService.setTheme('dark');

// Set to light mode without animation
this.themeService.setTheme('light', false);
```

#### 3. Read Current Theme

```typescript
// Get current theme signal
const currentTheme = this.themeService.theme();

// Check if dark mode is active
const isDarkMode = this.themeService.isDark();
```

### Theme Toggle Component Example

```typescript
import { Component, inject } from '@angular/core';
import { CpsThemeService, CpsIconComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-theme-toggle',
  imports: [CpsIconComponent],
  template: `
    <button
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="
        isDark() ? 'Switch to light mode' : 'Switch to dark mode'
      "
      type="button">
      <cps-icon [icon]="isDark() ? 'sun' : 'moon'" [size]="20"> </cps-icon>
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        background: transparent;
        border: 1px solid var(--cps-color-line-mid);
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--cps-color-highlight-hover);
        }

        &:focus {
          outline: 2px solid var(--cps-color-calm);
          outline-offset: 2px;
        }
      }
    `
  ]
})
export class ThemeToggleComponent {
  private themeService = inject(CpsThemeService);

  isDark = this.themeService.isDark;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
```

## Adding Dark Mode Support to Components

### Using CSS Variables

Components should use CSS variables for colors. The dark theme will automatically apply when `[data-theme='dark']` is set on the `<html>` element.

```scss
:host {
  .my-component {
    background: var(--cps-color-bg-light);
    color: var(--cps-color-text-dark);
    border: 1px solid var(--cps-color-line-mid);
  }
}
```

### Component-Specific Dark Mode Overrides

For components that need specific dark mode styling:

```scss
:host {
  .my-component {
    background: white;
    color: black;
  }

  // Dark mode overrides
  [data-theme='dark'] & {
    .my-component {
      background: var(--cps-color-bg-mid);
      color: var(--cps-color-text-light);
    }
  }
}
```

## Available CSS Variables

### Semantic Tokens (use these in components)

| Token                                                                                             | Description                                                       |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `--cps-accent-primary` / `--cps-accent-primary-contrast`                                          | Main action color and its readable text color                     |
| `--cps-accent-secondary` / `--cps-accent-secondary-contrast`                                      | Secondary action color pairing                                    |
| `--cps-surface-body` / `--cps-surface-muted` / `--cps-surface-elevated` / `--cps-surface-control` | Layered background surfaces (page, muted panels, cards, controls) |
| `--cps-surface-overlay`                                                                           | Backdrop color for modals, drawers, etc.                          |
| `--cps-text-primary` / `--cps-text-secondary` / `--cps-text-muted`                                | Standard text hierarchy                                           |
| `--cps-text-inverse`                                                                              | Text on very light surfaces when in dark theme (and vice versa)   |
| `--cps-text-on-accent`                                                                            | Text/icon color that sits on top of accent fills                  |
| `--cps-border-color` / `--cps-border-strong` / `--cps-border-focus`                               | Divider, card, and focus-ring colors                              |
| `--cps-highlight-hover` / `--cps-highlight-active` / `--cps-highlight-selected`                   | Interactive feedback surfaces                                     |
| `--cps-state-info`, `--cps-state-success`, `--cps-state-warn`, `--cps-state-error`                | Base color for stateful UI (borders, icons, badges)               |
| `--cps-state-*-contrast`                                                                          | Text/icon color to render on the matching state fill              |
| `--cps-state-*-surface`                                                                           | Background color for inline alerts, tags, etc.                    |

> ✅ **Rule of thumb:** application and library components should reference only these semantic tokens. The underlying palette (`--cps-color-calm`, `--cps-color-passion`, etc.) is free to evolve per theme without forcing component changes.

### Background Colors

- `--cps-color-bg-lightest` - Lightest background
- `--cps-color-bg-light` - Light background
- `--cps-color-bg-mid` - Medium background
- `--cps-color-bg-dark` - Dark background

### Text Colors

- `--cps-color-text-lightest` - Lightest text
- `--cps-color-text-light` - Light text
- `--cps-color-text-mild` - Mild text
- `--cps-color-text-dark` - Dark text
- `--cps-color-text-darkest` - Darkest text

### Line Colors

- `--cps-color-line-light` - Light borders/lines
- `--cps-color-line-mid` - Medium borders/lines
- `--cps-color-line-dark` - Dark borders/lines
- `--cps-color-line-darkest` - Darkest borders/lines

### Highlight Colors

- `--cps-color-highlight-hover` - Hover state
- `--cps-color-highlight-active` - Active/pressed state
- `--cps-color-highlight-selected` - Selected state
- `--cps-color-highlight-selected-dark` - Dark selected state

### State Colors

- `--cps-color-info` / `--cps-color-info-bg` - Info state
- `--cps-color-success` / `--cps-color-success-bg` - Success state
- `--cps-color-warn` / `--cps-color-warn-bg` - Warning state
- `--cps-color-error` / `--cps-color-error-bg` - Error state

All brand colors (energy, prepared, agile, passion, etc.) are also available with their dark mode variants.

## API Reference

### CpsThemeService

#### Properties

| Property | Type               | Description                                   |
| -------- | ------------------ | --------------------------------------------- |
| `theme`  | `Signal<CpsTheme>` | Current active theme (readonly signal)        |
| `isDark` | `Signal<boolean>`  | Whether dark mode is active (computed signal) |

#### Methods

| Method          | Parameters                            | Description                                |
| --------------- | ------------------------------------- | ------------------------------------------ |
| `toggleTheme()` | -                                     | Toggle between light and dark themes       |
| `setTheme()`    | `theme: CpsTheme, animated?: boolean` | Set specific theme with optional animation |

#### Types

```typescript
type CpsTheme = 'light' | 'dark';
```

## Browser Support

The dark mode implementation uses modern CSS features:

- CSS Custom Properties (CSS Variables)
- CSS Transitions
- `prefers-color-scheme` media query

Supported browsers:

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+

## Performance Considerations

- **Smooth Transitions**: The 750ms transition is applied only during theme changes
- **Efficient Updates**: Uses Angular signals for reactive, efficient updates
- **No Layout Shifts**: Only colors change, no layout recalculations
- **Optimized Selectors**: Uses efficient CSS selectors

## Accessibility

The dark mode implementation follows accessibility best practices:

- ✅ Maintains WCAG AA contrast ratios in both themes
- ✅ Respects `prefers-color-scheme` system preference
- ✅ Proper ARIA labels on theme toggle buttons
- ✅ Keyboard accessible controls
- ✅ Focus indicators visible in both themes

## Testing

Run the unit tests:

```bash
npm test -- cps-theme.service
```

## Future Enhancements

Potential improvements for future releases:

- High contrast theme option
- Custom theme creation API
- Per-component theme overrides
- Theme preview mode
- Automatic image adjustments for dark mode

## Credits

Implementation inspired by the article "Dark theme in a day" by Marcin Wichary, utilizing modern CSS features and Angular's reactive primitives.
