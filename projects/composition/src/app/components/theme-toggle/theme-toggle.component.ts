import { Component, inject } from '@angular/core';
import { CpsIconComponent, CpsThemeService } from 'cps-ui-kit';

@Component({
  selector: 'app-theme-toggle',
  imports: [CpsIconComponent],
  template: `
    <button
      class="theme-toggle-btn"
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
      .theme-toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--cps-color-line-mid);
        border-radius: 4px;
        color: var(--cps-color-text-dark);
        cursor: pointer;
        font-family: 'Source Sans Pro', sans-serif;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
          background: var(--cps-color-highlight-hover);
          border-color: var(--cps-color-calm);
        }

        &:active {
          background: var(--cps-color-highlight-active);
        }

        &:focus-visible {
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
