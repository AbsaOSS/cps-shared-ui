import { TestBed } from '@angular/core/testing';
import { CpsThemeService } from './cps-theme.service';

describe('CpsThemeService', () => {
  let service: CpsThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CpsThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with light theme by default', () => {
    expect(service.theme()).toBe('light');
  });

  it('should toggle theme', () => {
    const initialTheme = service.theme();
    service.toggleTheme();
    const newTheme = service.theme();
    expect(newTheme).not.toBe(initialTheme);
  });

  it('should save theme preference to localStorage', () => {
    service.setTheme('dark', false);
    expect(localStorage.getItem('cps-theme-preference')).toBe('dark');
  });

  it('should compute isDark correctly', () => {
    service.setTheme('dark', false);
    expect(service.isDark()).toBe(true);
    service.setTheme('light', false);
    expect(service.isDark()).toBe(false);
  });

  it('should apply color-scheme based on current theme', () => {
    service.setTheme('dark', false);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    service.setTheme('light', false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('should initialize with calm color theme by default', () => {
    expect(service.colorTheme()).toBe('calm');
  });

  it('should save color theme preference to localStorage', () => {
    service.setColorTheme('energy', false);
    expect(localStorage.getItem('cps-color-theme-preference')).toBe('energy');
  });

  it('should save base theme preference to localStorage', () => {
    service.setBaseTheme('midnight', false);
    expect(localStorage.getItem('cps-base-theme-preference')).toBe('midnight');
  });

  it('should save radius theme preference to localStorage', () => {
    service.setRadiusTheme('rounded', false);
    expect(localStorage.getItem('cps-radius-theme-preference')).toBe('rounded');
  });

  it('should initialize with compact radius theme by default', () => {
    expect(service.radiusTheme()).toBe('compact');
  });

  describe('animated transitions', () => {
    it('should add and schedule removal of the transition class when animated', () => {
      jest.useFakeTimers();
      service.setTheme('dark', true);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(true);
      jest.advanceTimersByTime(500);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(false);
      jest.useRealTimers();
    });

    it('should clear a pending transition timeout when toggling again quickly', () => {
      jest.useFakeTimers();
      service.setTheme('dark', true);
      service.setTheme('light', true);
      jest.advanceTimersByTime(500);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(false);
      jest.useRealTimers();
    });

    it('should not add the transition class when animated is false', () => {
      service.setTheme('dark', false);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(false);
    });

    it('should animate setColorTheme by default', () => {
      jest.useFakeTimers();
      service.setColorTheme('energy');
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(true);
      jest.advanceTimersByTime(500);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(false);
      jest.useRealTimers();
    });

    it('should animate setBaseTheme by default', () => {
      jest.useFakeTimers();
      service.setBaseTheme('midnight');
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(true);
      jest.advanceTimersByTime(500);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(false);
      jest.useRealTimers();
    });

    it('should animate setRadiusTheme by default', () => {
      jest.useFakeTimers();
      service.setRadiusTheme('pill');
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(true);
      jest.advanceTimersByTime(500);
      expect(
        document.documentElement.classList.contains('cps-theme-transition')
      ).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('no-op when setting the same value', () => {
    it('should not re-apply theme when setting the same theme', () => {
      service.setTheme('light', false);
      expect(service.theme()).toBe('light');
    });

    it('should not re-apply color theme when setting the same color theme', () => {
      service.setColorTheme('calm', false);
      expect(service.colorTheme()).toBe('calm');
    });

    it('should not re-apply base theme when setting the same base theme', () => {
      service.setBaseTheme('default', false);
      expect(service.baseTheme()).toBe('default');
    });

    it('should not re-apply radius theme when setting the same radius theme', () => {
      service.setRadiusTheme('compact', false);
      expect(service.radiusTheme()).toBe('compact');
    });
  });

  describe('initial theme from localStorage', () => {
    afterEach(() => {
      localStorage.clear();
      TestBed.resetTestingModule();
    });

    it('should read a stored dark theme preference', () => {
      localStorage.setItem('cps-theme-preference', 'dark');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);
      expect(freshService.theme()).toBe('dark');
    });

    it('should ignore an invalid stored theme preference', () => {
      localStorage.setItem('cps-theme-preference', 'not-a-theme');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);
      expect(freshService.theme()).toBe('light');
    });

    it('should read a stored color theme preference', () => {
      localStorage.setItem('cps-color-theme-preference', 'passion');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);
      expect(freshService.colorTheme()).toBe('passion');
    });

    it('should read a stored base theme preference', () => {
      localStorage.setItem('cps-base-theme-preference', 'graphite');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);
      expect(freshService.baseTheme()).toBe('graphite');
    });

    it('should read a stored radius theme preference', () => {
      localStorage.setItem('cps-radius-theme-preference', 'pill');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);
      expect(freshService.radiusTheme()).toBe('pill');
    });
  });

  describe('watchSystemTheme', () => {
    afterEach(() => {
      TestBed.resetTestingModule();
    });

    it('should do nothing when matchMedia is unavailable', () => {
      const original = window.matchMedia;
      (window as any).matchMedia = undefined;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      expect(() => TestBed.inject(CpsThemeService)).not.toThrow();
      window.matchMedia = original;
    });

    it('should switch theme on system change when no preference is stored', () => {
      let changeHandler: ((e: { matches: boolean }) => void) | undefined;
      const original = window.matchMedia;
      (window as any).matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: (_: string, handler: any) => {
          changeHandler = handler;
        },
        removeEventListener: jest.fn()
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);

      changeHandler?.({ matches: true });
      expect(freshService.theme()).toBe('dark');

      window.matchMedia = original;
    });

    it('should not switch theme on system change when a preference is already stored', () => {
      let changeHandler: ((e: { matches: boolean }) => void) | undefined;
      const original = window.matchMedia;
      (window as any).matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: (_: string, handler: any) => {
          changeHandler = handler;
        },
        removeEventListener: jest.fn()
      });
      localStorage.setItem('cps-theme-preference', 'light');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(CpsThemeService);

      changeHandler?.({ matches: true });
      expect(freshService.theme()).toBe('light');

      window.matchMedia = original;
    });
  });
});
