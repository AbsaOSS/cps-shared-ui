import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { throwError } from 'rxjs';
import {
  CPS_LOG_API_PROVIDER,
  CpsNoopTelemetrySink,
  CpsScenarioTelemetryService,
  CpsTelemetrySink,
  provideCpsTelemetry
} from 'cps-telemetry';
import { AppLogApiProvider } from '../../services/app-log-api.provider';
import { AutocompletePageComponent } from './autocomplete-page.component';

describe('AutocompletePageComponent', () => {
  let component: AutocompletePageComponent;
  let scenarioTelemetry: CpsScenarioTelemetryService;

  function createComponent(): AutocompletePageComponent {
    return TestBed.runInInjectionContext(
      () => new AutocompletePageComponent(TestBed.inject(FormBuilder))
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition-test',
          environment: 'test',
          version: '0.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useClass: CpsNoopTelemetrySink }
      ]
    }).compileComponents();

    component = createComponent();
    component.ngOnInit();
    component.singleOptionsObservable$?.subscribe();
    component.multiOptionsObservable$?.subscribe();
    scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('search error handling', () => {
    function makeSearchThrow(): void {
      jest
        .spyOn(
          component as unknown as { _getOptionsFromServer: unknown },
          '_getOptionsFromServer'
        )
        .mockReturnValue(throwError(() => new Error('backend down')));
    }

    it('should not leave the spinner stuck when a search errors', () => {
      makeSearchThrow();
      component.onSingleInputChanged('lon');

      expect(component.isSingleLoading).toBe(false);
    });

    it('should not leave the scenario open when a search errors', () => {
      makeSearchThrow();
      component.onSingleInputChanged('lon');

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should settle the scenario as failed, carrying the error', () => {
      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      makeSearchThrow();
      component.onSingleInputChanged('lon');

      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failure',
          error: expect.objectContaining({ message: 'backend down' })
        })
      );
    });

    it('should not kill the pipeline for later searches after one errors', () => {
      makeSearchThrow();
      component.onSingleInputChanged('lon');
      expect(component.isSingleLoading).toBe(false);

      jest.restoreAllMocks();
      component.onSingleInputChanged('par');

      expect(component.isSingleLoading).toBe(true);
    });
  });

  describe('onOptionSelected', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should cancel a still-running validation when a newer selection supersedes it', () => {
      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component.onOptionSelected(component.options[0]);
      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      component.onOptionSelected(component.options[1]);

      expect(scenarioTelemetry.getActive()).toHaveLength(1);
      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'abandoned' })
      );
    });

    it("should let ngOnDestroy cancel the newer selection even past the superseded one's original timer mark", () => {
      component.onOptionSelected(component.options[0]);
      component.onOptionSelected(component.options[1]);

      jest.advanceTimersByTime(3000);
      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should settle the newer selection successfully once its own delay elapses', () => {
      component.onOptionSelected(component.options[0]);
      component.onOptionSelected(component.options[1]);

      jest.advanceTimersByTime(3000);

      expect(component.validating).toBe(false);
      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should not leave the validating flag stuck when validation errors', () => {
      jest
        .spyOn(
          component as unknown as { _validateOption: unknown },
          '_validateOption'
        )
        .mockReturnValue(
          throwError(() => new Error('validation backend down'))
        );

      component.onOptionSelected(component.options[0]);

      expect(component.validating).toBe(false);
      expect(component.externalError).toBe('Validation failed');
    });

    it('should not leave the scenario open when validation errors', () => {
      jest
        .spyOn(
          component as unknown as { _validateOption: unknown },
          '_validateOption'
        )
        .mockReturnValue(
          throwError(() => new Error('validation backend down'))
        );

      component.onOptionSelected(component.options[0]);

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should not kill the pipeline for later selections after one errors', () => {
      jest
        .spyOn(
          component as unknown as { _validateOption: unknown },
          '_validateOption'
        )
        .mockReturnValueOnce(
          throwError(() => new Error('validation backend down'))
        );

      component.onOptionSelected(component.options[0]);
      expect(component.validating).toBe(false);

      component.onOptionSelected(component.options[1]);
      expect(component.validating).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should cancel an in-flight single search, not leave it open', () => {
      component.onSingleInputChanged('lon');
      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should cancel an in-flight multi search independently of the single one', () => {
      component.onSingleInputChanged('lon');
      component.onMultiInputChanged('par');
      expect(scenarioTelemetry.getActive()).toHaveLength(2);

      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should cancel an in-flight selection validation', () => {
      component.onOptionSelected(component.options[0]);
      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should not throw when nothing is in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
