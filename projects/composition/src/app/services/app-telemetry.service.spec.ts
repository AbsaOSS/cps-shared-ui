import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router
} from '@angular/router';
import { Subject } from 'rxjs';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogRecord,
  CpsScenarioTelemetryService,
  CpsTelemetrySink,
  provideCpsTelemetry,
  withScenarios
} from 'cps-telemetry';
import { AppLogApiProvider } from '../services/app-log-api.provider';
import { AppTelemetryService } from './app-telemetry.service';

interface RecordedEvent {
  eventType: string;
  payload: Record<string, unknown>;
}

describe('AppTelemetryService', () => {
  let service: AppTelemetryService;
  let routerEvents: Subject<unknown>;
  let events: RecordedEvent[];

  beforeEach(() => {
    routerEvents = new Subject<unknown>();
    events = [];

    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          {
            application: 'composition-test',
            environment: 'test',
            version: '0.0.0'
          },
          withScenarios({ defaultTimeoutMs: 0 })
        ),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        {
          provide: CpsTelemetrySink,
          useValue: {
            record: (eventType: string, payload: Record<string, unknown>) =>
              events.push({ eventType, payload }),
            recordError: () => undefined,
            getSessionId: () => 'session-1',
            setUserId: () => undefined,
            getUserId: () => undefined,
            flush: () => undefined
          }
        },
        { provide: Router, useValue: { events: routerEvents.asObservable() } }
      ]
    });

    service = TestBed.inject(AppTelemetryService);
    service.start();
  });

  /** The scenario records emitted so far. */
  function scenarios(): Record<string, unknown>[] {
    return events
      .filter((e) => e.eventType === 'com.cps.scenario')
      .map((e) => e.payload);
  }

  it('should not emit anything before a navigation starts', () => {
    expect(events).toHaveLength(0);
  });

  it('should open a scenario on NavigationStart', () => {
    routerEvents.next(new NavigationStart(1, '/button'));

    const scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
    expect(scenarioTelemetry.getActive()).toHaveLength(1);
    expect(scenarioTelemetry.getActive()[0].name).toBe('route-navigation');
    expect(events).toHaveLength(0);
  });

  it('should complete the scenario on NavigationEnd', () => {
    routerEvents.next(new NavigationStart(1, '/button'));
    routerEvents.next(new NavigationEnd(1, '/button', '/button'));

    const [record] = scenarios();
    expect(record).toMatchObject({
      scenarioName: 'route-navigation',
      operation: 'lazy-route-load',
      route: '/button',
      status: 'success',
      metadata: { finalUrl: '/button' }
    });
    expect(record.steps).toHaveLength(4);
  });

  it('should strip a query string and fragment from the route before recording it', () => {
    routerEvents.next(new NavigationStart(1, '/colors?experimental=true#hash'));
    routerEvents.next(
      new NavigationEnd(1, '/colors?experimental=true#hash', '/colors')
    );

    expect(scenarios()[0]).toMatchObject({ route: '/colors' });
  });

  it('should strip matrix parameters from every segment, not just the query string and fragment', () => {
    routerEvents.next(
      new NavigationStart(1, '/customers;id=123/details;tab=billing?x=1#h')
    );
    routerEvents.next(
      new NavigationEnd(
        1,
        '/customers;id=123/details;tab=billing?x=1#h',
        '/customers/details'
      )
    );

    expect(scenarios()[0]).toMatchObject({ route: '/customers/details' });
  });

  it('should cancel the scenario on NavigationCancel', () => {
    routerEvents.next(new NavigationStart(1, '/button'));
    routerEvents.next(new NavigationCancel(1, '/button', 'guard rejected'));

    expect(scenarios()[0]).toMatchObject({
      status: 'abandoned',
      message: 'guard rejected'
    });
  });

  describe('NavigationSkipped', () => {
    it('should clear a stale intent so it cannot backdate an unrelated navigation', () => {
      jest.useFakeTimers();

      service.markNavigationIntent();
      routerEvents.next(new NavigationSkipped(1, '/button', 'same url'));

      jest.advanceTimersByTime(500);
      routerEvents.next(new NavigationStart(2, '/select'));
      routerEvents.next(new NavigationEnd(2, '/select', '/select'));

      expect(scenarios()[0].delta).toBeLessThan(100);

      jest.useRealTimers();
    });

    it('should settle a scenario NavigationStart already opened before the skip follows', () => {
      routerEvents.next(new NavigationStart(1, '/button'));

      const scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      routerEvents.next(new NavigationSkipped(1, '/button', 'same url'));

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
      expect(scenarios()[0]).toMatchObject({ status: 'abandoned' });
    });

    it('should ignore a skip for a navigation that never started', () => {
      routerEvents.next(new NavigationSkipped(99, '/never-started', 'x'));
      expect(events).toHaveLength(0);
    });

    it('should settle a scenario stashed by a redirect-to-current-URL, instead of leaving it for a later navigation to wrongly reuse', () => {
      routerEvents.next(new NavigationStart(1, '/checkbox'));
      routerEvents.next(
        new NavigationCancel(
          1,
          '/checkbox',
          'Redirecting to "/checkbox/examples"',
          NavigationCancellationCode.Redirect
        )
      );
      routerEvents.next(
        new NavigationSkipped(2, '/checkbox/examples', 'same url')
      );

      const scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
      expect(scenarioTelemetry.getActive()).toHaveLength(0);
      expect(scenarios()[0]).toMatchObject({
        route: '/checkbox',
        status: 'abandoned'
      });

      routerEvents.next(new NavigationStart(3, '/select'));
      routerEvents.next(new NavigationEnd(3, '/select', '/select'));

      expect(scenarios()).toHaveLength(2);
      expect(scenarios()[1]).toMatchObject({
        route: '/select',
        status: 'success'
      });
    });
  });

  it('should fail the scenario on NavigationError', () => {
    routerEvents.next(new NavigationStart(1, '/button'));
    routerEvents.next(
      new NavigationError(1, '/button', new Error('chunk load failed'))
    );

    const record = scenarios()[0];
    expect(record.status).toBe('failure');
    expect(record.error).toMatchObject({ message: 'chunk load failed' });
  });

  describe('logging', () => {
    /** Log records captured by the default in-memory transport. */
    function logs(): CpsLogRecord[] {
      return TestBed.inject(AppLogApiProvider).getRecords();
    }

    it('should log once when tracking starts', () => {
      const started = logs().filter((r) => r.message === 'Application started');
      expect(started).toHaveLength(1);
      expect(started[0]).toMatchObject({
        level: 'log',
        context: 'AppTelemetry'
      });
    });

    it('should not log again when start is called twice', () => {
      service.start();
      expect(
        logs().filter((r) => r.message === 'Application started')
      ).toHaveLength(1);
    });

    it('should log a navigation failure', () => {
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(
        new NavigationError(1, '/button', new Error('chunk load failed'))
      );

      const failure = logs().find((r) => r.message === 'Navigation failed');
      expect(failure).toMatchObject({
        level: 'error',
        context: 'route-navigation',
        error: { message: 'chunk load failed' },
        metadata: { url: '/button' }
      });
    });

    it('should correlate the log line with the scenario record', () => {
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(
        new NavigationError(1, '/button', new Error('chunk load failed'))
      );

      const failure = logs().find((r) => r.message === 'Navigation failed');
      expect(failure?.correlationId).toBe(scenarios()[0].scenarioId);
    });

    it('should not log on a successful navigation', () => {
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(new NavigationEnd(1, '/button', '/button'));

      expect(logs().some((r) => r.level === 'error')).toBe(false);
    });

    it('should not log on a cancelled navigation', () => {
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(new NavigationCancel(1, '/button', 'superseded'));

      expect(logs().some((r) => r.level === 'error')).toBe(false);
    });
  });

  it('should keep concurrent navigations independent', () => {
    routerEvents.next(new NavigationStart(1, '/button'));
    routerEvents.next(new NavigationStart(2, '/select'));

    const scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
    expect(scenarioTelemetry.getActive()).toHaveLength(2);

    routerEvents.next(new NavigationCancel(1, '/button', 'superseded'));
    routerEvents.next(new NavigationEnd(2, '/select', '/select'));

    const records = scenarios();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ route: '/button', status: 'abandoned' });
    expect(records[1]).toMatchObject({ route: '/select', status: 'success' });
    expect(records[0].scenarioId).not.toBe(records[1].scenarioId);
  });

  describe('redirect-caused navigation restarts', () => {
    it('should continue the same scenario across a guard-redirect restart, instead of opening a second one', () => {
      routerEvents.next(new NavigationStart(1, '/checkbox'));
      routerEvents.next(
        new NavigationCancel(
          1,
          '/checkbox',
          'redirect',
          NavigationCancellationCode.Redirect
        )
      );
      routerEvents.next(new NavigationStart(2, '/checkbox/examples'));
      routerEvents.next(
        new NavigationEnd(2, '/checkbox/examples', '/checkbox/examples')
      );

      const records = scenarios();
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        status: 'success',
        route: '/checkbox',
        metadata: { finalUrl: '/checkbox/examples' }
      });
    });

    it('should still cancel the scenario when the cancellation is not a redirect', () => {
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(
        new NavigationCancel(
          1,
          '/button',
          'guard rejected',
          NavigationCancellationCode.GuardRejected
        )
      );
      routerEvents.next(new NavigationStart(2, '/select'));
      routerEvents.next(new NavigationEnd(2, '/select', '/select'));

      const records = scenarios();
      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject({
        status: 'abandoned',
        route: '/button'
      });
      expect(records[1]).toMatchObject({ status: 'success', route: '/select' });
    });
  });

  describe('navigation intent', () => {
    it('should backdate the scenario to the recorded click', () => {
      const nowSpy = jest.spyOn(Date, 'now');
      const clickedAt = Date.now();

      nowSpy.mockReturnValue(clickedAt);
      service.markNavigationIntent();

      nowSpy.mockReturnValue(clickedAt + 300);
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(new NavigationEnd(1, '/button', '/button'));

      const startTimeMs = new Date(
        scenarios()[0].startTime as string
      ).getTime();
      expect(startTimeMs).toBeLessThanOrEqual(clickedAt + 300);
    });

    it('should ignore a stale intent from an unrelated click', () => {
      const nowSpy = jest.spyOn(Date, 'now');
      const clickedAt = Date.now();

      nowSpy.mockReturnValue(clickedAt);
      service.markNavigationIntent();

      nowSpy.mockReturnValue(clickedAt + 10_000);
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(new NavigationEnd(1, '/button', '/button'));

      expect(scenarios()[0].delta).toBeLessThan(1_000);
    });

    it('should consume the intent so it cannot backdate a second navigation', () => {
      service.markNavigationIntent();

      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(new NavigationEnd(1, '/button', '/button'));
      routerEvents.next(new NavigationStart(2, '/select'));
      routerEvents.next(new NavigationEnd(2, '/select', '/select'));

      expect(scenarios()).toHaveLength(2);
      expect(scenarios()[1].delta).toBeLessThan(1_000);
    });

    it('should work with no intent recorded at all', () => {
      routerEvents.next(new NavigationStart(1, '/button'));
      routerEvents.next(new NavigationEnd(1, '/button', '/button'));

      expect(scenarios()[0].status).toBe('success');
    });
  });

  it('should ignore a settle event for an unknown navigation', () => {
    routerEvents.next(new NavigationEnd(99, '/never-started', '/x'));
    expect(events).toHaveLength(0);
  });

  it('should not double-subscribe when started twice', () => {
    service.start();
    routerEvents.next(new NavigationStart(1, '/button'));
    routerEvents.next(new NavigationEnd(1, '/button', '/button'));

    expect(scenarios()).toHaveLength(1);
  });

  it('should track a theme change as a BI event', () => {
    service.trackThemeChanged('dark');

    const bi = events.filter((e) => e.eventType === 'com.cps.bi');
    expect(bi).toHaveLength(1);
    expect(bi[0].payload).toMatchObject({
      eventName: 'theme_changed',
      metadata: { theme: 'dark' }
    });
  });

  describe('trackClick', () => {
    /** The BI events emitted so far. */
    function biEvents(): Record<string, unknown>[] {
      return events
        .filter((e) => e.eventType === 'com.cps.bi')
        .map((e) => e.payload);
    }

    it('should use the action as the BI event name', () => {
      service.trackClick('export_clicked');

      expect(biEvents()).toHaveLength(1);
      expect(biEvents()[0]).toMatchObject({ eventName: 'export_clicked' });
    });

    it('should forward metadata describing the interaction', () => {
      service.trackClick('tab_selected', {
        tabName: 'api',
        index: 2,
        isDefault: false
      });

      expect(biEvents()[0]).toMatchObject({
        eventName: 'tab_selected',
        metadata: { tabName: 'api', index: 2, isDefault: false }
      });
    });

    it('should work without metadata', () => {
      service.trackClick('modal_opened');
      expect(biEvents()[0].metadata).toBeUndefined();
    });

    it('should collapse a double-fired click', () => {
      service.trackClick('export_clicked');
      service.trackClick('export_clicked');

      expect(biEvents()).toHaveLength(1);
    });

    it('should not throw when the telemetry sink is broken', () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry({
            application: 'composition-test',
            environment: 'test',
            version: '0.0.0'
          }),
          { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
          {
            provide: CpsTelemetrySink,
            useValue: {
              record: () => {
                throw new Error('sink is broken');
              },
              recordError: () => undefined,
              getSessionId: () => undefined,
              setUserId: () => undefined,
              getUserId: () => undefined,
              flush: () => undefined
            }
          },
          { provide: Router, useValue: { events: routerEvents.asObservable() } }
        ]
      });

      const isolated = TestBed.inject(AppTelemetryService);
      expect(() => isolated.trackClick('export_clicked')).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('server-side rendering', () => {
    it('should not throw, and should omit navigator-derived metadata, when running on the server', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            {
              application: 'composition-test',
              environment: 'test',
              version: '0.0.0'
            },
            withScenarios({ defaultTimeoutMs: 0 })
          ),
          { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
          {
            provide: CpsTelemetrySink,
            useValue: {
              record: (eventType: string, payload: Record<string, unknown>) =>
                events.push({ eventType, payload }),
              recordError: () => undefined,
              getSessionId: () => 'session-1',
              setUserId: () => undefined,
              getUserId: () => undefined,
              flush: () => undefined
            }
          },
          {
            provide: Router,
            useValue: { events: routerEvents.asObservable() }
          },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const serverService = TestBed.inject(AppTelemetryService);
      expect(() => serverService.start()).not.toThrow();

      const logs = TestBed.inject(AppLogApiProvider).getRecords();
      const started = logs.find((r) => r.message === 'Application started');
      expect(started).toBeDefined();
      expect(started?.metadata).toBeUndefined();
    });
  });
});
