import {
  ChangeDetectionStrategy,
  ApplicationRef,
  Component,
  EnvironmentInjector,
  Injector
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { CpsDialogService } from './cps-dialog.service';
import type { CpsDialogConfig } from './utils/cps-dialog-config';
import { CpsDialogRef } from './utils/cps-dialog-ref/cps-dialog-ref';
import { CpsConfirmationComponent } from './internal/components/cps-confirmation/cps-confirmation.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
class TestContentComponent {}

function makeMockDialogComponentInstance() {
  return {
    childComponentType: undefined as unknown,
    close: jest.fn(),
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

type MockComponentRef = {
  instance: ReturnType<typeof makeMockDialogComponentInstance>;
  hostView: { rootNodes: HTMLElement[] };
  destroy: jest.Mock;
};

function makeMockComponentRef(): MockComponentRef {
  const domElement = document.createElement('div');
  return {
    instance: makeMockDialogComponentInstance(),
    hostView: { rootNodes: [domElement] },
    destroy: jest.fn()
  };
}

describe('CpsDialogService', () => {
  let service: CpsDialogService;
  let appRef: ApplicationRef;
  let lastCreatedMockRef: MockComponentRef;

  /**
   * Spy on the private appendDialogComponentToBody method, replacing the
   * real createComponent / createEnvironmentInjector calls (which are
   * non-configurable getters in the jest-transformed Angular module) with a
   * hand-rolled mock that honours all subscriptions and cleanup paths.
   */
  function setupAppendSpy() {
    jest
      .spyOn(service as any, 'appendDialogComponentToBody')
      .mockImplementation(() => {
        const dialogRef = new CpsDialogRef();
        const mockRef = makeMockComponentRef();
        lastCreatedMockRef = mockRef;

        const sub = dialogRef.onClose.subscribe(() => {
          service.dialogComponentRefMap.get(dialogRef)?.instance.close();
        });

        const destroySub = dialogRef.onDestroy.subscribe(() => {
          (service as any).removeDialogComponentFromBody(dialogRef);
          destroySub.unsubscribe();
          sub.unsubscribe();
        });

        appRef.attachView(mockRef.hostView as any);
        document.body.appendChild(mockRef.hostView.rootNodes[0]);

        service.dialogComponentRefMap.set(dialogRef, mockRef as any);
        service.openDialogs.push(dialogRef);
        dialogRef._setContainerInstance(mockRef.instance as any);

        return dialogRef;
      });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CpsDialogService]
    });

    service = TestBed.inject(CpsDialogService);
    appRef = TestBed.inject(ApplicationRef);
    jest.spyOn(appRef, 'attachView').mockImplementation(jest.fn());
    jest.spyOn(appRef, 'detachView').mockImplementation(jest.fn());
    setupAppendSpy();
  });

  afterEach(() => {
    (service as any)._openDialogsAtThisLevel.length = 0;
    service.dialogComponentRefMap.clear();
    jest.restoreAllMocks();
    document.body
      .querySelectorAll('div')
      .forEach((el) => el.parentNode?.removeChild(el));
  });

  describe('openDialogs getter', () => {
    it('should return its own array when there is no parent service', () => {
      expect(service.openDialogs).toEqual([]);
    });

    it('should delegate to parent service when a parent is present', () => {
      const parentService = TestBed.inject(CpsDialogService);
      const childService = new CpsDialogService(
        appRef,
        TestBed.inject(EnvironmentInjector),
        TestBed.inject(Injector),
        document,
        parentService
      );
      expect(childService.openDialogs).toBe(parentService.openDialogs);
    });
  });

  describe('open()', () => {
    it('should return a CpsDialogRef', () => {
      const ref = service.open(TestContentComponent, {});
      expect(ref).toBeInstanceOf(CpsDialogRef);
    });

    it('should add the ref to openDialogs', () => {
      service.open(TestContentComponent, {});
      expect(service.openDialogs).toHaveLength(1);
    });

    it('should set childComponentType on the dialog instance', () => {
      service.open(TestContentComponent, {});
      expect(lastCreatedMockRef.instance.childComponentType).toBe(
        TestContentComponent
      );
    });

    it('should call ApplicationRef.attachView with the component host view', () => {
      service.open(TestContentComponent, {});
      expect(appRef.attachView).toHaveBeenCalledWith(
        lastCreatedMockRef.hostView
      );
    });

    it('should append a DOM element to document.body', () => {
      const beforeCount = document.body.children.length;
      service.open(TestContentComponent, {});
      expect(document.body.children.length).toBe(beforeCount + 1);
    });

    it('should store the component ref in dialogComponentRefMap', () => {
      const ref = service.open(TestContentComponent, {});
      expect(service.dialogComponentRefMap.get(ref)).toBe(lastCreatedMockRef);
    });

    it('should open multiple dialogs independently', () => {
      service.open(TestContentComponent, {});
      service.open(TestContentComponent, {});
      expect(service.openDialogs).toHaveLength(2);
    });

    it('should call _setContainerInstance on the dialog ref', () => {
      const spySet = jest.spyOn(
        CpsDialogRef.prototype,
        '_setContainerInstance'
      );
      service.open(TestContentComponent, {});
      expect(spySet).toHaveBeenCalledWith(lastCreatedMockRef.instance);
    });

    it('should not throw when the ref was not registered in dialogComponentRefMap', () => {
      jest
        .spyOn(service as any, 'appendDialogComponentToBody')
        .mockImplementation(() => new CpsDialogRef());
      expect(() => service.open(TestContentComponent, {})).not.toThrow();
    });
  });

  describe('openConfirmationDialog()', () => {
    it('should return a CpsDialogRef', () => {
      const ref = service.openConfirmationDialog({});
      expect(ref).toBeInstanceOf(CpsDialogRef);
    });

    it('should set default headerTitle when not provided', () => {
      const config: CpsDialogConfig = {};
      service.openConfirmationDialog(config);
      expect(config.headerTitle).toBe('Confirm the action');
    });

    it('should not override headerTitle when already set', () => {
      const config: CpsDialogConfig = {};
      config.headerTitle = 'Custom Title';
      service.openConfirmationDialog(config);
      expect(config.headerTitle).toBe('Custom Title');
    });

    it('should set default headerIcon to "warning"', () => {
      const config: CpsDialogConfig = {};
      service.openConfirmationDialog(config);
      expect(config.headerIcon).toBe('warning');
    });

    it('should not override headerIcon when already set', () => {
      const config: CpsDialogConfig = {};
      config.headerIcon = 'info-circle';
      service.openConfirmationDialog(config);
      expect(config.headerIcon).toBe('info-circle');
    });

    it('should set default headerIconColor to "calm"', () => {
      const config: CpsDialogConfig = {};
      service.openConfirmationDialog(config);
      expect(config.headerIconColor).toBe('calm');
    });

    it('should not override headerIconColor when already set', () => {
      const config: CpsDialogConfig = {};
      config.headerIconColor = 'warn';
      service.openConfirmationDialog(config);
      expect(config.headerIconColor).toBe('warn');
    });

    it('should set default minWidth to "25rem"', () => {
      const config: CpsDialogConfig = {};
      service.openConfirmationDialog(config);
      expect(config.minWidth).toBe('25rem');
    });

    it('should not override minWidth when already set', () => {
      const config: CpsDialogConfig = {};
      config.minWidth = '30rem';
      service.openConfirmationDialog(config);
      expect(config.minWidth).toBe('30rem');
    });

    it('should set default maxWidth to "37.5rem"', () => {
      const config: CpsDialogConfig = {};
      service.openConfirmationDialog(config);
      expect(config.maxWidth).toBe('37.5rem');
    });

    it('should not override maxWidth when already set', () => {
      const config: CpsDialogConfig = {};
      config.maxWidth = '50rem';
      service.openConfirmationDialog(config);
      expect(config.maxWidth).toBe('50rem');
    });

    it('should set childComponentType to CpsConfirmationComponent', () => {
      service.openConfirmationDialog({});
      expect(lastCreatedMockRef.instance.childComponentType).toBe(
        CpsConfirmationComponent
      );
    });

    it('should not throw when the ref was not registered in dialogComponentRefMap', () => {
      jest
        .spyOn(service as any, 'appendDialogComponentToBody')
        .mockImplementation(() => new CpsDialogRef());
      expect(() => service.openConfirmationDialog({})).not.toThrow();
    });

    it('should add the ref to openDialogs', () => {
      service.openConfirmationDialog({});
      expect(service.openDialogs).toHaveLength(1);
    });
  });

  describe('closeAll()', () => {
    it('should call close() on each open dialog', () => {
      const ref1 = service.open(TestContentComponent, {});
      const ref2 = service.open(TestContentComponent, {});
      const closeSpy1 = jest.spyOn(ref1, 'close');
      const closeSpy2 = jest.spyOn(ref2, 'close');
      service.closeAll();
      expect(closeSpy1).toHaveBeenCalled();
      expect(closeSpy2).toHaveBeenCalled();
    });

    it('should call close() in reverse order', () => {
      const order: number[] = [];
      const ref1 = service.open(TestContentComponent, {});
      const ref2 = service.open(TestContentComponent, {});
      jest.spyOn(ref1, 'close').mockImplementation(() => order.push(1));
      jest.spyOn(ref2, 'close').mockImplementation(() => order.push(2));
      service.closeAll();
      expect(order).toEqual([2, 1]);
    });

    it('should call destroy() instead of close() when force is true', () => {
      const ref1 = service.open(TestContentComponent, {});
      const ref2 = service.open(TestContentComponent, {});
      const destroySpy1 = jest
        .spyOn(ref1, 'destroy')
        .mockImplementation(jest.fn());
      const destroySpy2 = jest
        .spyOn(ref2, 'destroy')
        .mockImplementation(jest.fn());
      const closeSpy1 = jest.spyOn(ref1, 'close');
      const closeSpy2 = jest.spyOn(ref2, 'close');
      service.closeAll(true);
      expect(destroySpy1).toHaveBeenCalled();
      expect(destroySpy2).toHaveBeenCalled();
      expect(closeSpy1).not.toHaveBeenCalled();
      expect(closeSpy2).not.toHaveBeenCalled();
    });

    it('should do nothing when there are no open dialogs', () => {
      expect(() => service.closeAll()).not.toThrow();
    });
  });

  describe('dialog cleanup on destroy signal', () => {
    it('should remove ref from openDialogs when onDestroy fires', () => {
      const ref = service.open(TestContentComponent, {});
      expect(service.openDialogs).toHaveLength(1);
      ref.destroy();
      expect(service.openDialogs).toHaveLength(0);
    });

    it('should remove entry from dialogComponentRefMap when onDestroy fires', () => {
      const ref = service.open(TestContentComponent, {});
      expect(service.dialogComponentRefMap.has(ref)).toBe(true);
      ref.destroy();
      expect(service.dialogComponentRefMap.has(ref)).toBe(false);
    });

    it('should call detachView on ApplicationRef when onDestroy fires', () => {
      service.open(TestContentComponent, {});
      const capturedRef = lastCreatedMockRef;
      service.openDialogs[0].destroy();
      expect(appRef.detachView).toHaveBeenCalledWith(capturedRef.hostView);
    });

    it('should call destroy on the component ref when onDestroy fires', () => {
      service.open(TestContentComponent, {});
      const capturedRef = lastCreatedMockRef;
      service.openDialogs[0].destroy();
      expect(capturedRef.destroy).toHaveBeenCalled();
    });

    it('should handle an unregistered ref gracefully', () => {
      const unknownRef = new CpsDialogRef();
      expect(() => unknownRef.destroy()).not.toThrow();
    });

    it('should only remove the destroyed ref from openDialogs', () => {
      const ref1 = service.open(TestContentComponent, {});
      service.open(TestContentComponent, {});
      ref1.destroy();
      expect(service.openDialogs).toHaveLength(1);
    });

    it('should not throw when the ref is registered in the map but already absent from openDialogs', () => {
      const ref = service.open(TestContentComponent, {});
      service.openDialogs.length = 0;
      expect(() =>
        (service as any).removeDialogComponentFromBody(ref)
      ).not.toThrow();
      expect(service.dialogComponentRefMap.has(ref)).toBe(false);
    });
  });

  describe('onClose subscription', () => {
    it('should call close() on the dialog component instance when dialogRef.close() is called', () => {
      const ref = service.open(TestContentComponent, {});
      const capturedRef = lastCreatedMockRef;
      ref.close();
      expect(capturedRef.instance.close).toHaveBeenCalled();
    });
  });

  describe('appendDialogComponentToBody() (real, unmocked)', () => {
    let realService: CpsDialogService;
    let realAppRef: ApplicationRef;

    beforeEach(() => {
      jest.restoreAllMocks();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [CpsDialogService, provideNoopAnimations()]
      });
      realService = TestBed.inject(CpsDialogService);
      realAppRef = TestBed.inject(ApplicationRef);
    });

    afterEach(() => {
      realService.closeAll(true);
      document.body
        .querySelectorAll('.cps-dialog')
        .forEach((el) => el.remove());
    });

    it('should create and attach a real CpsDialogComponent to document.body', () => {
      const beforeCount = document.body.children.length;

      const ref = realService.open(TestContentComponent, {
        headerTitle: 'Test'
      });
      realAppRef.tick();

      expect(document.body.children.length).toBeGreaterThan(beforeCount);
      expect(realService.dialogComponentRefMap.has(ref)).toBe(true);
      expect(realService.openDialogs).toContain(ref);
    });

    it('should remove the DOM element and map entry when the ref is destroyed', () => {
      const ref = realService.open(TestContentComponent, {
        headerTitle: 'Test'
      });
      realAppRef.tick();
      expect(realService.dialogComponentRefMap.has(ref)).toBe(true);
      const domElem = document.body.querySelector('.cps-dialog');
      expect(domElem).toBeTruthy();

      ref.destroy();
      realAppRef.tick();

      expect(realService.dialogComponentRefMap.has(ref)).toBe(false);
      expect(realService.openDialogs).not.toContain(ref);
      expect(document.body.contains(domElem)).toBe(false);
    });

    it('should be a no-op to remove a ref that was never registered', () => {
      const unregistered = new CpsDialogRef();
      expect(() =>
        (realService as any).removeDialogComponentFromBody(unregistered)
      ).not.toThrow();
    });

    it('should be a no-op to call removeDialogComponentFromBody twice for the same ref', () => {
      const ref = realService.open(TestContentComponent, {
        headerTitle: 'Test'
      });
      realAppRef.tick();
      ref.destroy();
      expect(() =>
        (realService as any).removeDialogComponentFromBody(ref)
      ).not.toThrow();
    });

    it('should close the real dialog component instance when the ref is closed', () => {
      const ref = realService.open(TestContentComponent, {
        headerTitle: 'Test'
      });
      realAppRef.tick();
      const instance = realService.dialogComponentRefMap.get(ref)?.instance;
      expect(instance?.visible).toBe(true);

      ref.close();
      realAppRef.tick();

      expect(instance?.visible).toBe(false);
    });

    it('should successfully open a dialog when injector and environmentInjector are the same instance', () => {
      const envInjector = TestBed.inject(EnvironmentInjector);
      const sameInjectorService = new CpsDialogService(
        realAppRef,
        envInjector,
        envInjector as unknown as Injector,
        document,
        undefined as unknown as CpsDialogService
      );

      const ref = sameInjectorService.open(TestContentComponent, {
        headerTitle: 'Test'
      });
      realAppRef.tick();

      expect(sameInjectorService.dialogComponentRefMap.has(ref)).toBe(true);
      sameInjectorService.closeAll(true);
    });
  });

  describe('ngOnDestroy()', () => {
    it('should destroy all dialogs at this level', () => {
      const ref1 = service.open(TestContentComponent, {});
      const ref2 = service.open(TestContentComponent, {});
      const destroySpy1 = jest
        .spyOn(ref1, 'destroy')
        .mockImplementation(jest.fn());
      const destroySpy2 = jest
        .spyOn(ref2, 'destroy')
        .mockImplementation(jest.fn());
      service.ngOnDestroy();
      expect(destroySpy1).toHaveBeenCalled();
      expect(destroySpy2).toHaveBeenCalled();
    });

    it('should destroy dialogs in reverse order', () => {
      const order: number[] = [];
      const ref1 = service.open(TestContentComponent, {});
      const ref2 = service.open(TestContentComponent, {});
      jest.spyOn(ref1, 'destroy').mockImplementation(() => order.push(1));
      jest.spyOn(ref2, 'destroy').mockImplementation(() => order.push(2));
      service.ngOnDestroy();
      expect(order).toEqual([2, 1]);
    });

    it('should not throw when no dialogs are open', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
