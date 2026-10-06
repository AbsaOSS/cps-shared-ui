import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideCpsTelemetry,
  withLogging,
  withScenarios
} from '../../providers/cps-telemetry-common.providers/cps-telemetry-common.providers';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider
} from '../../providers/cps-log-api.provider/cps-log-api.provider';
import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CpsTelemetryObservedEvent } from '../../models/cps-telemetry-monitor.models/cps-telemetry-monitor.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { CpsBITelemetryService } from '../cps-bi-telemetry.service/cps-bi-telemetry.service';
import { CpsLoggerService } from '../cps-logger.service/cps-logger.service';
import { CpsScenarioTelemetryService } from '../cps-scenario-telemetry.service/cps-scenario-telemetry.service';
import { CpsTelemetryMonitor } from './cps-telemetry-monitor.service';

/** Counts every hand-off, so a test can prove nothing is sent twice. */
@Injectable()
class CountingSink extends CpsTelemetrySink {
  readonly records: { eventType: string; payload: object }[] = [];
  readonly errors: CpsTelemetryError[] = [];
  throwOnRecord = false;

  record(eventType: string, payload: object, _m?: CpsTelemetryMetadata): void {
    if (this.throwOnRecord) {
      throw new Error('sink is down');
    }
    this.records.push({ eventType, payload });
  }

  recordError(error: CpsTelemetryError): void {
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
class CountingLogApi implements CpsLogApiProvider {
  readonly sent: CpsLogRecord[] = [];
  throwOnSend = false;

  send(record: CpsLogRecord): void {
    if (this.throwOnSend) {
      throw new Error('log backend is down');
    }
    this.sent.push(record);
  }

  query(): Promise<CpsLogRecord[]> {
    return Promise.resolve([]);
  }
}

describe('CpsTelemetryMonitor at the hand-off sites', () => {
  let observed: CpsTelemetryObservedEvent[];
  let sink: CountingSink;
  let logApi: CountingLogApi;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          { application: 'test-app', environment: 'test', version: '1.0.0' },
          withScenarios({ defaultTimeoutMs: 0, emitLifecycleEvents: true }),
          withLogging({ mirrorErrorsToRum: true })
        ),
        CountingSink,
        { provide: CpsTelemetrySink, useExisting: CountingSink },
        CountingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: CountingLogApi }
      ]
    });
    sink = TestBed.inject(CountingSink);
    logApi = TestBed.inject(CountingLogApi);
    observed = [];
    TestBed.inject(CpsTelemetryMonitor).events$.subscribe((e) =>
      observed.push(e)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('should observe a BI event once, and send it once', () => {
    TestBed.inject(CpsBITelemetryService).track('export_clicked', {
      format: 'csv'
    });

    expect(sink.records).toHaveLength(1);
    expect(observed).toHaveLength(1);
    expect(observed[0]).toMatchObject({
      kind: 'bi',
      eventType: 'com.cps.bi',
      destination: 'sink',
      origin: { forwarded: false },
      payload: { eventName: 'export_clicked', metadata: { format: 'csv' } }
    });
  });

  it('should observe each scenario step and the settled record, once each', () => {
    TestBed.inject(CpsScenarioTelemetryService)
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
      'com.cps.scenario.step',
      'com.cps.scenario.step',
      'com.cps.scenario'
    ]);

    expect(sink.records).toHaveLength(observed.length);
    expect(observed[2].payload).toEqual(sink.records[2].payload);
  });

  it('should observe a log record as handed to the log provider', () => {
    TestBed.inject(CpsLoggerService).getLogger('checkout').warn('careful');

    expect(logApi.sent).toHaveLength(1);
    expect(observed).toHaveLength(1);
    expect(observed[0]).toMatchObject({
      kind: 'log',
      destination: 'log-provider',
      payload: { logger: 'checkout', level: 'warn', message: 'careful' }
    });
  });

  it('should observe a mirrored error, linked to the log line it came from', () => {
    TestBed.inject(CpsLoggerService)
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

    TestBed.inject(CpsBITelemetryService).track('export_clicked');
    TestBed.inject(CpsLoggerService).getLogger('checkout').log('lost');

    expect(observed).toHaveLength(0);
  });

  it('should send exactly the same number of events whether observed or not', () => {
    const run = () => {
      TestBed.inject(CpsBITelemetryService).track('a');
      TestBed.inject(CpsScenarioTelemetryService)
        .start({ name: 'load' })
        .step('one')
        .complete();
      TestBed.inject(CpsLoggerService).getLogger('checkout').log('hi');
    };

    run();
    const observedCounts = [sink.records.length, logApi.sent.length];

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          { application: 'test-app', environment: 'test', version: '1.0.0' },
          withScenarios({ defaultTimeoutMs: 0, emitLifecycleEvents: true })
        ),
        CountingSink,
        { provide: CpsTelemetrySink, useExisting: CountingSink },
        CountingLogApi,
        { provide: CPS_LOG_API_PROVIDER, useExisting: CountingLogApi }
      ]
    });
    sink = TestBed.inject(CountingSink);
    logApi = TestBed.inject(CountingLogApi);
    run();

    expect([sink.records.length, logApi.sent.length]).toEqual(observedCounts);
  });
});
