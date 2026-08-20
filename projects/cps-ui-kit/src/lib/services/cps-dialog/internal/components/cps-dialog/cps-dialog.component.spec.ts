import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrimeNG } from '../../../../../primeng-temp/config/public_api';
import { DomHandler } from '../../../../../primeng-temp/dom/public_api';
import { ZIndexUtils } from '../../../../../primeng-temp/utils/public_api';
import { CpsDialogComponent } from './cps-dialog.component';
import {
  CPS_DIALOG_CONFIG,
  type CpsDialogConfig
} from '../../../utils/cps-dialog-config';
import { CpsDialogRef } from '../../../utils/cps-dialog-ref/cps-dialog-ref';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../../cps-root-font-size/cps-root-font-size.service';

@Component({ template: '' })
class TestChildComponent {}

const mockRootFontSizeService = {
  fontSize: () => 16
};

describe('CpsDialogComponent', () => {
  let component: CpsDialogComponent;
  let fixture: ComponentFixture<CpsDialogComponent>;
  let mockDialogRef: {
    close: jest.Mock;
    destroy: jest.Mock;
    disableClose: boolean;
    componentInstance: unknown;
  };
  let config: CpsDialogConfig;

  afterEach(() => {
    component?.unbindGlobalListeners?.();
  });

  function setup(configOverrides: Partial<CpsDialogConfig> = {}) {
    mockDialogRef = {
      close: jest.fn(),
      destroy: jest.fn(),
      disableClose: false,
      componentInstance: null
    };

    config = { ...configOverrides };

    TestBed.configureTestingModule({
      imports: [CpsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: CpsDialogRef, useValue: mockDialogRef },
        { provide: CPS_DIALOG_CONFIG, useValue: config },
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        },
        PrimeNG
      ]
    });

    fixture = TestBed.createComponent(CpsDialogComponent);
    component = fixture.componentInstance;
    component.childComponentType = TestChildComponent;
    fixture.detectChanges();
  }

  describe('creation', () => {
    it('should create with a headerTitle', () => {
      setup({ headerTitle: 'My Dialog' });
      expect(component).toBeTruthy();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should start maximized when config.maximized and maximizable are both true', () => {
      setup({ headerTitle: 'Test', maximized: true, maximizable: true });
      expect(component.maximized).toBe(true);
    });

    it('should not maximize when maximizable is false even if config.maximized is true', () => {
      setup({ headerTitle: 'Test', maximized: true, maximizable: false });
      expect(component.maximized).toBeUndefined();
    });
  });

  describe('ngOnInit accessibility warning', () => {
    it('should warn when no accessible name is provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setup({});
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('dialog has no accessible name')
      );
      warnSpy.mockRestore();
    });

    it('should not warn when headerTitle is set', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setup({ headerTitle: 'Dialog Title' });
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should not warn when ariaLabel is set', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setup({ ariaLabel: 'My dialog label' });
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should not warn when ariaLabelledBy is set', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setup({ ariaLabelledBy: 'some-id' });
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should warn when accessible name properties are whitespace only', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setup({ headerTitle: '   ', ariaLabel: '  ', ariaLabelledBy: '\t' });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('ariaLabel getter', () => {
    it('should return null when ariaLabelledBy is set', () => {
      setup({ ariaLabelledBy: 'header-id', ariaLabel: 'My Label' });
      expect(component.ariaLabel).toBeNull();
    });

    it('should return ariaLabel when set and no ariaLabelledBy', () => {
      setup({ ariaLabel: 'Custom label' });
      expect(component.ariaLabel).toBe('Custom label');
    });

    it('should return headerTitle as fallback', () => {
      setup({ headerTitle: 'Dialog Title' });
      expect(component.ariaLabel).toBe('Dialog Title');
    });

    it('should return null when no label sources are set', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setup({});
      warnSpy.mockRestore();
      expect(component.ariaLabel).toBeNull();
    });

    it('should prefer ariaLabel over headerTitle', () => {
      setup({ ariaLabel: 'Label', headerTitle: 'Title' });
      expect(component.ariaLabel).toBe('Label');
    });
  });

  describe('style setter/getter', () => {
    beforeEach(() => setup({ headerTitle: 'Test' }));

    it('should set _style and originalStyle when value is provided', () => {
      component.style = { width: '500px' };
      expect(component.style).toEqual({ width: '500px' });
      expect(component.originalStyle).toEqual({ width: '500px' });
    });

    it('should not update style when value is null/undefined', () => {
      component.style = { width: '400px' };
      component.style = null;
      expect(component.style).toEqual({ width: '400px' });
    });

    it('should return a copy of _style, not the same reference', () => {
      const orig = { color: 'red' };
      component.style = orig;
      orig.color = 'blue';
      expect(component.style.color).toBe('red');
    });
  });

  describe('boolean getters', () => {
    it('should return false for keepInViewport by default', () => {
      setup({ headerTitle: 'Test' });
      expect(component.keepInViewport).toBe(false);
    });

    it('should return config keepInViewport value', () => {
      setup({ headerTitle: 'Test', keepInViewport: true });
      expect(component.keepInViewport).toBe(true);
    });

    it('should return false for maximizable by default', () => {
      setup({ headerTitle: 'Test' });
      expect(component.maximizable).toBe(false);
    });

    it('should return config maximizable value', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      expect(component.maximizable).toBe(true);
    });

    it('should return false for draggable by default', () => {
      setup({ headerTitle: 'Test' });
      expect(component.draggable).toBe(false);
    });

    it('should return config draggable value', () => {
      setup({ headerTitle: 'Test', draggable: true });
      expect(component.draggable).toBe(true);
    });

    it('should return false for resizable by default', () => {
      setup({ headerTitle: 'Test' });
      expect(component.resizable).toBe(false);
    });

    it('should return config resizable value', () => {
      setup({ headerTitle: 'Test', resizable: true });
      expect(component.resizable).toBe(true);
    });
  });

  describe('position getter', () => {
    it('should return empty string when position is not set', () => {
      setup({ headerTitle: 'Test' });
      expect(component.position).toBe('');
    });

    it('should return config position', () => {
      setup({ headerTitle: 'Test', position: 'top' });
      expect(component.position).toBe('top');
    });
  });

  describe('close()', () => {
    it('should set visible to false when not disabled', () => {
      setup({ headerTitle: 'Test' });
      component.close();
      expect(component.visible).toBe(false);
    });

    it('should do nothing when config.disableClose is true', () => {
      setup({ headerTitle: 'Test', disableClose: true });
      component.close();
      expect(component.visible).toBe(true);
    });

    it('should do nothing when dialogRef.disableClose is true', () => {
      setup({ headerTitle: 'Test' });
      mockDialogRef.disableClose = true;
      component.close();
      expect(component.visible).toBe(true);
    });
  });

  describe('hide()', () => {
    it('should call dialogRef.close() when not disabled', () => {
      setup({ headerTitle: 'Test' });
      component.hide();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should do nothing when config.disableClose is true', () => {
      setup({ headerTitle: 'Test', disableClose: true });
      component.hide();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should do nothing when dialogRef.disableClose is true', () => {
      setup({ headerTitle: 'Test' });
      mockDialogRef.disableClose = true;
      component.hide();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('toggleMaximized()', () => {
    it('should do nothing when maximizable is false', () => {
      setup({ headerTitle: 'Test' });
      component.toggleMaximized();
      expect(component.maximized).toBeUndefined();
    });

    it('should toggle maximized to true', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      component.toggleMaximized();
      expect(component.maximized).toBe(true);
    });

    it('should toggle maximized back to false', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      component.toggleMaximized();
      component.toggleMaximized();
      expect(component.maximized).toBe(false);
    });

    it('should set maximized to specific boolean value', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      component.toggleMaximized(true);
      expect(component.maximized).toBe(true);
      component.toggleMaximized(false);
      expect(component.maximized).toBe(false);
    });

    it('should be a no-op when setting maximized to its current value', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      component.maximized = true;
      const emitSpy = jest.spyOn(component._maximizedStateChanged, 'emit');
      component.toggleMaximized(true);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should add overflow-hidden class to body when maximized', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      component.toggleMaximized(true);
      expect(document.body.classList.contains('cps-overflow-hidden')).toBe(
        true
      );
    });

    it('should remove overflow-hidden class from body when minimized', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      component.toggleMaximized(true);
      component.toggleMaximized(false);
      expect(document.body.classList.contains('cps-overflow-hidden')).toBe(
        false
      );
    });

    it('should emit maximized state changed event', () => {
      setup({ headerTitle: 'Test', maximizable: true });
      const emitSpy = jest.spyOn(component._maximizedStateChanged, 'emit');
      component.toggleMaximized(true);
      expect(emitSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('initDrag()', () => {
    describe('when draggable', () => {
      beforeEach(() => setup({ headerTitle: 'Test', draggable: true }));

      it('should set dragging to true', () => {
        const event = new MouseEvent('mousedown', {
          clientX: 100,
          clientY: 200
        });
        component.initDrag(event);
        expect(component.dragging).toBe(true);
      });

      it('should record initial page coordinates', () => {
        const event = new MouseEvent('mousedown', {
          clientX: 150,
          clientY: 250
        });
        component.initDrag(event);
        expect(component.lastPageX).toBe(150);
        expect(component.lastPageY).toBe(250);
      });

      it('should not start drag when maximized', () => {
        component.maximized = true;
        const event = new MouseEvent('mousedown');
        component.initDrag(event);
        expect(component.dragging).toBeUndefined();
      });

      it('should emit dragStarted event', () => {
        const emitSpy = jest.spyOn(component._dragStarted, 'emit');
        const event = new MouseEvent('mousedown');
        component.initDrag(event);
        expect(emitSpy).toHaveBeenCalledWith(event);
      });

      it('should not start drag when clicking a header action button', () => {
        const button = document.createElement('button');
        button.className = 'cps-dialog-header-action-button';
        const icon = document.createElement('span');
        button.appendChild(icon);
        const event = new MouseEvent('mousedown');
        Object.defineProperty(event, 'target', {
          value: icon,
          configurable: true
        });
        component.initDrag(event);
        expect(component.dragging).toBeUndefined();
      });

      it('should not start drag when clicking the header info circle', () => {
        const infoCircle = document.createElement('span');
        infoCircle.className = 'cps-dialog-header-info-circle';
        const event = new MouseEvent('mousedown');
        Object.defineProperty(event, 'target', {
          value: infoCircle,
          configurable: true
        });
        component.initDrag(event);
        expect(component.dragging).toBeUndefined();
      });
    });

    describe('when not draggable', () => {
      beforeEach(() => setup({ headerTitle: 'Test', draggable: false }));

      it('should not start drag', () => {
        const event = new MouseEvent('mousedown');
        component.initDrag(event);
        expect(component.dragging).toBeUndefined();
      });
    });
  });

  describe('endDrag()', () => {
    beforeEach(() => setup({ headerTitle: 'Test', draggable: true }));

    it('should set dragging to false', () => {
      const startEvent = new MouseEvent('mousedown');
      component.initDrag(startEvent);
      const endEvent = new MouseEvent('mouseup');
      component.endDrag(endEvent);
      expect(component.dragging).toBe(false);
    });

    it('should emit dragEnded event', () => {
      const startEvent = new MouseEvent('mousedown');
      component.initDrag(startEvent);
      const emitSpy = jest.spyOn(component._dragEnded, 'emit');
      const endEvent = new MouseEvent('mouseup');
      component.endDrag(endEvent);
      expect(emitSpy).toHaveBeenCalledWith(endEvent);
    });

    it('should do nothing when not currently dragging', () => {
      const emitSpy = jest.spyOn(component._dragEnded, 'emit');
      component.endDrag(new MouseEvent('mouseup'));
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('initResize()', () => {
    describe('when resizable', () => {
      beforeEach(() => setup({ headerTitle: 'Test', resizable: true }));

      it('should set resizing to true', () => {
        const event = new MouseEvent('mousedown', {
          clientX: 100,
          clientY: 200
        });
        component.initResize(event);
        expect(component.resizing).toBe(true);
      });

      it('should record initial page coordinates', () => {
        const event = new MouseEvent('mousedown', { clientX: 50, clientY: 75 });
        component.initResize(event);
        expect(component.lastPageX).toBe(50);
        expect(component.lastPageY).toBe(75);
      });

      it('should emit resizeStarted event', () => {
        const emitSpy = jest.spyOn(component._resizeStarted, 'emit');
        const event = new MouseEvent('mousedown');
        component.initResize(event);
        expect(emitSpy).toHaveBeenCalledWith(event);
      });
    });

    describe('when not resizable', () => {
      beforeEach(() => setup({ headerTitle: 'Test', resizable: false }));

      it('should not start resize', () => {
        const event = new MouseEvent('mousedown');
        component.initResize(event);
        expect(component.resizing).toBeUndefined();
      });
    });
  });

  describe('resizeEnd()', () => {
    beforeEach(() => setup({ headerTitle: 'Test', resizable: true }));

    it('should set resizing to false', () => {
      const startEvent = new MouseEvent('mousedown');
      component.initResize(startEvent);
      const endEvent = new MouseEvent('mouseup');
      component.resizeEnd(endEvent);
      expect(component.resizing).toBe(false);
    });

    it('should emit resizeEnded event', () => {
      const startEvent = new MouseEvent('mousedown');
      component.initResize(startEvent);
      const emitSpy = jest.spyOn(component._resizeEnded, 'emit');
      const endEvent = new MouseEvent('mouseup');
      component.resizeEnd(endEvent);
      expect(emitSpy).toHaveBeenCalledWith(endEvent);
    });

    it('should do nothing when not currently resizing', () => {
      const emitSpy = jest.spyOn(component._resizeEnded, 'emit');
      component.resizeEnd(new MouseEvent('mouseup'));
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('enableModality()', () => {
    it('should add cps-overflow-hidden class to body', () => {
      setup({ headerTitle: 'Test' });
      component.wrapper = document.body;
      component.enableModality();
      expect(document.body.classList.contains('cps-overflow-hidden')).toBe(
        true
      );
    });

    it('should not add body class when modal is false', () => {
      setup({ headerTitle: 'Test', modal: false });
      component.wrapper = document.body;
      component.enableModality();
      expect(document.body.classList.contains('cps-overflow-hidden')).toBe(
        false
      );
    });
  });

  describe('disableModality()', () => {
    it('should remove cps-overflow-hidden class from body', () => {
      setup({ headerTitle: 'Test' });
      document.body.classList.add('cps-overflow-hidden');
      component.wrapper = document.body;
      component.disableModality();
      expect(document.body.classList.contains('cps-overflow-hidden')).toBe(
        false
      );
    });
  });

  describe('resetPosition()', () => {
    it('should clear position styles on the container', () => {
      setup({ headerTitle: 'Test' });
      const mockContainer = document.createElement('div');
      mockContainer.style.position = 'fixed';
      mockContainer.style.left = '100px';
      mockContainer.style.top = '50px';
      mockContainer.style.margin = '0';
      component.container = mockContainer as HTMLDivElement;

      component.resetPosition();

      expect(mockContainer.style.position).toBe('');
      expect(mockContainer.style.left).toBe('');
      expect(mockContainer.style.top).toBe('');
      expect(mockContainer.style.margin).toBe('');
    });
  });

  describe('focus()', () => {
    beforeEach(() => setup({ headerTitle: 'Test' }));

    it('should call afterFocus without focusing when autoFocus is false', fakeAsync(() => {
      config.autoFocus = false;
      component.container = document.createElement('div') as HTMLDivElement;
      const afterFocus = jest.fn();
      component.focus(afterFocus);
      tick(10);
      expect(afterFocus).toHaveBeenCalled();
    }));

    it('should call afterFocus immediately when there is no container', () => {
      component.container = null;
      const afterFocus = jest.fn();
      component.focus(afterFocus);
      expect(afterFocus).toHaveBeenCalled();
    });

    it('should focus the dialog container when autoFocus is "dialog"', fakeAsync(() => {
      config.autoFocus = 'dialog';
      const containerEl = document.createElement('div') as HTMLDivElement;
      containerEl.setAttribute('tabindex', '-1');
      document.body.appendChild(containerEl);
      component.container = containerEl;
      const focusSpy = jest.spyOn(containerEl, 'focus');
      component.focus();
      tick(10);
      expect(focusSpy).toHaveBeenCalled();
      document.body.removeChild(containerEl);
    }));

    it('should focus the first tabbable element by default', fakeAsync(() => {
      config.autoFocus = true;
      const containerEl = document.createElement('div') as HTMLDivElement;
      const button = document.createElement('button');
      containerEl.appendChild(button);
      document.body.appendChild(containerEl);
      component.container = containerEl;
      jest
        .spyOn(DomHandler, 'getFocusableElements')
        .mockReturnValue([button] as HTMLElement[]);
      const focusSpy = jest.spyOn(button, 'focus');
      component.focus();
      tick(10);
      expect(focusSpy).toHaveBeenCalled();
      jest.restoreAllMocks();
      document.body.removeChild(containerEl);
    }));

    it('should fall back to container focus when no focusable elements exist', fakeAsync(() => {
      config.autoFocus = true;
      const containerEl = document.createElement('div') as HTMLDivElement;
      containerEl.setAttribute('tabindex', '-1');
      document.body.appendChild(containerEl);
      component.container = containerEl;
      const focusSpy = jest.spyOn(containerEl, 'focus');
      component.focus();
      tick(10);
      expect(focusSpy).toHaveBeenCalled();
      document.body.removeChild(containerEl);
    }));

    it('should focus an element matching a CSS selector', fakeAsync(() => {
      config.autoFocus = '#my-input';
      const containerEl = document.createElement('div') as HTMLDivElement;
      const input = document.createElement('input');
      input.id = 'my-input';
      containerEl.appendChild(input);
      document.body.appendChild(containerEl);
      component.container = containerEl;
      const focusSpy = jest.spyOn(input, 'focus');
      component.focus();
      tick(10);
      expect(focusSpy).toHaveBeenCalled();
      document.body.removeChild(containerEl);
    }));

    it('should call afterFocus callback after focusing', fakeAsync(() => {
      config.autoFocus = false;
      component.container = document.createElement('div') as HTMLDivElement;
      const afterFocus = jest.fn();
      component.focus(afterFocus);
      tick(10);
      expect(afterFocus).toHaveBeenCalled();
    }));
  });

  describe('onResizeHandleKeydown()', () => {
    function makeKeyEvent(key: string, target: HTMLElement): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'target', {
        value: target,
        configurable: true
      });
      return event;
    }

    describe('when resizable', () => {
      beforeEach(() => setup({ headerTitle: 'Test', resizable: true }));

      it('should do nothing when maximized', () => {
        component.maximized = true;
        const handleEl = document.createElement('div');
        const event = makeKeyEvent('ArrowRight', handleEl);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        component.onResizeHandleKeydown(event);
        expect(preventDefaultSpy).not.toHaveBeenCalled();
      });

      it('should do nothing for non-arrow keys', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        component.container = containerEl;
        const handleEl = document.createElement('div');
        const event = makeKeyEvent('Enter', handleEl);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        component.onResizeHandleKeydown(event);
        expect(preventDefaultSpy).not.toHaveBeenCalled();
      });

      it('should call preventDefault for arrow keys when resizable', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        document.body.appendChild(containerEl);
        component.container = containerEl;
        const handleEl = document.createElement('div');
        document.body.appendChild(handleEl);
        const event = makeKeyEvent('ArrowRight', handleEl);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        component.onResizeHandleKeydown(event);
        expect(preventDefaultSpy).toHaveBeenCalled();
        document.body.removeChild(containerEl);
        document.body.removeChild(handleEl);
      });

      it('should shrink width on ArrowLeft', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        Object.defineProperty(containerEl, 'offsetWidth', {
          value: 200,
          configurable: true
        });
        document.body.appendChild(containerEl);
        component.container = containerEl;
        const handleEl = document.createElement('div');
        document.body.appendChild(handleEl);
        component.onResizeHandleKeydown(makeKeyEvent('ArrowLeft', handleEl));
        expect(containerEl.style.width).not.toBe('');
        document.body.removeChild(containerEl);
        document.body.removeChild(handleEl);
      });

      it('should shrink height on ArrowUp', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        Object.defineProperty(containerEl, 'offsetHeight', {
          value: 200,
          configurable: true
        });
        document.body.appendChild(containerEl);
        component.container = containerEl;
        const handleEl = document.createElement('div');
        document.body.appendChild(handleEl);
        component.onResizeHandleKeydown(makeKeyEvent('ArrowUp', handleEl));
        expect(containerEl.style.height).not.toBe('');
        document.body.removeChild(containerEl);
        document.body.removeChild(handleEl);
      });

      it('should emit resizeStarted on first arrow key press', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        document.body.appendChild(containerEl);
        component.container = containerEl;
        const handleEl = document.createElement('div');
        document.body.appendChild(handleEl);
        const emitSpy = jest.spyOn(component._resizeStarted, 'emit');
        const event = makeKeyEvent('ArrowDown', handleEl);
        component.onResizeHandleKeydown(event);
        expect(emitSpy).toHaveBeenCalledWith(event);
        document.body.removeChild(containerEl);
        document.body.removeChild(handleEl);
      });

      it('should not emit resizeStarted again when already resizing', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        document.body.appendChild(containerEl);
        component.container = containerEl;
        const handleEl = document.createElement('div');
        document.body.appendChild(handleEl);
        const event = makeKeyEvent('ArrowDown', handleEl);
        component.onResizeHandleKeydown(event);
        const emitSpy = jest.spyOn(component._resizeStarted, 'emit');
        const event2 = makeKeyEvent('ArrowDown', handleEl);
        component.onResizeHandleKeydown(event2);
        expect(emitSpy).not.toHaveBeenCalled();
        document.body.removeChild(containerEl);
        document.body.removeChild(handleEl);
      });
    });

    describe('when not resizable', () => {
      beforeEach(() => setup({ headerTitle: 'Test', resizable: false }));

      it('should do nothing for arrow keys', () => {
        const containerEl = document.createElement('div') as HTMLDivElement;
        component.container = containerEl;
        const handleEl = document.createElement('div');
        const event = makeKeyEvent('ArrowRight', handleEl);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        component.onResizeHandleKeydown(event);
        expect(preventDefaultSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('onResizeHandleKeyup()', () => {
    beforeEach(() => setup({ headerTitle: 'Test', resizable: true }));

    it('should emit resizeEnded for arrow keys', () => {
      const emitSpy = jest.spyOn(component._resizeEnded, 'emit');
      const handleEl = document.createElement('div');
      document.body.appendChild(handleEl);
      const event = new KeyboardEvent('keyup', {
        key: 'ArrowUp',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {
        value: handleEl,
        configurable: true
      });
      component.onResizeHandleKeyup(event);
      expect(emitSpy).toHaveBeenCalledWith(event);
      document.body.removeChild(handleEl);
    });

    it('should not emit resizeEnded for non-arrow keys', () => {
      const emitSpy = jest.spyOn(component._resizeEnded, 'emit');
      const event = new KeyboardEvent('keyup', { key: 'Tab' });
      component.onResizeHandleKeyup(event);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onHeaderKeydown()', () => {
    it('should do nothing when not draggable', () => {
      setup({ headerTitle: 'Test', draggable: false });
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      component.onHeaderKeydown(event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when maximized', () => {
      setup({ headerTitle: 'Test', draggable: true });
      component.maximized = true;
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      component.onHeaderKeydown(event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when target is not inside drag handle', () => {
      setup({ headerTitle: 'Test', draggable: true });
      const containerEl = document.createElement('div') as HTMLDivElement;
      component.container = containerEl;
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      component.onHeaderKeydown(event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('onHeaderKeyup()', () => {
    it('should not emit dragEnded when target is not in drag handle', () => {
      setup({ headerTitle: 'Test', draggable: true });
      const emitSpy = jest.spyOn(component._dragEnded, 'emit');
      const event = new KeyboardEvent('keyup', { key: 'ArrowRight' });
      component.onHeaderKeyup(event);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('parent getter', () => {
    it('should return undefined when there is only one dialog in the DOM', () => {
      setup({ headerTitle: 'Test' });
      expect(component.parent).toBeUndefined();
    });

    it('should return the last dialog element when more than one is present', () => {
      setup({ headerTitle: 'Test' });
      const extra1 = document.createElement('div');
      extra1.className = 'cps-dialog';
      const extra2 = document.createElement('div');
      extra2.className = 'cps-dialog';
      document.body.appendChild(extra1);
      document.body.appendChild(extra2);

      expect(component.parent).toBe(extra2);

      extra1.remove();
      extra2.remove();
    });
  });

  describe('size getters', () => {
    it('should return converted width', () => {
      setup({ headerTitle: 'Test', width: '500px' });
      expect(component.cvtWidth).toBe('500px');
    });

    it('should return converted height', () => {
      setup({ headerTitle: 'Test', height: '300px' });
      expect(component.cvtHeight).toBe('300px');
    });

    it('should return converted minWidth', () => {
      setup({ headerTitle: 'Test', minWidth: '200px' });
      expect(component.cvtMinWidth).toBe('200px');
    });

    it('should return converted minHeight', () => {
      setup({ headerTitle: 'Test', minHeight: '100px' });
      expect(component.cvtMinHeight).toBe('100px');
    });

    it('should return empty string for maxWidth when maximized', () => {
      setup({ headerTitle: 'Test', maxWidth: '800px' });
      component.maximized = true;
      expect(component.cvtMaxWidth).toBe('');
    });

    it('should return converted maxWidth when not maximized', () => {
      setup({ headerTitle: 'Test', maxWidth: '800px' });
      expect(component.cvtMaxWidth).toBe('800px');
    });

    it('should return empty string for maxHeight when maximized', () => {
      setup({ headerTitle: 'Test', maxHeight: '600px' });
      component.maximized = true;
      expect(component.cvtMaxHeight).toBe('');
    });

    it('should return converted maxHeight when not maximized', () => {
      setup({ headerTitle: 'Test', maxHeight: '600px' });
      expect(component.cvtMaxHeight).toBe('600px');
    });
  });

  describe('minX / minY getters', () => {
    it('should return 0 when minX is not set', () => {
      setup({ headerTitle: 'Test' });
      expect(component.minX).toBe(0);
    });

    it('should return 0 when minY is not set', () => {
      setup({ headerTitle: 'Test' });
      expect(component.minY).toBe(0);
    });

    it('should return pixel value when minX is set as number', () => {
      setup({ headerTitle: 'Test', minX: 50 });
      expect(component.minX).toBe(50);
    });

    it('should return pixel value when minY is set as number', () => {
      setup({ headerTitle: 'Test', minY: 30 });
      expect(component.minY).toBe(30);
    });

    it('should convert a rem string value', () => {
      setup({ headerTitle: 'Test', minX: '2rem' });
      expect(component.minX).toBe(32);
    });

    it('should throw for an unsupported unit', () => {
      setup({ headerTitle: 'Test', minX: '10%' });
      expect(() => component.minX).toThrow(
        'Unsupported unit "%" in dialog config. Use px or rem.'
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw on destroy', () => {
      setup({ headerTitle: 'Test' });
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  describe('reduced motion', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use the configured transition options by default', () => {
      setup({ headerTitle: 'Test', transitionOptions: '150ms ease' });
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: false } as MediaQueryList);

      expect(component.resolvedTransitionOptions).toBe('150ms ease');
    });

    it('should fall back to the default transition options when unset', () => {
      setup({ headerTitle: 'Test' });
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: false } as MediaQueryList);

      expect(component.resolvedTransitionOptions).toBe(
        '150ms cubic-bezier(0, 0, 0.2, 1)'
      );
    });

    it('should use a near-instant transition when the OS prefers reduced motion', () => {
      setup({ headerTitle: 'Test', transitionOptions: '150ms ease' });
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: true } as MediaQueryList);

      expect(component.resolvedTransitionOptions).toBe('1ms');
    });
  });

  describe('isCloseDisabled()', () => {
    it('should return false when neither config nor dialogRef disables close', () => {
      setup({ headerTitle: 'Test' });
      expect(component.isCloseDisabled()).toBe(false);
    });

    it('should return true when config.disableClose is true', () => {
      setup({ headerTitle: 'Test', disableClose: true });
      expect(component.isCloseDisabled()).toBe(true);
    });

    it('should return true when dialogRef.disableClose is true', () => {
      setup({ headerTitle: 'Test' });
      mockDialogRef.disableClose = true;
      expect(component.isCloseDisabled()).toBe(true);
    });
  });

  describe('loadChildComponent()', () => {
    it('should create the child component via the insertion point and register it on dialogRef', () => {
      setup({ headerTitle: 'Test' });
      expect(component.componentRef).toBeTruthy();
      expect(mockDialogRef.componentInstance).toBeInstanceOf(
        TestChildComponent
      );
    });
  });

  describe('moveOnTop()', () => {
    beforeEach(() => setup({ headerTitle: 'Test' }));

    it('should set container and wrapper z-index when autoZIndex is not false', () => {
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      component.container = container as HTMLDivElement;
      component.wrapper = wrapper;
      component.moveOnTop();
      expect(container.style.zIndex).not.toBe('');
      expect(wrapper.style.zIndex).not.toBe('');
    });

    it('should do nothing when autoZIndex is false', () => {
      component.config.autoZIndex = false;
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      component.container = container as HTMLDivElement;
      component.wrapper = wrapper;
      component.moveOnTop();
      expect(container.style.zIndex).toBe('');
      expect(wrapper.style.zIndex).toBe('');
    });
  });

  describe('onAnimationStart()', () => {
    function makeEvent(toState: string, element: HTMLElement): any {
      return { toState, element };
    }

    afterEach(() => {
      component?.unbindGlobalListeners();
    });

    it('should set up container/wrapper, move on top, and bind listeners on "visible"', () => {
      setup({ headerTitle: 'Test' });
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      container.appendChild(wrapper);
      document.body.appendChild(container);
      const bindSpy = jest.spyOn(component, 'bindGlobalListeners');

      component.onAnimationStart(makeEvent('visible', container));

      expect(component.container).toBe(container);
      expect(bindSpy).toHaveBeenCalled();
      container.remove();
    });

    it('should unbind existing listeners first when a parent dialog already exists', () => {
      setup({ headerTitle: 'Test' });
      const otherDialog = document.createElement('div');
      otherDialog.className = 'cps-dialog';
      document.body.appendChild(otherDialog);
      const another = document.createElement('div');
      another.className = 'cps-dialog';
      document.body.appendChild(another);

      const container = document.createElement('div');
      document.body.appendChild(container);
      const unbindSpy = jest.spyOn(component, 'unbindGlobalListeners');

      component.onAnimationStart(makeEvent('visible', container));

      expect(unbindSpy).toHaveBeenCalled();
      container.remove();
      otherDialog.remove();
      another.remove();
    });

    it('should enable modality when modal is not false', () => {
      setup({ headerTitle: 'Test' });
      const container = document.createElement('div');
      document.body.appendChild(container);
      const enableModalitySpy = jest.spyOn(component, 'enableModality');

      component.onAnimationStart(makeEvent('visible', container));

      expect(enableModalitySpy).toHaveBeenCalled();
      container.remove();
    });

    it('should not enable modality when modal is false', () => {
      setup({ headerTitle: 'Test', modal: false });
      const container = document.createElement('div');
      document.body.appendChild(container);
      const enableModalitySpy = jest.spyOn(component, 'enableModality');

      component.onAnimationStart(makeEvent('visible', container));

      expect(enableModalitySpy).not.toHaveBeenCalled();
      container.remove();
    });

    it('should add the blurred overlay leave class on "void" when blurredBackground is true', () => {
      setup({ headerTitle: 'Test', blurredBackground: true });
      const wrapper = document.createElement('div');
      component.wrapper = wrapper;
      component.container = document.createElement('div') as HTMLDivElement;

      component.onAnimationStart(
        makeEvent('void', document.createElement('div'))
      );

      expect(
        wrapper.classList.contains('cps-dialog-blurred-overlay-leave')
      ).toBe(true);
    });

    it('should add the plain overlay leave class on "void" when blurredBackground is false', () => {
      setup({ headerTitle: 'Test' });
      const wrapper = document.createElement('div');
      component.wrapper = wrapper;
      component.container = document.createElement('div') as HTMLDivElement;

      component.onAnimationStart(
        makeEvent('void', document.createElement('div'))
      );

      expect(wrapper.classList.contains('cps-dialog-overlay-leave')).toBe(true);
    });

    it('should not touch the wrapper on "void" when modal is false', () => {
      setup({ headerTitle: 'Test', modal: false });
      const wrapper = document.createElement('div');
      component.wrapper = wrapper;
      component.container = document.createElement('div') as HTMLDivElement;

      component.onAnimationStart(
        makeEvent('void', document.createElement('div'))
      );

      expect(wrapper.classList.length).toBe(0);
    });
  });

  describe('onAnimationEnd()', () => {
    it('should destroy the container and dialogRef on "void"', () => {
      setup({ headerTitle: 'Test' });
      const destroySpy = jest.spyOn(component, 'onContainerDestroy');

      component.onAnimationEnd({ toState: 'void' } as any);

      expect(destroySpy).toHaveBeenCalled();
      expect(mockDialogRef.destroy).toHaveBeenCalled();
    });

    it('should focus and emit openStateChanged on other states', fakeAsync(() => {
      setup({ headerTitle: 'Test' });
      component.container = document.createElement('div') as HTMLDivElement;
      const emitSpy = jest.spyOn(component._openStateChanged, 'emit');

      component.onAnimationEnd({ toState: 'visible' } as any);
      tick(10);

      expect(emitSpy).toHaveBeenCalled();
    }));
  });

  describe('onContainerDestroy()', () => {
    it('should clear zIndex and disable modality when applicable', () => {
      setup({ headerTitle: 'Test' });
      const container = document.createElement('div');
      component.container = container as HTMLDivElement;
      component.wrapper = document.createElement('div');
      const unbindSpy = jest.spyOn(component, 'unbindGlobalListeners');
      const disableModalitySpy = jest.spyOn(component, 'disableModality');

      component.onContainerDestroy();

      expect(unbindSpy).toHaveBeenCalled();
      expect(disableModalitySpy).toHaveBeenCalled();
      expect(component.container).toBeNull();
    });

    it('should skip disableModality when modal is false', () => {
      setup({ headerTitle: 'Test', modal: false });
      component.container = document.createElement('div') as HTMLDivElement;
      const disableModalitySpy = jest.spyOn(component, 'disableModality');

      component.onContainerDestroy();

      expect(disableModalitySpy).not.toHaveBeenCalled();
    });

    it('should restore focus via the focus service when shouldRestoreFocus is set', () => {
      setup({ headerTitle: 'Test' });
      const previouslyFocused = document.createElement('button');
      document.body.appendChild(previouslyFocused);
      (component as any)._shouldRestoreFocus = true;
      (component as any)._previouslyFocusedElement = previouslyFocused;
      const focusSpy = jest.spyOn(
        (component as any)._cpsFocusService,
        'focusElement'
      );

      component.onContainerDestroy();

      expect(focusSpy).toHaveBeenCalledWith(previouslyFocused, false);
      previouslyFocused.remove();
    });

    it('should fall back to native focus when no focus service is present', () => {
      setup({ headerTitle: 'Test' });
      (component as any)._cpsFocusService = null;
      const previouslyFocused = document.createElement('button');
      document.body.appendChild(previouslyFocused);
      (component as any)._shouldRestoreFocus = true;
      (component as any)._previouslyFocusedElement = previouslyFocused;
      const focusSpy = jest.spyOn(previouslyFocused, 'focus');

      component.onContainerDestroy();

      expect(focusSpy).toHaveBeenCalled();
      previouslyFocused.remove();
    });

    it('should not attempt to restore focus when shouldRestoreFocus is false', () => {
      setup({ headerTitle: 'Test' });
      const previouslyFocused = document.createElement('button');
      document.body.appendChild(previouslyFocused);
      (component as any)._shouldRestoreFocus = false;
      (component as any)._previouslyFocusedElement = previouslyFocused;
      const focusSpy = jest.spyOn(previouslyFocused, 'focus');

      component.onContainerDestroy();

      expect(focusSpy).not.toHaveBeenCalled();
      previouslyFocused.remove();
    });
  });

  describe('enableModality() mask click', () => {
    it('should hide the dialog when clicking directly on the wrapper', () => {
      setup({ headerTitle: 'Test' });
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      component.wrapper = wrapper;
      component.enableModality();

      wrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(mockDialogRef.close).toHaveBeenCalled();
      wrapper.remove();
    });

    it('should not hide the dialog when clicking inside the wrapper (not the wrapper itself)', () => {
      setup({ headerTitle: 'Test' });
      const wrapper = document.createElement('div');
      const inner = document.createElement('div');
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);
      component.wrapper = wrapper;
      component.enableModality();

      inner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
      wrapper.remove();
    });

    it('should not register a mask click listener when disableClose is true', () => {
      setup({ headerTitle: 'Test', disableClose: true });
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      component.wrapper = wrapper;
      component.enableModality();

      expect(component.maskClickListener).toBeUndefined();
      wrapper.remove();
    });
  });

  describe('bind/unbind global listeners', () => {
    afterEach(() => {
      component?.unbindGlobalListeners();
    });

    it('should bind the escape listener when closeOnEscape and disableClose allow it', () => {
      setup({ headerTitle: 'Test' });
      component.bindGlobalListeners();
      expect(component.documentEscapeListener).toBeTruthy();
      component.unbindGlobalListeners();
    });

    it('should not bind the escape listener when closeOnEscape is false', () => {
      setup({ headerTitle: 'Test', closeOnEscape: false });
      component.bindGlobalListeners();
      expect(component.documentEscapeListener).toBeFalsy();
    });

    it('should bind the focus trap when modal is not false', () => {
      setup({ headerTitle: 'Test' });
      component.container = document.createElement('div') as HTMLDivElement;
      const trapSpy = jest.spyOn(
        (component as any)._cpsFocusService,
        'trapFocus'
      );
      component.bindGlobalListeners();
      expect(trapSpy).toHaveBeenCalled();
      component.unbindGlobalListeners();
    });

    it('should not bind the focus trap when modal is false', () => {
      setup({ headerTitle: 'Test', modal: false });
      component.container = document.createElement('div') as HTMLDivElement;
      const trapSpy = jest.spyOn(
        (component as any)._cpsFocusService,
        'trapFocus'
      );
      component.bindGlobalListeners();
      expect(trapSpy).not.toHaveBeenCalled();
    });

    it('should bind resize listeners when resizable', () => {
      setup({ headerTitle: 'Test', resizable: true });
      component.bindGlobalListeners();
      expect(component.documentResizeListener).toBeTruthy();
      expect(component.documentResizeEndListener).toBeTruthy();
      component.unbindGlobalListeners();
    });

    it('should bind drag listeners when draggable', () => {
      setup({ headerTitle: 'Test', draggable: true });
      component.bindGlobalListeners();
      expect(component.documentDragListener).toBeTruthy();
      expect(component.documentDragEndListener).toBeTruthy();
      component.unbindGlobalListeners();
    });

    it('should be a no-op to unbind escape listener twice', () => {
      setup({ headerTitle: 'Test' });
      component.bindGlobalListeners();
      component.unbindDocumentEscapeListener();
      expect(() => component.unbindDocumentEscapeListener()).not.toThrow();
    });

    it('should be a no-op to unbind resize listeners when not bound', () => {
      setup({ headerTitle: 'Test' });
      expect(() => component.unbindDocumentResizeListeners()).not.toThrow();
    });
  });

  describe('bindFocusTrapListener() / unbindFocusTrapListener()', () => {
    it('should do nothing when there is no container', () => {
      setup({ headerTitle: 'Test' });
      component.container = null;
      expect(() => component.bindFocusTrapListener()).not.toThrow();
    });

    it('should tear down the focus trap on unbind', () => {
      setup({ headerTitle: 'Test' });
      component.container = document.createElement('div') as HTMLDivElement;
      component.bindFocusTrapListener();
      const teardown = (component as any)._focusTrapTeardown;
      expect(teardown).toBeTruthy();
      component.unbindFocusTrapListener();
      expect((component as any)._focusTrapTeardown).toBeNull();
    });

    it('should delegate the focusable-elements lookup to DomHandler', () => {
      setup({ headerTitle: 'Test' });
      const container = document.createElement('div');
      component.container = container as HTMLDivElement;
      const getFocusableSpy = jest.spyOn(DomHandler, 'getFocusableElements');
      const trapFocusSpy = jest.spyOn(
        (component as any)._cpsFocusService,
        'trapFocus'
      );

      component.bindFocusTrapListener();
      const getFocusableElements = trapFocusSpy.mock.calls[0][1] as (
        el: HTMLElement
      ) => HTMLElement[];
      getFocusableElements(container);

      expect(getFocusableSpy).toHaveBeenCalledWith(container);
    });
  });

  describe('bindDocumentEscapeListener()', () => {
    function captureEscapeHandler(): (event: KeyboardEvent) => void {
      let handler: (event: KeyboardEvent) => void = () => {};
      jest.spyOn(component.renderer, 'listen').mockImplementation(((
        _target: any,
        _event: string,
        cb: any
      ) => {
        handler = cb;
        return () => {};
      }) as any);
      component.bindDocumentEscapeListener();
      return (event: KeyboardEvent) => handler(event);
    }

    afterEach(() => jest.restoreAllMocks());

    it('should hide the dialog on Escape when zIndex matches the current one', () => {
      setup({ headerTitle: 'Test' });
      const container = document.createElement('div');
      container.style.zIndex = '1000';
      component.container = container as HTMLDivElement;
      jest.spyOn(ZIndexUtils, 'getCurrent').mockReturnValue(1000);
      const fire = captureEscapeHandler();

      fire(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not hide the dialog on Escape when zIndex does not match', () => {
      setup({ headerTitle: 'Test' });
      const container = document.createElement('div');
      container.style.zIndex = '1000';
      component.container = container as HTMLDivElement;
      jest.spyOn(ZIndexUtils, 'getCurrent').mockReturnValue(2000);
      const fire = captureEscapeHandler();

      fire(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should ignore non-Escape keys', () => {
      setup({ headerTitle: 'Test' });
      component.container = document.createElement('div') as HTMLDivElement;
      const fire = captureEscapeHandler();

      fire(new KeyboardEvent('keydown', { key: 'Tab' }));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onResize() / onDrag() mouse handlers', () => {
    afterEach(() => {
      component?.unbindDocumentResizeListeners();
    });

    function makeContainer(): HTMLDivElement {
      const el = document.createElement('div');
      Object.defineProperties(el, {
        offsetWidth: { value: 200, configurable: true },
        offsetHeight: { value: 150, configurable: true }
      });
      jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 200,
        height: 150
      } as DOMRect);
      return el as HTMLDivElement;
    }

    it('should do nothing for onResize when not resizing', () => {
      setup({ headerTitle: 'Test', resizable: true });
      const container = makeContainer();
      component.container = container;
      expect(() =>
        component.onResize(new MouseEvent('mousemove'))
      ).not.toThrow();
      expect(container.style.width).toBe('');
    });

    it('should update size while resizing', () => {
      setup({ headerTitle: 'Test', resizable: true });
      const container = makeContainer();
      const content = document.createElement('div');
      const header = document.createElement('div');
      component.container = container;
      (component as any).contentViewChild = { nativeElement: content };
      (component as any).headerViewChild = { nativeElement: header };
      component.initResize(
        new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
      );

      component.onResize(
        new MouseEvent('mousemove', { clientX: 50, clientY: 30 })
      );

      expect(container.style.width).toBe('18.75rem');
      expect(container.style.height).toBe('13.125rem');
    });

    it('should do nothing for onDrag when not dragging', () => {
      setup({ headerTitle: 'Test', draggable: true });
      const container = makeContainer();
      component.container = container;
      expect(() => component.onDrag(new MouseEvent('mousemove'))).not.toThrow();
    });

    it('should update position while dragging without keepInViewport', () => {
      setup({ headerTitle: 'Test', draggable: true });
      const container = makeContainer();
      component.container = container;
      component.initDrag(
        new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
      );

      component.onDrag(
        new MouseEvent('mousemove', { clientX: 40, clientY: 20 })
      );

      expect(container.style.left).toBe('3.125rem');
      expect(container.style.top).toBe('1.875rem');
    });

    it('should update position while dragging with keepInViewport when within bounds', () => {
      setup({ headerTitle: 'Test', draggable: true, keepInViewport: true });
      const container = makeContainer();
      component.container = container;
      component.initDrag(
        new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
      );

      component.onDrag(new MouseEvent('mousemove', { clientX: 5, clientY: 5 }));

      expect(container.style.position).toBe('fixed');
      expect(container.style.left).toBe('0.9375rem');
      expect(container.style.top).toBe('0.9375rem');
    });
  });

  describe('onHeaderKeydown() full drag-move path', () => {
    function setupDraggableHeader(keepInViewport = false) {
      setup({ headerTitle: 'Test', draggable: true, keepInViewport });
      const container = document.createElement('div');
      Object.defineProperties(container, {
        offsetWidth: { value: 100, configurable: true },
        offsetHeight: { value: 80, configurable: true }
      });
      jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 50,
        top: 50,
        width: 100,
        height: 80
      } as DOMRect);
      component.container = container as HTMLDivElement;

      const dragHandle = document.createElement('div');
      const header = document.createElement('div');
      dragHandle.appendChild(document.createElement('span'));
      (component as any).dragHandleViewChild = { nativeElement: dragHandle };
      (component as any).headerViewChild = { nativeElement: header };
      return { container, dragHandle, header };
    }

    it('should move the container left on ArrowLeft', () => {
      const { container, dragHandle } = setupDraggableHeader();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {
        value: dragHandle,
        configurable: true
      });

      component.onHeaderKeydown(event);

      expect(container.style.left).toBe('2.125rem');
    });

    it('should clamp position when keepInViewport is true', () => {
      const { container, dragHandle } = setupDraggableHeader(true);

      jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 50,
        top: 5,
        width: 100,
        height: 80
      } as DOMRect);
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {
        value: dragHandle,
        configurable: true
      });

      component.onHeaderKeydown(event);

      expect(container.style.top).toBe('0rem');
    });

    it('should not emit dragStarted again on subsequent keydowns', () => {
      const { dragHandle } = setupDraggableHeader();
      const emitSpy = jest.spyOn(component._dragStarted, 'emit');
      const makeEvent = () => {
        const e = new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          bubbles: true
        });
        Object.defineProperty(e, 'target', {
          value: dragHandle,
          configurable: true
        });
        return e;
      };
      component.onHeaderKeydown(makeEvent());
      component.onHeaderKeydown(makeEvent());
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should move the container down on ArrowDown', () => {
      const { container, dragHandle } = setupDraggableHeader();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });
      Object.defineProperty(event, 'target', {
        value: dragHandle,
        configurable: true
      });

      component.onHeaderKeydown(event);

      expect(container.style.top).not.toBe('');
    });

    it('should emit dragEnded and remove the moving class via onHeaderKeyup', () => {
      const { dragHandle, header } = setupDraggableHeader();
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true
      });
      Object.defineProperty(keydownEvent, 'target', {
        value: dragHandle,
        configurable: true
      });
      component.onHeaderKeydown(keydownEvent);
      expect(header.classList.contains('cps-dialog-header-moving')).toBe(true);

      const emitSpy = jest.spyOn(component._dragEnded, 'emit');
      const keyupEvent = new KeyboardEvent('keyup', {
        key: 'ArrowLeft',
        bubbles: true
      });
      Object.defineProperty(keyupEvent, 'target', {
        value: dragHandle,
        configurable: true
      });

      component.onHeaderKeyup(keyupEvent);

      expect(emitSpy).toHaveBeenCalledWith(keyupEvent);
      expect(header.classList.contains('cps-dialog-header-moving')).toBe(false);
    });
  });
});
