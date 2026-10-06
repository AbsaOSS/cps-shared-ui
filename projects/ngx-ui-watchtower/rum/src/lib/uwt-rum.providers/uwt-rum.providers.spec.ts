import { ApplicationInitStatus, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  UwtScenarioTelemetryService,
  UwtTelemetrySink,
  provideUwtTelemetry
} from '@absaoss-cps/ngx-ui-watchtower';
import {
  UWT_RUM_CREDENTIALS_PROVIDER,
  UwtRumBootstrap,
  UwtRumCredentialsProvider
} from '../uwt-rum-credentials/uwt-rum-credentials';
import { UwtRumTelemetrySink } from '../uwt-rum-telemetry.sink/uwt-rum-telemetry.sink';
import { provideUwtTelemetryRumSink } from './uwt-rum.providers';

jest.mock('aws-rum-web', () => ({ AwsRum: class {} }), { virtual: true });

/** Declines every load — the documented session-disable signal. */
@Injectable()
class StubCredentialsProvider implements UwtRumCredentialsProvider {
  async load(): Promise<UwtRumBootstrap | null> {
    return null;
  }
}

describe('provideUwtTelemetryRumSink', () => {
  function configure(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideUwtTelemetry({
          application: 'my-app',
          environment: 'prod',
          version: '1.0.0'
        }),
        provideUwtTelemetryRumSink(),
        {
          provide: UWT_RUM_CREDENTIALS_PROVIDER,
          useClass: StubCredentialsProvider
        }
      ]
    });
  }

  beforeEach(() => configure());

  it('should replace the default sink with the RUM sink', () => {
    expect(TestBed.inject(UwtTelemetrySink)).toBeInstanceOf(
      UwtRumTelemetrySink
    );
  });

  it('should resolve the sink token and the concrete class to one instance', () => {
    expect(TestBed.inject(UwtTelemetrySink)).toBe(
      TestBed.inject(UwtRumTelemetrySink)
    );
  });

  it("should call the sink's init() automatically via app initialization", async () => {
    const initSpy = jest.spyOn(UwtRumTelemetrySink.prototype, 'init');

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(initSpy).toHaveBeenCalled();
    initSpy.mockRestore();
  });

  it('should leave application code unchanged, the same as broadcast/noop', () => {
    const scenario = TestBed.inject(UwtScenarioTelemetryService).start({
      name: 'add-to-cart'
    });

    expect(() => scenario.step('one').complete()).not.toThrow();
    expect(scenario.status).toBe('success');
  });

  it('should report a settled scenario as lost, not silently dropped, once buffered telemetry is flushed at teardown', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.inject(UwtScenarioTelemetryService)
      .start({ name: 'add-to-cart' })
      .step('one')
      .complete();

    TestBed.resetTestingModule();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('RUM event(s) lost')
    );
  });
});
