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
});
