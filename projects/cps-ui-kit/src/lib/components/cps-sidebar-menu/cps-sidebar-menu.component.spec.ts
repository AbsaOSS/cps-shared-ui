import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';
import {
  CpsSidebarMenuComponent,
  CpsSidebarMenuItem
} from './cps-sidebar-menu.component';

describe('CpsSidebarMenuComponent', () => {
  let component: CpsSidebarMenuComponent;
  let fixture: ComponentFixture<CpsSidebarMenuComponent>;
  let router: Router;

  const sampleItems: CpsSidebarMenuItem[] = [
    { title: 'Home', icon: 'home', url: '/home' },
    { title: 'Settings', icon: 'settings', url: '/settings', disabled: true },
    {
      title: 'Reports',
      icon: 'reports',
      items: [
        { title: 'Monthly', url: '/reports/monthly' },
        { title: 'Annual', url: '/reports/annual' }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsSidebarMenuComponent, NoopAnimationsModule],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CpsSidebarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.items).toEqual([]);
    expect(component.isExpanded).toBe(true);
    expect(component.exactRoutes).toBe(false);
    expect(component.ariaLabel).toBe('Main navigation');
  });

  it('should convert numeric height to px string', () => {
    fixture.componentRef.setInput('height', 500);
    expect(component.cvtHeight()).toBe('500px');
  });

  it('should preserve percentage height string', () => {
    fixture.componentRef.setInput('height', '80%');
    expect(component.cvtHeight()).toBe('80%');
  });

  it('should preserve rem height string', () => {
    fixture.componentRef.setInput('height', '10rem');
    expect(component.cvtHeight()).toBe('10rem');
  });

  describe('toggleSidebar', () => {
    it('should collapse when expanded', () => {
      component.isExpanded = true;
      component.toggleSidebar();
      expect(component.isExpanded).toBe(false);
    });

    it('should expand when collapsed', () => {
      component.isExpanded = false;
      component.toggleSidebar();
      expect(component.isExpanded).toBe(true);
    });
  });

  describe('isActive', () => {
    it('should return false when item has no sub-items', () => {
      const item: CpsSidebarMenuItem = {
        title: 'Home',
        icon: 'home',
        url: '/home'
      };
      expect(component.isActive(item)).toBe(false);
    });

    it('should return false when sub-items have no URLs', () => {
      const item: CpsSidebarMenuItem = {
        title: 'Reports',
        icon: 'reports',
        items: [{ title: 'Monthly' }]
      };
      expect(component.isActive(item)).toBe(false);
    });

    it('should return true when current URL partially matches a sub-item URL', () => {
      const item: CpsSidebarMenuItem = {
        title: 'Reports',
        icon: 'reports',
        items: [{ title: 'Monthly', url: '/reports/monthly' }]
      };
      jest.spyOn(router, 'url', 'get').mockReturnValue('/reports/monthly');
      expect(component.isActive(item)).toBe(true);
    });

    it('should return false when current URL does not match any sub-item URL', () => {
      const item: CpsSidebarMenuItem = {
        title: 'Reports',
        icon: 'reports',
        items: [{ title: 'Monthly', url: '/reports/monthly' }]
      };
      jest.spyOn(router, 'url', 'get').mockReturnValue('/home');
      expect(component.isActive(item)).toBe(false);
    });

    it('should use partial match when exactRoutes is false', () => {
      component.exactRoutes = false;
      const item: CpsSidebarMenuItem = {
        title: 'Reports',
        icon: 'reports',
        items: [{ title: 'Reports', url: '/reports' }]
      };
      jest.spyOn(router, 'url', 'get').mockReturnValue('/reports/monthly');
      expect(component.isActive(item)).toBe(true);
    });

    it('should use exact match when exactRoutes is true', () => {
      component.exactRoutes = true;
      const item: CpsSidebarMenuItem = {
        title: 'Reports',
        icon: 'reports',
        items: [{ title: 'Reports', url: '/reports' }]
      };
      jest.spyOn(router, 'url', 'get').mockReturnValue('/reports/monthly');
      expect(component.isActive(item)).toBe(false);
    });

    it('should match exactly when exactRoutes is true and URL matches', () => {
      component.exactRoutes = true;
      const item: CpsSidebarMenuItem = {
        title: 'Reports',
        icon: 'reports',
        items: [{ title: 'Reports', url: '/reports' }]
      };
      jest.spyOn(router, 'url', 'get').mockReturnValue('/reports');
      expect(component.isActive(item)).toBe(true);
    });
  });

  describe('showMenu', () => {
    let mockMenu: Pick<CpsMenuComponent, 'isVisible' | 'show' | 'hide'>;

    beforeEach(() => {
      mockMenu = {
        isVisible: jest.fn().mockReturnValue(false),
        show: jest.fn(),
        hide: jest.fn()
      } as unknown as Pick<CpsMenuComponent, 'isVisible' | 'show' | 'hide'>;
      component.allMenus = { forEach: jest.fn() } as any;
    });

    it('should not show menu when target element has disabled class', () => {
      const el = document.createElement('button');
      el.classList.add('disabled');
      const event = { type: 'click', currentTarget: el } as any;
      component.showMenu(event, mockMenu as CpsMenuComponent);
      expect(mockMenu.show).not.toHaveBeenCalled();
    });

    it('should set focusedItemWithMenu on focusin event', () => {
      const el = document.createElement('button');
      const item: CpsSidebarMenuItem = { title: 'Reports', icon: 'reports' };
      const event = { type: 'focusin', currentTarget: el } as any;
      component.showMenu(event, mockMenu as CpsMenuComponent, item);
      expect(component.focusedItemWithMenu).toBe(item);
    });

    it('should not set focusedItemWithMenu when no item is provided', () => {
      const el = document.createElement('button');
      const event = { type: 'focusin', currentTarget: el } as any;
      component.showMenu(event, mockMenu as CpsMenuComponent);
      expect(component.focusedItemWithMenu).toBeNull();
    });

    it('should hide all other menus and show this one when not visible', () => {
      const el = document.createElement('button');
      const event = { type: 'mouseenter', currentTarget: el } as any;
      (mockMenu.isVisible as jest.Mock).mockReturnValue(false);
      component.showMenu(event, mockMenu as CpsMenuComponent);
      expect((component.allMenus as any).forEach).toHaveBeenCalled();
      expect(mockMenu.show).toHaveBeenCalledWith(null, el, 'tr');
    });

    it('should call show again on focusin when menu is already visible', () => {
      const el = document.createElement('button');
      const item: CpsSidebarMenuItem = { title: 'Reports', icon: 'reports' };
      const event = { type: 'focusin', currentTarget: el } as any;
      (mockMenu.isVisible as jest.Mock).mockReturnValue(true);
      component.showMenu(event, mockMenu as CpsMenuComponent, item);
      expect(mockMenu.show).toHaveBeenCalledWith(null, el, 'tr');
    });

    it('should not call show on non-focusin event when menu is already visible', () => {
      const el = document.createElement('button');
      const event = { type: 'mouseenter', currentTarget: el } as any;
      (mockMenu.isVisible as jest.Mock).mockReturnValue(true);
      component.showMenu(event, mockMenu as CpsMenuComponent);
      expect(mockMenu.show).not.toHaveBeenCalled();
    });
  });

  describe('toggleMenu', () => {
    let mockMenu: Pick<CpsMenuComponent, 'isVisible' | 'show' | 'hide'>;
    let item: CpsSidebarMenuItem;

    beforeEach(() => {
      mockMenu = {
        isVisible: jest.fn().mockReturnValue(false),
        show: jest.fn(),
        hide: jest.fn()
      } as unknown as Pick<CpsMenuComponent, 'isVisible' | 'show' | 'hide'>;
      item = { title: 'Reports', icon: 'reports' };
      component.allMenus = { forEach: jest.fn() } as any;
    });

    it('should not toggle when target element has disabled class', () => {
      const el = document.createElement('button');
      el.classList.add('disabled');
      const event = { currentTarget: el } as unknown as MouseEvent;
      component.toggleMenu(event, mockMenu as CpsMenuComponent, item);
      expect(mockMenu.show).not.toHaveBeenCalled();
      expect(mockMenu.hide).not.toHaveBeenCalled();
    });

    it('should hide menu when it is visible', () => {
      const el = document.createElement('button');
      const event = { currentTarget: el } as unknown as MouseEvent;
      (mockMenu.isVisible as jest.Mock).mockReturnValue(true);
      component.toggleMenu(event, mockMenu as CpsMenuComponent, item);
      expect(mockMenu.hide).toHaveBeenCalled();
      expect(mockMenu.show).not.toHaveBeenCalled();
    });

    it('should hide all other menus and show this one when not visible', () => {
      const el = document.createElement('button');
      const event = { currentTarget: el } as unknown as MouseEvent;
      (mockMenu.isVisible as jest.Mock).mockReturnValue(false);
      component.toggleMenu(event, mockMenu as CpsMenuComponent, item);
      expect((component.allMenus as any).forEach).toHaveBeenCalled();
      expect(mockMenu.show).toHaveBeenCalledWith(null, el, 'tr');
    });

    it('should always set focusedItemWithMenu to the given item', () => {
      const el = document.createElement('button');
      const event = { currentTarget: el } as unknown as MouseEvent;
      component.toggleMenu(event, mockMenu as CpsMenuComponent, item);
      expect(component.focusedItemWithMenu).toBe(item);
    });
  });

  describe('leaveMenu', () => {
    let mockMenu: {
      hide: jest.Mock;
      container: HTMLElement | null;
      target: HTMLElement | null;
    };

    beforeEach(() => {
      mockMenu = {
        hide: jest.fn(),
        container: document.createElement('div'),
        target: document.createElement('button')
      };
    });

    it('should hide menu when related target is outside container and target', () => {
      const externalEl = document.createElement('div');
      const event = { type: 'mouseleave', relatedTarget: externalEl } as any;
      component.leaveMenu(event, mockMenu as any);
      expect(mockMenu.hide).toHaveBeenCalled();
    });

    it('should not hide menu when related target is inside container', () => {
      const inner = document.createElement('span');
      mockMenu.container!.appendChild(inner);
      const event = { type: 'mouseleave', relatedTarget: inner } as any;
      component.leaveMenu(event, mockMenu as any);
      expect(mockMenu.hide).not.toHaveBeenCalled();
    });

    it('should not hide menu when related target is inside target element', () => {
      const inner = document.createElement('span');
      mockMenu.target!.appendChild(inner);
      const event = { type: 'mouseleave', relatedTarget: inner } as any;
      component.leaveMenu(event, mockMenu as any);
      expect(mockMenu.hide).not.toHaveBeenCalled();
    });

    it('should reset focusedItemWithMenu on focusout when hiding', () => {
      component.focusedItemWithMenu = { title: 'Test', icon: 'icon' };
      const externalEl = document.createElement('div');
      const event = { type: 'focusout', relatedTarget: externalEl } as any;
      component.leaveMenu(event, mockMenu as any);
      expect(component.focusedItemWithMenu).toBeNull();
    });

    it('should not reset focusedItemWithMenu on mouseleave', () => {
      const focusedItem: CpsSidebarMenuItem = { title: 'Test', icon: 'icon' };
      component.focusedItemWithMenu = focusedItem;
      const externalEl = document.createElement('div');
      const event = { type: 'mouseleave', relatedTarget: externalEl } as any;
      component.leaveMenu(event, mockMenu as any);
      expect(component.focusedItemWithMenu).toBe(focusedItem);
    });
  });

  describe('touch behavior', () => {
    type InternalComponent = { _pendingTouch: boolean };
    let mockMenu: Pick<CpsMenuComponent, 'isVisible' | 'show' | 'hide'>;

    beforeEach(() => {
      mockMenu = {
        isVisible: jest.fn().mockReturnValue(false),
        show: jest.fn(),
        hide: jest.fn()
      } as unknown as Pick<CpsMenuComponent, 'isVisible' | 'show' | 'hide'>;
      component.allMenus = {
        forEach: jest.fn()
      } as unknown as typeof component.allMenus;
    });

    it('onMenuItemTouchStart should set _pendingTouch to true', () => {
      component.onMenuItemTouchStart();
      expect((component as unknown as InternalComponent)._pendingTouch).toBe(
        true
      );
    });

    it('showMenu on mouseenter should be skipped when _pendingTouch is true', () => {
      (component as unknown as InternalComponent)._pendingTouch = true;
      const el = document.createElement('button');
      const event = {
        type: 'mouseenter',
        currentTarget: el
      } as unknown as MouseEvent;
      component.showMenu(event, mockMenu as CpsMenuComponent);
      expect(mockMenu.show).not.toHaveBeenCalled();
    });

    it('showMenu on focusin should be skipped when _pendingTouch is true', () => {
      (component as unknown as InternalComponent)._pendingTouch = true;
      const el = document.createElement('button');
      const item: CpsSidebarMenuItem = { title: 'Reports', icon: 'reports' };
      const event = {
        type: 'focusin',
        currentTarget: el
      } as unknown as FocusEvent;
      component.showMenu(event, mockMenu as CpsMenuComponent, item);
      expect(mockMenu.show).not.toHaveBeenCalled();
    });

    it('showMenu on mouseenter should work normally when _pendingTouch is false', () => {
      (component as unknown as InternalComponent)._pendingTouch = false;
      const el = document.createElement('button');
      const event = {
        type: 'mouseenter',
        currentTarget: el
      } as unknown as MouseEvent;
      component.showMenu(event, mockMenu as CpsMenuComponent);
      expect(mockMenu.show).toHaveBeenCalledWith(null, el, 'tr');
    });

    it('leaveMenu on mouseleave should be skipped when _pendingTouch is true', () => {
      (component as unknown as InternalComponent)._pendingTouch = true;
      const externalEl = document.createElement('div');
      const event = {
        type: 'mouseleave',
        relatedTarget: externalEl
      } as unknown as MouseEvent;
      component.leaveMenu(event, mockMenu as CpsMenuComponent);
      expect(mockMenu.hide).not.toHaveBeenCalled();
    });

    it('toggleMenu should reset _pendingTouch and open the menu (simulates first tap)', () => {
      (component as unknown as InternalComponent)._pendingTouch = true;
      const el = document.createElement('button');
      const item: CpsSidebarMenuItem = { title: 'Reports', icon: 'reports' };
      const event = { currentTarget: el } as unknown as MouseEvent;
      (mockMenu.isVisible as jest.Mock).mockReturnValue(false);
      component.toggleMenu(event, mockMenu as CpsMenuComponent, item);
      expect((component as unknown as InternalComponent)._pendingTouch).toBe(
        false
      );
      expect(mockMenu.show).toHaveBeenCalledWith(null, el, 'tr');
    });
  });

  describe('ngAfterViewInit', () => {
    afterEach(() => jest.restoreAllMocks());

    it('should set expand button background to the nearest opaque ancestor color', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      parent.appendChild(fixture.nativeElement);

      jest.spyOn(window, 'getComputedStyle').mockImplementation(
        (el) =>
          ({
            backgroundColor:
              el === parent ? 'rgb(30, 30, 30)' : 'rgba(0, 0, 0, 0)'
          }) as CSSStyleDeclaration
      );

      (
        component as unknown as { _applyExpandButtonBackground(): void }
      )._applyExpandButtonBackground();

      const btn = fixture.nativeElement.querySelector(
        '.expand-area'
      ) as HTMLElement;
      expect(btn?.style.backgroundColor).toBe('rgb(30, 30, 30)');

      parent.remove();
    });

    it('should skip ancestors returning "transparent" keyword and find the opaque one', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      document.body.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(fixture.nativeElement);

      jest.spyOn(window, 'getComputedStyle').mockImplementation(
        (el) =>
          ({
            backgroundColor:
              el === grandparent ? 'rgb(50, 50, 50)' : 'transparent'
          }) as CSSStyleDeclaration
      );

      (
        component as unknown as { _applyExpandButtonBackground(): void }
      )._applyExpandButtonBackground();

      const btn = fixture.nativeElement.querySelector(
        '.expand-area'
      ) as HTMLElement;
      expect(btn?.style.backgroundColor).toBe('rgb(50, 50, 50)');

      grandparent.remove();
    });

    it('should not change expand button background when all ancestors are transparent', () => {
      jest.spyOn(window, 'getComputedStyle').mockReturnValue({
        backgroundColor: 'rgba(0, 0, 0, 0)'
      } as CSSStyleDeclaration);

      (
        component as unknown as { _applyExpandButtonBackground(): void }
      )._applyExpandButtonBackground();

      const btn = fixture.nativeElement.querySelector(
        '.expand-area'
      ) as HTMLElement;
      expect(btn?.style.backgroundColor).toBe('');
    });

    it('should not call getComputedStyle when running in SSR', () => {
      type InternalSsr = {
        _platformId: string;
        _applyExpandButtonBackground(): void;
      };
      (component as unknown as InternalSsr)._platformId = 'server';
      const spy = jest.spyOn(window, 'getComputedStyle');
      (component as unknown as InternalSsr)._applyExpandButtonBackground();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('should apply the given height style', () => {
      fixture.componentRef.setInput('height', '200px');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.cps-sidebar-menu');
      expect(el.style.height).toBe('200px');
    });

    it('should render nav with correct aria-label', () => {
      fixture.componentRef.setInput('ariaLabel', 'Side navigation');
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('aria-label')).toBe('Side navigation');
    });

    it('should render aria-description as expanded when isExpanded is true', () => {
      fixture.componentRef.setInput('isExpanded', true);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('aria-description')).toBe('Sidebar expanded');
    });

    it('should render aria-description as collapsed when isExpanded is false', () => {
      fixture.componentRef.setInput('isExpanded', false);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('aria-description')).toBe('Sidebar collapsed');
    });

    it('should add collapsed class when isExpanded is false', () => {
      fixture.componentRef.setInput('isExpanded', false);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.cps-sidebar-menu');
      expect(el.classList.contains('cps-sidebar-menu-collapsed')).toBe(true);
    });

    it('should not add collapsed class when isExpanded is true', () => {
      fixture.componentRef.setInput('isExpanded', true);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.cps-sidebar-menu');
      expect(el.classList.contains('cps-sidebar-menu-collapsed')).toBe(false);
    });

    it('should render expand button with Collapse sidebar aria-label when expanded', () => {
      fixture.componentRef.setInput('isExpanded', true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.expand-area');
      expect(btn.getAttribute('aria-label')).toBe('Collapse sidebar');
    });

    it('should render expand button with Expand sidebar aria-label when collapsed', () => {
      fixture.componentRef.setInput('isExpanded', false);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.expand-area');
      expect(btn.getAttribute('aria-label')).toBe('Expand sidebar');
    });

    it('should set aria-expanded on expand button', () => {
      fixture.componentRef.setInput('isExpanded', true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.expand-area');
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    it('should toggle sidebar when expand button is clicked', () => {
      fixture.componentRef.setInput('isExpanded', true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.expand-area');
      btn.click();
      expect(component.isExpanded).toBe(false);
    });

    it('should render anchor element for items with url', () => {
      fixture.componentRef.setInput('items', [
        { title: 'Home', icon: 'home', url: '/home' }
      ]);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector(
        'a.cps-sidebar-menu-item'
      );
      expect(link).toBeTruthy();
    });

    it('should set aria-label on anchor item', () => {
      fixture.componentRef.setInput('items', [
        { title: 'Home', icon: 'home', url: '/home' }
      ]);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector(
        'a.cps-sidebar-menu-item'
      );
      expect(link.getAttribute('aria-label')).toBe('Home');
    });

    it('should apply disabled class to disabled link item', () => {
      fixture.componentRef.setInput('items', [
        {
          title: 'Settings',
          icon: 'settings',
          url: '/settings',
          disabled: true
        }
      ]);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector(
        '.cps-sidebar-menu-item'
      );
      expect(link.classList.contains('disabled')).toBe(true);
    });

    it('should set aria-disabled on disabled link item', () => {
      fixture.componentRef.setInput('items', [
        {
          title: 'Settings',
          icon: 'settings',
          url: '/settings',
          disabled: true
        }
      ]);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector(
        '.cps-sidebar-menu-item'
      );
      expect(link.getAttribute('aria-disabled')).toBe('true');
    });

    it('should render button element for items without url', () => {
      fixture.componentRef.setInput('items', [
        {
          title: 'Reports',
          icon: 'reports',
          items: [{ title: 'Monthly', url: '/reports/monthly' }]
        }
      ]);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-sidebar-menu-item'
      );
      expect(btn).toBeTruthy();
    });

    it('should set aria-haspopup on button menu trigger', () => {
      fixture.componentRef.setInput('items', [
        {
          title: 'Reports',
          icon: 'reports',
          items: [{ title: 'Monthly', url: '/reports/monthly' }]
        }
      ]);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-sidebar-menu-item'
      );
      expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should set aria-label on button menu trigger', () => {
      fixture.componentRef.setInput('items', [
        {
          title: 'Reports',
          icon: 'reports',
          items: [{ title: 'Monthly', url: '/reports/monthly' }]
        }
      ]);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-sidebar-menu-item'
      );
      expect(btn.getAttribute('aria-label')).toBe('Reports');
    });

    it('should render all provided items', () => {
      fixture.componentRef.setInput('items', sampleItems);
      fixture.detectChanges();
      const menuItems = fixture.nativeElement.querySelectorAll(
        '.cps-sidebar-menu-item'
      );
      expect(menuItems.length).toBe(sampleItems.length);
    });
  });
});
