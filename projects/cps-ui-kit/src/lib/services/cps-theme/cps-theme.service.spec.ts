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

  it('should initialize with system preference', () => {
    expect(['light', 'dark']).toContain(service.theme());
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
});
