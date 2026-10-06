import { UwtLogRecord } from '../../models/uwt-log.models/uwt-log.models';
import { ApplicationInitStatus, Injectable, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UwtLoggerService } from '../../services/uwt-logger.service/uwt-logger.service';
import { UwtScenarioTelemetryService } from '../../services/uwt-scenario-telemetry.service/uwt-scenario-telemetry.service';
import { UwtBITelemetryService } from '../../services/uwt-bi-telemetry.service/uwt-bi-telemetry.service';
import {
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import {
  uwtClassifyTelemetryEvent,
  UwtTelemetrySinkEvent
} from '../../utils/uwt-telemetry-event.util/uwt-telemetry-event.util';
import { UwtNoopTelemetrySink } from '../../sinks/uwt-telemetry/uwt-noop-telemetry.sink/uwt-noop-telemetry.sink';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import {
  UWT_LOG_API_PROVIDER,
  UwtLogApiProvider,
  UwtLogQuery
} from '../uwt-log-api.provider/uwt-log-api.provider';
import {
  UWT_DEFAULT_TELEMETRY_CONFIG,
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY
} from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { UWT_BI_TELEMETRY_CONFIG } from '../../config/uwt-bi-telemetry.config/uwt-bi-telemetry.config';
import { UWT_LOG_CONFIG } from '../../config/uwt-log.config/uwt-log.config';
import { UWT_SCENARIO_TELEMETRY_CONFIG } from '../../config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
import { UwtBroadcastTelemetrySink } from '../../sinks/uwt-broadcast/uwt-broadcast-telemetry.sink';
import { UwtBroadcastLogApiProvider } from '../uwt-broadcast-log-api.provider/uwt-broadcast-log-api.provider';
import { UwtNoopLogApiProvider } from '../uwt-noop-log-api.provider/uwt-noop-log-api.provider';
import { UWT_BROADCAST_CHANNEL } from '../../sinks/uwt-broadcast/uwt-broadcast.messages';
import {
  UwtTelemetryFeature,
  UwtTelemetryLocalSinkMode,
  provideUwtTelemetry,
  provideUwtTelemetryBroadcastHost,
  provideUwtTelemetryDestination,
  provideUwtTelemetrySink,
  withBIEvents,
  withLogging,
  withRedaction,
  withScenarios
} from './uwt-telemetry-common.providers';

/** Keeps every record, so a test can assert on what was shipped. */
@Injectable()
class RecordingLogApi implements UwtLogApiProvider {
  readonly records: UwtLogRecord[] = [];

  send(record: UwtLogRecord): void {
    this.records.push(record);
  }

  query(filter: UwtLogQuery): Promise<UwtLogRecord[]> {
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

/**
 * Minimal `BroadcastChannel` stand-in for observing what one connection
 * posts. See `uwt-broadcast.spec.ts` for the full cross-realm stub.
 */
class RecordingChannelStub {
  static posted: unknown[] = [];

  onmessage: ((event: { data: unknown }) => void) | null = null;
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(message: unknown): void {
    RecordingChannelStub.posted.push(message);
  }

  close(): void {}

  static install(): void {
    RecordingChannelStub.posted = [];
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      value: RecordingChannelStub,
      configurable: true,
      writable: true
    });
  }

  static uninstall(): void {
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
  }
}

describe('provideUwtTelemetry', () => {
  /** Configuration only — a destination has to be chosen separately. */
  function configureAlone(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry(
          { application: 'my-app', environment: 'prod', version: '1.0.0' },
          withLogging({ minLevel: 'warn' })
        )
      ]
    });
  }

  it('should provide the application identity', () => {
    configureAlone();
    expect(TestBed.inject(UWT_TELEMETRY_IDENTITY)).toMatchObject({
      application: 'my-app',
      environment: 'prod',
      version: '1.0.0'
    });
  });

  it('should apply a with*() override over the library default', () => {
    configureAlone();
    expect(TestBed.inject(UWT_LOG_CONFIG)).toMatchObject({ minLevel: 'warn' });
  });

  it('should default every concern not given a with*() feature', () => {
    configureAlone();
    expect(TestBed.inject(UWT_SCENARIO_TELEMETRY_CONFIG)).toEqual(
      UWT_DEFAULT_TELEMETRY_CONFIG.scenario
    );
    expect(TestBed.inject(UWT_BI_TELEMETRY_CONFIG)).toEqual(
      UWT_DEFAULT_TELEMETRY_CONFIG.bi
    );
    expect(TestBed.inject(UWT_REDACT_CONFIG)).toEqual(
      UWT_DEFAULT_TELEMETRY_CONFIG.redact
    );
  });

  it('should provide no sink of its own', () => {
    configureAlone();
    expect(() => TestBed.inject(UwtTelemetrySink)).toThrow();
  });

  it('should provide no log destination of its own', () => {
    configureAlone();
    expect(() => TestBed.inject(UwtLoggerService)).toThrow(
      /UWT_LOG_API_PROVIDER/
    );
  });

  it('should fail loudly when a service is injected with no destination', () => {
    configureAlone();
    expect(() => TestBed.inject(UwtScenarioTelemetryService)).toThrow();
  });

  it('should work once a destination is chosen', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        RecordingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi }
      ]
    });

    const scenario = TestBed.inject(UwtScenarioTelemetryService).start({
      name: 'load'
    });

    expect(() => scenario.step('one').complete()).not.toThrow();
    expect(scenario.status).toBe('success');
    expect(TestBed.inject(UwtLoggerService)).toBeTruthy();
  });
});

describe('provideUwtTelemetrySink', () => {
  function configure(
    mode: UwtTelemetryLocalSinkMode,
    options?: { channelName?: string }
  ): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry({
          application: 'cart',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink(mode, options),
        RecordingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi }
      ]
    });
  }

  it('should wire the forwarding sink for an embedded deployment', () => {
    configure('broadcast');
    expect(TestBed.inject(UwtTelemetrySink)).toBeInstanceOf(
      UwtBroadcastTelemetrySink
    );
  });

  it('should send log records to the shell in broadcast mode, needing no log provider of its own', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry({
          application: 'cart',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('broadcast')
      ]
    });

    expect(TestBed.inject(UWT_LOG_API_PROVIDER)).toBeInstanceOf(
      UwtBroadcastLogApiProvider
    );
    expect(TestBed.inject(UwtLoggerService)).toBeTruthy();
  });

  it('should wire a discarding sink when telemetry is switched off', () => {
    configure('noop');
    expect(TestBed.inject(UwtTelemetrySink)).toBeInstanceOf(
      UwtNoopTelemetrySink
    );
  });

  it('should pass the channel name through in broadcast mode', () => {
    configure('broadcast', { channelName: 'my-channel' });
    expect(TestBed.inject(UWT_BROADCAST_CHANNEL)).toBe('my-channel');
  });

  it('should leave the channel name unbound when none is given', () => {
    configure('broadcast');
    expect(
      TestBed.inject(UWT_BROADCAST_CHANNEL, null, { optional: true })
    ).toBeNull();
  });

  it.each(['broadcast', 'noop'] as UwtTelemetryLocalSinkMode[])(
    'should leave application code unchanged in %s mode',
    (mode) => {
      configure(mode);
      const scenario = TestBed.inject(UwtScenarioTelemetryService).start({
        name: 'add-to-cart'
      });

      expect(() => scenario.step('one').complete()).not.toThrow();
      expect(scenario.status).toBe('success');
    }
  );
});

describe('provideUwtTelemetryBroadcastHost', () => {
  afterEach(() => {
    RecordingChannelStub.uninstall();
  });

  it('should construct the host eagerly via app initialization, with nothing else injecting it', async () => {
    RecordingChannelStub.install();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideUwtTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        RecordingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        provideUwtTelemetryBroadcastHost()
      ]
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(RecordingChannelStub.posted).toContainEqual(
      expect.objectContaining({ kind: 'identity' })
    );
  });

  it('should fail at bootstrap when the shell binds no log provider', () => {
    RecordingChannelStub.install();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideUwtTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        provideUwtTelemetryBroadcastHost()
      ]
    });
    expect(() => TestBed.inject(ApplicationInitStatus)).toThrow(
      /UWT_LOG_API_PROVIDER/
    );
  });

  it('should bootstrap a shell that states it has no log backend', async () => {
    RecordingChannelStub.install();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideUwtTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        { provide: UWT_LOG_API_PROVIDER, useClass: UwtNoopLogApiProvider },
        provideUwtTelemetryBroadcastHost()
      ]
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(RecordingChannelStub.posted).toContainEqual(
      expect.objectContaining({ kind: 'identity' })
    );
  });

  it('should pass the channel name through', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideUwtTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        RecordingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        provideUwtTelemetryBroadcastHost('my-channel')
      ]
    });

    expect(TestBed.inject(UWT_BROADCAST_CHANNEL)).toBe('my-channel');
  });

  it('should leave the channel name unbound when none is given', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideUwtTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        RecordingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        provideUwtTelemetryBroadcastHost()
      ]
    });

    expect(
      TestBed.inject(UWT_BROADCAST_CHANNEL, null, { optional: true })
    ).toBeNull();
  });
});

describe('custom implementations', () => {
  it('should reach the application log API through one binding alone', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetrySink('noop'),
        RecordingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi }
      ]
    });

    const api = TestBed.inject(RecordingLogApi);
    TestBed.inject(UwtLoggerService).getLogger('test').log('hello');

    expect(api.records).toHaveLength(1);
    expect(api.records[0].message).toBe('hello');
  });
});

describe('with*() features', () => {
  const identity = {
    application: 'my-app',
    environment: 'prod',
    version: '1.0.0'
  };

  function configure(...features: UwtTelemetryFeature[]): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideUwtTelemetry(identity, ...features)]
    });
  }

  it('should default the event namespace to com.uwt', () => {
    configure();
    expect(TestBed.inject(UWT_TELEMETRY_IDENTITY).eventNamespace).toBe(
      'com.uwt'
    );
  });

  it('should accept an application-specific event namespace', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry({ ...identity, eventNamespace: 'com.test-app' })
      ]
    });
    expect(TestBed.inject(UWT_TELEMETRY_IDENTITY).eventNamespace).toBe(
      'com.test-app'
    );
  });

  it('should merge withLogging over the library default rather than replacing it wholesale', () => {
    configure(withLogging({ minLevel: 'warn' }));
    const logs = TestBed.inject(UWT_LOG_CONFIG);
    expect(logs.minLevel).toBe('warn');
    expect(logs.mirrorErrorsToRum).toBe(
      UWT_DEFAULT_TELEMETRY_CONFIG.logs.mirrorErrorsToRum
    );
  });

  it('should merge withScenarios over the library default', () => {
    configure(withScenarios({ maxSteps: 10 }));
    const scenario = TestBed.inject(UWT_SCENARIO_TELEMETRY_CONFIG);
    expect(scenario.maxSteps).toBe(10);
    expect(scenario.defaultTimeoutMs).toBe(
      UWT_DEFAULT_TELEMETRY_CONFIG.scenario.defaultTimeoutMs
    );
  });

  it('should merge withBIEvents over the library default', () => {
    configure(withBIEvents({ dedupWindowMs: 1_000 }));
    const bi = TestBed.inject(UWT_BI_TELEMETRY_CONFIG);
    expect(bi.dedupWindowMs).toBe(1_000);
    expect(bi.dedupMaxKeys).toBe(UWT_DEFAULT_TELEMETRY_CONFIG.bi.dedupMaxKeys);
  });

  it('should merge withRedaction over the library default', () => {
    configure(withRedaction({ includeStack: false }));
    const redact = TestBed.inject(UWT_REDACT_CONFIG);
    expect(redact.includeStack).toBe(false);
    expect(redact.maxStringLength).toBe(
      UWT_DEFAULT_TELEMETRY_CONFIG.redact.maxStringLength
    );
  });

  describe('withRedaction array identity', () => {
    it('should give each call its own extraKeyPatterns array', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideUwtTelemetry(identity, withRedaction())]
      });
      const redactA = TestBed.inject(UWT_REDACT_CONFIG);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideUwtTelemetry(identity, withRedaction())]
      });
      const redactB = TestBed.inject(UWT_REDACT_CONFIG);

      expect(redactA.extraKeyPatterns).not.toBe(redactB.extraKeyPatterns);
      expect(redactA.extraKeyPatterns).not.toBe(
        UWT_DEFAULT_TELEMETRY_CONFIG.redact.extraKeyPatterns
      );
    });

    it('should not leak a mutation of one resolved extraKeyPatterns into another', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideUwtTelemetry(identity, withRedaction())]
      });
      TestBed.inject(UWT_REDACT_CONFIG).extraKeyPatterns.push(/leaked/i);

      expect(UWT_DEFAULT_TELEMETRY_CONFIG.redact.extraKeyPatterns).toEqual([]);
    });

    it('should still copy an explicitly supplied array, not share it back', () => {
      const shared = [/customerRef/i];
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideUwtTelemetry(
            identity,
            withRedaction({ extraKeyPatterns: shared })
          )
        ]
      });

      TestBed.inject(UWT_REDACT_CONFIG).extraKeyPatterns.push(/addedLater/i);

      expect(shared).toHaveLength(1);
    });

    it('should give each call its own extraValueTransforms array too', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideUwtTelemetry(identity, withRedaction())]
      });
      const redactA = TestBed.inject(UWT_REDACT_CONFIG);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideUwtTelemetry(identity, withRedaction())]
      });
      const redactB = TestBed.inject(UWT_REDACT_CONFIG);

      expect(redactA.extraValueTransforms).not.toBe(
        redactB.extraValueTransforms
      );
      expect(redactA.extraValueTransforms).not.toBe(
        UWT_DEFAULT_TELEMETRY_CONFIG.redact.extraValueTransforms
      );
    });

    it('should still copy an explicitly supplied extraValueTransforms array, not share it back', () => {
      const shared = [(value: string) => value];
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideUwtTelemetry(
            identity,
            withRedaction({ extraValueTransforms: shared })
          )
        ]
      });

      TestBed.inject(UWT_REDACT_CONFIG).extraValueTransforms.push(
        (value) => value
      );

      expect(shared).toHaveLength(1);
    });
  });
});

/**
 * A destination the library has never seen, written against the public
 * contract only.
 */
@Injectable()
class BrandNewSink extends UwtTelemetrySink {
  readonly events: UwtTelemetrySinkEvent[] = [];
  readonly errors: UwtTelemetryError[] = [];
  readonly flushes: boolean[] = [];
  started = 0;
  private userId?: string;

  start(): void {
    this.started++;
  }

  record(
    eventType: string,
    payload: object,
    _metadata?: UwtTelemetryMetadata
  ): void {
    this.events.push(uwtClassifyTelemetryEvent(eventType, payload));
  }

  recordError(error: UwtTelemetryError): void {
    this.errors.push(error);
  }

  getSessionId(): string | undefined {
    return 'brand-new-session';
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
}

/** The same, for log records. */
@Injectable()
class BrandNewLogApi implements UwtLogApiProvider {
  readonly records: UwtLogRecord[] = [];

  send(record: UwtLogRecord): void {
    this.records.push(record);
  }

  query(): Promise<UwtLogRecord[]> {
    return Promise.resolve(this.records);
  }
}

describe('provideUwtTelemetryDestination', () => {
  function configure(...destinations: unknown[]): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideUwtTelemetry(
          { application: 'my-app', environment: 'prod', version: '1.0.0' },
          withLogging({ mirrorErrorsToRum: true })
        ),
        ...(destinations as never[]),
        BrandNewLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: BrandNewLogApi }
      ]
    });
  }

  it('should take a brand-new destination in place of the built-in ones, with no other change', () => {
    configure(
      provideUwtTelemetryDestination(BrandNewSink, {
        init: (sink) => sink.start()
      })
    );
    TestBed.inject(ApplicationInitStatus);
    const sink = TestBed.inject(BrandNewSink);

    // Application code, exactly as it is written against any destination.
    const scenario = TestBed.inject(UwtScenarioTelemetryService).start({
      name: 'checkout'
    });
    scenario.step('pay');
    scenario.complete();
    TestBed.inject(UwtBITelemetryService).track('export_clicked', {
      format: 'csv'
    });
    TestBed.inject(UwtLoggerService)
      .getLogger('checkout')
      .error('Payment failed', { correlationId: scenario.id });
    TestBed.inject(UwtTelemetrySink).setUserId('user-1');
    TestBed.inject(UwtTelemetrySink).flush(true);

    expect(TestBed.inject(UwtTelemetrySink)).toBe(sink);
    expect(sink.started).toBe(1);
    expect(sink.events.map((e) => e.kind)).toEqual(['scenario', 'bi']);
    const [record, bi] = sink.events;
    expect(record.kind === 'scenario' && record.payload.scenarioName).toBe(
      'checkout'
    );
    expect(bi.kind === 'bi' && bi.payload.eventName).toBe('export_clicked');
    expect(sink.errors).toEqual([
      expect.objectContaining({ message: 'Payment failed' })
    ]);
    expect(sink.getUserId()).toBe('user-1');
    expect(sink.flushes).toEqual([true]);

    const [log] = TestBed.inject(BrandNewLogApi).records;
    expect(log).toMatchObject({
      message: 'Payment failed',
      correlationId: scenario.id,
      // Identity comes from whichever destination is bound.
      sessionId: 'brand-new-session',
      userId: undefined
    });
  });

  it('should fail at bootstrap when two different destinations are provided', () => {
    configure(
      provideUwtTelemetrySink('noop'),
      provideUwtTelemetryDestination(BrandNewSink)
    );

    expect(() => TestBed.inject(ApplicationInitStatus)).toThrow(
      'More than one telemetry destination is provided: UwtNoopTelemetrySink, BrandNewSink. Provide exactly one.'
    );
  });

  it('should accept the same destination listed twice, and start it once', () => {
    configure(
      provideUwtTelemetryDestination(BrandNewSink, {
        init: (sink) => sink.start()
      }),
      provideUwtTelemetryDestination(BrandNewSink, {
        init: (sink) => sink.start()
      })
    );

    expect(() => TestBed.inject(ApplicationInitStatus)).not.toThrow();
    expect(TestBed.inject(BrandNewSink).started).toBe(1);
  });

  it('should not let a throwing init break bootstrap', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    configure(
      provideUwtTelemetryDestination(BrandNewSink, {
        init: () => {
          throw new Error('backend unreachable');
        }
      })
    );

    expect(() => TestBed.inject(ApplicationInitStatus)).not.toThrow();
    TestBed.inject(UwtBITelemetryService).track('export_clicked');
    expect(TestBed.inject(BrandNewSink).events).toHaveLength(1);
    consoleError.mockRestore();
  });

  it('should leave a sink bound directly, without the helper, to work as before', () => {
    configure(BrandNewSink, {
      provide: UwtTelemetrySink,
      useExisting: BrandNewSink
    });

    TestBed.inject(UwtBITelemetryService).track('export_clicked');

    expect(TestBed.inject(BrandNewSink).events).toHaveLength(1);
  });

  it('should still fail when no destination is provided', () => {
    configure();

    expect(() => TestBed.inject(UwtBITelemetryService)).toThrow(/NG0201/);
  });
});
