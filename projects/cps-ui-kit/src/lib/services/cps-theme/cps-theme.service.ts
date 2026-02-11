import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

/**
 * Available theme options
 * @group Types
 */
export type CpsTheme = 'light' | 'dark';

/**
 * CpsThemeService manages application theming including dark mode support.
 *
 * This service provides:
 * - Light and dark theme switching with smooth transitions
 * - Automatic persistence of theme preference in localStorage
 * - System preference detection (prefers-color-scheme)
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
  private readonly TRANSITION_CLASS = 'cps-theme-transition';
  private readonly TRANSITION_DURATION = 500;

  private _theme = signal<CpsTheme>(this.getInitialTheme());

  /**
   * Current active theme (readonly)
   */
  readonly theme = this._theme.asReadonly();

  /**
   * Whether dark mode is currently active
   */
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Apply theme changes to DOM whenever theme signal changes
    effect(() => {
      this.applyTheme(this._theme());
    });

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

    if (animated) {
      setTimeout(() => this.disableTransition(), this.TRANSITION_DURATION);
    }
  }

  private applyTheme(theme: CpsTheme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private enableTransition(): void {
    this.document.documentElement.classList.add(this.TRANSITION_CLASS);
  }

  private disableTransition(): void {
    this.document.documentElement.classList.remove(this.TRANSITION_CLASS);
  }

  private getInitialTheme(): CpsTheme {
    // Check saved preference first
    const stored = localStorage.getItem(
      this.THEME_STORAGE_KEY
    ) as CpsTheme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Fall back to system preference
    return this.getSystemTheme();
  }

  private getSystemTheme(): CpsTheme {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }

  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
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
}
