import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsToastComponent } from './cps-toast.component';
import {
  CpsNotificationAppearance,
  CpsNotificationConfig
} from '../../../utils/cps-notification-config';
import {
  CpsNotificationData,
  CpsNotificationType
} from '../../../utils/internal/cps-notification-data';

const defaultConfig: CpsNotificationConfig = {
  appearance: CpsNotificationAppearance.FILLED,
  timeout: 0
};

const defaultData: CpsNotificationData = {
  type: CpsNotificationType.INFO,
  message: 'Test notification'
};

describe('CpsToastComponent', () => {
  let component: CpsToastComponent;
  let fixture: ComponentFixture<CpsToastComponent>;

  function setup(
    config: CpsNotificationConfig = defaultConfig,
    data: CpsNotificationData = defaultData
  ) {
    TestBed.configureTestingModule({
      imports: [CpsToastComponent, NoopAnimationsModule]
    });
    fixture = TestBed.createComponent(CpsToastComponent);
    component = fixture.componentInstance;
    component.config = config;
    component.data = data;
    fixture.detectChanges();
  }

  afterEach(() => jest.restoreAllMocks());

  describe('isPolite', () => {
    beforeEach(() => setup());

    it('should return true for INFO', () => {
      component.data = { type: CpsNotificationType.INFO };
      expect(component.isPolite).toBe(true);
    });

    it('should return true for SUCCESS', () => {
      component.data = { type: CpsNotificationType.SUCCESS };
      expect(component.isPolite).toBe(true);
    });

    it('should return false for ERROR by default', () => {
      component.data = { type: CpsNotificationType.ERROR };
      expect(component.isPolite).toBe(false);
    });

    it('should return true for ERROR when politeError is true', () => {
      component.config = { ...defaultConfig, politeError: true };
      component.data = { type: CpsNotificationType.ERROR };
      expect(component.isPolite).toBe(true);
    });

    it('should return false for WARNING by default', () => {
      component.data = { type: CpsNotificationType.WARNING };
      expect(component.isPolite).toBe(false);
    });

    it('should return true for WARNING when politeWarning is true', () => {
      component.config = { ...defaultConfig, politeWarning: true };
      component.data = { type: CpsNotificationType.WARNING };
      expect(component.isPolite).toBe(true);
    });
  });

  describe('notificationRole', () => {
    beforeEach(() => setup());

    it('should return null for polite notifications', () => {
      component.data = { type: CpsNotificationType.INFO };
      expect(component.notificationRole).toBeNull();
    });

    it('should return "alert" for non-polite notifications', () => {
      component.data = { type: CpsNotificationType.ERROR };
      expect(component.notificationRole).toBe('alert');
    });
  });

  describe('ariaLive', () => {
    beforeEach(() => setup());

    it('should return null for polite notifications', () => {
      component.data = { type: CpsNotificationType.INFO };
      expect(component.ariaLive).toBeNull();
    });

    it('should return "assertive" for non-polite notifications', () => {
      component.data = { type: CpsNotificationType.ERROR };
      expect(component.ariaLive).toBe('assertive');
    });
  });

  describe('closeAriaLabel', () => {
    beforeEach(() => setup());

    it('should return "Close info notification" for INFO type', () => {
      component.data = { type: CpsNotificationType.INFO };
      expect(component.closeAriaLabel).toBe('Close info notification');
    });

    it('should return "Close error notification" for ERROR type', () => {
      component.data = { type: CpsNotificationType.ERROR };
      expect(component.closeAriaLabel).toBe('Close error notification');
    });

    it('should return "Close warning notification" for WARNING type', () => {
      component.data = { type: CpsNotificationType.WARNING };
      expect(component.closeAriaLabel).toBe('Close warning notification');
    });

    it('should include an empty string for type when data has no type', () => {
      component.data = {};
      expect(component.closeAriaLabel).toBe('Close  notification');
    });
  });

  describe('ngOnInit()', () => {
    it('should set filled to true when appearance is FILLED', () => {
      setup({ ...defaultConfig, appearance: CpsNotificationAppearance.FILLED });
      expect(component.filled).toBe(true);
    });

    it('should set filled to false when appearance is OUTLINED', () => {
      setup({
        ...defaultConfig,
        appearance: CpsNotificationAppearance.OUTLINED
      });
      expect(component.filled).toBe(false);
    });

    it('should set color to "warn" for WARNING type', () => {
      setup(defaultConfig, { type: CpsNotificationType.WARNING });
      expect(component.color).toBe('warn');
    });

    it('should set color to the type string for INFO', () => {
      setup(defaultConfig, { type: CpsNotificationType.INFO });
      expect(component.color).toBe(CpsNotificationType.INFO);
    });

    it('should set color to the type string for SUCCESS', () => {
      setup(defaultConfig, { type: CpsNotificationType.SUCCESS });
      expect(component.color).toBe(CpsNotificationType.SUCCESS);
    });

    it('should set color to the type string for ERROR', () => {
      setup(defaultConfig, { type: CpsNotificationType.ERROR });
      expect(component.color).toBe(CpsNotificationType.ERROR);
    });

    it('should set maxWidth when config.maxWidth is provided', () => {
      setup({ ...defaultConfig, maxWidth: '400px' });
      expect(component.maxWidth).toBeTruthy();
    });

    it('should leave maxWidth falsy when config.maxWidth is not set', () => {
      setup();
      expect(component.maxWidth).toBeFalsy();
    });
  });

  describe('ngAfterViewInit()', () => {
    it('should call initiateTimeout', () => {
      setup();
      const spy = jest.spyOn(component, 'initiateTimeout');
      component.ngAfterViewInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should set srAnnouncement for polite notifications', fakeAsync(() => {
      setup(defaultConfig, {
        type: CpsNotificationType.INFO,
        message: 'Hello'
      });
      tick(0);
      expect(component.srAnnouncement).toContain('Hello');
      expect(component.srAnnouncement).toContain('info');
    }));

    it('should include details in srAnnouncement when provided', fakeAsync(() => {
      setup(defaultConfig, {
        type: CpsNotificationType.INFO,
        message: 'Hello',
        details: 'Extra details'
      });
      tick(0);
      expect(component.srAnnouncement).toContain('Extra details');
    }));

    it('should not set srAnnouncement for non-polite notifications', fakeAsync(() => {
      setup(defaultConfig, {
        type: CpsNotificationType.ERROR,
        message: 'Error'
      });
      tick(0);
      expect(component.srAnnouncement).toBe('');
    }));
  });

  describe('initiateTimeout()', () => {
    it('should not set a timer when timeout is 0', fakeAsync(() => {
      setup({ ...defaultConfig, timeout: 0 });
      const closeSpy = jest
        .spyOn(component, 'close')
        .mockImplementation(jest.fn());
      component.initiateTimeout();
      tick(0);
      expect(closeSpy).not.toHaveBeenCalled();
    }));

    it('should auto-close after the configured timeout', fakeAsync(() => {
      setup({ ...defaultConfig, timeout: 3000 });
      jest.spyOn(component, 'close').mockImplementation(jest.fn());
      tick(3000);
      expect(component.close).toHaveBeenCalled();
    }));

    it('should store the timeout reference', fakeAsync(() => {
      setup({ ...defaultConfig, timeout: 3000 });
      expect(component.timeout).toBeTruthy();
      jest.spyOn(component, 'close').mockImplementation(jest.fn());
      tick(3000);
    }));

    it('should fall back to 5000ms when timeout is not set', fakeAsync(() => {
      setup({} as CpsNotificationConfig);
      jest.spyOn(component, 'close').mockImplementation(jest.fn());
      tick(4999);
      expect(component.close).not.toHaveBeenCalled();
      tick(1);
      expect(component.close).toHaveBeenCalled();
    }));
  });

  describe('clearTimeout()', () => {
    it('should cancel a pending timeout so close is not called', fakeAsync(() => {
      setup({ ...defaultConfig, timeout: 3000 });
      jest.spyOn(component, 'close').mockImplementation(jest.fn());
      component.clearTimeout();
      tick(3000);
      expect(component.close).not.toHaveBeenCalled();
    }));

    it('should set the timeout property to null', fakeAsync(() => {
      setup({ ...defaultConfig, timeout: 3000 });
      component.clearTimeout();
      expect(component.timeout).toBeNull();
      tick(0);
    }));

    it('should not throw when there is no pending timeout', () => {
      setup();
      expect(() => component.clearTimeout()).not.toThrow();
    });
  });

  describe('close()', () => {
    beforeEach(() => setup());

    it('should emit the closed event', () => {
      const emitSpy = jest.spyOn(component.closed, 'emit');
      component.close();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should call clearTimeout', () => {
      const clearSpy = jest.spyOn(component, 'clearTimeout');
      component.close();
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy()', () => {
    it('should call clearTimeout on destroy', () => {
      setup();
      const clearSpy = jest.spyOn(component, 'clearTimeout');
      component.ngOnDestroy();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should not throw when destroyed via fixture', () => {
      setup();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  describe('host bindings', () => {
    it('should not set role attribute for polite notifications', () => {
      setup(defaultConfig, { type: CpsNotificationType.INFO, message: 'hi' });
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('role')).toBeNull();
    });

    it('should set role="alert" for non-polite notifications', () => {
      setup(defaultConfig, { type: CpsNotificationType.ERROR, message: 'err' });
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should set aria-live="assertive" for non-polite notifications', () => {
      setup(defaultConfig, { type: CpsNotificationType.ERROR, message: 'err' });
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('aria-live')).toBe('assertive');
    });

    it('should always set aria-atomic="true"', () => {
      setup();
      expect(fixture.nativeElement.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('DOM interactions', () => {
    it('should call clearTimeout on mouseenter', fakeAsync(() => {
      setup({ ...defaultConfig, timeout: 5000 });
      jest.spyOn(component, 'close').mockImplementation(jest.fn());
      const clearSpy = jest.spyOn(component, 'clearTimeout');
      const content = fixture.nativeElement.querySelector('.cps-toast-content');
      content.dispatchEvent(new MouseEvent('mouseenter'));
      tick(5000);
      expect(clearSpy).toHaveBeenCalled();
      expect(component.close).not.toHaveBeenCalled();
    }));

    it('should call initiateTimeout on mouseleave', fakeAsync(() => {
      setup();
      const spy = jest.spyOn(component, 'initiateTimeout');
      const content = fixture.nativeElement.querySelector('.cps-toast-content');
      content.dispatchEvent(new MouseEvent('mouseleave'));
      tick(0);
      expect(spy).toHaveBeenCalled();
    }));

    it('should call clearTimeout on focusin', () => {
      setup();
      const clearSpy = jest.spyOn(component, 'clearTimeout');
      const content = fixture.nativeElement.querySelector('.cps-toast-content');
      content.dispatchEvent(new FocusEvent('focusin'));
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should call initiateTimeout on focusout', fakeAsync(() => {
      setup();
      const spy = jest.spyOn(component, 'initiateTimeout');
      const content = fixture.nativeElement.querySelector('.cps-toast-content');
      content.dispatchEvent(new FocusEvent('focusout'));
      tick(0);
      expect(spy).toHaveBeenCalled();
    }));
  });
});
