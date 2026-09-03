import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideCpsTelemetry,
  withBiEvents,
  withRedaction,
  withScenarios
} from '../../providers/cps-telemetry-common.providers/cps-telemetry-common.providers';
import { CpsBiEvent } from '../../models/cps-bi.models/cps-bi.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider,
  CpsLogQuery
} from '../../providers/cps-log-api.provider/cps-log-api.provider';
import { CPS_REDACTED } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import { CpsBiTelemetryService } from './cps-bi-telemetry.service';
import { CpsScenarioTelemetryService } from '../cps-scenario-telemetry.service/cps-scenario-telemetry.service';
import {
  CPS_TELEMETRY_EVENT_TYPE,
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';

/** Captures what the library emitted, so a test can assert on it. */
@Injectable()
class RecordingSink extends CpsTelemetrySink {
  readonly events: {
    eventType: string;
    payload: Record<string, unknown>;
    metadata?: CpsTelemetryMetadata;
  }[] = [];

  readonly errors: CpsTelemetryError[] = [];
  readonly flushes: boolean[] = [];
  userId?: string;
  sessionId: string | undefined = 'test-session';

  record(
    eventType: string,
    payload: object,
    metadata?: CpsTelemetryMetadata
  ): void {
    this.events.push({
      eventType,
      payload: payload as Record<string, unknown>,
      metadata
    });
  }

  recordError(error: CpsTelemetryError): void {
    this.errors.push(error);
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  flush(beacon = false): void {
    this.flushes.push(beacon);
  }

  ofType(eventType: string) {
    return this.events.filter((event) => event.eventType === eventType);
  }
}

/** Fails on every call, to prove telemetry cannot break the caller. */
@Injectable()
class ThrowingSink extends CpsTelemetrySink {
  record(): never {
    throw new Error('sink is broken');
  }

  recordError(): never {
    throw new Error('sink is broken');
  }

  getSessionId(): never {
    throw new Error('sink is broken');
  }

  setUserId(): never {
    throw new Error('sink is broken');
  }

  getUserId(): never {
    throw new Error('sink is broken');
  }

  flush(): never {
    throw new Error('sink is broken');
  }
}

/** Keeps every batch, so a test can assert on what was shipped. */
@Injectable()
class RecordingLogApi implements CpsLogApiProvider {
  readonly records: CpsLogRecord[] = [];

  send(record: CpsLogRecord): void {
    this.records.push(record);
  }

  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    let found = this.records;
    if (filter.correlationId) {
      found = found.filter((r) => r.correlationId === filter.correlationId);
    }
    if (filter.logger) {
      found = found.filter((r) => r.logger === filter.logger);
    }
    if (filter.limit !== undefined) {
      found = found.slice(0, filter.limit);
    }
    return Promise.resolve(found);
  }
}

describe('CpsBiTelemetryService', () => {
  let service: CpsBiTelemetryService;
  let sink: RecordingSink;

  function configure(sinkClass: unknown = RecordingSink): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          { application: 'test-app', environment: 'test', version: '1.0.0' },
          withScenarios({ defaultTimeoutMs: 0 })
        ),
        RecordingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        sinkClass as never,
        { provide: CpsTelemetrySink, useExisting: sinkClass as never }
      ]
    });
    service = TestBed.inject(CpsBiTelemetryService);
  }

  function lastEvent(): CpsBiEvent {
    const events = sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi);
    return events[events.length - 1].payload as unknown as CpsBiEvent;
  }

  beforeEach(() => {
    localStorage.clear();
    configure();
    sink = TestBed.inject(RecordingSink);
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('event creation', () => {
    it('should record the application-supplied event name and metadata', () => {
      service.track('export_clicked', {
        exportType: 'csv',
        source: 'customer-table'
      });

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(1);
      expect(lastEvent()).toMatchObject({
        eventName: 'export_clicked',
        metadata: { exportType: 'csv', source: 'customer-table' }
      });
    });

    it('should work with no metadata at all', () => {
      service.track('modal_opened');
      expect(lastEvent()).toMatchObject({ eventName: 'modal_opened' });
      expect(lastEvent().metadata).toBeUndefined();
    });

    it('should carry an ISO-8601 event time', () => {
      service.track('tab_selected');
      expect(lastEvent().eventTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should not carry a route — the RUM envelope already stamps the page', () => {
      service.track('filter_changed');

      expect(lastEvent()).not.toHaveProperty('route');
    });

    it('should ignore an empty event name', () => {
      service.track('');
      expect(sink.events).toHaveLength(0);
    });

    it('should redact sensitive metadata', () => {
      service.track('sign_in_submitted', {
        password: 'hunter2',
        method: 'sso'
      });

      expect(lastEvent().metadata).toEqual({
        password: CPS_REDACTED,
        method: 'sso'
      });
    });

    it('should drop nested objects rather than serializing them', () => {
      service.track('row_selected', {
        customer: { id: 1, email: 'a@b.c' },
        rowIndex: 4
      } as never);

      expect(lastEvent().metadata).toEqual({ rowIndex: 4 });
    });
  });

  describe('withBiEvents({ redact: false })', () => {
    it('should skip configurable PII scrubbing but keep the built-in credential denylist', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withBiEvents({ redact: false })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const unredactedService = TestBed.inject(CpsBiTelemetryService);
      const unredactedSink = TestBed.inject(RecordingSink);

      unredactedService.track('sign_in_submitted', {
        password: 'hunter2',
        method: 'sso'
      });

      const [event] = unredactedSink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi);
      expect((event.payload as { metadata: unknown }).metadata).toEqual({
        password: CPS_REDACTED,
        method: 'sso'
      });
    });
  });

  describe('scenario correlation', () => {
    it('should attach the supplied scenario id', () => {
      const scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
      const scenario = scenarioTelemetry.start({ name: 'export-data' });

      service.track(
        'export_clicked',
        { exportType: 'csv' },
        { scenarioId: scenario.id, feature: 'customers' }
      );

      expect(lastEvent()).toMatchObject({
        scenarioId: scenario.id,
        feature: 'customers'
      });
    });

    it('should length-cap feature, the same as any other string field', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withRedaction({ maxStringLength: 4 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const capped = TestBed.inject(CpsBiTelemetryService);
      const cappedSink = TestBed.inject(RecordingSink);

      capped.track('export_clicked', undefined, { feature: 'customers' });

      const [event] = cappedSink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi);
      expect((event.payload as { feature: string }).feature).toBe('cust…');
    });

    it('should leave the scenario id absent when there is no scenario', () => {
      service.track('export_clicked');
      expect(lastEvent().scenarioId).toBeUndefined();
    });
  });

  describe('deduplication', () => {
    it('should collapse an identical event fired twice in quick succession', () => {
      service.track('export_clicked');
      service.track('export_clicked');

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(1);
    });

    it('should not collapse different event names', () => {
      service.track('export_clicked');
      service.track('modal_opened');

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(2);
    });

    it('should not collapse the same event across different scenarios', () => {
      service.track('export_clicked', undefined, { scenarioId: 'a' });
      service.track('export_clicked', undefined, { scenarioId: 'b' });

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(2);
    });

    it('should not collapse the same event across different features', () => {
      service.track('export_clicked', undefined, { feature: 'customers' });
      service.track('export_clicked', undefined, { feature: 'invoices' });

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(2);
    });

    it('should not collapse the same event across different event types', () => {
      service.track('export_clicked', undefined, { eventType: 'com.cps.a' });
      service.track('export_clicked', undefined, { eventType: 'com.cps.b' });

      expect(sink.events).toHaveLength(2);
    });

    it('should allow the event again once the window has passed', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(1_000_000);
      service.track('export_clicked');

      nowSpy.mockReturnValue(1_000_000 + 500);
      service.track('export_clicked');

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(2);
    });

    it('should read the dedup window from CPS_BI_CONFIG, not a hardcoded value', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withBiEvents({ dedupWindowMs: 5_000 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const configured = TestBed.inject(CpsBiTelemetryService);
      const configuredSink = TestBed.inject(RecordingSink);

      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);
      configured.track('export_clicked');

      nowSpy.mockReturnValue(1_000);
      configured.track('export_clicked');

      expect(configuredSink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(
        1
      );
    });

    it('should not collapse events with different metadata under the same name', () => {
      service.track('theme_option_changed', { dimension: 'color' });
      service.track('theme_option_changed', { dimension: 'radius' });

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(2);
    });

    it('should still collapse identical metadata built in a different key order', () => {
      service.track('theme_option_changed', { dimension: 'color', value: 'x' });
      service.track('theme_option_changed', { value: 'x', dimension: 'color' });

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(1);
    });

    it('should not collapse metadata that only collides under naive string joining', () => {
      service.track('order_placed', { a: '1&b=2' } as never);
      service.track('order_placed', { a: '1', b: '2' } as never);

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(2);
    });

    it('should sweep stale entries once the key cap is reached, freeing them for reuse', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withBiEvents({ dedupWindowMs: 50, dedupMaxKeys: 2 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const capped = TestBed.inject(CpsBiTelemetryService);
      const cappedSink = TestBed.inject(RecordingSink);
      const nowSpy = jest.spyOn(performance, 'now');

      nowSpy.mockReturnValue(0);
      capped.track('event_a');
      capped.track('event_b');

      nowSpy.mockReturnValue(100);
      capped.track('event_c');
      capped.track('event_a');
      capped.track('event_b');

      expect(cappedSink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(5);
    });

    it('should evict the oldest key once the cap is reached even with nothing stale to sweep', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withBiEvents({ dedupWindowMs: 100_000, dedupMaxKeys: 2 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const capped = TestBed.inject(CpsBiTelemetryService);
      const cappedSink = TestBed.inject(RecordingSink);
      const nowSpy = jest.spyOn(performance, 'now');

      nowSpy.mockReturnValue(0);
      capped.track('key_a');
      nowSpy.mockReturnValue(1);
      capped.track('key_b');

      nowSpy.mockReturnValue(2);
      capped.track('key_c');

      nowSpy.mockReturnValue(3);
      capped.track('key_a');

      expect(cappedSink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(4);
    });

    it('should not let a backwards Date.now jump affect dedup timing at all', () => {
      const dateSpy = jest.spyOn(Date, 'now');
      dateSpy.mockReturnValue(2_000_000_000);
      service.track('export_clicked');

      dateSpy.mockReturnValue(1_000_000);
      service.track('export_clicked');

      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)).toHaveLength(1);
      dateSpy.mockRestore();
    });
  });

  describe('debug output', () => {
    let consoleLog: jest.SpyInstance;

    beforeEach(() => {
      consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should stay silent by default', () => {
      service.track('export_clicked');
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it.each(['true', '1'])(
      'should log the event when debugBI is "%s"',
      (value) => {
        localStorage.setItem('debugBI', value);
        service.track('export_clicked', { exportType: 'csv' });

        expect(consoleLog).toHaveBeenCalledWith(
          '[cps][bi] export_clicked -> com.cps.bi',
          expect.objectContaining({ eventName: 'export_clicked' })
        );
      }
    );

    it('should log the very object handed to the sink', () => {
      localStorage.setItem('debugBI', 'true');
      service.track('export_clicked', { exportType: 'csv' });

      const [label, logged] = consoleLog.mock.calls[0];
      const sent = sink.ofType(CPS_TELEMETRY_EVENT_TYPE.bi)[0];

      expect(logged).toBe(sent.payload);
      expect(label).toContain(CPS_TELEMETRY_EVENT_TYPE.bi);
    });

    it('should stay silent for an invalid debugBI value', () => {
      localStorage.setItem('debugBI', 'yes');
      service.track('export_clicked');
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it('should not log secrets even when debugging is on', () => {
      localStorage.setItem('debugBI', 'true');
      service.track('sign_in', { password: 'hunter2' });

      expect(consoleLog).toHaveBeenCalledWith(
        '[cps][bi] sign_in -> com.cps.bi',
        expect.objectContaining({ metadata: { password: CPS_REDACTED } })
      );
    });
  });

  describe('event namespace', () => {
    it('should emit under the default namespace', () => {
      service.track('export_clicked');
      expect(sink.events[0].eventType).toBe('com.cps.bi');
    });

    it('should emit under an application-specific namespace', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry({
            application: 'test-app',
            environment: 'test',
            version: '1.0.0',
            eventNamespace: 'com.data-gateway'
          }),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });

      const namespaced = TestBed.inject(CpsBiTelemetryService);
      const namespacedSink = TestBed.inject(RecordingSink);
      namespaced.track('export_clicked');

      expect(namespacedSink.events[0].eventType).toBe('com.data-gateway.bi');
    });

    it('should let one event override the type, for a legacy dashboard', () => {
      service.track(
        'click',
        { source: 'toolbar' },
        {
          eventType: 'com.data-gateway.click'
        }
      );

      expect(sink.events[0].eventType).toBe('com.data-gateway.click');
      expect(sink.events[0].payload.eventName).toBe('click');
    });

    it('should fall back to the configured type when the override is empty', () => {
      service.track('click', undefined, { eventType: '' });
      expect(sink.events[0].eventType).toBe('com.cps.bi');
    });
  });

  describe('failure isolation', () => {
    it('should never let a broken sink reach application code', () => {
      configure(ThrowingSink);
      expect(() => service.track('export_clicked')).not.toThrow();
    });
  });
});
