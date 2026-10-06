import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideUwtTelemetry,
  withLogging,
  withScenarios
} from '../../providers/uwt-telemetry-common.providers/uwt-telemetry-common.providers';
import {
  UWT_LOG_API_PROVIDER,
  UwtLogApiProvider
} from '../../providers/uwt-log-api.provider/uwt-log-api.provider';
import { UwtLogRecord } from '../../models/uwt-log.models/uwt-log.models';
import {
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { UwtTelemetryObservedEvent } from '../../models/uwt-telemetry-monitor.models/uwt-telemetry-monitor.models';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import { UwtBITelemetryService } from '../uwt-bi-telemetry.service/uwt-bi-telemetry.service';
import { UwtLoggerService } from '../uwt-logger.service/uwt-logger.service';
import { UwtScenarioTelemetryService } from '../uwt-scenario-telemetry.service/uwt-scenario-telemetry.service';
import { UwtTelemetryMonitor } from './uwt-telemetry-monitor.service';

/** Counts every hand-off, so a test can prove nothing is sent twice. */
@Injectable()
class CountingSink extends UwtTelemetrySink {
  readonly records: { eventType: string; payload: object }[] = [];
  readonly errors: UwtTelemetryError[] = [];
  throwOnRecord = false;

  record(eventType: string, payload: object, _m?: UwtTelemetryMetadata): void {
    if (this.throwOnRecord) {
      throw new Error('sink is down');
    }
    this.records.push({ eventType, payload });
  }

  recordError(error: UwtTelemetryError): void {
    this.errors.push(error);
  }

  getSessionId(): string | undefined {
    return 'session-1';
  }

  setUserId(): void {}

  getUserId(): string | undefined {
    return undefined;
  }

  flush(): void {}
}

@Injectable()
class CountingLogApi implements UwtLogApiProvider {
  readonly sent: UwtLogRecord[] = [];
  throwOnSend = false;

  send(record: UwtLogRecord): void {
    if (this.throwOnSend) {
      throw new Error('log backend is down');
    }
    this.sent.push(record);
  }

  query(): Promise<UwtLogRecord[]> {
    return Promise.resolve([]);
  }
}

describe('UwtTelemetryMonitor at the hand-off sites', () => {
  let observed: UwtTelemetryObservedEvent[];
  let sink: CountingSink;
  let logApi: CountingLogApi;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry(
          { application: 'test-app', environment: 'test', version: '1.0.0' },
          withScenarios({ defaultTimeoutMs: 0, emitLifecycleEvents: true }),
          withLogging({ mirrorErrorsToRum: true })
        ),
        CountingSink,
        { provide: UwtTelemetrySink, useExisting: CountingSink },
        CountingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: CountingLogApi }
      ]
    });
    sink = TestBed.inject(CountingSink);
    logApi = TestBed.inject(CountingLogApi);
    observed = [];
    TestBed.inject(UwtTelemetryMonitor).events$.subscribe((e) =>
      observed.push(e)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('should observe a BI event once, and send it once', () => {
    TestBed.inject(UwtBITelemetryService).track('export_clicked', {
      format: 'csv'
    });

    expect(sink.records).toHaveLength(1);
    expect(observed).toHaveLength(1);
    expect(observed[0]).toMatchObject({
      kind: 'bi',
      eventType: 'com.uwt.bi',
      destination: 'sink',
      origin: { forwarded: false },
      payload: { eventName: 'export_clicked', metadata: { format: 'csv' } }
    });
  });

  it('should observe each scenario step and the settled record, once each', () => {
    TestBed.inject(UwtScenarioTelemetryService)
      .start({ name: 'load' })
      .step('one')
      .step('two')
      .complete();

    expect(observed.map((e) => e.kind)).toEqual([
      'scenario-step',
      'scenario-step',
      'scenario'
    ]);
    expect(observed.map((e) => 'eventType' in e && e.eventType)).toEqual([
      'com.uwt.scenario.step',
      'com.uwt.scenario.step',
      'com.uwt.scenario'
    ]);

    expect(sink.records).toHaveLength(observed.length);
    expect(observed[2].payload).toEqual(sink.records[2].payload);
  });

  it('should observe a log record as handed to the log provider', () => {
    TestBed.inject(UwtLoggerService).getLogger('checkout').warn('careful');

    expect(logApi.sent).toHaveLength(1);
    expect(observed).toHaveLength(1);
    expect(observed[0]).toMatchObject({
      kind: 'log',
      destination: 'log-provider',
      payload: { logger: 'checkout', level: 'warn', message: 'careful' }
    });
  });

  it('should observe a mirrored error, linked to the log line it came from', () => {
    TestBed.inject(UwtLoggerService)
      .getLogger('checkout')
      .error('failed', { error: new Error('boom') });

    expect(sink.errors).toHaveLength(1);
    const [log, error] = observed;
    expect(log.kind).toBe('log');
    expect(error).toMatchObject({
      kind: 'error',
      destination: 'sink',
      relatedSequence: log.sequence,
      payload: { name: 'Error', message: 'boom' }
    });
  });

  it('should observe nothing for a hand-off that threw', () => {
    sink.throwOnRecord = true;
    logApi.throwOnSend = true;

    TestBed.inject(UwtBITelemetryService).track('export_clicked');
    TestBed.inject(UwtLoggerService).getLogger('checkout').log('lost');

    expect(observed).toHaveLength(0);
  });

  it('should send exactly the same number of events whether observed or not', () => {
    const run = () => {
      TestBed.inject(UwtBITelemetryService).track('a');
      TestBed.inject(UwtScenarioTelemetryService)
        .start({ name: 'load' })
        .step('one')
        .complete();
      TestBed.inject(UwtLoggerService).getLogger('checkout').log('hi');
    };

    run();
    const observedCounts = [sink.records.length, logApi.sent.length];

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry(
          { application: 'test-app', environment: 'test', version: '1.0.0' },
          withScenarios({ defaultTimeoutMs: 0, emitLifecycleEvents: true })
        ),
        CountingSink,
        { provide: UwtTelemetrySink, useExisting: CountingSink },
        CountingLogApi,
        { provide: UWT_LOG_API_PROVIDER, useExisting: CountingLogApi }
      ]
    });
    sink = TestBed.inject(CountingSink);
    logApi = TestBed.inject(CountingLogApi);
    run();

    expect([sink.records.length, logApi.sent.length]).toEqual(observedCounts);
  });
});
