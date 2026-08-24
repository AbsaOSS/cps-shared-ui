import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrimeNG } from '../../../../../primeng-temp/config/public_api';
import { ZIndexUtils } from '../../../../../primeng-temp/utils/public_api';
import { CpsNotificationContainerComponent } from './cps-notification-container.component';
import {
  CpsNotificationAppearance,
  CpsNotificationConfig,
  CpsNotificationPosition
} from '../../../utils/cps-notification-config';
import {
  CpsNotificationData,
  CpsNotificationType
} from '../../../utils/internal/cps-notification-data';

function makeConfig(
  overrides: Partial<CpsNotificationConfig> = {}
): CpsNotificationConfig {
  return {
    appearance: CpsNotificationAppearance.FILLED,
    timeout: 5000,
    ...overrides
  };
}

function makeData(
  overrides: Partial<CpsNotificationData> = {}
): CpsNotificationData {
  return {
    type: CpsNotificationType.INFO,
    message: 'Test message',
    ...overrides
  };
}

describe('CpsNotificationContainerComponent', () => {
  let component: CpsNotificationContainerComponent;
  let fixture: ComponentFixture<CpsNotificationContainerComponent>;

  beforeEach(() => {
    jest.spyOn(ZIndexUtils, 'set').mockImplementation((_type, el) => {
      if (el) (el as HTMLElement).style.zIndex = '1000';
    });
    jest.spyOn(ZIndexUtils, 'clear').mockImplementation(jest.fn());

    TestBed.configureTestingModule({
      imports: [CpsNotificationContainerComponent, NoopAnimationsModule],
      providers: [PrimeNG]
    });

    fixture = TestBed.createComponent(CpsNotificationContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should default position to TOPRIGHT', () => {
      expect(component.position).toBe(CpsNotificationPosition.TOPRIGHT);
    });

    it('should start with an empty notifications array', () => {
      expect(component.notifications).toHaveLength(0);
    });

    it('should have role="region" on the mask element', () => {
      const mask = fixture.nativeElement.querySelector(
        '.cps-notification-container-mask'
      );
      expect(mask.getAttribute('role')).toBe('region');
    });

    it('should set aria-label to "Notifications: top-right" by default', () => {
      const mask = fixture.nativeElement.querySelector(
        '.cps-notification-container-mask'
      );
      expect(mask.getAttribute('aria-label')).toBe('Notifications: top-right');
    });

    it('should update aria-label when position changes', () => {
      component.position = CpsNotificationPosition.BOTTOMLEFT;
      fixture.detectChanges();
      const mask = fixture.nativeElement.querySelector(
        '.cps-notification-container-mask'
      );
      expect(mask.getAttribute('aria-label')).toBe(
        'Notifications: bottom-left'
      );
    });
  });

  describe('ngAfterViewInit()', () => {
    it('should call moveOnTop()', () => {
      const spy = jest
        .spyOn(component, 'moveOnTop')
        .mockImplementation(jest.fn());
      component.ngAfterViewInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should assign wrapper from the container parentElement', () => {
      component.ngAfterViewInit();
      expect(component.wrapper).toBe(
        component.container?.nativeElement.parentElement
      );
    });
  });

  describe('addNotification()', () => {
    it('should add the first notification', () => {
      component.addNotification(makeConfig(), makeData());
      expect(component.notifications).toHaveLength(1);
    });

    it('should prepend (unshift) new notifications', () => {
      component.addNotification(makeConfig(), makeData({ message: 'first' }));
      component.addNotification(makeConfig(), makeData({ message: 'second' }));
      expect(component.notifications[0].data.message).toBe('second');
      expect(component.notifications[1].data.message).toBe('first');
    });

    it('should store data and config together', () => {
      const config = makeConfig({ timeout: 3000 });
      const data = makeData({ message: 'hello', details: 'world' });
      component.addNotification(config, data);
      expect(component.notifications[0].data).toBe(data);
      expect(component.notifications[0].config).toBe(config);
    });

    it('should skip a duplicate (same message and details) when allowDuplicates is falsy', () => {
      const data = makeData({ message: 'msg', details: 'det' });
      component.addNotification(makeConfig(), data);
      component.addNotification(makeConfig(), { ...data });
      expect(component.notifications).toHaveLength(1);
    });

    it('should add when message matches but details differ', () => {
      component.addNotification(
        makeConfig(),
        makeData({ message: 'msg', details: 'a' })
      );
      component.addNotification(
        makeConfig(),
        makeData({ message: 'msg', details: 'b' })
      );
      expect(component.notifications).toHaveLength(2);
    });

    it('should add when details match but message differs', () => {
      component.addNotification(
        makeConfig(),
        makeData({ message: 'a', details: 'shared' })
      );
      component.addNotification(
        makeConfig(),
        makeData({ message: 'b', details: 'shared' })
      );
      expect(component.notifications).toHaveLength(2);
    });

    it('should allow duplicate when allowDuplicates is true', () => {
      const data = makeData();
      const config = makeConfig({ allowDuplicates: true });
      component.addNotification(config, data);
      component.addNotification(config, data);
      expect(component.notifications).toHaveLength(2);
    });

    it('should pop the oldest notification when maxAmount is reached', () => {
      const config = makeConfig({ allowDuplicates: true, maxAmount: 2 });
      component.addNotification(config, makeData({ message: 'a' }));
      component.addNotification(config, makeData({ message: 'b' }));
      component.addNotification(config, makeData({ message: 'c' }));
      expect(component.notifications).toHaveLength(2);
      expect(component.notifications[0].data.message).toBe('c');
      expect(component.notifications[1].data.message).toBe('b');
    });

    it('should not pop below maxAmount', () => {
      const config = makeConfig({ allowDuplicates: true, maxAmount: 3 });
      component.addNotification(config, makeData({ message: 'a' }));
      component.addNotification(config, makeData({ message: 'b' }));
      expect(component.notifications).toHaveLength(2);
    });

    it('should not limit notifications when maxAmount is not set', () => {
      const config = makeConfig({ allowDuplicates: true });
      for (let i = 0; i < 5; i++) {
        component.addNotification(config, makeData({ message: `msg${i}` }));
      }
      expect(component.notifications).toHaveLength(5);
    });
  });

  describe('onCloseNotification()', () => {
    beforeEach(() => {
      const config = makeConfig({ allowDuplicates: true });
      component.addNotification(config, makeData({ message: 'a' }));
      component.addNotification(config, makeData({ message: 'b' }));
      component.addNotification(config, makeData({ message: 'c' }));
    });

    it('should remove the notification at the given index', () => {
      component.onCloseNotification(1);
      expect(component.notifications).toHaveLength(2);
    });

    it('should remove the correct notification', () => {
      component.onCloseNotification(0);
      expect(component.notifications[0].data.message).toBe('b');
      expect(component.notifications[1].data.message).toBe('a');
    });

    it('should emit the closed event', () => {
      const emitSpy = jest.spyOn(component.closed, 'emit');
      component.onCloseNotification(0);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should preserve remaining notifications', () => {
      component.onCloseNotification(1);
      expect(component.notifications[0].data.message).toBe('c');
      expect(component.notifications[1].data.message).toBe('a');
    });
  });

  describe('moveOnTop()', () => {
    it('should call ZIndexUtils.set with "modal" and the container element', () => {
      (ZIndexUtils.set as jest.Mock).mockClear();
      component.moveOnTop();
      expect(ZIndexUtils.set).toHaveBeenCalledWith(
        'modal',
        component.container?.nativeElement,
        expect.any(Number)
      );
    });

    it('should set wrapper z-index to one below the container z-index', () => {
      component.moveOnTop();
      const containerZIndex = parseInt(
        (component.container?.nativeElement as HTMLElement).style.zIndex,
        10
      );
      expect((component.wrapper as HTMLElement).style.zIndex).toBe(
        String(containerZIndex - 1)
      );
    });
  });

  describe('ngOnDestroy()', () => {
    it('should call ZIndexUtils.clear with the container element', () => {
      component.ngOnDestroy();
      expect(ZIndexUtils.clear).toHaveBeenCalledWith(
        component.container?.nativeElement
      );
    });

    it('should not throw when the component is destroyed via fixture', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
