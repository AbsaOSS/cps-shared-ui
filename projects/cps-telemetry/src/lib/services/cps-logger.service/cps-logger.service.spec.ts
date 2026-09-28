import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CpsLogConfig } from '../../config/cps-log.config/cps-log.config';
import {
  provideCpsTelemetry,
  withLogging,
  withRedaction
} from '../../providers/cps-telemetry-common.providers/cps-telemetry-common.providers';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider,
  CpsLogQuery
} from '../../providers/cps-log-api.provider/cps-log-api.provider';
import * as cpsTelemetryRedactUtil from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import { CPS_REDACTED } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import { CpsLoggerService } from './cps-logger.service';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import {
  CpsLogDetail,
  CpsLogger,
  CpsLogRecord
} from '../../models/cps-log.models/cps-log.models';

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

/** Keeps every record, so a test can assert on what was shipped. */
@Injectable()
class RecordingLogApi implements CpsLogApiProvider {
  readonly records: CpsLogRecord[] = [];
  flushCount = 0;

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

  flush(): void {
    this.flushCount++;
  }
}

/** A provider implementing no `flush` at all, the common case. */
@Injectable()
class NoFlushLogApi implements CpsLogApiProvider {
  send(): void {}

  query(): Promise<CpsLogRecord[]> {
    return Promise.resolve([]);
  }
}

/** Fails on every call, to prove logging cannot break the caller. */
@Injectable()
class ThrowingLogApi implements CpsLogApiProvider {
  send(): never {
    throw new Error('log backend is down');
  }

  query(): Promise<CpsLogRecord[]> {
    return Promise.reject(new Error('log backend is down'));
  }
}

describe('CpsLoggerService', () => {
  /** The service itself — for `getLogger` and `query`. */
  let service: CpsLoggerService;
  /** What most tests exercise: a named logger, the only way records are written. */
  let logger: CpsLogger;
  let transport: RecordingLogApi;
  let sink: RecordingSink;

  function configure(logsOverrides?: Partial<CpsLogConfig>): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          { application: 'test-app', environment: 'test', version: '1.0.0' },
          withLogging(logsOverrides)
        ),
        RecordingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        RecordingSink,
        { provide: CpsTelemetrySink, useExisting: RecordingSink }
      ]
    });
    service = TestBed.inject(CpsLoggerService);
    logger = service.getLogger('test');
    transport = TestBed.inject(RecordingLogApi);
    sink = TestBed.inject(RecordingSink);
  }

  beforeEach(() => {
    localStorage.clear();
    configure();
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('levels', () => {
    it.each(['log', 'warn', 'error'] as const)(
      'should send a %s record to the transport',
      (level) => {
        logger[level]('a message');

        const records = transport.records;
        expect(records).toHaveLength(1);
        expect(records[0].level).toBe(level);
        expect(records[0].message).toBe('a message');
      }
    );

    it('should discard records below the configured minimum level', () => {
      configure({ minLevel: 'warn' });

      logger.log('dropped');
      logger.warn('kept');
      logger.error('kept too');

      expect(transport.records.map((r) => r.level)).toEqual(['warn', 'error']);
    });
  });

  describe('record shape', () => {
    it('should stamp the ambient application context onto every record', () => {
      logger.log('hello');

      expect(transport.records[0]).toMatchObject({
        application: 'test-app',
        environment: 'test',
        version: '1.0.0',
        sessionId: 'test-session'
      });
    });

    it('should take the user id from the sink, not from a copy of its own', () => {
      expect(transport.records).toHaveLength(0);
      sink.setUserId('user-42');
      logger.log('after sign-in');

      expect(transport.records[0].userId).toBe('user-42');
    });

    it('should stop attributing records after sign-out', () => {
      sink.setUserId('user-42');
      sink.setUserId(undefined);
      logger.log('after sign-out');

      const record = transport.records[0];
      expect(record).toHaveProperty('userId', undefined);
    });

    it('should carry an ISO-8601 timestamp', () => {
      logger.log('hello');
      expect(transport.records[0].timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should record context, metadata and correlation id when supplied', () => {
      logger.warn('careful', {
        context: 'CustomerService',
        metadata: { attempt: 2 },
        correlationId: 'scenario-1'
      });

      expect(transport.records[0]).toMatchObject({
        context: 'CustomerService',
        metadata: { attempt: 2 },
        correlationId: 'scenario-1'
      });
    });

    it('should length-cap context, the same as message', () => {
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
      const capped = TestBed.inject(CpsLoggerService).getLogger('test');
      const cappedTransport = TestBed.inject(RecordingLogApi);

      capped.warn('careful', { context: 'CustomerService' });

      expect(cappedTransport.records[0].context).toBe('Cust…');
    });

    it('should require nothing beyond the message', () => {
      expect(() => logger.log('bare')).not.toThrow();
      expect(transport.records[0].metadata).toBeUndefined();
      expect(transport.records[0].error).toBeUndefined();
    });

    it('should normalize an error rather than passing it through raw', () => {
      logger.error('failed', { error: new TypeError('boom') });

      const { error } = transport.records[0];
      expect(error).toMatchObject({ name: 'TypeError', message: 'boom' });
      expect(error).not.toBeInstanceOf(Error);
    });

    it('should redact sensitive metadata before it leaves the browser', () => {
      logger.log('sign-in attempt', {
        metadata: { password: 'hunter2', username: 'ada' }
      });

      expect(transport.records[0].metadata).toEqual({
        password: CPS_REDACTED,
        username: 'ada'
      });
    });

    it('should strip URL query strings from the message', () => {
      logger.error('GET https://api.dev/me?access_token=xyz failed');
      expect(transport.records[0].message).toBe(
        'GET https://api.dev/me failed'
      );
    });

    it('should scrub correlationId the same way context is scrubbed, not pass it through unredacted', () => {
      logger.log('hello', {
        correlationId: 'https://api.dev/trace?access_token=xyz'
      });

      expect(transport.records[0].correlationId).toBe('https://api.dev/trace');
    });
  });

  describe('withLogging({ redact: false })', () => {
    it('should skip configurable PII scrubbing but keep the built-in credential denylist and size caps', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withLogging({ redact: false }),
            withRedaction({ maxStringLength: 4 })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });
      const unredactedLogger =
        TestBed.inject(CpsLoggerService).getLogger('test');
      const unredactedTransport = TestBed.inject(RecordingLogApi);

      unredactedLogger.error('GET https://api.dev/me?access_token=xyz failed', {
        metadata: { password: 'hunter2', username: 'ada' }
      });

      expect(unredactedTransport.records[0].message).toBe('GET …');
      expect(unredactedTransport.records[0].metadata).toEqual({
        password: CPS_REDACTED,
        username: 'ada'
      });
    });
  });

  describe('console output', () => {
    let consoleLog: jest.SpyInstance;
    let consoleWarn: jest.SpyInstance;
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should stay silent by default', () => {
      logger.log('quiet');
      logger.warn('quiet');
      logger.error('quiet');

      expect(consoleLog).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('should write to the console when debugLogger is "true"', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.log('loud');
      expect(consoleLog).toHaveBeenCalledWith(
        '[test-app][test] loud',
        expect.objectContaining({ message: 'loud' })
      );
    });

    it('should log the very record handed to the transport', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.log('loud', { metadata: { a: 1 } });

      const [label, logged] = consoleLog.mock.calls[0];

      expect(label).toBe('[test-app][test] loud');
      expect(logged).toBe(transport.records[0]);
    });

    it('should still deliver the record when the console itself throws', () => {
      localStorage.setItem('debugLogger', 'true');
      consoleLog.mockImplementation(() => {
        throw new Error('console is patched and broken');
      });

      expect(() => logger.log('loud')).not.toThrow();
      expect(transport.records).toHaveLength(1);
      expect(transport.records[0]).toMatchObject({ message: 'loud' });
    });

    it('should write only the named logger when debugLogger names it', () => {
      localStorage.setItem('debugLogger', 'checkout');
      service.getLogger('checkout').log('loud');
      service.getLogger('admin').log('quiet');
      logger.log('quiet too');

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        '[test-app][checkout] loud',
        expect.objectContaining({ logger: 'checkout' })
      );
    });

    it('should accept a comma-separated list of logger names', () => {
      localStorage.setItem('debugLogger', 'checkout, admin');
      service.getLogger('checkout').log('a');
      service.getLogger('admin').log('b');
      service.getLogger('reports').log('c');

      expect(consoleLog).toHaveBeenCalledTimes(2);
    });

    it('should name each logger when several are filtered in at once', () => {
      localStorage.setItem('debugLogger', 'checkout, admin');
      service.getLogger('checkout').log('a');
      service.getLogger('admin').log('b');

      expect(consoleLog.mock.calls.map(([label]: [string]) => label)).toEqual([
        '[test-app][checkout] a',
        '[test-app][admin] b'
      ]);
    });

    it('should show the logger and the context together, coarse first', () => {
      localStorage.setItem('debugLogger', 'true');
      service.getLogger('checkout').log('working', { context: 'Loader' });

      expect(consoleLog).toHaveBeenCalledWith(
        '[test-app][checkout][Loader] working',
        expect.objectContaining({ logger: 'checkout', context: 'Loader' })
      );
    });

    it('should still write every logger when debugLogger is "true"', () => {
      localStorage.setItem('debugLogger', 'true');
      service.getLogger('checkout').log('a');
      logger.log('b');

      expect(consoleLog).toHaveBeenCalledTimes(2);
    });

    it('should write to the console when debugLogger is "1"', () => {
      localStorage.setItem('debugLogger', '1');
      logger.warn('loud');
      expect(consoleWarn).toHaveBeenCalled();
    });

    it('should stay silent for an invalid debugLogger value', () => {
      localStorage.setItem('debugLogger', 'yes');
      logger.log('quiet');
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it('should use the console method matching the level', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.error('bad');
      expect(consoleError).toHaveBeenCalled();
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it('should include the context and correlation id in the console line', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.log('working', {
        context: 'Loader',
        correlationId: 'abc-123'
      });
      expect(consoleLog).toHaveBeenCalledWith(
        '[test-app][test][Loader] working (abc-123)',
        expect.objectContaining({ correlationId: 'abc-123' })
      );
    });

    it('should still send to the transport while console output is on', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.log('both');
      expect(transport.records).toHaveLength(1);
    });
  });

  describe('named loggers', () => {
    it('should stamp the name onto every record', () => {
      configure();
      service.getLogger('checkout').log('submitting');

      expect(transport.records[0].logger).toBe('checkout');
    });

    it('should keep context free-form alongside the name', () => {
      configure();
      service.getLogger('checkout').log('submitting', {
        context: 'OrderService'
      });

      expect(transport.records[0]).toMatchObject({
        logger: 'checkout',
        context: 'OrderService'
      });
    });

    it('should return the very same logger for a name asked for twice', () => {
      // A name is identity, not a label: it addresses one logger the way
      // a file name addresses one file.
      configure();

      expect(service.getLogger('checkout')).toBe(service.getLogger('checkout'));
    });

    it('should give different names different loggers', () => {
      configure();

      expect(service.getLogger('checkout')).not.toBe(
        service.getLogger('admin')
      );
    });

    it('should keep returning the same logger across many lookups', () => {
      configure();
      const first = service.getLogger('checkout');
      service.getLogger('admin');
      service.getLogger('reports');

      expect(service.getLogger('checkout')).toBe(first);
    });

    it('should ignore a stray logger key in per-call detail', () => {
      // `CpsLogDetail` has no `logger` field, so this cannot be written in
      // TypeScript — the cast proves the runtime honours the logger's own
      // name too, rather than relying on the type alone.
      configure();
      service
        .getLogger('checkout')
        .log('elsewhere', { logger: 'admin' } as unknown as CpsLogDetail);

      expect(transport.records[0].logger).toBe('checkout');
    });

    it('should name every record, there being no unnamed way in', () => {
      // getLogger is the service's only writing entry point, so a record
      // without a `logger` cannot be produced — the four things that key
      // off the name (levels, the debugLogger filter, query({ logger })
      // and the console prefix) always have something to target.
      configure();
      logger.log('always named');
      service.getLogger('checkout').log('named too');

      expect(transport.records.map((r) => r.logger)).toEqual([
        'test',
        'checkout'
      ]);
    });
  });

  describe('per-logger levels', () => {
    it('should let one logger run below the global floor', () => {
      configure({ minLevel: 'warn', levels: { checkout: 'log' } });

      service.getLogger('checkout').log('kept');
      service.getLogger('admin').log('dropped');
      logger.log('dropped too');

      expect(transport.records.map((r) => r.message)).toEqual(['kept']);
    });

    it('should let one logger be quieter than the global floor', () => {
      configure({ minLevel: 'log', levels: { checkout: 'error' } });

      service.getLogger('checkout').warn('dropped');
      service.getLogger('checkout').error('kept');
      service.getLogger('admin').warn('kept too');

      expect(transport.records.map((r) => r.message)).toEqual([
        'kept',
        'kept too'
      ]);
    });

    it('should fall back to the global floor for an unlisted logger', () => {
      configure({ minLevel: 'error', levels: { checkout: 'log' } });

      service.getLogger('admin').warn('dropped');

      expect(transport.records).toHaveLength(0);
    });
  });

  describe('query', () => {
    it('should read records back from the backend', async () => {
      configure();
      service.getLogger('checkout').log('first');
      logger.log('second');

      const all = await service.query();

      expect(all.map((r) => r.message)).toEqual(['first', 'second']);
    });

    it('should pass the filter through to the backend', async () => {
      configure();
      const scenarioId = 'abc-123';
      logger.log('mine', { correlationId: scenarioId });
      logger.log('someone else');

      const found = await service.query({ correlationId: scenarioId });

      expect(found.map((r) => r.message)).toEqual(['mine']);
    });

    it('should resolve to an empty array when the backend rejects', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry({
            application: 'test-app',
            environment: 'test',
            version: '1.0.0'
          }),
          { provide: CPS_LOG_API_PROVIDER, useClass: ThrowingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });

      await expect(TestBed.inject(CpsLoggerService).query()).resolves.toEqual(
        []
      );
    });
  });

  describe('requires a log API provider', () => {
    it('should fail construction with no CPS_LOG_API_PROVIDER bound', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry({
            application: 'test-app',
            environment: 'test',
            version: '1.0.0'
          }),
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });

      expect(() => TestBed.inject(CpsLoggerService)).toThrow();
    });
  });

  describe('RUM error mirroring', () => {
    it('should not mirror errors to the sink by default', () => {
      logger.error('failed', { error: new Error('boom') });
      expect(sink.errors).toHaveLength(0);
    });

    it('should mirror errors to the sink when enabled', () => {
      configure({ mirrorErrorsToRum: true });
      logger.error('failed', { error: new Error('boom') });

      expect(sink.errors).toEqual([
        expect.objectContaining({ name: 'Error', message: 'boom' })
      ]);
    });

    it('should mirror a message-only error using the message', () => {
      configure({ mirrorErrorsToRum: true });
      logger.error('no error object supplied');

      expect(sink.errors[0].message).toBe('no error object supplied');
    });

    it('should not mirror non-error levels', () => {
      configure({ mirrorErrorsToRum: true });
      logger.warn('careful', { error: new Error('boom') });
      expect(sink.errors).toHaveLength(0);
    });
  });

  describe('without a sink configured', () => {
    function configureWithoutSink(logsOverrides?: Partial<CpsLogConfig>): void {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withLogging(logsOverrides)
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi }
        ]
      });
      service = TestBed.inject(CpsLoggerService);
      logger = service.getLogger('test');
      transport = TestBed.inject(RecordingLogApi);
    }

    it('should not throw on any level with no sink provided', () => {
      configureWithoutSink();
      expect(() => {
        logger.log('a');
        logger.warn('b');
        logger.error('c');
      }).not.toThrow();
    });

    it('should still deliver the record to the log backend with no sink', () => {
      configureWithoutSink();
      logger.log('still delivered');
      expect(transport.records).toHaveLength(1);
    });

    it('should omit sessionId and userId entirely with no sink, not merely leave them undefined', () => {
      configureWithoutSink();
      logger.log('no identity source');

      const record = transport.records[0];
      expect(record).not.toHaveProperty('sessionId');
      expect(record).not.toHaveProperty('userId');
    });

    it('should not throw when mirrorErrorsToRum is on but no sink is provided', () => {
      configureWithoutSink({ mirrorErrorsToRum: true });
      expect(() =>
        logger.error('failed', { error: new Error('boom') })
      ).not.toThrow();
    });

    it('should skip building the mirrored error entirely with no sink to send it to', () => {
      const normalizeSpy = jest.spyOn(
        cpsTelemetryRedactUtil,
        'cpsNormalizeError'
      );
      configureWithoutSink({ mirrorErrorsToRum: true });

      logger.error('message-only error');

      expect(normalizeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('failure isolation', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('should not propagate a throwing transport', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry({
            application: 'test-app',
            environment: 'test',
            version: '1.0.0'
          }),
          { provide: CPS_LOG_API_PROVIDER, useClass: ThrowingLogApi },
          RecordingSink,
          { provide: CpsTelemetrySink, useExisting: RecordingSink }
        ]
      });

      const isolated = TestBed.inject(CpsLoggerService).getLogger('test');
      expect(() => isolated.log('still fine')).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('logger.deliver failed'),
        expect.any(Error)
      );
    });

    it('should not propagate a throwing sink while mirroring errors', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            { application: 'test-app', environment: 'test', version: '1.0.0' },
            withLogging({ mirrorErrorsToRum: true })
          ),
          RecordingLogApi,
          { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
          ThrowingSink,
          { provide: CpsTelemetrySink, useExisting: ThrowingSink }
        ]
      });

      const isolated = TestBed.inject(CpsLoggerService).getLogger('test');
      expect(() => isolated.error('still fine')).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Error)
      );
    });
  });

  describe('page unload', () => {
    it('should flush the provider on pagehide', () => {
      window.dispatchEvent(new Event('pagehide'));
      expect(transport.flushCount).toBe(1);
    });

    it('should flush the provider when the page goes hidden', () => {
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(transport.flushCount).toBe(1);
    });

    it('should not flush merely on becoming visible again', () => {
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(transport.flushCount).toBe(0);
    });

    it('should flush the provider on destroy', () => {
      service.ngOnDestroy();
      expect(transport.flushCount).toBe(1);
    });

    it('should stop listening once destroyed', () => {
      service.ngOnDestroy();
      transport.flushCount = 0;

      window.dispatchEvent(new Event('pagehide'));

      expect(transport.flushCount).toBe(0);
    });

    it('should tolerate a provider that implements no flush', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry({
            application: 'test-app',
            environment: 'test',
            version: '1.0.0'
          }),
          { provide: CPS_LOG_API_PROVIDER, useClass: NoFlushLogApi }
        ]
      });
      TestBed.inject(CpsLoggerService);

      expect(() => window.dispatchEvent(new Event('pagehide'))).not.toThrow();
    });
  });
});
