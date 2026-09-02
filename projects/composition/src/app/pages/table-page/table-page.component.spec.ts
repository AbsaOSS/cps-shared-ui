import { TestBed } from '@angular/core/testing';
import {
  CPS_LOG_API_PROVIDER,
  CpsNoopTelemetrySink,
  CpsScenarioTelemetryService,
  CpsTelemetrySink,
  provideCpsTelemetry
} from 'cps-telemetry';
import { AppLogApiProvider } from '../../services/app-log-api.provider';
import { TablePageComponent } from './table-page.component';

describe('TablePageComponent', () => {
  let component: TablePageComponent;
  let scenarioTelemetry: CpsScenarioTelemetryService;

  beforeEach(async () => {
    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [TablePageComponent],
      providers: [
        provideCpsTelemetry({
          application: 'composition-test',
          environment: 'test'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useClass: CpsNoopTelemetrySink }
      ]
    }).compileComponents();

    component = TestBed.runInInjectionContext(() => new TablePageComponent());
    scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
  });

  afterEach(() => jest.useRealTimers());

  describe('ngOnDestroy', () => {
    it('should cancel a lazy-load scenario still in flight, not leave it open', () => {
      component.onLazyLoad({ first: 0, rows: 10 });
      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should settle it as abandoned, not leave it to auto-settle as a misleading timeout', () => {
      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component.onLazyLoad({ first: 0, rows: 10 });
      component.ngOnDestroy();

      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'abandoned' })
      );
    });

    it('should not throw when there is no lazy load in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should stop a pending lazy-load timer from completing a destroyed scenario', async () => {
      component.onLazyLoad({ first: 0, rows: 10 });
      await Promise.resolve();

      component.ngOnDestroy();
      jest.advanceTimersByTime(600);

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });
  });

  describe('onLazyLoad', () => {
    it('should aggregate one format-row call per fetched row', async () => {
      component.dataVirtual = Array.from({ length: 10 }, (_, i) => ({
        a: `a${i}`,
        b: `b${i % 5}`,
        c: i,
        d: new Date(),
        e: i % 2 === 0,
        f: new Date()
      }));

      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component.onLazyLoad({ first: 0, rows: 10 });
      await Promise.resolve();
      jest.advanceTimersByTime(600);

      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregates: [
            expect.objectContaining({ name: 'format-row', callCount: 10 })
          ]
        })
      );
    });
  });
});
