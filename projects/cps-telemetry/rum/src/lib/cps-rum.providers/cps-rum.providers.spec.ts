import { ApplicationInitStatus, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CpsScenarioTelemetryService,
  CpsTelemetrySink,
  provideCpsTelemetry
} from 'cps-telemetry';
import {
  CPS_RUM_CREDENTIALS_PROVIDER,
  CpsRumBootstrap,
  CpsRumCredentialsProvider
} from '../cps-rum-credentials/cps-rum-credentials';
import { CpsRumTelemetrySink } from '../cps-rum-telemetry.sink/cps-rum-telemetry.sink';
import { provideCpsTelemetryRumSink } from './cps-rum.providers';

jest.mock('aws-rum-web', () => ({ AwsRum: class {} }), { virtual: true });

/** Declines every load — the documented session-disable signal. */
@Injectable()
class StubCredentialsProvider implements CpsRumCredentialsProvider {
  async load(): Promise<CpsRumBootstrap | null> {
    return null;
  }
}

describe('provideCpsTelemetryRumSink', () => {
  function configure(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideCpsTelemetryRumSink(),
        {
          provide: CPS_RUM_CREDENTIALS_PROVIDER,
          useClass: StubCredentialsProvider
        }
      ]
    });
  }

  beforeEach(() => configure());

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

  it('should leave application code unchanged, the same as broadcast/noop', () => {
    const scenario = TestBed.inject(CpsScenarioTelemetryService).start({
      name: 'add-to-cart'
    });

    expect(() => scenario.step('one').complete()).not.toThrow();
    expect(scenario.status).toBe('success');
  });

  it('should report a settled scenario as lost, not silently dropped, once buffered telemetry is flushed at teardown', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.inject(CpsScenarioTelemetryService)
      .start({ name: 'add-to-cart' })
      .step('one')
      .complete();

    TestBed.resetTestingModule();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('RUM event(s) lost')
    );
  });
});
