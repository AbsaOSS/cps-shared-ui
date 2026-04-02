import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

/**
 * Available theme options
 * @group Types
 */
export type CpsTheme = 'light' | 'dark';

/**
 * Available color theme options
 * @group Types
 */
export type CpsColorTheme = 'neutral' | 'calm' | 'energy' | 'passion';

/**
 * Available dark-mode base theme options
 * @group Types
 */
export type CpsBaseTheme = 'default' | 'graphite' | 'midnight' | 'aubergine';

/**
 * Available radius theme options
 * @group Types
 */
export type CpsRadiusTheme = 'none' | 'compact' | 'rounded' | 'pill';

/**
 * CpsThemeService manages application theming including dark mode support.
 *
 * This service provides:
 * - Light and dark theme switching with smooth transitions
 * - Automatic persistence of theme preference in localStorage
 * - Reactive state management using Angular signals
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   private themeService = inject(CpsThemeService);
 *
 *   isDark = this.themeService.isDark;
 *
 *   toggleTheme() {
 *     this.themeService.toggleTheme();
 *   }
 * }
 * ```
 *
 * @group Services
 */
@Injectable({
  providedIn: 'root'
})
export class CpsThemeService {
  private document = inject(DOCUMENT);
  private readonly THEME_STORAGE_KEY = 'cps-theme-preference';
  private readonly COLOR_THEME_STORAGE_KEY = 'cps-color-theme-preference';
  private readonly BASE_THEME_STORAGE_KEY = 'cps-base-theme-preference';
  private readonly RADIUS_THEME_STORAGE_KEY = 'cps-radius-theme-preference';
  private readonly TRANSITION_CLASS = 'cps-theme-transition';
  private readonly TRANSITION_DURATION = 500;
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null;

  private _theme = signal<CpsTheme>(this.getInitialTheme());
  private _colorTheme = signal<CpsColorTheme>(this.getInitialColorTheme());
  private _baseTheme = signal<CpsBaseTheme>(this.getInitialBaseTheme());
  private _radiusTheme = signal<CpsRadiusTheme>(this.getInitialRadiusTheme());

  /**
   * Current active theme (readonly)
   */
  readonly theme = this._theme.asReadonly();

  /**
   * Current active color theme (readonly)
   */
  readonly colorTheme = this._colorTheme.asReadonly();

  /**
   * Current active base theme (readonly)
   */
  readonly baseTheme = this._baseTheme.asReadonly();

  /**
   * Current active radius theme (readonly)
   */
  readonly radiusTheme = this._radiusTheme.asReadonly();

  /**
   * Whether dark mode is currently active
   */
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Apply initial theme to DOM synchronously
    this.applyCurrentTheme();

    // Listen for system theme changes
    this.watchSystemTheme();
  }

  /**
   * Toggle between light and dark themes with smooth transition
   */
  toggleTheme(): void {
    const newTheme: CpsTheme = this._theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   * @param theme - Theme to apply ('light' or 'dark')
   * @param animated - Whether to animate the transition (default: true)
   */
  setTheme(theme: CpsTheme, animated = true): void {
    if (this._theme() === theme) return;

    if (animated) {
      this.enableTransition();
    }

    this._theme.set(theme);
    this.saveThemePreference(theme);
    this.applyCurrentTheme();

    if (animated) {
      this.scheduleDisableTransition();
    }
  }

  /**
   * Set specific color theme independently from mode
   * @param colorTheme - Color theme to apply
   * @param animated - Whether to animate the transition (default: true)
   */
  setColorTheme(colorTheme: CpsColorTheme, animated = true): void {
    if (this._colorTheme() === colorTheme) return;

    if (animated) {
      this.enableTransition();
    }

    this._colorTheme.set(colorTheme);
    this.saveColorThemePreference(colorTheme);
    this.applyCurrentTheme();

    if (animated) {
      this.scheduleDisableTransition();
    }
  }

  /**
   * Set base background theme (primarily affects dark mode)
   */
  setBaseTheme(baseTheme: CpsBaseTheme, animated = true): void {
    if (this._baseTheme() === baseTheme) return;

    if (animated) {
      this.enableTransition();
    }

    this._baseTheme.set(baseTheme);
    this.saveBaseThemePreference(baseTheme);
    this.applyCurrentTheme();

    if (animated) {
      this.scheduleDisableTransition();
    }
  }

  /**
   * Set radius profile
   */
  setRadiusTheme(radiusTheme: CpsRadiusTheme, animated = true): void {
    if (this._radiusTheme() === radiusTheme) return;

    if (animated) {
      this.enableTransition();
    }

    this._radiusTheme.set(radiusTheme);
    this.saveRadiusThemePreference(radiusTheme);
    this.applyCurrentTheme();

    if (animated) {
      this.scheduleDisableTransition();
    }
  }

  private applyCurrentTheme(): void {
    this.document.documentElement.setAttribute('data-theme', this._theme());
    this.document.documentElement.setAttribute(
      'data-color-theme',
      this._colorTheme()
    );
    this.document.documentElement.setAttribute(
      'data-base-theme',
      this._baseTheme()
    );
    this.document.documentElement.setAttribute(
      'data-radius-theme',
      this._radiusTheme()
    );
  }

  private enableTransition(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    this.document.documentElement.classList.add(this.TRANSITION_CLASS);
  }

  private scheduleDisableTransition(): void {
    this.transitionTimeout = setTimeout(() => {
      this.document.documentElement.classList.remove(this.TRANSITION_CLASS);
      this.transitionTimeout = null;
    }, this.TRANSITION_DURATION);
  }

  private getInitialTheme(): CpsTheme {
    // Check saved preference first
    const stored = localStorage.getItem(
      this.THEME_STORAGE_KEY
    ) as CpsTheme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Fall back to light mode
    return 'light';
  }

  private getInitialColorTheme(): CpsColorTheme {
    const stored = localStorage.getItem(
      this.COLOR_THEME_STORAGE_KEY
    ) as CpsColorTheme | null;

    if (
      stored === 'neutral' ||
      stored === 'calm' ||
      stored === 'energy' ||
      stored === 'passion'
    ) {
      return stored;
    }

    return 'calm';
  }

  private getInitialBaseTheme(): CpsBaseTheme {
    const stored = localStorage.getItem(
      this.BASE_THEME_STORAGE_KEY
    ) as CpsBaseTheme | null;

    if (
      stored === 'default' ||
      stored === 'graphite' ||
      stored === 'midnight' ||
      stored === 'aubergine'
    ) {
      return stored;
    }

    return 'default';
  }

  private getInitialRadiusTheme(): CpsRadiusTheme {
    const stored = localStorage.getItem(
      this.RADIUS_THEME_STORAGE_KEY
    ) as CpsRadiusTheme | null;

    if (
      stored === 'none' ||
      stored === 'compact' ||
      stored === 'rounded' ||
      stored === 'pill'
    ) {
      return stored;
    }

    return 'compact';
  }

  // TODO: Use as fallback in getInitialTheme() once dark mode is fully supported across all components.
  private getSystemTheme(): CpsTheme {
    const win = this.document.defaultView;
    if (!win?.matchMedia) return 'light';
    return win.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // TODO: Enable system preference fallback once dark mode is fully supported across all components.
  private watchSystemTheme(): void {
    const win = this.document.defaultView;
    if (!win?.matchMedia) return;
    const mediaQuery = win.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  private saveThemePreference(theme: CpsTheme): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }

  private saveColorThemePreference(colorTheme: CpsColorTheme): void {
    localStorage.setItem(this.COLOR_THEME_STORAGE_KEY, colorTheme);
  }

  private saveBaseThemePreference(baseTheme: CpsBaseTheme): void {
    localStorage.setItem(this.BASE_THEME_STORAGE_KEY, baseTheme);
  }

  private saveRadiusThemePreference(radiusTheme: CpsRadiusTheme): void {
    localStorage.setItem(this.RADIUS_THEME_STORAGE_KEY, radiusTheme);
  }
}
