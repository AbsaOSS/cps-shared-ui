import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CpsThemeService } from 'cps-ui-kit';
import { AppComponent } from './app.component';

jest.mock('projects/cps-ui-kit/package.json', () => ({ version: '1.0.0' }), {
  virtual: true
});

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let routerEvents$: Subject<unknown>;
  let matchMediaChangeCb: ((e: MediaQueryListEvent) => void) | null;
  let doc: Document;

  beforeAll(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: jest.fn()
      });
    }
  });

  function mockMatchMedia(mobile: boolean): void {
    matchMediaChangeCb = null;
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: mobile,
      addEventListener: jest.fn(
        (_: string, cb: (e: MediaQueryListEvent) => void) => {
          matchMediaChangeCb = cb;
        }
      ),
      removeEventListener: jest.fn()
    } as Partial<MediaQueryList>);
  }

  async function setup(mobile = false): Promise<void> {
    mockMatchMedia(mobile);
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: { events: routerEvents$ } },
        {
          provide: ActivatedRoute,
          useValue: {
            firstChild: { snapshot: { routeConfig: { title: 'Button' } } }
          }
        },
        { provide: CpsThemeService, useValue: { isDark: signal(false) } }
      ]
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    routerEvents$ = new Subject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('viewport initialisation', () => {
    it('sets isMobile=false and sidebarExpanded=true on desktop', async () => {
      await setup(false);
      expect(component.isMobile).toBe(false);
      expect(component.sidebarExpanded).toBe(true);
    });

    it('sets isMobile=true and sidebarExpanded=false on mobile', async () => {
      await setup(true);
      expect(component.isMobile).toBe(true);
      expect(component.sidebarExpanded).toBe(false);
    });
  });

  describe('matchMedia change', () => {
    it('switches to mobile state when breakpoint enters mobile range', async () => {
      await setup(false);
      matchMediaChangeCb!({ matches: true } as MediaQueryListEvent);
      expect(component.isMobile).toBe(true);
      expect(component.sidebarExpanded).toBe(false);
    });

    it('switches to desktop state when breakpoint leaves mobile range', async () => {
      await setup(true);
      matchMediaChangeCb!({ matches: false } as MediaQueryListEvent);
      expect(component.isMobile).toBe(false);
      expect(component.sidebarExpanded).toBe(true);
    });
  });

  describe('NavigationEnd on desktop', () => {
    beforeEach(async () => setup(false));

    it('sets componentTitle to uppercased route title', fakeAsync(() => {
      routerEvents$.next(new NavigationEnd(1, '/button', '/button'));
      tick();
      expect(component.componentTitle).toBe('BUTTON');
    }));

    it('keeps sidebar open on desktop navigation', fakeAsync(() => {
      component.sidebarExpanded = true;
      routerEvents$.next(new NavigationEnd(1, '/button', '/button'));
      tick();
      expect(component.sidebarExpanded).toBe(true);
    }));

    it('focuses main-content after navigation', fakeAsync(() => {
      const mainEl = doc.createElement('div');
      jest.spyOn(mainEl, 'focus');
      jest.spyOn(doc, 'getElementById').mockReturnValue(mainEl);

      routerEvents$.next(new NavigationEnd(1, '/button', '/button'));
      tick();

      expect(mainEl.focus).toHaveBeenCalled();
    }));
  });

  describe('NavigationEnd on mobile', () => {
    beforeEach(async () => setup(true));

    it('closes sidebar on navigation', fakeAsync(() => {
      component.sidebarExpanded = true;
      routerEvents$.next(new NavigationEnd(1, '/button', '/button'));
      tick();
      expect(component.sidebarExpanded).toBe(false);
    }));
  });

  describe('toggleSidebar', () => {
    beforeEach(async () => setup(false));

    it('collapses an expanded sidebar', () => {
      component.sidebarExpanded = true;
      component.toggleSidebar();
      expect(component.sidebarExpanded).toBe(false);
    });

    it('expands a collapsed sidebar', () => {
      component.sidebarExpanded = false;
      component.toggleSidebar();
      expect(component.sidebarExpanded).toBe(true);
    });
  });

  describe('focusMainContent', () => {
    beforeEach(async () => setup(false));

    it('focuses the main-content element after a timeout', fakeAsync(() => {
      const mainEl = doc.createElement('div');
      jest.spyOn(mainEl, 'focus');
      jest.spyOn(doc, 'getElementById').mockReturnValue(mainEl);

      component.focusMainContent();
      tick();

      expect(mainEl.focus).toHaveBeenCalled();
    }));

    it('does not throw when main-content element is absent', fakeAsync(() => {
      jest.spyOn(doc, 'getElementById').mockReturnValue(null);
      expect(() => {
        component.focusMainContent();
        tick();
      }).not.toThrow();
    }));
  });

  describe('focusActiveNavItem', () => {
    beforeEach(async () => setup(false));

    it('prevents default and focuses the active nav item when found', () => {
      const activeEl = doc.createElement('a');
      jest.spyOn(activeEl, 'focus');
      jest.spyOn(doc, 'querySelector').mockReturnValue(activeEl);

      const event = new Event('keydown');
      jest.spyOn(event, 'preventDefault');

      component.focusActiveNavItem(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(activeEl.focus).toHaveBeenCalled();
    });

    it('does not prevent default when no active nav item exists', () => {
      jest.spyOn(doc, 'querySelector').mockReturnValue(null);

      const event = new Event('keydown');
      jest.spyOn(event, 'preventDefault');

      component.focusActiveNavItem(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
