import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';
import { ApplicationInitStatus, Injectable, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CpsLoggerService } from '../../services/cps-logger.service/cps-logger.service';
import { CpsScenarioTelemetryService } from '../../services/cps-scenario-telemetry.service/cps-scenario-telemetry.service';
import { CpsRumTelemetrySink } from '../../sinks/cps-rum/cps-rum-telemetry.sink/cps-rum-telemetry.sink';
import {
  CPS_RUM_CREDENTIALS_PROVIDER,
  CpsRumBootstrap,
  CpsRumCredentialsProvider
} from '../../sinks/cps-rum/cps-rum-credentials/cps-rum-credentials';
import { CpsNoopTelemetrySink } from '../../sinks/cps-telemetry/cps-noop-telemetry.sink/cps-noop-telemetry.sink';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider,
  CpsLogQuery
} from '../cps-log-api.provider/cps-log-api.provider';
import {
  CPS_DEFAULT_TELEMETRY_CONFIG,
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CPS_BI_CONFIG } from '../../config/cps-bi.config/cps-bi.config';
import { CPS_LOG_CONFIG } from '../../config/cps-log.config/cps-log.config';
import { CPS_SCENARIO_CONFIG } from '../../config/cps-scenario.config/cps-scenario.config';
import { CpsBroadcastTelemetrySink } from '../../sinks/cps-broadcast/cps-broadcast-telemetry.sink';
import { CPS_BROADCAST_CHANNEL } from '../../sinks/cps-broadcast/cps-broadcast.messages';
import {
  CpsTelemetryFeature,
  CpsTelemetrySinkMode,
  provideCpsTelemetry,
  provideCpsTelemetryBroadcastHost,
  provideCpsTelemetrySink,
  withBiEvents,
  withLogging,
  withRedaction,
  withScenarios
} from './cps-telemetry-common.providers';

jest.mock('aws-rum-web', () => ({ AwsRum: class {} }), { virtual: true });

@Injectable()
class StubCredentialsProvider implements CpsRumCredentialsProvider {
  async load(): Promise<CpsRumBootstrap | null> {
    return null;
  }
}

/** Keeps every record, so a test can assert on what was shipped. */
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

/**
 * Minimal `BroadcastChannel` stand-in for observing what one connection
 * posts. See `cps-broadcast.spec.ts` for the full cross-realm stub.
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

describe('provideCpsTelemetry', () => {
  /** Configuration only — a destination has to be chosen separately. */
  function configureAlone(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          { application: 'my-app', environment: 'prod', version: '1.0.0' },
          withLogging({ minLevel: 'warn' })
        )
      ]
    });
  }

  it('should provide the application identity', () => {
    configureAlone();
    expect(TestBed.inject(CPS_TELEMETRY_IDENTITY)).toMatchObject({
      application: 'my-app',
      environment: 'prod',
      version: '1.0.0'
    });
  });

  it('should apply a with*() override over the library default', () => {
    configureAlone();
    expect(TestBed.inject(CPS_LOG_CONFIG)).toMatchObject({ minLevel: 'warn' });
  });

  it('should default every concern not given a with*() feature', () => {
    configureAlone();
    expect(TestBed.inject(CPS_SCENARIO_CONFIG)).toEqual(
      CPS_DEFAULT_TELEMETRY_CONFIG.scenario
    );
    expect(TestBed.inject(CPS_BI_CONFIG)).toEqual(
      CPS_DEFAULT_TELEMETRY_CONFIG.bi
    );
    expect(TestBed.inject(CPS_REDACT_CONFIG)).toEqual(
      CPS_DEFAULT_TELEMETRY_CONFIG.redact
    );
  });

  it('should provide no sink of its own', () => {
    configureAlone();
    expect(() => TestBed.inject(CpsTelemetrySink)).toThrow();
  });

  it('should provide no log destination of its own', () => {
    configureAlone();
    expect(() => TestBed.inject(CpsLoggerService)).toThrow(
      /CPS_LOG_API_PROVIDER/
    );
  });

  it('should fail loudly when a service is injected with no destination', () => {
    configureAlone();
    expect(() => TestBed.inject(CpsScenarioTelemetryService)).toThrow();
  });

  it('should work once a destination is chosen', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink('noop'),
        RecordingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi }
      ]
    });

    const scenario = TestBed.inject(CpsScenarioTelemetryService).start({
      name: 'load'
    });

    expect(() => scenario.step('one').complete()).not.toThrow();
    expect(scenario.status).toBe('success');
    expect(TestBed.inject(CpsLoggerService)).toBeTruthy();
  });
});

describe("provideCpsTelemetrySink('rum')", () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink('rum'),
        {
          provide: CPS_RUM_CREDENTIALS_PROVIDER,
          useClass: StubCredentialsProvider
        }
      ]
    });
  });

  it('should replace the default sink with the RUM sink', () => {
    expect(TestBed.inject(CpsTelemetrySink)).toBeInstanceOf(
      CpsRumTelemetrySink
    );
  });

  it('should resolve the sink token and the concrete class to one instance', () => {
    expect(TestBed.inject(CpsTelemetrySink)).toBe(
      TestBed.inject(CpsRumTelemetrySink)
    );
  });

  it("should call the sink's init() automatically via app initialization", async () => {
    const initSpy = jest.spyOn(CpsRumTelemetrySink.prototype, 'init');

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(initSpy).toHaveBeenCalled();
    initSpy.mockRestore();
  });
});

describe('provideCpsTelemetrySink', () => {
  function configure(
    mode: CpsTelemetrySinkMode,
    options?: { channelName?: string }
  ): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'cart',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink(mode, options),
        RecordingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
        {
          provide: CPS_RUM_CREDENTIALS_PROVIDER,
          useClass: StubCredentialsProvider
        }
      ]
    });
  }

  it('should wire the RUM sink for a standalone deployment', () => {
    configure('rum');
    expect(TestBed.inject(CpsTelemetrySink)).toBeInstanceOf(
      CpsRumTelemetrySink
    );
  });

  it('should wire the forwarding sink for an embedded deployment', () => {
    configure('broadcast');
    expect(TestBed.inject(CpsTelemetrySink)).toBeInstanceOf(
      CpsBroadcastTelemetrySink
    );
  });

  it('should wire a discarding sink when telemetry is switched off', () => {
    configure('noop');
    expect(TestBed.inject(CpsTelemetrySink)).toBeInstanceOf(
      CpsNoopTelemetrySink
    );
  });

  it('should pass the channel name through in broadcast mode', () => {
    configure('broadcast', { channelName: 'my-channel' });
    expect(TestBed.inject(CPS_BROADCAST_CHANNEL)).toBe('my-channel');
  });

  it('should leave the channel name unbound when none is given', () => {
    configure('broadcast');
    expect(
      TestBed.inject(CPS_BROADCAST_CHANNEL, null, { optional: true })
    ).toBeNull();
  });

  describe('leaves application code unchanged across modes', () => {
    let consoleWarn: jest.SpyInstance;

    beforeAll(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterAll(() => {
      consoleWarn.mockRestore();
    });

    it.each(['rum', 'broadcast', 'noop'] as CpsTelemetrySinkMode[])(
      'should leave application code unchanged in %s mode',
      (mode) => {
        configure(mode);
        const scenario = TestBed.inject(CpsScenarioTelemetryService).start({
          name: 'add-to-cart'
        });

        expect(() => scenario.step('one').complete()).not.toThrow();
        expect(scenario.status).toBe('success');
      }
    );

    it('should report the rum-mode scenario above as lost, not silently dropped', () => {
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('RUM event(s) lost')
      );
    });
  });
});

describe('provideCpsTelemetryBroadcastHost', () => {
  afterEach(() => {
    RecordingChannelStub.uninstall();
  });

  it('should construct the host eagerly via app initialization, with nothing else injecting it', async () => {
    RecordingChannelStub.install();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideCpsTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink('noop'),
        provideCpsTelemetryBroadcastHost()
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
        provideCpsTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink('noop'),
        provideCpsTelemetryBroadcastHost('my-channel')
      ]
    });

    expect(TestBed.inject(CPS_BROADCAST_CHANNEL)).toBe('my-channel');
  });

  it('should leave the channel name unbound when none is given', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideCpsTelemetry({
          application: 'shell',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink('noop'),
        provideCpsTelemetryBroadcastHost()
      ]
    });

    expect(
      TestBed.inject(CPS_BROADCAST_CHANNEL, null, { optional: true })
    ).toBeNull();
  });
});

describe('custom implementations', () => {
  it('should reach the application log API through one binding alone', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetrySink('noop'),
        RecordingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi }
      ]
    });

    const api = TestBed.inject(RecordingLogApi);
    TestBed.inject(CpsLoggerService).log('hello');

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

  function configure(...features: CpsTelemetryFeature[]): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideCpsTelemetry(identity, ...features)]
    });
  }

  it('should default the event namespace to com.cps', () => {
    configure();
    expect(TestBed.inject(CPS_TELEMETRY_IDENTITY).eventNamespace).toBe(
      'com.cps'
    );
  });

  it('should accept an application-specific event namespace', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({ ...identity, eventNamespace: 'com.data-gateway' })
      ]
    });
    expect(TestBed.inject(CPS_TELEMETRY_IDENTITY).eventNamespace).toBe(
      'com.data-gateway'
    );
  });

  it('should merge withLogging over the library default rather than replacing it wholesale', () => {
    configure(withLogging({ minLevel: 'warn' }));
    const logs = TestBed.inject(CPS_LOG_CONFIG);
    expect(logs.minLevel).toBe('warn');
    expect(logs.mirrorErrorsToRum).toBe(
      CPS_DEFAULT_TELEMETRY_CONFIG.logs.mirrorErrorsToRum
    );
  });

  it('should merge withScenarios over the library default', () => {
    configure(withScenarios({ maxSteps: 10 }));
    const scenario = TestBed.inject(CPS_SCENARIO_CONFIG);
    expect(scenario.maxSteps).toBe(10);
    expect(scenario.defaultTimeoutMs).toBe(
      CPS_DEFAULT_TELEMETRY_CONFIG.scenario.defaultTimeoutMs
    );
  });

  it('should merge withBiEvents over the library default', () => {
    configure(withBiEvents({ dedupWindowMs: 1_000 }));
    const bi = TestBed.inject(CPS_BI_CONFIG);
    expect(bi.dedupWindowMs).toBe(1_000);
    expect(bi.dedupMaxKeys).toBe(CPS_DEFAULT_TELEMETRY_CONFIG.bi.dedupMaxKeys);
  });

  it('should merge withRedaction over the library default', () => {
    configure(withRedaction({ includeStack: false }));
    const redact = TestBed.inject(CPS_REDACT_CONFIG);
    expect(redact.includeStack).toBe(false);
    expect(redact.maxStringLength).toBe(
      CPS_DEFAULT_TELEMETRY_CONFIG.redact.maxStringLength
    );
  });

  describe('withRedaction array identity', () => {
    it('should give each call its own extraKeyPatterns array', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideCpsTelemetry(identity, withRedaction())]
      });
      const redactA = TestBed.inject(CPS_REDACT_CONFIG);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideCpsTelemetry(identity, withRedaction())]
      });
      const redactB = TestBed.inject(CPS_REDACT_CONFIG);

      expect(redactA.extraKeyPatterns).not.toBe(redactB.extraKeyPatterns);
      expect(redactA.extraKeyPatterns).not.toBe(
        CPS_DEFAULT_TELEMETRY_CONFIG.redact.extraKeyPatterns
      );
    });

    it('should not leak a mutation of one resolved extraKeyPatterns into another', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideCpsTelemetry(identity, withRedaction())]
      });
      TestBed.inject(CPS_REDACT_CONFIG).extraKeyPatterns.push(/leaked/i);

      expect(CPS_DEFAULT_TELEMETRY_CONFIG.redact.extraKeyPatterns).toEqual([]);
    });

    it('should still copy an explicitly supplied array, not share it back', () => {
      const shared = [/customerRef/i];
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            identity,
            withRedaction({ extraKeyPatterns: shared })
          )
        ]
      });

      TestBed.inject(CPS_REDACT_CONFIG).extraKeyPatterns.push(/addedLater/i);

      expect(shared).toHaveLength(1);
    });

    it('should give each call its own extraValueTransforms array too', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideCpsTelemetry(identity, withRedaction())]
      });
      const redactA = TestBed.inject(CPS_REDACT_CONFIG);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideCpsTelemetry(identity, withRedaction())]
      });
      const redactB = TestBed.inject(CPS_REDACT_CONFIG);

      expect(redactA.extraValueTransforms).not.toBe(
        redactB.extraValueTransforms
      );
      expect(redactA.extraValueTransforms).not.toBe(
        CPS_DEFAULT_TELEMETRY_CONFIG.redact.extraValueTransforms
      );
    });

    it('should still copy an explicitly supplied extraValueTransforms array, not share it back', () => {
      const shared = [(value: string) => value];
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideCpsTelemetry(
            identity,
            withRedaction({ extraValueTransforms: shared })
          )
        ]
      });

      TestBed.inject(CPS_REDACT_CONFIG).extraValueTransforms.push(
        (value) => value
      );

      expect(shared).toHaveLength(1);
    });
  });
});
