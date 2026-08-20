import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DomHandler } from '../../primeng-temp/dom/public_api';
import { CPS_FOCUS_SERVICE } from '../../services/cps-focus/cps-focus.service';
import {
  CpsMenuComponent,
  CpsMenuHideReason,
  CpsMenuItem
} from './cps-menu.component';

const mockFocusService = {
  isKeyboard: jest.fn().mockReturnValue(false),
  focusElement: jest.fn()
};

describe('CpsMenuComponent', () => {
  let component: CpsMenuComponent;
  let fixture: ComponentFixture<CpsMenuComponent>;

  beforeEach(async () => {
    mockFocusService.isKeyboard.mockReturnValue(false);
    mockFocusService.focusElement.mockReset();

    await TestBed.configureTestingModule({
      imports: [CpsMenuComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CPS_FOCUS_SERVICE, useValue: mockFocusService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct initial values', () => {
    expect(component.header).toBe('');
    expect(component.ariaLabel).toBe('');
    expect(component.items).toEqual([]);
    expect(component.withArrow).toBe(true);
    expect(component.compressed).toBe(false);
    expect(component.focusOnShow).toBe(true);
    expect(component.persistent).toBe(false);
    expect(component.containerClass).toBe('');
    expect(component.overlayVisible).toBe(false);
    expect(component.render).toBe(false);
  });

  describe('ngAfterViewInit', () => {
    it('should set display:none on host element', () => {
      expect(component.el.nativeElement.style.display).toBe('none');
    });
  });

  describe('ngOnChanges', () => {
    const items: CpsMenuItem[] = [
      { title: 'Action 1', icon: 'home' },
      { title: 'Action 2' }
    ];

    it('should compute itemsClasses when items change', () => {
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();
      expect(component.itemsClasses.length).toBe(2);
      expect(component.itemsClasses[0]).toContain('cps-menu-item');
      expect(component.itemsClasses[0]).toContain('cps-menu-item-first');
      expect(component.itemsClasses[1]).not.toContain('cps-menu-item-first');
    });

    it('should add disabled class for disabled items', () => {
      fixture.componentRef.setInput('items', [
        { title: 'Disabled', disabled: true },
        { title: 'Enabled' }
      ]);
      fixture.detectChanges();
      expect(component.itemsClasses[0]).toContain('cps-menu-item-disabled');
      expect(component.itemsClasses[1]).not.toContain('cps-menu-item-disabled');
    });

    it('should add disabled class for loading items', () => {
      fixture.componentRef.setInput('items', [
        { title: 'Loading', loading: true }
      ]);
      fixture.detectChanges();
      expect(component.itemsClasses[0]).toContain('cps-menu-item-disabled');
    });

    it('should add compressed classes when compressed is true', () => {
      fixture.componentRef.setInput('compressed', true);
      fixture.componentRef.setInput('items', [{ title: 'A', icon: 'home' }]);
      fixture.detectChanges();
      expect(component.itemsClasses[0]).toContain('cps-menu-item-compressed');
      expect(component.itemsClasses[0]).toContain(
        'cps-menu-item-compressed-with-icons'
      );
    });

    it('should not add compressed-with-icons when compressed but no icons', () => {
      fixture.componentRef.setInput('compressed', true);
      fixture.componentRef.setInput('items', [{ title: 'A' }]);
      fixture.detectChanges();
      expect(component.itemsClasses[0]).toContain('cps-menu-item-compressed');
      expect(component.itemsClasses[0]).not.toContain(
        'cps-menu-item-compressed-with-icons'
      );
    });

    it('should set withIcons based on whether any item has an icon when compressed', () => {
      fixture.componentRef.setInput('compressed', true);
      fixture.componentRef.setInput('items', [
        { title: 'A', icon: 'home' },
        { title: 'B' }
      ]);
      fixture.detectChanges();
      expect(component.withIcons).toBe(true);

      fixture.componentRef.setInput('items', [{ title: 'A' }, { title: 'B' }]);
      fixture.detectChanges();
      expect(component.withIcons).toBe(false);
    });

    it('should log an error when an item has no title and no ariaLabel', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fixture.componentRef.setInput('items', [{ title: '' }]);
      fixture.detectChanges();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('accessibility')
      );
    });

    it('should not log an error when items have title', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fixture.componentRef.setInput('items', [{ title: 'Valid' }]);
      fixture.detectChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log an error when items have ariaLabel but no title', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fixture.componentRef.setInput('items', [{ ariaLabel: 'Icon action' }]);
      fixture.detectChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('show', () => {
    it('should set overlayVisible and render to true', () => {
      const target = document.createElement('button');
      component.show(null, target);
      expect(component.overlayVisible).toBe(true);
      expect(component.render).toBe(true);
    });

    it('should store the provided target', () => {
      const target = document.createElement('button');
      component.show(null, target);
      expect(component.target).toBe(target);
    });

    it('should use event target when no target is provided', () => {
      const el = document.createElement('button');
      const event = { currentTarget: el } as any;
      component.show(event);
      expect(component.target).toBe(el);
    });

    it('should set position to provided value', () => {
      const target = document.createElement('button');
      component.show(null, target, 'tr');
      expect(component.position).toBe('tr');
    });

    it('should default position to "default" when not provided', () => {
      const target = document.createElement('button');
      component.show(null, target);
      expect(component.position).toBe('default');
    });

    it('should do nothing when animation is in progress', () => {
      component.isOverlayAnimationInProgress = true;
      const target = document.createElement('button');
      component.show(null, target);
      expect(component.overlayVisible).toBe(false);
    });

    it('should track whether opened by keyboard via focus service', () => {
      mockFocusService.isKeyboard.mockReturnValue(true);
      const target = document.createElement('button');
      component.show(null, target);
      expect(mockFocusService.isKeyboard).toHaveBeenCalled();
    });
  });

  describe('hide', () => {
    beforeEach(() => {
      const target = document.createElement('button');
      component.show(null, target);
      component.isOverlayAnimationInProgress = false;
    });

    it('should set overlayVisible to false', () => {
      component.hide();
      expect(component.overlayVisible).toBe(false);
    });

    it('should set hideReason to FORCED when no reason provided', () => {
      component.hide();
      expect(component.hideReason).toBe(CpsMenuHideReason.FORCED);
    });

    it('should store the provided hide reason', () => {
      component.hide(CpsMenuHideReason.CLICK_OUTSIDE);
      expect(component.hideReason).toBe(CpsMenuHideReason.CLICK_OUTSIDE);
    });

    it('should do nothing when already hidden', () => {
      component.hide();
      expect(component.overlayVisible).toBe(false);
      component.hide(CpsMenuHideReason.CLICK_ITEM);
      expect(component.hideReason).toBe(CpsMenuHideReason.FORCED);
    });

    it('should set isOverlayAnimationInProgress to true', () => {
      component.hide();
      expect(component.isOverlayAnimationInProgress).toBe(true);
    });
  });

  describe('isVisible', () => {
    it('should return false initially', () => {
      expect(component.isVisible()).toBe(false);
    });

    it('should return true after show', () => {
      component.show(null, document.createElement('button'));
      expect(component.isVisible()).toBe(true);
    });

    it('should return false after hide', () => {
      component.show(null, document.createElement('button'));
      component.isOverlayAnimationInProgress = false;
      component.hide();
      expect(component.isVisible()).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should call show when not visible', () => {
      jest.spyOn(component, 'show');
      const target = document.createElement('button');
      component.toggle(null, target);
      expect(component.show).toHaveBeenCalledWith(null, target, undefined);
    });

    it('should call hide when visible', () => {
      jest.spyOn(component, 'hide');
      const target = document.createElement('button');
      component.show(null, target);
      component.isOverlayAnimationInProgress = false;
      component.toggle(null, target);
      expect(component.hide).toHaveBeenCalledWith(CpsMenuHideReason.TOGGLE);
    });

    it('should do nothing when animation is in progress', () => {
      jest.spyOn(component, 'show');
      jest.spyOn(component, 'hide');
      component.isOverlayAnimationInProgress = true;
      component.toggle(null, document.createElement('button'));
      expect(component.show).not.toHaveBeenCalled();
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should set destroyCallback when target has changed while visible', () => {
      const target1 = document.createElement('button');
      const target2 = document.createElement('button');
      component.show(null, target1);
      component.isOverlayAnimationInProgress = false;
      component.toggle(null, target2);
      expect(component.destroyCallback).not.toBeNull();
    });

    it('should show the new target when destroyCallback is invoked', () => {
      const target1 = document.createElement('button');
      const target2 = document.createElement('button');
      component.show(null, target1);
      component.isOverlayAnimationInProgress = false;
      component.toggle(null, target2);
      jest.spyOn(component, 'show');
      component.destroyCallback?.();
      expect(component.show).toHaveBeenCalledWith(null, target2, undefined);
    });
  });

  describe('hasTargetChanged', () => {
    it('should return false when there is no current target', () => {
      component.target = null;
      const el = document.createElement('button');
      expect(component.hasTargetChanged(null, el)).toBeFalsy();
    });

    it('should return false when the target is the same', () => {
      const el = document.createElement('button');
      component.target = el;
      expect(component.hasTargetChanged(null, el)).toBe(false);
    });

    it('should return true when the target has changed', () => {
      component.target = document.createElement('button');
      const newTarget = document.createElement('button');
      expect(component.hasTargetChanged(null, newTarget)).toBe(true);
    });

    it('should use event.currentTarget when no explicit target is given', () => {
      const el = document.createElement('button');
      component.target = el;
      const event = { currentTarget: el } as any;
      expect(component.hasTargetChanged(event)).toBe(false);
    });
  });

  describe('onItemClick', () => {
    let item: CpsMenuItem;
    let event: any;

    beforeEach(() => {
      item = { title: 'Test', action: jest.fn() };
      event = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
      const target = document.createElement('button');
      component.show(null, target);
      component.isOverlayAnimationInProgress = false;
    });

    it('should call item action and hide when item is normal', () => {
      jest.spyOn(component, 'hide');
      component.onItemClick(event, item);
      expect(item.action).toHaveBeenCalled();
      expect(component.hide).toHaveBeenCalledWith(CpsMenuHideReason.CLICK_ITEM);
    });

    it('should preventDefault and stopPropagation when item is disabled', () => {
      item.disabled = true;
      component.onItemClick(event, item);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(item.action).not.toHaveBeenCalled();
    });

    it('should preventDefault and stopPropagation when item is loading', () => {
      item.loading = true;
      component.onItemClick(event, item);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(item.action).not.toHaveBeenCalled();
    });

    it('should not throw when item has no action', () => {
      item.action = undefined;
      expect(() => component.onItemClick(event, item)).not.toThrow();
    });

    it('should focus target after clicking', () => {
      const target = document.createElement('button');
      jest.spyOn(target, 'focus');
      component.target = target;
      component.onItemClick(event, item);
      expect(target.focus).toHaveBeenCalled();
    });
  });

  describe('onItemKeydown', () => {
    let item: CpsMenuItem;

    beforeEach(() => {
      item = { title: 'Test', action: jest.fn() };
      const target = document.createElement('button');
      component.show(null, target);
      component.isOverlayAnimationInProgress = false;
    });

    it('should call onItemClick on Enter for non-url item', () => {
      jest.spyOn(component, 'onItemClick');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onItemKeydown(event, item);
      expect(component.onItemClick).toHaveBeenCalledWith(event, item);
    });

    it('should call onItemClick on Space for non-url item', () => {
      jest.spyOn(component, 'onItemClick');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      component.onItemKeydown(event, item);
      expect(component.onItemClick).toHaveBeenCalledWith(event, item);
    });

    it('should not call onItemClick on Enter for url item', () => {
      item.url = 'https://example.com';
      jest.spyOn(component, 'onItemClick');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onItemKeydown(event, item);
      expect(component.onItemClick).not.toHaveBeenCalled();
    });

    it('should preventDefault on Enter for non-url item', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        cancelable: true
      });
      jest.spyOn(event, 'preventDefault');
      component.onItemKeydown(event, item);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should preventDefault on Space for url item and trigger click', () => {
      item.url = 'https://example.com';
      const anchor = document.createElement('a');
      jest.spyOn(anchor, 'click');
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        cancelable: true
      });
      Object.defineProperty(event, 'currentTarget', {
        value: anchor,
        configurable: true
      });
      jest.spyOn(event, 'preventDefault');
      component.onItemKeydown(event, item);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(anchor.click).toHaveBeenCalled();
    });

    it('should preventDefault when item is disabled', () => {
      item.disabled = true;
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        cancelable: true
      });
      jest.spyOn(event, 'preventDefault');
      jest.spyOn(component, 'onItemClick');
      component.onItemKeydown(event, item);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.onItemClick).not.toHaveBeenCalled();
    });

    it('should preventDefault when item is loading', () => {
      item.loading = true;
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        cancelable: true
      });
      jest.spyOn(event, 'preventDefault');
      jest.spyOn(component, 'onItemClick');
      component.onItemKeydown(event, item);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.onItemClick).not.toHaveBeenCalled();
    });
  });

  describe('onOverlayClick', () => {
    it('should set selfClick to true', () => {
      component.selfClick = false;
      component.onOverlayClick(new MouseEvent('mousedown'));
      expect(component.selfClick).toBe(true);
    });

    it('should call overlayService.add', () => {
      jest.spyOn(component.overlayService, 'add');
      const event = new MouseEvent('mousedown');
      component.onOverlayClick(event);
      expect(component.overlayService.add).toHaveBeenCalledWith({
        originalEvent: event,
        target: component.el.nativeElement
      });
    });
  });

  describe('onContentClick', () => {
    it('should set selfClick to true immediately', () => {
      component.selfClick = false;
      component.onContentClick();
      expect(component.selfClick).toBe(true);
    });

    it('should emit contentClicked after a timeout', fakeAsync(() => {
      jest.spyOn(component.contentClicked, 'emit');
      component.onContentClick();
      tick(100);
      expect(component.contentClicked.emit).toHaveBeenCalled();
    }));
  });

  describe('onWindowResize', () => {
    it('should hide the menu when overlay is visible', () => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(false);
      jest.spyOn(component, 'hide');
      component.show(null, document.createElement('button'));
      component.isOverlayAnimationInProgress = false;
      component.onWindowResize();
      expect(component.hide).toHaveBeenCalledWith(CpsMenuHideReason.RESIZE);
    });

    it('should not hide the menu when overlay is not visible', () => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(false);
      jest.spyOn(component, 'hide');
      component.onWindowResize();
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should not hide when touch device', () => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(true);
      jest.spyOn(component, 'hide');
      component.show(null, document.createElement('button'));
      component.isOverlayAnimationInProgress = false;
      component.onWindowResize();
      expect(component.hide).not.toHaveBeenCalled();
    });
  });

  describe('bindDocumentClickListener / unbindDocumentClickListener', () => {
    let target: HTMLElement;

    beforeEach(() => {
      target = document.createElement('button');
      document.body.appendChild(target);
      component.target = target;
      component.overlayVisible = true;
      component.dismissable = true;
      const container = document.createElement('div');
      component.container = container as HTMLDivElement;
    });

    afterEach(() => {
      component.unbindDocumentClickListener();
      document.body.removeChild(target);
    });

    it('should bind a click listener', () => {
      component.bindDocumentClickListener();
      expect(component.documentClickListener).not.toBeNull();
    });

    it('should not bind a second listener when one is already bound', () => {
      component.bindDocumentClickListener();
      const firstListener = component.documentClickListener;
      component.bindDocumentClickListener();
      expect(component.documentClickListener).toBe(firstListener);
    });

    it('should hide when mousedown is outside the container and target', () => {
      jest.spyOn(component, 'hide');
      component.bindDocumentClickListener();
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(component.hide).toHaveBeenCalledWith(
        CpsMenuHideReason.CLICK_OUTSIDE
      );
    });

    it('should not hide when persistent is true', () => {
      jest.spyOn(component, 'hide');
      component.persistent = true;
      component.bindDocumentClickListener();
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should not hide when mousedown is on the target', () => {
      jest.spyOn(component, 'hide');
      component.bindDocumentClickListener();
      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: target,
        configurable: true
      });
      document.dispatchEvent(event);
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should not hide when selfClick is true', () => {
      jest.spyOn(component, 'hide');
      component.selfClick = true;
      component.bindDocumentClickListener();
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should clear the listener on unbind', () => {
      component.bindDocumentClickListener();
      component.unbindDocumentClickListener();
      expect(component.documentClickListener).toBeNull();
    });

    it('should reset selfClick on unbind', () => {
      component.selfClick = true;
      component.bindDocumentClickListener();
      component.unbindDocumentClickListener();
      expect(component.selfClick).toBe(false);
    });
  });

  describe('bindDocumentKeydownListener / unbindDocumentKeydownListener', () => {
    beforeEach(() => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(false);
      component.dismissable = true;
      component.overlayVisible = true;
      component.target = document.createElement('button');
      component.bindDocumentKeydownListener();
    });

    afterEach(() => {
      component.unbindDocumentKeydownListener();
    });

    it('should bind a keydown listener', () => {
      expect(component.documentKeydownListener).not.toBeNull();
    });

    it('should hide on Escape', () => {
      jest.spyOn(component, 'hide');
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      expect(component.hide).toHaveBeenCalledWith(
        CpsMenuHideReason.KEYDOWN_ESCAPE
      );
    });

    it('should focus the target on Escape via focusService', () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      expect(mockFocusService.focusElement).toHaveBeenCalledWith(
        component.target,
        expect.any(Boolean)
      );
    });

    it('should hide on Tab when items exist', () => {
      jest.spyOn(component, 'hide');
      fixture.componentRef.setInput('items', [{ title: 'A' }]);
      fixture.detectChanges();
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
      );
      expect(component.hide).toHaveBeenCalledWith(
        CpsMenuHideReason.KEYDOWN_TAB
      );
    });

    it('should not dispatch keydown events when overlayVisible is false', () => {
      jest.spyOn(component, 'hide');
      component.overlayVisible = false;
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should clear the listener on unbind', () => {
      component.unbindDocumentKeydownListener();
      expect(component.documentKeydownListener).toBeNull();
    });
  });

  describe('ArrowDown / ArrowUp keyboard navigation', () => {
    let item1: HTMLElement;
    let item2: HTMLElement;
    let container: HTMLDivElement;

    beforeEach(() => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(false);
      fixture.componentRef.setInput('items', [
        { title: 'Item 1' },
        { title: 'Item 2' }
      ]);
      fixture.detectChanges();

      container = document.createElement('div');
      item1 = document.createElement('a');
      item1.className = 'cps-menu-item';
      item1.tabIndex = 0;
      item2 = document.createElement('a');
      item2.className = 'cps-menu-item';
      item2.tabIndex = 0;
      container.appendChild(item1);
      container.appendChild(item2);
      document.body.appendChild(container);

      component.container = container;
      component.overlayVisible = true;
      component.dismissable = true;
      component.bindDocumentKeydownListener();
    });

    afterEach(() => {
      component.unbindDocumentKeydownListener();
      document.body.removeChild(container);
    });

    it('should focus next item on ArrowDown', () => {
      item1.focus();
      jest.spyOn(item2, 'focus');
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );
      expect(item2.focus).toHaveBeenCalled();
    });

    it('should wrap to last item on ArrowUp from first', () => {
      item1.focus();
      jest.spyOn(item2, 'focus');
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      );
      expect(item2.focus).toHaveBeenCalled();
    });

    it('should focus first item on Home', () => {
      item2.focus();
      jest.spyOn(item1, 'focus');
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      );
      expect(item1.focus).toHaveBeenCalled();
    });

    it('should focus last item on End', () => {
      item1.focus();
      jest.spyOn(item2, 'focus');
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      );
      expect(item2.focus).toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('should focus the first menu item when items exist', fakeAsync(() => {
      const menuItem = document.createElement('a');
      menuItem.className = 'cps-menu-item';
      jest.spyOn(menuItem, 'focus');

      jest.spyOn(component as any, '_getMenuItems').mockReturnValue([menuItem]);
      jest
        .spyOn((component as any).zone, 'runOutsideAngular')
        .mockImplementation((fn: unknown) => (fn as () => void)());

      component.focus();
      tick(10);

      expect(menuItem.focus).toHaveBeenCalledWith({ preventScroll: true });
    }));

    it('should focus the first focusable element when no menu items exist', fakeAsync(() => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      container.appendChild(btn);
      component.container = container as HTMLDivElement;
      jest.spyOn(btn, 'focus');

      jest.spyOn(component as any, '_getMenuItems').mockReturnValue([]);
      jest.spyOn(component as any, '_focusableIn').mockReturnValue([btn]);
      jest
        .spyOn((component as any).zone, 'runOutsideAngular')
        .mockImplementation((fn: unknown) => (fn as () => void)());

      component.focus();
      tick(10);

      expect(btn.focus).toHaveBeenCalledWith({ preventScroll: true });
    }));
  });

  describe('ngOnDestroy', () => {
    it('should disconnect the resize observer', () => {
      jest.spyOn(component.resizeObserver, 'disconnect');
      component.ngOnDestroy();
      expect(component.resizeObserver.disconnect).toHaveBeenCalled();
    });

    it('should clear scrollHandler on destroy', () => {
      const mockScrollHandler = {
        destroy: jest.fn(),
        unbindScrollListener: jest.fn(),
        bindScrollListener: jest.fn()
      };
      component.scrollHandler = mockScrollHandler as any;
      component.ngOnDestroy();
      expect(mockScrollHandler.destroy).toHaveBeenCalled();
      expect(component.scrollHandler).toBeNull();
    });
  });

  describe('resizeObserver callback', () => {
    let capturedCallback: ((entries: any[]) => void) | undefined;
    let localFixture: ComponentFixture<CpsMenuComponent>;
    let localComponent: CpsMenuComponent;
    let OriginalRO: any;

    beforeEach(async () => {
      OriginalRO = window.ResizeObserver;
      (window as any).ResizeObserver = class {
        constructor(cb: (entries: any[]) => void) {
          capturedCallback = cb;
        }

        observe() {}
        unobserve() {}
        disconnect() {}
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CpsMenuComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          { provide: CPS_FOCUS_SERVICE, useValue: mockFocusService }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
      localFixture = TestBed.createComponent(CpsMenuComponent);
      localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
    });

    afterEach(() => {
      window.ResizeObserver = OriginalRO;
    });

    it('should call align for each entry when target is set', () => {
      const target = document.createElement('button');
      localComponent.target = target;
      jest.spyOn(localComponent, 'align').mockImplementation(() => {});
      capturedCallback?.([{}, null]);
      expect(localComponent.align).toHaveBeenCalledTimes(1);
    });

    it('should not call align when there is no target', () => {
      localComponent.target = null;
      jest.spyOn(localComponent, 'align').mockImplementation(() => {});
      capturedCallback?.([{}]);
      expect(localComponent.align).not.toHaveBeenCalled();
    });
  });

  describe('align', () => {
    let target: HTMLElement;
    let container: HTMLDivElement;

    beforeEach(() => {
      target = document.createElement('button');
      document.body.appendChild(target);
      container = document.createElement('div');
      document.body.appendChild(container);
      component.container = container;
      component.target = target;
    });

    afterEach(() => {
      target.remove();
      container.remove();
    });

    it('should do nothing when there is no target', () => {
      component.target = null;
      expect(() => component.align()).not.toThrow();
    });

    it('should hide and destroy when target is no longer connected', () => {
      jest.spyOn(component, 'hide');
      target.remove();
      component.align();
      expect(component.hide).toHaveBeenCalledWith(
        CpsMenuHideReason.TARGET_NOT_CONNECTED
      );
    });

    it('should set z-index when autoZIndex is true', () => {
      component.autoZIndex = true;
      component.align();
      expect(container.style.zIndex).not.toBe('');
    });

    it('should skip z-index handling when autoZIndex is false', () => {
      component.autoZIndex = false;
      component.align();
      expect(container.style.zIndex).toBe('');
    });

    it.each(['bl', 'br', 'tl', 'tr', 'default'] as const)(
      'should position the container for position "%s"',
      (pos) => {
        component.position = pos;
        component.align();
        expect(container.style.top).toBe('0px');
        expect(container.style.left).toBe('0px');
      }
    );

    it('should position the arrow when withArrow is true', () => {
      component.withArrow = true;
      const arrowEl = document.createElement('div');
      container.appendChild(arrowEl);
      (component as any)._menuArrow = { nativeElement: arrowEl };
      component.align();
      expect(arrowEl.style.left).toBe('-1px');
    });

    it('should skip arrow positioning when withArrow is false', () => {
      component.withArrow = false;
      (component as any)._menuArrow = undefined;
      expect(() => component.align()).not.toThrow();
    });

    it('should skip arrow positioning when arrow element is not present', () => {
      component.withArrow = true;
      (component as any)._menuArrow = undefined;
      expect(() => component.align()).not.toThrow();
    });

    it('should add flipped class when container is above target', () => {
      jest
        .spyOn(container, 'getBoundingClientRect')
        .mockReturnValue({ top: -100, left: 0 } as DOMRect);
      jest
        .spyOn(target, 'getBoundingClientRect')
        .mockReturnValue({ top: 100, left: 0 } as DOMRect);
      component.align();
      expect(container.classList.contains('cps-menu-container-flipped')).toBe(
        true
      );
    });
  });

  describe('onAnimationStart / onAnimationEnd', () => {
    let target: HTMLElement;

    beforeEach(() => {
      target = document.createElement('button');
      document.body.appendChild(target);
      component.target = target;
      jest.spyOn(component, 'align').mockImplementation(() => {});
      jest.spyOn(component, 'appendContainer').mockImplementation(() => {});
      jest
        .spyOn(component, 'bindDocumentClickListener')
        .mockImplementation(() => {});
      jest
        .spyOn(component, 'bindDocumentKeydownListener')
        .mockImplementation(() => {});
      jest
        .spyOn(component, 'bindDocumentResizeListener')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      document.body.removeChild(target);
    });

    it('should emit beforeMenuHidden when animation moves to close', () => {
      jest.spyOn(component.beforeMenuHidden, 'emit');
      component.hideReason = CpsMenuHideReason.CLICK_ITEM;
      component.onAnimationStart({
        toState: 'close'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.beforeMenuHidden.emit).toHaveBeenCalledWith(
        CpsMenuHideReason.CLICK_ITEM
      );
    });

    it('should set up listeners and emit menuShown when animation moves to open', () => {
      jest.spyOn(component.menuShown, 'emit');
      const containerEl = document.createElement('div');
      component.onAnimationStart({
        toState: 'open',
        element: containerEl
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.container).toBe(containerEl);
      expect(component.appendContainer).toHaveBeenCalled();
      expect(component.align).toHaveBeenCalled();
      expect(component.menuShown.emit).toHaveBeenCalled();
      expect(component.isOverlayAnimationInProgress).toBe(true);
    });

    it('should focus on show when focusOnShow is true', () => {
      component.focusOnShow = true;
      jest.spyOn(component, 'focus').mockImplementation(() => {});
      component.onAnimationStart({
        toState: 'open',
        element: document.createElement('div')
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.focus).toHaveBeenCalled();
    });

    it('should not focus on show when focusOnShow is false', () => {
      component.focusOnShow = false;
      jest.spyOn(component, 'focus').mockImplementation(() => {});
      component.onAnimationStart({
        toState: 'open',
        element: document.createElement('div')
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.focus).not.toHaveBeenCalled();
    });

    it('should not react to other animation states on start', () => {
      component.onAnimationStart({
        toState: 'void'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.isOverlayAnimationInProgress).toBe(true);
    });

    it('should bind scroll listener when animation ends in open', () => {
      jest.spyOn(component, 'bindScrollListener').mockImplementation(() => {});
      component.onAnimationEnd({
        toState: 'open'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.bindScrollListener).toHaveBeenCalled();
      expect(component.isOverlayAnimationInProgress).toBe(false);
    });

    it('should invoke destroyCallback and unsubscribe when animation ends in void', () => {
      const destroyCallback = jest.fn();
      component.destroyCallback = destroyCallback;
      component.overlaySubscription =
        component.overlayService.clickObservable.subscribe(() => {});
      jest.spyOn(component.overlaySubscription, 'unsubscribe');
      component.onAnimationEnd({
        toState: 'void'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(destroyCallback).toHaveBeenCalled();
      expect(component.destroyCallback).toBeNull();
    });

    it('should do nothing extra when animation ends in void with no destroyCallback or subscription', () => {
      component.destroyCallback = null;
      component.overlaySubscription = undefined;
      expect(() =>
        component.onAnimationEnd({
          toState: 'void'
        } as unknown as import('@angular/animations').AnimationEvent)
      ).not.toThrow();
    });

    it('should clear z-index and emit menuHidden when animation ends in close', () => {
      jest.spyOn(component.menuHidden, 'emit');
      component.autoZIndex = true;
      component.hideReason = CpsMenuHideReason.CLICK_OUTSIDE;
      component.onAnimationEnd({
        toState: 'close'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.menuHidden.emit).toHaveBeenCalledWith(
        CpsMenuHideReason.CLICK_OUTSIDE
      );
      expect(component.render).toBe(false);
    });

    it('should unsubscribe overlaySubscription when animation ends in close', () => {
      component.overlaySubscription =
        component.overlayService.clickObservable.subscribe(() => {});
      jest.spyOn(component.overlaySubscription, 'unsubscribe');
      component.onAnimationEnd({
        toState: 'close'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.overlaySubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should set selfClick when overlay is clicked inside the container', () => {
      const containerEl = document.createElement('div');
      const innerTarget = document.createElement('span');
      containerEl.appendChild(innerTarget);
      component.onAnimationStart({
        toState: 'open',
        element: containerEl
      } as unknown as import('@angular/animations').AnimationEvent);

      component.selfClick = false;
      (component.overlayService as any).clickSource.next({
        target: innerTarget
      });
      expect(component.selfClick).toBe(true);
    });

    it('should skip z-index clearing when autoZIndex is false on close', () => {
      component.autoZIndex = false;
      component.onAnimationEnd({
        toState: 'close'
      } as unknown as import('@angular/animations').AnimationEvent);
      expect(component.render).toBe(false);
    });
  });

  describe('_focusTarget', () => {
    it('should do nothing when there is no target', () => {
      component.target = null;
      expect(() => (component as any)._focusTarget()).not.toThrow();
    });

    it('should use the focus service when available', () => {
      const target = document.createElement('button');
      component.target = target;
      (component as any)._focusTarget();
      expect(mockFocusService.focusElement).toHaveBeenCalledWith(
        target,
        expect.any(Boolean)
      );
    });

    it('should fall back to native focus when focus service is unavailable', () => {
      const target = document.createElement('button');
      jest.spyOn(target, 'focus');
      component.target = target;
      (component as any)._cpsFocusService = undefined;
      (component as any)._focusTarget();
      expect(target.focus).toHaveBeenCalled();
    });
  });

  describe('_focusableIn', () => {
    it('should return focusable, visible, enabled elements', () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      Object.defineProperty(btn, 'offsetWidth', { value: 10 });
      const disabledBtn = document.createElement('button');
      disabledBtn.disabled = true;
      Object.defineProperty(disabledBtn, 'offsetWidth', { value: 10 });
      const notTabbable = document.createElement('div');
      notTabbable.tabIndex = -1;
      container.appendChild(btn);
      container.appendChild(disabledBtn);
      container.appendChild(notTabbable);
      document.body.appendChild(container);

      const result = (component as any)._focusableIn(container);
      expect(result).toContain(btn);
      expect(result).not.toContain(disabledBtn);
      expect(result).not.toContain(notTabbable);

      document.body.removeChild(container);
    });
  });

  describe('bindDocumentResizeListener / unbindDocumentResizeListener', () => {
    afterEach(() => {
      component.unbindDocumentResizeListener();
    });

    it('should bind a resize listener', () => {
      component.bindDocumentResizeListener();
      expect(component.documentResizeListener).toBeTruthy();
    });

    it('should not bind a second listener when one already exists', () => {
      component.bindDocumentResizeListener();
      const first = component.documentResizeListener;
      component.bindDocumentResizeListener();
      expect(component.documentResizeListener).toBe(first);
    });

    it('should clear the listener on unbind', () => {
      component.bindDocumentResizeListener();
      component.unbindDocumentResizeListener();
      expect(component.documentResizeListener).toBeNull();
    });
  });

  describe('bindScrollListener / unbindScrollListener', () => {
    beforeEach(() => {
      const target = document.createElement('button');
      component.target = target;
    });

    afterEach(() => {
      component.unbindScrollListener();
    });

    it('should create and bind a scroll handler', () => {
      component.bindScrollListener();
      expect(component.scrollHandler).toBeTruthy();
    });

    it('should hide the menu when scroll fires while overlay visible', () => {
      component.bindScrollListener();
      jest.spyOn(component, 'hide');
      component.overlayVisible = true;
      (component.scrollHandler as any).listener();
      expect(component.hide).toHaveBeenCalledWith(CpsMenuHideReason.SCROLL);
    });

    it('should not hide the menu when scroll fires while overlay hidden', () => {
      component.bindScrollListener();
      jest.spyOn(component, 'hide');
      component.overlayVisible = false;
      (component.scrollHandler as any).listener();
      expect(component.hide).not.toHaveBeenCalled();
    });

    it('should not recreate the scroll handler if one already exists', () => {
      component.bindScrollListener();
      const first = component.scrollHandler;
      component.bindScrollListener();
      expect(component.scrollHandler).toBe(first);
    });
  });

  describe('appendContainer / restoreAppend', () => {
    it('should append the container to the document body', () => {
      const container = document.createElement('div');
      component.container = container;
      component.appendContainer();
      expect(container.parentElement).toBe(document.body);
      document.body.removeChild(container);
    });

    it('should restore the container into the host element', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      component.container = container;
      component.restoreAppend();
      expect(container.parentElement).toBe(component.el.nativeElement);
    });

    it('should do nothing on restoreAppend when there is no container', () => {
      component.container = null;
      expect(() => component.restoreAppend()).not.toThrow();
    });
  });

  describe('onContainerDestroy', () => {
    it('should clear the target when change detector is not destroyed', () => {
      component.target = document.createElement('button');
      component.onContainerDestroy();
      expect(component.target).toBeNull();
    });

    it('should unbind all listeners', () => {
      jest.spyOn(component, 'unbindDocumentClickListener');
      jest.spyOn(component, 'unbindDocumentKeydownListener');
      jest.spyOn(component, 'unbindDocumentResizeListener');
      jest.spyOn(component, 'unbindScrollListener');
      component.onContainerDestroy();
      expect(component.unbindDocumentClickListener).toHaveBeenCalled();
      expect(component.unbindDocumentKeydownListener).toHaveBeenCalled();
      expect(component.unbindDocumentResizeListener).toHaveBeenCalled();
      expect(component.unbindScrollListener).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy / _destroy', () => {
    it('should destroy the scroll handler and clear container z-index', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      component.container = container;
      component.autoZIndex = true;
      const mockScrollHandler = {
        destroy: jest.fn(),
        unbindScrollListener: jest.fn(),
        bindScrollListener: jest.fn()
      };
      component.scrollHandler = mockScrollHandler as any;
      component.ngOnDestroy();
      expect(mockScrollHandler.destroy).toHaveBeenCalled();
      expect(component.container).toBeTruthy();
      document.body.removeChild(
        component.el.nativeElement.contains(container)
          ? component.el.nativeElement
          : container
      );
    });

    it('should unsubscribe from overlaySubscription on destroy', () => {
      component.overlaySubscription =
        component.overlayService.clickObservable.subscribe(() => {});
      jest.spyOn(component.overlaySubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.overlaySubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle destroy with no scrollHandler or container gracefully', () => {
      component.scrollHandler = null;
      component.container = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('bindDocumentKeydownListener Tab handling without items', () => {
    let container: HTMLDivElement;
    let focusableEl: HTMLElement;

    beforeEach(() => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(false);
      container = document.createElement('div');
      focusableEl = document.createElement('button');
      Object.defineProperty(focusableEl, 'offsetWidth', { value: 10 });
      container.appendChild(focusableEl);
      document.body.appendChild(container);

      component.container = container;
      component.target = document.createElement('button');
      component.overlayVisible = true;
      component.dismissable = true;
      component.bindDocumentKeydownListener();
    });

    afterEach(() => {
      component.unbindDocumentKeydownListener();
      document.body.removeChild(container);
    });

    it('should hide on Tab at the last focusable element without shift', () => {
      jest.spyOn(component, 'hide');
      focusableEl.focus();
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
      );
      expect(component.hide).toHaveBeenCalledWith(
        CpsMenuHideReason.KEYDOWN_TAB
      );
    });

    it('should hide on Shift+Tab at the first focusable element', () => {
      jest.spyOn(component, 'hide');
      focusableEl.focus();
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true
        })
      );
      expect(component.hide).toHaveBeenCalledWith(
        CpsMenuHideReason.KEYDOWN_TAB
      );
    });

    it('should not hide on Tab when focus is not at a boundary', () => {
      jest.spyOn(component, 'hide');
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
      );
      expect(component.hide).not.toHaveBeenCalled();
    });
  });

  describe('ArrowDown / ArrowUp / Home / End with no items', () => {
    beforeEach(() => {
      jest.spyOn(DomHandler, 'isTouchDevice').mockReturnValue(false);
      component.container = document.createElement('div');
      component.target = document.createElement('button');
      component.overlayVisible = true;
      component.dismissable = true;
      component.bindDocumentKeydownListener();
    });

    afterEach(() => {
      component.unbindDocumentKeydownListener();
    });

    it('should not navigate on ArrowDown when there are no items', () => {
      expect(() =>
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
        )
      ).not.toThrow();
    });

    it('should not navigate on Home when there are no items', () => {
      expect(() =>
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
        )
      ).not.toThrow();
    });

    it('should not navigate on End when there are no items', () => {
      expect(() =>
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'End', bubbles: true })
        )
      ).not.toThrow();
    });
  });

  describe('_navigateItems with no active item', () => {
    it('should focus the first item when no item currently has focus', () => {
      const container = document.createElement('div');
      const item1 = document.createElement('a');
      item1.className = 'cps-menu-item';
      const item2 = document.createElement('a');
      item2.className = 'cps-menu-item';
      container.appendChild(item1);
      container.appendChild(item2);
      document.body.appendChild(container);
      component.container = container;

      jest.spyOn(item1, 'focus');
      (component as any)._navigateItems(1);
      expect(item1.focus).toHaveBeenCalled();

      document.body.removeChild(container);
    });

    it('should do nothing when there are no menu items', () => {
      component.container = document.createElement('div');
      expect(() => (component as any)._navigateItems(1)).not.toThrow();
    });
  });

  describe('reduced motion', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use the configured transition options by default', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: false } as MediaQueryList);

      expect(component.resolvedShowTransitionOptions).toBe(
        component.showTransitionOptions
      );
      expect(component.resolvedHideTransitionOptions).toBe(
        component.hideTransitionOptions
      );
    });

    it('should use a near-instant transition when the OS prefers reduced motion', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: true } as MediaQueryList);

      expect(component.resolvedShowTransitionOptions).toBe('1ms');
      expect(component.resolvedHideTransitionOptions).toBe('1ms');
    });
  });
});
