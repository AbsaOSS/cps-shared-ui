import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  CpsBaseTheme,
  CpsColorTheme,
  CpsIconComponent,
  CpsRadiusTheme,
  CpsThemeService
} from 'cps-ui-kit';
import { AppTelemetryService } from '../../services/app-telemetry.service';

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
  private appTelemetry = inject(AppTelemetryService);

  isDark = this.themeService.isDark;
  colorTheme = this.themeService.colorTheme;
  radiusTheme = this.themeService.radiusTheme;
  baseTheme = this.themeService.baseTheme;
  menuOpen = false;

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.appTelemetry.trackThemeChanged(
      this.themeService.isDark() ? 'dark' : 'light'
    );
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
    this._applyTheme('color', value, (v) => this.themeService.setColorTheme(v));
  }

  setRadiusTheme(value: CpsRadiusTheme): void {
    this._applyTheme('radius', value, (v) =>
      this.themeService.setRadiusTheme(v)
    );
  }

  setBaseTheme(value: CpsBaseTheme): void {
    this._applyTheme('base', value, (v) => this.themeService.setBaseTheme(v));
  }

  /** Applies one theme dimension and reports it. */
  private _applyTheme<T extends string | number | boolean | null>(
    dimension: string,
    value: T,
    setter: (value: T) => void
  ): void {
    setter(value);
    this.appTelemetry.trackClick('theme_option_changed', { dimension, value });
  }
}
