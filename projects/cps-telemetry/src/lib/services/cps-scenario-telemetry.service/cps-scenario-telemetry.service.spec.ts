import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CpsScenarioConfig } from '../../config/cps-scenario.config/cps-scenario.config';
import {
  provideCpsTelemetry,
  withRedaction,
  withScenarios
} from '../../providers/cps-telemetry-common.providers/cps-telemetry-common.providers';
import {
  CpsScenarioRecord,
  CpsScenarioStatus
} from '../../models/cps-scenario.models/cps-scenario.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider,
  CpsLogQuery
} from '../../providers/cps-log-api.provider/cps-log-api.provider';
import { CPS_REDACTED } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import {
  CpsLogger,
  CpsLoggerService
} from '../cps-logger.service/cps-logger.service';
import { CpsScenarioTelemetryService } from './cps-scenario-telemetry.service';
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

describe('CpsScenarioTelemetryService', () => {
  let service: CpsScenarioTelemetryService;
  let sink: RecordingSink;

  function configure(
    scenarioOverrides?: Partial<CpsScenarioConfig>,
    eventNamespace?: string
  ): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          {
            application: 'test-app',
            environment: 'test',
            version: '1.0.0',
            ...(eventNamespace ? { eventNamespace } : {})
          },
          withScenarios({
            defaultTimeoutMs: 0,
            ...scenarioOverrides
          })
        ),
        RecordingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        RecordingSink,
        { provide: CpsTelemetrySink, useExisting: RecordingSink }
      ]
    });
    service = TestBed.inject(CpsScenarioTelemetryService);
    sink = TestBed.inject(RecordingSink);
  }

  /** The single packed scenario event, asserted to be the only one emitted. */
  function onlyScenarioRecord(): CpsScenarioRecord {
    const events = sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario);
    expect(events).toHaveLength(1);
    return events[0].payload as unknown as CpsScenarioRecord;
  }

  beforeEach(() => {
    localStorage.clear();
    configure();
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('creation', () => {
    it('should return a scenario carrying the requested name', () => {
      const scenario = service.start({ name: 'load-customer-data' });
      expect(scenario.name).toBe('load-customer-data');
      expect(scenario.status).toBeUndefined();
      expect(scenario.isSettled).toBe(false);
    });

    it('should report an undefined status on a mid-flight toRecord() snapshot, not a lie', () => {
      const scenario = service.start({ name: 'load-customer-data' });
      const snapshot = scenario.toRecord();
      expect(snapshot.status).toBeUndefined();
      expect(snapshot.endTime).toBeUndefined();

      scenario.complete();
      expect(scenario.toRecord().status).toBe('success');
    });

    it('should generate a unique id per scenario', () => {
      const ids = new Set(
        Array.from({ length: 50 }, () => service.start({ name: 's' }).id)
      );
      expect(ids.size).toBe(50);
    });

    it('should not emit anything until the scenario settles', () => {
      service.start({ name: 'load' });
      expect(sink.events).toHaveLength(0);
    });

    it('should track the scenario as active until it settles', () => {
      const scenario = service.start({ name: 'load' });
      expect(service.find(scenario.id)).toBe(scenario);
      expect(service.getActive()).toEqual([scenario]);

      scenario.complete();

      expect(service.find(scenario.id)).toBeUndefined();
      expect(service.getActive()).toEqual([]);
    });
  });

  describe('timing', () => {
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    it('should record ISO-8601 start and end times', () => {
      const before = new Date().toISOString();
      const scenario = service.start({ name: 'load' });
      scenario.complete();
      const after = new Date().toISOString();

      const record = onlyScenarioRecord();
      expect(record.startTime).toMatch(isoPattern);
      expect(record.endTime).toMatch(isoPattern);
      expect(record.startTime >= before).toBe(true);
      expect(record.endTime! <= after).toBe(true);
      expect(record.endTime! >= record.startTime).toBe(true);
    });

    it('should measure a real duration as delta', () => {
      jest.useFakeTimers();
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(1000);

      const scenario = service.start({ name: 'load' });
      nowSpy.mockReturnValue(1250);
      scenario.complete();

      expect(onlyScenarioRecord().delta).toBe(250);
      jest.useRealTimers();
    });

    it('should expose a growing delta value while in progress', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);
      const scenario = service.start({ name: 'load' });

      nowSpy.mockReturnValue(500);
      expect(scenario.delta).toBe(500);

      nowSpy.mockReturnValue(900);
      scenario.complete();
      nowSpy.mockReturnValue(5000);
      expect(scenario.delta).toBe(900);
    });

    it('should stamp elapsed as milliseconds since page load, distinct from delta', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(2000);
      const scenario = service.start({ name: 'load' });

      nowSpy.mockReturnValue(2400);
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.delta).toBe(400);
      expect(record.elapsed).toBe(2400);
    });
  });

  describe('concurrent scenarios', () => {
    it('should keep interleaved scenarios completely independent', () => {
      const a = service.start({ name: 'scenario-a' });
      const b = service.start({ name: 'scenario-b' });

      a.step('a1');
      b.step('b1');
      a.step('a2');
      b.step('b2');
      a.step('a3');

      expect(service.getActive()).toHaveLength(2);

      a.complete();
      b.fail({ error: new Error('b failed') });

      const events = sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario);
      expect(events).toHaveLength(2);

      const recordA = events[0].payload as unknown as CpsScenarioRecord;
      const recordB = events[1].payload as unknown as CpsScenarioRecord;

      expect(recordA.scenarioName).toBe('scenario-a');
      expect(recordA.status).toBe('success');
      expect(recordA.steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'a1',
        'a2',
        'a3',
        'scenario-end'
      ]);

      expect(recordB.scenarioName).toBe('scenario-b');
      expect(recordB.status).toBe('failure');
      expect(recordB.steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'b1',
        'b2',
        'scenario-end'
      ]);

      expect(recordA.scenarioId).not.toBe(recordB.scenarioId);
    });

    it('should support many scenarios of the same name running at once', () => {
      const scenarios = Array.from({ length: 5 }, () =>
        service.start({ name: 'load-widget' })
      );
      scenarios.forEach((s, i) => s.step(`step-${i}`));
      scenarios.forEach((s) => s.complete());

      const records = sink
        .ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)
        .map((e) => e.payload as unknown as CpsScenarioRecord);

      expect(records).toHaveLength(5);
      expect(new Set(records.map((r) => r.scenarioId)).size).toBe(5);
      records.forEach((record, i) => {
        expect(record.steps.map((s) => s.name)).toEqual([
          'scenario-start',
          `step-${i}`,
          'scenario-end'
        ]);
      });
    });
  });

  describe('steps', () => {
    it('should close the previous step when the next one opens', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);

      const scenario = service.start({ name: 'load' });
      nowSpy.mockReturnValue(100);
      scenario.step('fetch');
      nowSpy.mockReturnValue(400);
      scenario.step('render');
      nowSpy.mockReturnValue(500);
      scenario.complete();

      const [start, fetch, render, end] = onlyScenarioRecord().steps;
      expect(start).toMatchObject({ name: 'scenario-start', stepDelta: 0 });
      expect(fetch).toMatchObject({
        name: 'fetch',
        startOffset: 100,
        endOffset: 400,
        stepDelta: 300,
        status: 'success'
      });
      expect(render).toMatchObject({
        name: 'render',
        startOffset: 400,
        endOffset: 500,
        stepDelta: 100,
        status: 'success'
      });
      expect(end).toMatchObject({ name: 'scenario-end', stepDelta: 0 });
    });

    it('should always bookend the real steps with scenario-start and scenario-end', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.complete();

      expect(onlyScenarioRecord().steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'fetch',
        'scenario-end'
      ]);
    });

    it('should still have exactly the two boundary markers when no step is ever opened', () => {
      const scenario = service.start({ name: 'load' });
      scenario.complete();

      const steps = onlyScenarioRecord().steps;
      expect(steps).toHaveLength(2);
      expect(steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'scenario-end'
      ]);
      expect(steps[0]).toMatchObject({
        startOffset: 0,
        endOffset: 0,
        stepDelta: 0,
        status: 'success'
      });
      expect(steps[1]).toMatchObject({ stepDelta: 0, status: 'success' });
    });

    it("should give scenario-end the scenario's own settled status", () => {
      const scenario = service.start({ name: 'load' });
      scenario.fail({ error: new Error('boom') });

      const steps = onlyScenarioRecord().steps;
      expect(steps.at(-1)).toMatchObject({
        name: 'scenario-end',
        status: 'failure'
      });
    });

    it('should close the open step when the scenario settles', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.complete();

      expect(onlyScenarioRecord().steps[1].status).toBe('success');
    });

    it('should mark the open step as failed when the scenario fails', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.fail({ error: new Error('network down') });

      const step = onlyScenarioRecord().steps[1];
      expect(step.status).toBe('failure');
      expect(step.error).toMatchObject({ message: 'network down' });
    });

    it("should merge the settle outcome's message and metadata into the step it closes", () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.complete({
        message: 'served from cache',
        metadata: { cacheHit: true }
      });

      const step = onlyScenarioRecord().steps[1];
      expect(step).toMatchObject({
        name: 'fetch',
        message: 'served from cache',
        metadata: { cacheHit: true }
      });
    });

    it("should carry the settle outcome's reason onto the step it closes, independently of message", () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.cancel({ reason: 'user navigated away' });

      const step = onlyScenarioRecord().steps[1];
      expect(step).toMatchObject({
        name: 'fetch',
        reason: 'user navigated away'
      });
      expect(step).not.toHaveProperty('message');
    });

    it('should carry both message and reason, unmerged, onto the root record and scenario-end', () => {
      const scenario = service.start({ name: 'load' });
      scenario.incomplete({
        message: 'search returned nothing to show',
        reason: 'no-results'
      });

      const record = onlyScenarioRecord();
      expect(record).toMatchObject({
        message: 'search returned nothing to show',
        reason: 'no-results'
      });
      expect(record.steps.at(-1)).toMatchObject({
        name: 'scenario-end',
        message: 'search returned nothing to show',
        reason: 'no-results'
      });
    });

    it("should carry the settle outcome's message, metadata and error onto scenario-end", () => {
      const scenario = service.start({ name: 'load' });
      scenario.fail({
        error: new Error('boom'),
        message: 'checkout failed',
        metadata: { step: 'payment' }
      });

      const end = onlyScenarioRecord().steps.at(-1);
      expect(end).toMatchObject({
        name: 'scenario-end',
        status: 'failure',
        message: 'checkout failed',
        metadata: { step: 'payment' },
        error: { message: 'boom' }
      });
    });

    it('should not carry an error onto scenario-end for a non-failure status', () => {
      const scenario = service.start({ name: 'load' });
      scenario.settle('incomplete', undefined, new Error('irrelevant'));

      expect(onlyScenarioRecord().steps.at(-1)).not.toHaveProperty('error');
    });

    it('should leave scenario-end without message or metadata when the outcome has none', () => {
      const scenario = service.start({ name: 'load' });
      scenario.complete();

      const end = onlyScenarioRecord().steps.at(-1);
      expect(end).not.toHaveProperty('message');
      expect(end).not.toHaveProperty('metadata');
    });

    it('should mark the open step as cancelled when the scenario is cancelled', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.cancel({ reason: 'user navigated away' });

      expect(onlyScenarioRecord().steps[1].status).toBe('abandoned');
    });

    it('should close a step explicitly via endStep', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch').endStep({ message: 'cache hit' });
      scenario.complete();

      expect(onlyScenarioRecord().steps[1]).toMatchObject({
        status: 'success',
        message: 'cache hit'
      });
    });

    it('should fail a step without settling the scenario', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('optional-resource').failStep(new Error('404'));

      expect(scenario.status).toBeUndefined();
      expect(scenario.isSettled).toBe(false);
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.status).toBe('success');
      expect(record.steps[1].status).toBe('failure');
    });

    it('should tolerate endStep with no open step', () => {
      const scenario = service.start({ name: 'load' });
      expect(() => scenario.endStep()).not.toThrow();
      scenario.complete();
      expect(onlyScenarioRecord().steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'scenario-end'
      ]);
    });

    it('should count every real step but retain only up to maxSteps, plus the two markers', () => {
      configure({ defaultTimeoutMs: 0, maxSteps: 3 });

      const scenario = service.start({ name: 'loop' });
      for (let i = 0; i < 10; i++) {
        scenario.step(`step-${i}`);
      }
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.stepCount).toBe(10);
      expect(record.steps).toHaveLength(5);
      expect(record.steps[0].name).toBe('scenario-start');
      expect(record.steps.at(-1)!.name).toBe('scenario-end');
    });

    it('should retain every step and leave exceededStepsLimit unset at the exact maxSteps boundary', () => {
      configure({ defaultTimeoutMs: 0, maxSteps: 3 });

      const scenario = service.start({ name: 'loop' });
      scenario.step('a').step('b').step('c');
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.stepCount).toBe(3);
      expect(record.steps).toHaveLength(5);
      expect(record.exceededStepsLimit).toBeUndefined();
    });

    it('should drop exactly one step and flag the limit at maxSteps + 1', () => {
      configure({ defaultTimeoutMs: 0, maxSteps: 3 });

      const scenario = service.start({ name: 'loop' });
      scenario.step('a').step('b').step('c').step('d');
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.stepCount).toBe(4);
      expect(record.steps).toHaveLength(5);
      expect(record.exceededStepsLimit).toBe(true);
    });

    it('should retain no real steps and flag the limit immediately when maxSteps is 0', () => {
      configure({ defaultTimeoutMs: 0, maxSteps: 0 });

      const scenario = service.start({ name: 'loop' });
      scenario.step('a');
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.stepCount).toBe(1);
      expect(record.steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'scenario-end'
      ]);
      expect(record.exceededStepsLimit).toBe(true);
    });

    it('should redact sensitive step metadata', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('auth', { token: 'abc', attempt: 1 });
      scenario.complete();

      expect(onlyScenarioRecord().steps[1].metadata).toEqual({
        token: CPS_REDACTED,
        attempt: 1
      });
    });
  });

  describe('outcomes', () => {
    it('should settle as completed with a status code and metadata', () => {
      const scenario = service.start({ name: 'load' });
      scenario.complete({
        statusCode: 200,
        message: 'ok',
        metadata: { rowCount: 42 }
      });

      expect(onlyScenarioRecord()).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: 'ok',
        metadata: { rowCount: 42 }
      });
    });

    it('should settle as failed with a normalized error', () => {
      const scenario = service.start({ name: 'load' });
      scenario.fail({ error: new TypeError('bad shape'), statusCode: 500 });

      const record = onlyScenarioRecord();
      expect(record.status).toBe('failure');
      expect(record.statusCode).toBe(500);
      expect(record.error).toMatchObject({
        name: 'TypeError',
        message: 'bad shape'
      });
    });

    it('should settle as failed even with no error supplied', () => {
      service.start({ name: 'load' }).fail();
      expect(onlyScenarioRecord().status).toBe('failure');
    });

    it('should settle as cancelled carrying the reason', () => {
      service.start({ name: 'load' }).cancel({ reason: 'user navigated away' });

      const record = onlyScenarioRecord();
      expect(record).toMatchObject({
        status: 'abandoned',
        reason: 'user navigated away',
        metadata: { abandonedBy: 'caller' }
      });
      expect(record).not.toHaveProperty('message');
    });

    it('should settle as cancelled carrying additional outcome metadata and status code', () => {
      service.start({ name: 'load' }).cancel({
        reason: 'dialog-closed',
        statusCode: 499,
        metadata: { dialogButton: 'cancel', stepIndex: 2 }
      });

      expect(onlyScenarioRecord()).toMatchObject({
        status: 'abandoned',
        reason: 'dialog-closed',
        statusCode: 499,
        metadata: {
          abandonedBy: 'caller',
          dialogButton: 'cancel',
          stepIndex: 2
        }
      });
    });

    it("should not let caller metadata override cancel()'s own abandonedBy: caller", () => {
      service.start({ name: 'load' }).cancel({
        metadata: { abandonedBy: 'page-hidden' }
      });

      expect(onlyScenarioRecord().metadata).toMatchObject({
        abandonedBy: 'caller'
      });
    });

    it('should return a shallow copy of steps from toRecord so external mutations do not affect internal state', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('first-step');
      const record = scenario.toRecord();

      expect(record.steps).toHaveLength(2);
      record.steps.pop();

      scenario.complete();
      const finalRecord = onlyScenarioRecord();
      expect(finalRecord.steps).toHaveLength(3);
    });

    it('should carry the optional classification fields', () => {
      service
        .start({
          name: 'export',
          feature: 'customers',
          operation: 'csv-export',
          route: '/customers',
          parentScenarioId: 'parent-1',
          metadata: { source: 'toolbar' }
        })
        .complete();

      expect(onlyScenarioRecord()).toMatchObject({
        scenarioName: 'export',
        feature: 'customers',
        operation: 'csv-export',
        route: '/customers',
        parentScenarioId: 'parent-1',
        metadata: { source: 'toolbar' }
      });
    });

    it('should strip a query string from route, the same as any other URL-shaped string field', () => {
      service.start({ name: 'export', route: '/customers?id=42' }).complete();

      expect(onlyScenarioRecord()).toMatchObject({ route: '/customers' });
    });

    it('should length-cap feature/operation/route, the same as any other string field', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withScenarios({ defaultTimeoutMs: 0 }),
            withRedaction({ maxStringLength: 4 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const capped = TestBed.inject(CpsScenarioTelemetryService);
      const cappedSink = TestBed.inject(RecordingSink);

      capped
        .start({
          name: 'export',
          feature: 'customers',
          operation: 'csv-export',
          route: '/customers'
        })
        .complete();

      const record = cappedSink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)[0]
        .payload as Record<string, unknown>;
      expect(record).toMatchObject({
        feature: 'cust…',
        operation: 'csv-…',
        route: '/cus…'
      });
    });

    it('should not carry browser, device or page fields already in the RUM envelope', () => {
      service.start({ name: 'load' }).complete();
      const record = onlyScenarioRecord() as unknown as Record<string, unknown>;

      expect(record.browser).toBeUndefined();
      expect(record.device).toBeUndefined();
      expect(record.page).toBeUndefined();
    });

    it('should stamp application from config and sessionId from the sink', () => {
      service.start({ name: 'load' }).complete();
      const record = onlyScenarioRecord();

      expect(record.application).toBe('test-app');
      expect(record.sessionId).toBe('test-session');
    });

    it('should leave userId absent until the sink has one, then carry it', () => {
      const first = service.start({ name: 'load' });
      first.complete();
      expect(onlyScenarioRecord().userId).toBeUndefined();

      sink.setUserId('user-42');
      const second = service.start({ name: 'load' });
      second.complete();

      const records = sink
        .ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)
        .map((e) => e.payload as unknown as CpsScenarioRecord);
      expect(records[1].userId).toBe('user-42');
    });
  });

  describe('settle', () => {
    it.each([
      ['success'],
      ['failure'],
      ['abandoned'],
      ['incomplete'],
      ['timeout']
    ] as [CpsScenarioStatus][])(
      'should settle into %s from a status supplied as data',
      (status) => {
        service.start({ name: 'load' }).settle(status);
        expect(onlyScenarioRecord().status).toBe(status);
      }
    );

    it('should behave identically to the named method', () => {
      service.start({ name: 'a' }).settle('success', { statusCode: 200 });
      service.start({ name: 'b' }).complete({ statusCode: 200 });

      const [viaSettle, viaNamed] = sink
        .ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)
        .map((e) => e.payload as unknown as CpsScenarioRecord);

      expect(viaSettle.status).toBe(viaNamed.status);
      expect(viaSettle.statusCode).toBe(viaNamed.statusCode);
    });

    it('should accept an error when settling as failed', () => {
      service
        .start({ name: 'load' })
        .settle('failure', { statusCode: 500 }, new TypeError('bad shape'));

      expect(onlyScenarioRecord()).toMatchObject({
        status: 'failure',
        statusCode: 500,
        error: { name: 'TypeError', message: 'bad shape' }
      });
    });

    it('should close the open step with the settling status', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.settle('incomplete');

      expect(onlyScenarioRecord().steps[1].status).toBe('incomplete');
    });

    it('should be absorbing, like the named methods', () => {
      const scenario = service.start({ name: 'load' });
      scenario.settle('failure');
      scenario.settle('success');

      expect(scenario.status).toBe('failure');
      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)).toHaveLength(1);
    });

    it('should let an adapter map an external status onto a scenario', () => {
      const fromMessage: Record<string, CpsScenarioStatus> = {
        ok: 'success',
        error: 'failure',
        superseded: 'abandoned'
      };

      const scenario = service.start({ name: 'remote-job' });
      scenario.settle(fromMessage.error);

      expect(onlyScenarioRecord().status).toBe('failure');
    });
  });

  describe('terminal states are absorbing', () => {
    it('should ignore a second settle call', () => {
      const scenario = service.start({ name: 'load' });
      scenario.complete();
      scenario.fail({ error: new Error('too late') });
      scenario.cancel();

      expect(scenario.status).toBe('success');
      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)).toHaveLength(1);
    });

    it('should ignore step mutations after settling', () => {
      const scenario = service.start({ name: 'load' });
      scenario.complete();

      scenario.step('late').endStep().failStep(new Error());

      expect(onlyScenarioRecord().steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'scenario-end'
      ]);
    });

    it('should never throw when used after settling', () => {
      const scenario = service.start({ name: 'load' });
      scenario.fail({ error: new Error('boom') });
      expect(() => scenario.step('late').complete()).not.toThrow();
    });
  });

  describe('abandoned', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should settle as timeout when the deadline passes', () => {
      const scenario = service.start({ name: 'slow', timeoutMs: 5000 });

      jest.advanceTimersByTime(5000);

      expect(scenario.status).toBe('timeout');
      expect(onlyScenarioRecord()).toMatchObject({
        status: 'timeout',
        message: 'Scenario did not settle within 5000ms'
      });
    });

    it('should not record an abandonedBy cause for a timeout', () => {
      service.start({ name: 'slow', timeoutMs: 5000 });

      jest.advanceTimersByTime(5000);

      expect(onlyScenarioRecord().metadata).toBeUndefined();
    });

    it('should record caller as the cause for an explicit cancel', () => {
      service
        .start({ name: 'quick' })
        .cancel({ reason: 'user navigated away' });

      expect(onlyScenarioRecord()).toMatchObject({
        reason: 'user navigated away',
        metadata: { abandonedBy: 'caller' }
      });
    });

    it('should record page-hidden as the cause at unload', () => {
      service.start({ name: 'in-flight' });

      window.dispatchEvent(new Event('pagehide'));

      const record = onlyScenarioRecord();
      expect(record.metadata).toMatchObject({ abandonedBy: 'page-hidden' });
      expect(record.reason).toBe('page-hidden');
    });

    it('should not fire the timeout once the scenario has settled', () => {
      const scenario = service.start({ name: 'quick', timeoutMs: 5000 });
      scenario.complete();

      jest.advanceTimersByTime(10000);

      expect(scenario.status).toBe('success');
      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)).toHaveLength(1);
    });

    it('should apply the configured default timeout', () => {
      configure({ defaultTimeoutMs: 1000 });
      const scenario = service.start({ name: 'slow' });

      jest.advanceTimersByTime(1000);

      expect(scenario.status).toBe('timeout');
    });

    it('should not schedule a timeout when it is zero', () => {
      const scenario = service.start({ name: 'unbounded', timeoutMs: 0 });
      jest.advanceTimersByTime(600_000);
      expect(scenario.status).toBeUndefined();
      expect(scenario.isSettled).toBe(false);
    });
  });

  describe('correlation', () => {
    it('should expose no logger unless one is supplied', () => {
      const scenario = service.start({ name: 'load' });

      expect(scenario.logger).toBeUndefined();
    });

    it('should bind its id onto a supplied logger', () => {
      const logger = TestBed.inject(CpsLoggerService);
      const scenario = service.start({ name: 'load-customer-data', logger });

      scenario.logger?.error('Failed to load customer data');

      expect(TestBed.inject(RecordingLogApi).records[0]).toMatchObject({
        level: 'error',
        message: 'Failed to load customer data',
        correlationId: scenario.id,
        context: 'load-customer-data'
      });
    });

    it('should not require any logging to be wired', () => {
      expect(() => service.start({ name: 'load' }).complete()).not.toThrow();
    });

    it('should use the scenario id as the emitted correlation identifier', () => {
      const scenario = service.start({ name: 'load' });
      const id = scenario.id;
      scenario.complete();

      expect(onlyScenarioRecord().scenarioId).toBe(id);
    });
  });

  describe('emission mode', () => {
    it('should emit exactly one event per scenario by default', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('one').step('two').step('three');
      scenario.complete();

      expect(sink.events).toHaveLength(1);
      expect(sink.events[0].eventType).toBe(CPS_TELEMETRY_EVENT_TYPE.scenario);
      expect(
        (sink.events[0].payload as unknown as CpsScenarioRecord).steps
      ).toHaveLength(5); // scenario-start + 3 real + scenario-end
    });

    it('should emit each step and the settlement in verbose mode', () => {
      configure({ emitLifecycleEvents: true });

      const scenario = service.start({ name: 'load' });
      scenario.step('one').step('two');
      scenario.complete();

      expect(sink.events).toHaveLength(3);
      expect(sink.events.map((e) => e.eventType)).toEqual([
        CPS_TELEMETRY_EVENT_TYPE.scenarioStep,
        CPS_TELEMETRY_EVENT_TYPE.scenarioStep,
        CPS_TELEMETRY_EVENT_TYPE.scenario
      ]);

      expect(sink.events[2].payload.status).toBe('success');
      expect(sink.events[0].payload.scenarioId).toBe(scenario.id);
    });

    it('should stamp application, sessionId and userId on each verbose step event, same as the packed record', () => {
      configure({ emitLifecycleEvents: true });
      sink.setUserId('user-42');

      const scenario = service.start({ name: 'load' });
      scenario.step('one');
      scenario.complete();

      const stepEvent = sink.events.find(
        (e) => e.eventType === CPS_TELEMETRY_EVENT_TYPE.scenarioStep
      );
      expect(stepEvent?.payload.application).toBe('test-app');
      expect(stepEvent?.payload.sessionId).toBe('test-session');
      expect(stepEvent?.payload.userId).toBe('user-42');
    });

    it('should stop emitting step events once maxSteps is exceeded', () => {
      configure({ emitLifecycleEvents: true, maxSteps: 2 });

      const scenario = service.start({ name: 'load' });
      scenario.step('one').step('two').step('three').step('four');
      scenario.complete();

      const stepEvents = sink.events.filter(
        (e) => e.eventType === CPS_TELEMETRY_EVENT_TYPE.scenarioStep
      );
      expect(stepEvents).toHaveLength(2);
    });

    it("should close the open step with the scenario's own terminal status in verbose mode", () => {
      configure({ emitLifecycleEvents: true });

      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.fail({ error: new Error('boom') });

      const stepEvents = sink.events.filter(
        (e) => e.eventType === CPS_TELEMETRY_EVENT_TYPE.scenarioStep
      );
      expect(stepEvents).toHaveLength(1);
      expect(stepEvents[0].payload).toMatchObject({
        name: 'fetch',
        status: 'failure'
      });

      const record = onlyScenarioRecord();
      expect(record.steps.find((s) => s.name === 'fetch')).toMatchObject({
        status: 'failure'
      });
    });
  });

  describe('debug output', () => {
    let consoleLog: jest.SpyInstance;

    beforeEach(() => {
      consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should stay silent by default', () => {
      service.start({ name: 'load' }).step('one').complete();
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it.each(['true', '1'])(
      'should log every operation when debugScenario is "%s"',
      (value) => {
        localStorage.setItem('debugScenario', value);

        service.start({ name: 'load' }).step('one').complete();

        expect(consoleLog).toHaveBeenCalledWith(
          '[cps][scenario] load started',
          expect.any(Object)
        );
        expect(consoleLog).toHaveBeenCalledWith(
          '[cps][scenario] load step one',
          expect.any(Object)
        );
        expect(consoleLog).toHaveBeenCalledWith(
          expect.stringMatching(
            /^\[cps]\[scenario] load success in \d+ms -> com\.cps\.scenario$/
          ),
          expect.any(Object)
        );
      }
    );

    it('should carry a lightweight progress snapshot on debug lines, not a record', () => {
      localStorage.setItem('debugScenario', 'true');
      const scenario = service.start({ name: 'load' });
      scenario.step('one');
      scenario.step('two');

      const stepTwoCall = consoleLog.mock.calls.find(
        ([label]: [string]) => label === '[cps][scenario] load step two'
      );

      expect(stepTwoCall?.[1]).toMatchObject({
        scenarioId: scenario.id,
        stepCount: 2,
        previousStep: 'one'
      });
      expect(stepTwoCall?.[1]).toHaveProperty('delta');
      expect(stepTwoCall?.[1]).not.toHaveProperty('status');
      expect(stepTwoCall?.[1]).not.toHaveProperty('steps');
    });

    it('should log the very record handed to the sink', () => {
      localStorage.setItem('debugScenario', 'true');
      service.start({ name: 'load' }).step('one').complete();

      const settleCall = consoleLog.mock.calls.find(([label]: [string]) =>
        label.includes('success in')
      );
      const sent = sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)[0];

      expect(settleCall?.[1]).toBe(sent.payload);
    });

    it('should report ignored operations after settling', () => {
      localStorage.setItem('debugScenario', 'true');
      const scenario = service.start({ name: 'load' });
      scenario.complete();
      scenario.step('late');

      expect(consoleLog).toHaveBeenCalledWith(
        '[cps][scenario] load ignored step — already success',
        expect.any(Object)
      );
    });

    it('should stay silent for an invalid debugScenario value', () => {
      localStorage.setItem('debugScenario', 'yes');
      service.start({ name: 'load' }).complete();
      expect(consoleLog).not.toHaveBeenCalled();
    });
  });

  describe('page unload', () => {
    it('should abandon in-flight scenarios and beacon-flush on pagehide', () => {
      const a = service.start({ name: 'a' });
      const b = service.start({ name: 'b' });
      b.complete();

      window.dispatchEvent(new Event('pagehide'));

      expect(a.status).toBe('abandoned');
      const abandoned = sink
        .ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)
        .map((e) => e.payload as unknown as CpsScenarioRecord)
        .find((r) => r.scenarioName === 'a');
      expect(abandoned?.status).toBe('abandoned');
      expect(abandoned?.reason).toBe('page-hidden');
      expect(sink.flushes).toContain(true);
    });

    it('should leave an already-completed scenario alone at unload', () => {
      const done = service.start({ name: 'b' });
      done.complete();

      window.dispatchEvent(new Event('pagehide'));

      expect(done.status).toBe('success');
    });

    it('should abandon in-flight scenarios on destroy', () => {
      const scenario = service.start({ name: 'a' });
      service.ngOnDestroy();
      expect(scenario.status).toBe('abandoned');
    });

    it('should flush the sink when the page is hidden, without settling', () => {
      const scenario = service.start({ name: 'a' });

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(sink.flushes).toEqual([true]);
      expect(scenario.status).toBeUndefined();
      expect(scenario.isSettled).toBe(false);
      expect(sink.events).toHaveLength(0);
    });

    it('should not flush when the page becomes visible again', () => {
      service.start({ name: 'a' });

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(sink.flushes).toEqual([]);
    });

    it('should stop listening for visibility changes after destroy', () => {
      service.ngOnDestroy();
      sink.flushes.length = 0;

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(sink.flushes).toEqual([]);
    });

    it('should stop listening after destroy', () => {
      service.ngOnDestroy();
      const scenario = service.start({ name: 'a' });

      window.dispatchEvent(new Event('pagehide'));

      expect(scenario.status).toBeUndefined();
      expect(scenario.isSettled).toBe(false);
    });
  });

  describe('incomplete', () => {
    it('should settle as incomplete, apart from failed and cancelled', () => {
      service.start({ name: 'search' }).incomplete({ reason: 'no-results' });

      expect(onlyScenarioRecord()).toMatchObject({
        status: 'incomplete',
        reason: 'no-results'
      });
    });

    it('should accept a status code and metadata', () => {
      service.start({ name: 'search' }).incomplete({
        reason: 'no-results',
        statusCode: 204,
        metadata: { hits: 0 }
      });

      expect(onlyScenarioRecord()).toMatchObject({
        status: 'incomplete',
        statusCode: 204,
        metadata: { hits: 0 }
      });
    });

    it('should mark the open step incomplete, not failed', () => {
      const scenario = service.start({ name: 'search' });
      scenario.step('query');
      scenario.incomplete({ reason: 'no-results' });

      expect(onlyScenarioRecord().steps[1].status).toBe('incomplete');
    });

    it('should be absorbing', () => {
      const scenario = service.start({ name: 'search' });
      scenario.incomplete({ reason: 'no-results' });
      scenario.complete();

      expect(scenario.status).toBe('incomplete');
      expect(sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)).toHaveLength(1);
    });

    it('should carry no error object', () => {
      service.start({ name: 'search' }).incomplete({ reason: 'no-results' });
      expect(onlyScenarioRecord().error).toBeUndefined();
    });
  });

  describe('setData', () => {
    it('should merge attributes recorded mid-flight', () => {
      const scenario = service.start({ name: 'load' });
      scenario.setData({ rowCount: 42 });
      scenario.complete();

      expect(onlyScenarioRecord().metadata).toMatchObject({ rowCount: 42 });
    });

    it('should merge with start and settle metadata', () => {
      const scenario = service.start({
        name: 'load',
        metadata: { source: 'toolbar' }
      });
      scenario.setData({ strategy: 'cache' });
      scenario.complete({ metadata: { rowCount: 3 } });

      expect(onlyScenarioRecord().metadata).toEqual({
        source: 'toolbar',
        strategy: 'cache',
        rowCount: 3
      });
    });

    it('should let a later call overwrite an earlier one', () => {
      const scenario = service.start({ name: 'load' });
      scenario.setData({ strategy: 'cache' });
      scenario.setData({ strategy: 'network' });
      scenario.complete();

      expect(onlyScenarioRecord().metadata).toMatchObject({
        strategy: 'network'
      });
    });

    it('should redact sensitive attributes', () => {
      const scenario = service.start({ name: 'load' });
      scenario.setData({ token: 'abc', rows: 1 });
      scenario.complete();

      expect(onlyScenarioRecord().metadata).toMatchObject({
        token: CPS_REDACTED,
        rows: 1
      });
    });

    it('should still redact via the built-in credential denylist when withScenarios({ redact: false })', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withScenarios({ defaultTimeoutMs: 0, redact: false })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const unredacted = TestBed.inject(CpsScenarioTelemetryService);
      const unredactedSink = TestBed.inject(RecordingSink);

      unredacted
        .start({ name: 'load' })
        .setData({ token: 'abc', rows: 1 })
        .complete();

      const record = unredactedSink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)[0]
        .payload as Record<string, unknown>;

      expect(record.metadata).toMatchObject({
        token: CPS_REDACTED,
        rows: 1
      });
    });

    it('should be ignored after settling', () => {
      const scenario = service.start({ name: 'load' });
      scenario.complete();
      scenario.setData({ late: true });

      expect(onlyScenarioRecord().metadata).toBeUndefined();
    });
  });

  describe('backdated start', () => {
    it('should measure from the supplied epoch timestamp', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(5_000);

      const scenario = service.start({
        name: 'nav',
        startedAt: performance.timeOrigin + 3_000
      });

      nowSpy.mockReturnValue(5_500);
      scenario.complete();

      expect(onlyScenarioRecord().delta).toBe(2_500);
    });

    it('should ignore a timestamp from the future', () => {
      const scenario = service.start({
        name: 'nav',
        startedAt: Date.now() + 60_000
      });
      scenario.complete();

      expect(onlyScenarioRecord().delta).toBeGreaterThanOrEqual(0);
      expect(onlyScenarioRecord().delta).toBeLessThan(1_000);
    });

    it('should ignore a timestamp from before the page loaded', () => {
      const scenario = service.start({ name: 'nav', startedAt: 0 });
      scenario.complete();

      expect(onlyScenarioRecord().delta).toBeGreaterThanOrEqual(0);
      expect(onlyScenarioRecord().delta).toBeLessThan(1_000);
    });

    it('should behave normally when omitted', () => {
      service.start({ name: 'nav' }).complete();
      expect(onlyScenarioRecord().delta).toBeLessThan(1_000);
    });

    it('should backdate startTime to match the backdated delta', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(10_000);

      const scenario = service.start({
        name: 'nav',
        startedAt: performance.timeOrigin + 6_000
      });
      nowSpy.mockReturnValue(10_000);
      scenario.complete();

      const record = onlyScenarioRecord();
      const startMs = new Date(record.startTime).getTime();
      const endMs = new Date(record.endTime!).getTime();
      expect(endMs - startMs).toBe(record.delta);
    });

    it('should shorten the scheduled timeout by however much startedAt already backdates it', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(5_000);
      const setTimeoutSpy = jest
        .spyOn(globalThis, 'setTimeout')
        .mockReturnValue(0 as unknown as ReturnType<typeof setTimeout>);

      service.start({
        name: 'nav',
        timeoutMs: 5_000,
        startedAt: performance.timeOrigin + 2_000
      });

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2_000);
    });
  });

  describe('aggregates', () => {
    it('should sum repeated calls of one operation', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);
      const scenario = service.start({ name: 'render-table' });

      nowSpy.mockReturnValue(100);
      scenario.aggregateStart('format-cell');
      nowSpy.mockReturnValue(130);
      scenario.aggregateEnd('format-cell');

      nowSpy.mockReturnValue(200);
      scenario.aggregateStart('format-cell');
      nowSpy.mockReturnValue(220);
      scenario.aggregateEnd('format-cell');

      scenario.complete();

      expect(onlyScenarioRecord().aggregates).toEqual([
        { name: 'format-cell', elapsed: 50, callCount: 2 }
      ]);
    });

    it('should keep separate operations apart', () => {
      const scenario = service.start({ name: 'render' });
      scenario.aggregateStart('a').aggregateEnd('a');
      scenario.aggregateStart('b').aggregateEnd('b');
      scenario.complete();

      expect(onlyScenarioRecord().aggregates?.map((a) => a.name)).toEqual([
        'a',
        'b'
      ]);
    });

    it('should ignore an end with no matching start', () => {
      const scenario = service.start({ name: 'render' });
      scenario.aggregateEnd('never-started');
      scenario.complete();

      expect(onlyScenarioRecord().aggregates).toBeUndefined();
    });

    it('should not double-count an overlapping start', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);
      const scenario = service.start({ name: 'render' });

      nowSpy.mockReturnValue(100);
      scenario.aggregateStart('op');
      nowSpy.mockReturnValue(150);
      scenario.aggregateStart('op'); // ignored — already open
      nowSpy.mockReturnValue(300);
      scenario.aggregateEnd('op');
      scenario.complete();

      expect(onlyScenarioRecord().aggregates).toEqual([
        { name: 'op', elapsed: 200, callCount: 1 }
      ]);
    });

    it('should close an aggregate still open when the scenario settles', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);
      const scenario = service.start({ name: 'render' });

      nowSpy.mockReturnValue(100);
      scenario.aggregateStart('op');
      nowSpy.mockReturnValue(400);
      scenario.complete();

      expect(onlyScenarioRecord().aggregates).toEqual([
        { name: 'op', elapsed: 300, callCount: 1 }
      ]);
    });

    it('should freeze an aggregate left open at settlement, not keep advancing on later toRecord() calls', () => {
      const nowSpy = jest.spyOn(performance, 'now');
      nowSpy.mockReturnValue(0);
      const scenario = service.start({ name: 'render' });

      nowSpy.mockReturnValue(100);
      scenario.aggregateStart('op');
      nowSpy.mockReturnValue(400);
      scenario.complete();

      const atSettlement = scenario.toRecord().aggregates;
      expect(atSettlement).toEqual([
        { name: 'op', elapsed: 300, callCount: 1 }
      ]);

      nowSpy.mockReturnValue(10_000);
      const muchLater = scenario.toRecord().aggregates;

      expect(muchLater).toEqual(atSettlement);
    });

    it('should omit the field when nothing was aggregated', () => {
      service.start({ name: 'render' }).complete();
      expect(onlyScenarioRecord().aggregates).toBeUndefined();
    });

    it('should be ignored after settling', () => {
      const scenario = service.start({ name: 'render' });
      scenario.complete();
      scenario.aggregateStart('late').aggregateEnd('late');

      expect(onlyScenarioRecord().aggregates).toBeUndefined();
    });
  });

  describe('trace and ordering fields', () => {
    it('should emit one event per lifecycle transition in verbose mode', () => {
      configure({ emitLifecycleEvents: true });

      const scenario = service.start({ name: 'load' });
      scenario.step('one').step('two');
      scenario.complete();

      expect(sink.events).toHaveLength(3);
    });

    it('should name the last step closed before settling', () => {
      const scenario = service.start({ name: 'load' });
      scenario.step('first').step('second');
      scenario.complete();

      expect(onlyScenarioRecord().previousStep).toBe('second');
    });

    it('should have no previousStep when no step was opened', () => {
      service.start({ name: 'load' }).complete();
      expect(onlyScenarioRecord().previousStep).toBeUndefined();
    });
  });

  describe('event namespace', () => {
    it('should emit under the default namespace', () => {
      service.start({ name: 'load' }).complete();
      expect(sink.events[0].eventType).toBe('com.cps.scenario');
    });

    it('should emit scenario and step events under a configured namespace', () => {
      configure({ emitLifecycleEvents: true }, 'com.data-gateway');

      const scenario = service.start({ name: 'load' });
      scenario.step('one');
      scenario.complete();

      expect(sink.events.map((e) => e.eventType)).toEqual([
        'com.data-gateway.scenario.step',
        'com.data-gateway.scenario'
      ]);
    });
  });

  describe('exceededStepsLimit', () => {
    it('should flag a truncated step list', () => {
      configure({ defaultTimeoutMs: 0, maxSteps: 2 });

      const scenario = service.start({ name: 'loop' });
      for (let i = 0; i < 5; i++) {
        scenario.step(`s${i}`);
      }
      scenario.complete();

      const record = onlyScenarioRecord();
      expect(record.exceededStepsLimit).toBe(true);
      expect(record.stepCount).toBe(5);
      expect(record.steps).toHaveLength(4); // scenario-start + 2 real + scenario-end
    });

    it('should be absent when every step was retained', () => {
      const scenario = service.start({ name: 'loop' });
      scenario.step('one').step('two');
      scenario.complete();

      expect(onlyScenarioRecord().exceededStepsLimit).toBeUndefined();
    });
  });

  describe('user timings', () => {
    let perfApi: {
      mark: jest.Mock;
      measure: jest.Mock;
      clearMarks: jest.Mock;
      clearMeasures: jest.Mock;
    };
    const realPerformance = globalThis.performance;

    /** jsdom has no mark/measure, so the API is installed for these tests. */
    function installPerf(): void {
      perfApi = {
        mark: jest.fn(),
        measure: jest.fn(),
        clearMarks: jest.fn(),
        clearMeasures: jest.fn()
      };
      Object.defineProperty(globalThis, 'performance', {
        value: {
          ...perfApi,
          now: () => realPerformance.now(),
          timeOrigin: realPerformance.timeOrigin,
          getEntriesByName: () => []
        },
        // required so later tests can still redefine window.performance
        writable: true,
        configurable: true
      });
    }

    afterEach(() => {
      Object.defineProperty(globalThis, 'performance', {
        value: realPerformance,
        writable: true,
        configurable: true
      });
    });

    it('should emit nothing when disabled', () => {
      installPerf();
      service.start({ name: 'load' }).step('one').complete();

      expect(perfApi.mark).not.toHaveBeenCalled();
      expect(perfApi.measure).not.toHaveBeenCalled();
    });

    it('should mark start, steps and settle when enabled by config', () => {
      configure({ defaultTimeoutMs: 0, userTimings: true });
      installPerf();

      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.complete();

      const marked = perfApi.mark.mock.calls.map((c) => c[0] as string);
      expect(marked).toContain(`test-app:load:start:${scenario.id}`);
      expect(marked).toContain(`test-app:load:fetch:${scenario.id}`);
      expect(marked).toContain(`test-app:load:settle:${scenario.id}`);
    });

    it('should not collide marks between concurrent scenarios of the same name', () => {
      configure({ defaultTimeoutMs: 0, userTimings: true });
      installPerf();

      const first = service.start({ name: 'load' });
      first.step('fetch');
      const second = service.start({ name: 'load' });
      second.step('fetch');

      first.complete();
      second.complete();

      const marked = perfApi.mark.mock.calls.map((c) => c[0] as string);
      expect(marked).toContain(`test-app:load:fetch:${first.id}`);
      expect(marked).toContain(`test-app:load:fetch:${second.id}`);
      expect(new Set(marked).size).toBe(marked.length);

      const cleared = perfApi.clearMarks.mock.calls.map((c) => c[0] as string);
      expect(cleared).toContain(`test-app:load:settle:${first.id}`);
      expect(cleared).toContain(`test-app:load:settle:${second.id}`);
    });

    it('should be enabled by the debugScenario flag with config off', () => {
      localStorage.setItem('debugScenario', 'true');
      jest.spyOn(console, 'log').mockImplementation(() => {});
      installPerf();

      service.start({ name: 'load' }).complete();

      expect(perfApi.mark).toHaveBeenCalled();
    });

    it('should measure each step and the whole scenario', () => {
      configure({ defaultTimeoutMs: 0, userTimings: true });
      installPerf();

      const scenario = service.start({ name: 'load', feature: 'customers' });
      scenario.step('fetch').step('render');
      scenario.complete();

      const measured = perfApi.measure.mock.calls.map((c) => c[0] as string);
      expect(measured).toContain('load [fetch]');
      expect(measured).toContain('load [render]');
      expect(measured).toContain('load (customers)');
    });

    it('should clear its marks once the scenario settles', () => {
      configure({ defaultTimeoutMs: 0, userTimings: true });
      installPerf();

      const scenario = service.start({ name: 'load' });
      scenario.step('fetch');
      scenario.complete();

      const cleared = perfApi.clearMarks.mock.calls.map((c) => c[0] as string);
      expect(cleared).toContain(`test-app:load:start:${scenario.id}`);
      expect(cleared).toContain(`test-app:load:settle:${scenario.id}`);
    });

    it('should clear its marks via the configured fallback when it has no timeout and never settles', () => {
      jest.useFakeTimers();
      configure({ userTimings: true, markCleanupFallbackMs: 90_000 });
      installPerf();

      const scenario = service.start({ name: 'load' });
      scenario.step('fetch').step('render');

      jest.advanceTimersByTime(89_999);
      expect(perfApi.clearMarks).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      const cleared = perfApi.clearMarks.mock.calls.map((c) => c[0] as string);
      expect(cleared).toContain(`test-app:load:start:${scenario.id}`);
      expect(cleared).toContain(`test-app:load:fetch:${scenario.id}`);

      jest.useRealTimers();
    });

    it('should not schedule a mark cleanup fallback when a real timeout is configured', () => {
      jest.useFakeTimers();
      configure({
        defaultTimeoutMs: 10 * 60 * 1000,
        userTimings: true,
        markCleanupFallbackMs: 1_000
      });
      installPerf();

      service.start({ name: 'load' }).step('fetch');

      jest.advanceTimersByTime(60_000);

      expect(perfApi.clearMarks).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should disable the fallback entirely when markCleanupFallbackMs is 0', () => {
      jest.useFakeTimers();
      configure({ userTimings: true, markCleanupFallbackMs: 0 });
      installPerf();

      service.start({ name: 'load' }).step('fetch');

      jest.advanceTimersByTime(60 * 60 * 1000);

      expect(perfApi.clearMarks).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not throw when the browser has no User Timing API', () => {
      configure({ defaultTimeoutMs: 0, userTimings: true });

      expect(() => {
        service.start({ name: 'load' }).step('one').complete();
      }).not.toThrow();
      expect(onlyScenarioRecord().status).toBe('success');
    });
  });

  describe('settled$', () => {
    it('should emit each scenario as it settles', () => {
      const seen: string[] = [];
      service.settled$.subscribe((r) =>
        seen.push(`${r.scenarioName}:${r.status}`)
      );

      service.start({ name: 'a' }).complete();
      service.start({ name: 'b' }).fail({ error: new Error('boom') });

      expect(seen).toEqual(['a:success', 'b:failure']);
    });

    it('should not emit for a scenario still running', () => {
      const seen: unknown[] = [];
      service.settled$.subscribe((r) => seen.push(r));

      service.start({ name: 'a' }).step('one');

      expect(seen).toEqual([]);
    });

    it('should deliver the full record', () => {
      let record: CpsScenarioRecord | undefined;
      service.settled$.subscribe((r) => (record = r));

      service.start({ name: 'a' }).step('one').complete();

      expect(record).toMatchObject({
        scenarioName: 'a',
        status: 'success'
      });
      expect(record?.steps.map((s) => s.name)).toEqual([
        'scenario-start',
        'one',
        'scenario-end'
      ]);
    });

    it('should complete on destroy', () => {
      let completed = false;
      service.settled$.subscribe({ complete: () => (completed = true) });

      service.ngOnDestroy();

      expect(completed).toBe(true);
    });

    it('should not let a throwing subscriber break the scenario', () => {
      // RxJS's Subject.next() already isolates a throwing subscriber, not
      // cpsSafeVoid — this confirms the guarantee holds either way.
      service.settled$.subscribe(() => {
        throw new Error('subscriber exploded');
      });

      expect(() => service.start({ name: 'a' }).complete()).not.toThrow();
    });

    it("should not let a subscriber's mutation affect what the sink receives", () => {
      service.settled$.subscribe((r) => {
        (r as { status: string }).status = 'tampered';
        r.metadata = { tampered: true };
      });

      service.start({ name: 'a' }).complete({ metadata: { real: true } });

      expect(
        sink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)[0].payload
      ).toMatchObject({ status: 'success', metadata: { real: true } });
    });
  });

  describe('failure isolation', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withScenarios({ defaultTimeoutMs: 0 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          ThrowingSink,
          { provide: CpsTelemetrySink, useExisting: ThrowingSink }
        ]
      });
      service = TestBed.inject(CpsScenarioTelemetryService);
    });

    afterEach(() => {
      configure();
      consoleError.mockRestore();
    });

    it('should never let a broken sink reach application code', () => {
      expect(() => {
        const scenario = service.start({ name: 'load' });
        scenario.step('one');
        scenario.complete();
      }).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Error)
      );
    });

    it('should still expose a usable scenario when the sink is broken', () => {
      const scenario = service.start({ name: 'load' });
      expect(scenario.id).toBeTruthy();
      scenario.complete();
      expect(scenario.status).toBe('success');
    });

    it('should never let a throwing metadata getter reach application code', () => {
      const metadata: CpsTelemetryMetadata = {};
      Object.defineProperty(metadata, 'poison', {
        enumerable: true,
        get(): never {
          throw new Error('metadata getter exploded');
        }
      });

      expect(() => service.start({ name: 'load', metadata })).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Error)
      );
    });

    it('should never let a throwing logger.child reach application code', () => {
      const throwingLogger: CpsLogger = {
        log: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        child: () => {
          throw new Error('logger.child exploded');
        }
      };

      const scenario = service.start({ name: 'load', logger: throwingLogger });
      expect(() => scenario.logger).not.toThrow();
      expect(scenario.logger).toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Error)
      );
    });
  });

  describe('active scenario registry', () => {
    it('should warn in dev mode when active scenarios exceed the threshold', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      for (let i = 0; i < 51; i++) {
        service.start({ name: 'load', timeoutMs: 0 });
      }

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[cps-telemetry] High number of active scenarios (51)'
        )
      );
    });
  });
});
