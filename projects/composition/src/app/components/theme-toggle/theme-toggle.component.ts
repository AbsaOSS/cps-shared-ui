import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  CpsBaseTheme,
  CpsColorTheme,
  CpsIconComponent,
  CpsRadiusTheme,
  CpsThemeService
} from 'cps-ui-kit';

@Component({
  selector: 'app-theme-toggle',
  imports: [CpsIconComponent],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()'
  }
})
export class ThemeToggleComponent {
  private themeService = inject(CpsThemeService);

  showCustomize =
    new URLSearchParams(window.location.search).get('experimental') === 'true';

  isDark = this.themeService.isDark;
  colorTheme = this.themeService.colorTheme;
  radiusTheme = this.themeService.radiusTheme;
  baseTheme = this.themeService.baseTheme;
  menuOpen = false;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  onEscapeKey(): void {
    if (this.menuOpen) {
      this.closeMenu();
    }
  }

  setColorTheme(value: CpsColorTheme): void {
    this.themeService.setColorTheme(value);
  }

  setRadiusTheme(value: CpsRadiusTheme): void {
    this.themeService.setRadiusTheme(value);
  }

  setBaseTheme(value: CpsBaseTheme): void {
    this.themeService.setBaseTheme(value);
  }
}
