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
  let logger: CpsLoggerService;
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
    logger = TestBed.inject(CpsLoggerService);
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
      const capped = TestBed.inject(CpsLoggerService);
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
      const unredactedLogger = TestBed.inject(CpsLoggerService);
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
        '[test-app] loud',
        expect.objectContaining({ message: 'loud' })
      );
    });

    it('should log the very record handed to the transport', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.log('loud', { metadata: { a: 1 } });

      const [label, logged] = consoleLog.mock.calls[0];

      expect(label).toBe('[test-app] loud');
      expect(logged).toBe(transport.records[0]);
    });

    it('should write only the named logger when debugLogger names it', () => {
      localStorage.setItem('debugLogger', 'checkout');
      logger.getLogger('checkout').log('loud');
      logger.getLogger('admin').log('quiet');
      logger.log('quiet too');

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        '[test-app] loud',
        expect.objectContaining({ logger: 'checkout' })
      );
    });

    it('should accept a comma-separated list of logger names', () => {
      localStorage.setItem('debugLogger', 'checkout, admin');
      logger.getLogger('checkout').log('a');
      logger.getLogger('admin').log('b');
      logger.getLogger('reports').log('c');

      expect(consoleLog).toHaveBeenCalledTimes(2);
    });

    it('should still write every logger when debugLogger is "true"', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.getLogger('checkout').log('a');
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
        '[test-app][Loader] working (abc-123)',
        expect.objectContaining({ correlationId: 'abc-123' })
      );
    });

    it('should still send to the transport while console output is on', () => {
      localStorage.setItem('debugLogger', 'true');
      logger.log('both');
      expect(transport.records).toHaveLength(1);
    });
  });

  describe('child loggers', () => {
    it('should pre-bind the correlation id onto every call', () => {
      const child = logger.child({ correlationId: 'scenario-9' });

      child.log('one');
      child.error('two');

      expect(transport.records.map((r) => r.correlationId)).toEqual([
        'scenario-9',
        'scenario-9'
      ]);
    });

    it('should let a per-call value override a binding', () => {
      const child = logger.child({ correlationId: 'bound' });
      child.log('one', { correlationId: 'explicit' });
      expect(transport.records[0].correlationId).toBe('explicit');
    });

    it('should merge bound metadata with per-call metadata', () => {
      const child = logger.child({ metadata: { feature: 'customers' } });
      child.log('one', { metadata: { attempt: 1 } });

      expect(transport.records[0].metadata).toEqual({
        feature: 'customers',
        attempt: 1
      });
    });

    it('should support nesting', () => {
      const nested = logger
        .child({ context: 'Outer' })
        .child({ correlationId: 'inner-id' });

      nested.log('deep');

      expect(transport.records[0]).toMatchObject({
        context: 'Outer',
        correlationId: 'inner-id'
      });
    });
  });

  describe('named loggers', () => {
    it('should stamp the name onto every record', () => {
      configure();
      logger.getLogger('checkout').log('submitting');

      expect(transport.records[0].logger).toBe('checkout');
    });

    it('should keep context free-form alongside the name', () => {
      configure();
      logger
        .getLogger('checkout', { context: 'OrderService' })
        .log('submitting');

      expect(transport.records[0]).toMatchObject({
        logger: 'checkout',
        context: 'OrderService'
      });
    });

    it('should let a per-call logger override the bound one', () => {
      configure();
      logger.getLogger('checkout').log('elsewhere', { logger: 'admin' });

      expect(transport.records[0].logger).toBe('admin');
    });

    it('should carry the name through a nested child', () => {
      configure();
      logger
        .getLogger('checkout')
        .child({ correlationId: 'abc' })
        .log('nested');

      expect(transport.records[0]).toMatchObject({
        logger: 'checkout',
        correlationId: 'abc'
      });
    });

    it('should leave records from the bare service unnamed', () => {
      configure();
      logger.log('no name');

      expect(transport.records[0].logger).toBeUndefined();
    });
  });

  describe('per-logger levels', () => {
    it('should let one logger run below the global floor', () => {
      configure({ minLevel: 'warn', levels: { checkout: 'log' } });

      logger.getLogger('checkout').log('kept');
      logger.getLogger('admin').log('dropped');
      logger.log('dropped too');

      expect(transport.records.map((r) => r.message)).toEqual(['kept']);
    });

    it('should let one logger be quieter than the global floor', () => {
      configure({ minLevel: 'log', levels: { checkout: 'error' } });

      logger.getLogger('checkout').warn('dropped');
      logger.getLogger('checkout').error('kept');
      logger.getLogger('admin').warn('kept too');

      expect(transport.records.map((r) => r.message)).toEqual([
        'kept',
        'kept too'
      ]);
    });

    it('should fall back to the global floor for an unlisted logger', () => {
      configure({ minLevel: 'error', levels: { checkout: 'log' } });

      logger.getLogger('admin').warn('dropped');

      expect(transport.records).toHaveLength(0);
    });
  });

  describe('query', () => {
    it('should read records back from the backend', async () => {
      configure();
      logger.getLogger('checkout').log('first');
      logger.log('second');

      const all = await logger.query();

      expect(all.map((r) => r.message)).toEqual(['first', 'second']);
    });

    it('should pass the filter through to the backend', async () => {
      configure();
      const scenarioId = 'abc-123';
      logger.log('mine', { correlationId: scenarioId });
      logger.log('someone else');

      const found = await logger.query({ correlationId: scenarioId });

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
      logger = TestBed.inject(CpsLoggerService);
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

      const isolated = TestBed.inject(CpsLoggerService);
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

      const isolated = TestBed.inject(CpsLoggerService);
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
      logger.ngOnDestroy();
      expect(transport.flushCount).toBe(1);
    });

    it('should stop listening once destroyed', () => {
      logger.ngOnDestroy();
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
