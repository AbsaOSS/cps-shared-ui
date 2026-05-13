import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { CpsFocusService, CPS_FOCUS_SERVICE } from './cps-focus.service';

describe('CpsFocusService', () => {
  let service: CpsFocusService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CpsFocusService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default lastInput to "pointer"', () => {
    expect(service.lastInput()).toBe('pointer');
  });

  describe('keyboard navigation keys', () => {
    const navigationKeys = [
      'Tab',
      'Enter',
      ' ',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ];

    navigationKeys.forEach((key) => {
      it(`should set lastInput to "keyboard" on "${key}" keydown`, () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key }));
        expect(service.lastInput()).toBe('keyboard');
      });
    });
  });

  describe('non-navigation keys', () => {
    it('should NOT change lastInput when a non-navigation key is pressed', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(service.lastInput()).toBe('pointer');
    });

    it('should NOT change lastInput for "Shift" keydown', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
      expect(service.lastInput()).toBe('pointer');
    });

    it('should NOT change lastInput for "Escape" keydown', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(service.lastInput()).toBe('pointer');
    });
  });

  it('should reset lastInput to "pointer" on pointerdown after keyboard input', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(service.lastInput()).toBe('keyboard');

    document.dispatchEvent(new Event('pointerdown'));
    expect(service.lastInput()).toBe('pointer');
  });

  it('should remain "pointer" when pointerdown fires without prior keyboard input', () => {
    document.dispatchEvent(new Event('pointerdown'));
    expect(service.lastInput()).toBe('pointer');
  });

  it('should alternate correctly between keyboard and pointer events', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(service.lastInput()).toBe('keyboard');

    document.dispatchEvent(new Event('pointerdown'));
    expect(service.lastInput()).toBe('pointer');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(service.lastInput()).toBe('keyboard');
  });

  describe('isKeyboard()', () => {
    it('should return false by default', () => {
      expect(service.isKeyboard()).toBe(false);
    });

    it('should return true after a navigation key press', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(service.isKeyboard()).toBe(true);
    });

    it('should return false after a pointer event', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      document.dispatchEvent(new Event('pointerdown'));
      expect(service.isKeyboard()).toBe(false);
    });
  });

  describe('focusElement()', () => {
    let el: HTMLElement;

    beforeEach(() => {
      el = document.createElement('button');
      document.body.appendChild(el);
      jest.spyOn(el, 'focus');
    });

    afterEach(() => {
      document.body.removeChild(el);
    });

    it('should call focus() on the element', () => {
      service.focusElement(el, true);
      expect(el.focus).toHaveBeenCalled();
    });

    it('should NOT add suppress-focus-visible when showFocusRing is true', () => {
      service.focusElement(el, true);
      expect(el.classList.contains('suppress-focus-visible')).toBe(false);
    });

    it('should add suppress-focus-visible when showFocusRing is false', () => {
      service.focusElement(el, false);
      expect(el.classList.contains('suppress-focus-visible')).toBe(true);
    });

    it('should remove suppress-focus-visible on blur when showFocusRing is false', () => {
      service.focusElement(el, false);
      expect(el.classList.contains('suppress-focus-visible')).toBe(true);
      el.dispatchEvent(new Event('blur'));
      expect(el.classList.contains('suppress-focus-visible')).toBe(false);
    });

    it('should only remove suppress-focus-visible on the first blur', () => {
      service.focusElement(el, false);
      el.dispatchEvent(new Event('blur'));
      el.classList.add('suppress-focus-visible');
      el.dispatchEvent(new Event('blur'));
      expect(el.classList.contains('suppress-focus-visible')).toBe(true);
    });
  });

  describe('trapFocus()', () => {
    let container: HTMLElement;
    let btn1: HTMLButtonElement;
    let btn2: HTMLButtonElement;
    let btn3: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.setAttribute('tabindex', '-1');
      btn1 = document.createElement('button');
      btn2 = document.createElement('button');
      btn3 = document.createElement('button');
      container.append(btn1, btn2, btn3);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    const tab = (shiftKey = false) =>
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, shiftKey });

    it('should return a teardown function', () => {
      const teardown = service.trapFocus(container);
      expect(typeof teardown).toBe('function');
      teardown();
    });

    it('should wrap focus from last to first on Tab', () => {
      service.trapFocus(container);
      jest.spyOn(btn1, 'focus');
      btn3.focus();
      container.dispatchEvent(tab());
      expect(btn1.focus).toHaveBeenCalled();
    });

    it('should wrap focus from first to last on Shift+Tab', () => {
      service.trapFocus(container);
      jest.spyOn(btn3, 'focus');
      btn1.focus();
      container.dispatchEvent(tab(true));
      expect(btn3.focus).toHaveBeenCalled();
    });

    it('should not trap when Tab is pressed on a middle element', () => {
      service.trapFocus(container);
      jest.spyOn(btn1, 'focus');
      jest.spyOn(btn3, 'focus');
      btn2.focus();
      container.dispatchEvent(tab());
      expect(btn1.focus).not.toHaveBeenCalled();
      expect(btn3.focus).not.toHaveBeenCalled();
    });

    it('should stop trapping after teardown is called', () => {
      const teardown = service.trapFocus(container);
      teardown();
      jest.spyOn(btn1, 'focus');
      btn3.focus();
      container.dispatchEvent(tab());
      expect(btn1.focus).not.toHaveBeenCalled();
    });

    it('should use the provided getFocusableElements function', () => {
      const customGetFocusable = jest.fn(() => [btn1, btn2]);
      service.trapFocus(container, customGetFocusable);
      container.dispatchEvent(tab());
      expect(customGetFocusable).toHaveBeenCalledWith(container);
    });

    it('should prevent default and do nothing when no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);
      service.trapFocus(emptyContainer, () => []);
      const event = tab();
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      emptyContainer.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
      document.body.removeChild(emptyContainer);
    });
  });
});

describe('CpsFocusService (SSR)', () => {
  it('should not register event listeners outside browser', () => {
    const addEventListenerSpy = jest.spyOn(
      Document.prototype,
      'addEventListener'
    );

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, CpsFocusService]
    });
    TestBed.inject(CpsFocusService);

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });
});

describe('CPS_FOCUS_SERVICE token', () => {
  it('should resolve to the CpsFocusService instance', () => {
    TestBed.configureTestingModule({});
    const token = TestBed.inject(CPS_FOCUS_SERVICE);
    const service = TestBed.inject(CpsFocusService);
    expect(token).toBe(service);
  });
});
