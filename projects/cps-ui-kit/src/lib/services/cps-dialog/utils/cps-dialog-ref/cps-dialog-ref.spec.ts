import { Subject } from 'rxjs';
import { CpsDialogRef } from './cps-dialog-ref';
import { CpsDialogComponent } from '../../internal/components/cps-dialog/cps-dialog.component';

function makeMockContainer() {
  return {
    visible: true,
    maximized: false as boolean | undefined,
    toggleMaximized: jest.fn(),
    _openStateChanged: new Subject<void>(),
    _dragStarted: new Subject<MouseEvent | KeyboardEvent>(),
    _dragEnded: new Subject<MouseEvent | KeyboardEvent>(),
    _resizeStarted: new Subject<MouseEvent | KeyboardEvent>(),
    _resizeEnded: new Subject<MouseEvent | KeyboardEvent>(),
    _maximizedStateChanged: new Subject<boolean>()
  };
}

describe('CpsDialogRef', () => {
  let dialogRef: CpsDialogRef;

  beforeEach(() => {
    dialogRef = new CpsDialogRef();
  });

  it('should create', () => {
    expect(dialogRef).toBeTruthy();
  });

  it('should allow componentInstance and disableClose to be assigned', () => {
    const instance = { foo: 'bar' };
    dialogRef.componentInstance = instance;
    dialogRef.disableClose = true;

    expect(dialogRef.componentInstance).toBe(instance);
    expect(dialogRef.disableClose).toBe(true);
  });

  describe('before a container instance is set', () => {
    it('isOpen() should return false', () => {
      expect(dialogRef.isOpen()).toBe(false);
    });

    it('isMaximized() should return false', () => {
      expect(dialogRef.isMaximized()).toBe(false);
    });

    it('maximize()/minimize() should not throw', () => {
      expect(() => dialogRef.maximize()).not.toThrow();
      expect(() => dialogRef.minimize()).not.toThrow();
    });
  });

  describe('after a container instance is set', () => {
    let container: ReturnType<typeof makeMockContainer>;

    beforeEach(() => {
      container = makeMockContainer();
      dialogRef._setContainerInstance(
        container as unknown as CpsDialogComponent
      );
    });

    it('isOpen() should reflect container.visible', () => {
      expect(dialogRef.isOpen()).toBe(true);
      container.visible = false;
      expect(dialogRef.isOpen()).toBe(false);
    });

    it('isMaximized() should reflect container.maximized', () => {
      expect(dialogRef.isMaximized()).toBe(false);
      container.maximized = true;
      expect(dialogRef.isMaximized()).toBe(true);
    });

    it('should emit onOpen exactly once even if the container emits _openStateChanged twice', () => {
      const handler = jest.fn();
      dialogRef.onOpen.subscribe(handler);

      container._openStateChanged.next();
      container._openStateChanged.next();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should forward drag/resize events from the matching container subjects', () => {
      const dragStart = jest.fn();
      const dragEnd = jest.fn();
      const resizeStart = jest.fn();
      const resizeEnd = jest.fn();
      dialogRef.onDragStart.subscribe(dragStart);
      dialogRef.onDragEnd.subscribe(dragEnd);
      dialogRef.onResizeStart.subscribe(resizeStart);
      dialogRef.onResizeEnd.subscribe(resizeEnd);

      const mouseEvent = new MouseEvent('mousedown');
      container._dragStarted.next(mouseEvent);
      container._dragEnded.next(mouseEvent);
      container._resizeStarted.next(mouseEvent);
      container._resizeEnded.next(mouseEvent);

      expect(dragStart).toHaveBeenCalledWith(mouseEvent);
      expect(dragEnd).toHaveBeenCalledWith(mouseEvent);
      expect(resizeStart).toHaveBeenCalledWith(mouseEvent);
      expect(resizeEnd).toHaveBeenCalledWith(mouseEvent);
    });

    it('should forward the maximized state via onMaximize', () => {
      const handler = jest.fn();
      dialogRef.onMaximize.subscribe(handler);

      container._maximizedStateChanged.next(true);
      container._maximizedStateChanged.next(false);

      expect(handler).toHaveBeenNthCalledWith(1, true);
      expect(handler).toHaveBeenNthCalledWith(2, false);
    });

    it('close() should emit the result on onClose when disableClose is falsy', () => {
      const handler = jest.fn();
      dialogRef.onClose.subscribe(handler);

      dialogRef.close('some-result');

      expect(handler).toHaveBeenCalledWith('some-result');
    });

    it('close() should not emit on onClose when disableClose is true', () => {
      dialogRef.disableClose = true;
      const handler = jest.fn();
      dialogRef.onClose.subscribe(handler);

      dialogRef.close('some-result');

      expect(handler).not.toHaveBeenCalled();
    });

    it('destroy() should emit on onDestroy', () => {
      const handler = jest.fn();
      dialogRef.onDestroy.subscribe(handler);

      dialogRef.destroy();

      expect(handler).toHaveBeenCalled();
    });

    it('maximize() should call container.toggleMaximized(true)', () => {
      dialogRef.maximize();
      expect(container.toggleMaximized).toHaveBeenCalledWith(true);
    });

    it('minimize() should call container.toggleMaximized(false)', () => {
      dialogRef.minimize();
      expect(container.toggleMaximized).toHaveBeenCalledWith(false);
    });
  });
});
