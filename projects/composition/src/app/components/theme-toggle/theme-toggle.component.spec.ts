import { TestBed } from '@angular/core/testing';
import { CpsThemeService } from 'cps-ui-kit';
import { AppTelemetryService } from '../../services/app-telemetry.service';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let themeService: {
    isDark: jest.Mock;
    colorTheme: jest.Mock;
    radiusTheme: jest.Mock;
    baseTheme: jest.Mock;
    toggleTheme: jest.Mock;
    setColorTheme: jest.Mock;
    setRadiusTheme: jest.Mock;
    setBaseTheme: jest.Mock;
  };
  let appTelemetry: { trackThemeChanged: jest.Mock; trackClick: jest.Mock };

  beforeEach(() => {
    themeService = {
      isDark: jest.fn(() => false),
      colorTheme: jest.fn(() => 'neutral'),
      radiusTheme: jest.fn(() => 'rounded'),
      baseTheme: jest.fn(() => 'default'),
      toggleTheme: jest.fn(),
      setColorTheme: jest.fn(),
      setRadiusTheme: jest.fn(),
      setBaseTheme: jest.fn()
    };
    appTelemetry = {
      trackThemeChanged: jest.fn(),
      trackClick: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        { provide: CpsThemeService, useValue: themeService },
        { provide: AppTelemetryService, useValue: appTelemetry }
      ]
    });

    component = TestBed.createComponent(ThemeToggleComponent).componentInstance;
  });

  describe('toggleTheme', () => {
    it('should toggle the underlying theme and report the mode it switched to', () => {
      themeService.isDark.mockReturnValue(true);

      component.toggleTheme();

      expect(themeService.toggleTheme).toHaveBeenCalled();
      expect(appTelemetry.trackThemeChanged).toHaveBeenCalledWith('dark');
    });

    it('should report light when the toggle lands back on light mode', () => {
      themeService.isDark.mockReturnValue(false);

      component.toggleTheme();

      expect(appTelemetry.trackThemeChanged).toHaveBeenCalledWith('light');
    });

    it('should read the resulting mode after toggling, not before', () => {
      let toggled = false;
      themeService.isDark.mockImplementation(() => toggled);
      themeService.toggleTheme.mockImplementation(() => {
        toggled = true;
      });

      component.toggleTheme();

      expect(appTelemetry.trackThemeChanged).toHaveBeenCalledWith('dark');
    });
  });

  describe('theme dimension changes', () => {
    it('should apply and report a color theme change', () => {
      component.setColorTheme('passion');

      expect(themeService.setColorTheme).toHaveBeenCalledWith('passion');
      expect(appTelemetry.trackClick).toHaveBeenCalledWith(
        'theme_option_changed',
        { dimension: 'color', value: 'passion' }
      );
    });

    it('should apply and report a radius theme change', () => {
      component.setRadiusTheme('pill');

      expect(themeService.setRadiusTheme).toHaveBeenCalledWith('pill');
      expect(appTelemetry.trackClick).toHaveBeenCalledWith(
        'theme_option_changed',
        { dimension: 'radius', value: 'pill' }
      );
    });

    it('should apply and report a base theme change', () => {
      component.setBaseTheme('midnight');

      expect(themeService.setBaseTheme).toHaveBeenCalledWith('midnight');
      expect(appTelemetry.trackClick).toHaveBeenCalledWith(
        'theme_option_changed',
        { dimension: 'base', value: 'midnight' }
      );
    });
  });

  describe('menu', () => {
    it('should open and close the menu', () => {
      expect(component.menuOpen).toBe(false);

      component.toggleMenu();
      expect(component.menuOpen).toBe(true);

      component.closeMenu();
      expect(component.menuOpen).toBe(false);
    });

    it('should close an open menu on Escape', () => {
      component.toggleMenu();

      component.onEscapeKey();

      expect(component.menuOpen).toBe(false);
    });

    it('should do nothing on Escape when the menu is already closed', () => {
      expect(() => component.onEscapeKey()).not.toThrow();
      expect(component.menuOpen).toBe(false);
    });
  });
});
