import { ApplicationRef, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CpsNotificationService } from './cps-notification.service';
import {
  CpsNotificationAppearance,
  CpsNotificationPosition,
  type CpsNotificationConfig
} from './utils/cps-notification-config';
import {
  CpsNotificationType,
  type CpsNotificationData
} from './utils/internal/cps-notification-data';

function makeHostNode() {
  const el = document.createElement('div');
  el.setAttribute('data-cps-notification-test-host', '');
  return el;
}

function makeMockContainerRef() {
  return {
    instance: {
      addNotification: jest.fn(),
      notifications: [] as {
        data: CpsNotificationData;
        config: CpsNotificationConfig;
      }[],
      closed: new EventEmitter<void>()
    },
    hostView: { rootNodes: [makeHostNode()] },
    setInput: jest.fn(),
    destroy: jest.fn()
  };
}

describe('CpsNotificationService', () => {
  let service: CpsNotificationService;
  let appRef: ApplicationRef;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CpsNotificationService] });
    service = TestBed.inject(CpsNotificationService);
    appRef = TestBed.inject(ApplicationRef);
    jest.spyOn(appRef, 'attachView').mockImplementation(jest.fn());
    jest.spyOn(appRef, 'detachView').mockImplementation(jest.fn());
    jest
      .spyOn(service as any, '_createContainerComponent')
      .mockImplementation(() => makeMockContainerRef());
  });

  afterEach(() => {
    (service as any)._containersMap.clear();
    jest.restoreAllMocks();
    document.body
      .querySelectorAll('[data-cps-notification-test-host]')
      .forEach((el) => el.parentNode?.removeChild(el));
  });

  describe('info()', () => {
    it('should call _createNotification with INFO type', () => {
      const spy = jest.spyOn(service as any, '_createNotification');
      service.info('Test message');
      expect(spy).toHaveBeenCalledWith(
        CpsNotificationType.INFO,
        'Test message',
        undefined,
        undefined
      );
    });

    it('should forward details', () => {
      const spy = jest.spyOn(service as any, '_createNotification');
      service.info('msg', 'details');
      expect(spy).toHaveBeenCalledWith(
        CpsNotificationType.INFO,
        'msg',
        'details',
        undefined
      );
    });

    it('should forward config', () => {
      const spy = jest.spyOn(service as any, '_createNotification');
      const config: CpsNotificationConfig = { timeout: 3000 };
      service.info('msg', undefined, config);
      expect(spy).toHaveBeenCalledWith(
        CpsNotificationType.INFO,
        'msg',
        undefined,
        config
      );
    });
  });

  describe('warning()', () => {
    it('should call _createNotification with WARNING type', () => {
      const spy = jest.spyOn(service as any, '_createNotification');
      service.warning('msg');
      expect(spy).toHaveBeenCalledWith(
        CpsNotificationType.WARNING,
        'msg',
        undefined,
        undefined
      );
    });
  });

  describe('success()', () => {
    it('should call _createNotification with SUCCESS type', () => {
      const spy = jest.spyOn(service as any, '_createNotification');
      service.success('msg');
      expect(spy).toHaveBeenCalledWith(
        CpsNotificationType.SUCCESS,
        'msg',
        undefined,
        undefined
      );
    });
  });

  describe('error()', () => {
    it('should call _createNotification with ERROR type', () => {
      const spy = jest.spyOn(service as any, '_createNotification');
      service.error('msg');
      expect(spy).toHaveBeenCalledWith(
        CpsNotificationType.ERROR,
        'msg',
        undefined,
        undefined
      );
    });
  });

  describe('_initConfig()', () => {
    function callInitConfig(
      config?: CpsNotificationConfig
    ): CpsNotificationConfig {
      return (service as any)._initConfig(config);
    }

    it('should return a config object when none is passed', () => {
      expect(callInitConfig()).toBeDefined();
    });

    it('should default appearance to FILLED', () => {
      expect(callInitConfig().appearance).toBe(
        CpsNotificationAppearance.FILLED
      );
    });

    it('should not override appearance when already set', () => {
      expect(
        callInitConfig({ appearance: CpsNotificationAppearance.OUTLINED })
          .appearance
      ).toBe(CpsNotificationAppearance.OUTLINED);
    });

    it('should default position to TOPRIGHT', () => {
      expect(callInitConfig().position).toBe(CpsNotificationPosition.TOPRIGHT);
    });

    it('should not override position when already set', () => {
      expect(
        callInitConfig({ position: CpsNotificationPosition.BOTTOMLEFT })
          .position
      ).toBe(CpsNotificationPosition.BOTTOMLEFT);
    });

    it('should default timeout to 5000', () => {
      expect(callInitConfig().timeout).toBe(5000);
    });

    it('should not override timeout when set to a non-null value', () => {
      expect(callInitConfig({ timeout: 3000 }).timeout).toBe(3000);
    });

    it('should apply default timeout when timeout is null', () => {
      expect(callInitConfig({ timeout: null as any }).timeout).toBe(5000);
    });

    it('should preserve timeout of 0 as a valid persistent value', () => {
      expect(callInitConfig({ timeout: 0 }).timeout).toBe(0);
    });
  });

  describe('container management', () => {
    it('should create a new container for the first notification', () => {
      service.info('msg');
      expect((service as any)._containersMap.size).toBe(1);
    });

    it('should reuse the existing container for the same position', () => {
      service.info('msg1');
      service.info('msg2');
      expect((service as any)._containersMap.size).toBe(1);
      expect(appRef.attachView).toHaveBeenCalledTimes(1);
    });

    it('should create a separate container for each distinct position', () => {
      service.info('msg', undefined, {
        position: CpsNotificationPosition.TOPRIGHT
      });
      service.info('msg', undefined, {
        position: CpsNotificationPosition.BOTTOMLEFT
      });
      expect((service as any)._containersMap.size).toBe(2);
    });

    it('should call appRef.attachView once per new container', () => {
      service.info('msg');
      expect(appRef.attachView).toHaveBeenCalledTimes(1);
    });

    it('should append the container DOM element to document.body', () => {
      const before = document.body.children.length;
      service.info('msg');
      expect(document.body.children.length).toBe(before + 1);
    });

    it('should call addNotification on the container with the correct config and data', () => {
      service.info('hello');
      const container = (service as any)._containersMap.get(
        CpsNotificationPosition.TOPRIGHT
      );
      expect(container.instance.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: CpsNotificationAppearance.FILLED,
          timeout: 5000,
          position: CpsNotificationPosition.TOPRIGHT
        }),
        expect.objectContaining({
          type: CpsNotificationType.INFO,
          message: 'hello'
        })
      );
    });

    it('should subscribe to the closed event and call _tryRemoveContainer', () => {
      service.info('msg');
      const container = (service as any)._containersMap.get(
        CpsNotificationPosition.TOPRIGHT
      );
      const tryRemoveSpy = jest.spyOn(service as any, '_tryRemoveContainer');
      container.instance.closed.emit();
      expect(tryRemoveSpy).toHaveBeenCalledWith(
        CpsNotificationPosition.TOPRIGHT
      );
    });
  });

  describe('_tryRemoveContainer()', () => {
    it('should detach, destroy and delete the container when notifications are empty', () => {
      const ref = makeMockContainerRef();
      ref.instance.notifications = [];
      const map: Map<any, any> = (service as any)._containersMap;
      map.set(CpsNotificationPosition.TOPRIGHT, ref);

      (service as any)._tryRemoveContainer(CpsNotificationPosition.TOPRIGHT);

      expect(appRef.detachView).toHaveBeenCalledWith(ref.hostView);
      expect(ref.destroy).toHaveBeenCalled();
      expect(map.has(CpsNotificationPosition.TOPRIGHT)).toBe(false);
    });

    it('should not remove the container when notifications remain', () => {
      const ref = makeMockContainerRef();
      ref.instance.notifications = [{ data: {}, config: {} }];
      const map: Map<any, any> = (service as any)._containersMap;
      map.set(CpsNotificationPosition.TOPRIGHT, ref);

      (service as any)._tryRemoveContainer(CpsNotificationPosition.TOPRIGHT);

      expect(appRef.detachView).not.toHaveBeenCalled();
      expect(ref.destroy).not.toHaveBeenCalled();
      expect(map.has(CpsNotificationPosition.TOPRIGHT)).toBe(true);
    });

    it('should not throw when no container exists for the position', () => {
      expect(() =>
        (service as any)._tryRemoveContainer(CpsNotificationPosition.BOTTOM)
      ).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('should detach views for all containers', () => {
      const ref1 = makeMockContainerRef();
      const ref2 = makeMockContainerRef();
      const map: Map<any, any> = (service as any)._containersMap;
      map.set(CpsNotificationPosition.TOPRIGHT, ref1);
      map.set(CpsNotificationPosition.BOTTOMLEFT, ref2);

      service.clear();

      expect(appRef.detachView).toHaveBeenCalledWith(ref1.hostView);
      expect(appRef.detachView).toHaveBeenCalledWith(ref2.hostView);
    });

    it('should destroy all containers', () => {
      const ref1 = makeMockContainerRef();
      const ref2 = makeMockContainerRef();
      const map: Map<any, any> = (service as any)._containersMap;
      map.set(CpsNotificationPosition.TOPRIGHT, ref1);
      map.set(CpsNotificationPosition.BOTTOMLEFT, ref2);

      service.clear();

      expect(ref1.destroy).toHaveBeenCalled();
      expect(ref2.destroy).toHaveBeenCalled();
    });

    it('should empty the containers map', () => {
      const ref = makeMockContainerRef();
      const map: Map<any, any> = (service as any)._containersMap;
      map.set(CpsNotificationPosition.TOPRIGHT, ref);

      service.clear();

      expect(map.size).toBe(0);
    });

    it('should not throw when no containers exist', () => {
      expect(() => service.clear()).not.toThrow();
    });
  });
});
