import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';
import {
  CPS_LOG_API_PROVIDER,
  CpsNoopTelemetrySink,
  CpsScenarioTelemetryService,
  CpsTelemetrySink,
  provideCpsTelemetry
} from 'cps-telemetry';
import { AppLogApiProvider } from '../../services/app-log-api.provider';
import { FileUploadPageComponent } from './file-upload-page.component';

/** jsdom's `File` has no `.text()`, so this stands in with just what's used. */
function makeFile(name: string): File {
  return {
    name,
    text: () => Promise.resolve('contents')
  } as unknown as File;
}

describe('FileUploadPageComponent', () => {
  let component: FileUploadPageComponent;
  let scenarioTelemetry: CpsScenarioTelemetryService;

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

    component = TestBed.runInInjectionContext(
      () => new FileUploadPageComponent()
    );
    scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
  });

  describe('processing scenarios within one widget', () => {
    it("should track each filename's scenario independently", () => {
      component.processExtraInfoUploadedFile(makeFile('a.txt')).subscribe();
      component.processExtraInfoUploadedFile(makeFile('b.txt')).subscribe();

      expect(scenarioTelemetry.getActive()).toHaveLength(2);
    });

    it('should cancel only the file that fired the cancel, not a different one still in flight', () => {
      component.processExtraInfoUploadedFile(makeFile('a.txt')).subscribe();
      component.processExtraInfoUploadedFile(makeFile('b.txt')).subscribe();

      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component.onExtraInfoFileProcessingCancelled('a.txt');

      expect(settled).toHaveBeenCalledTimes(1);
      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'abandoned' })
      );
      expect(scenarioTelemetry.getActive()).toHaveLength(1);
    });

    it('should not leave either scenario open once both are cancelled', () => {
      component.processExtraInfoUploadedFile(makeFile('a.txt')).subscribe();
      component.processExtraInfoUploadedFile(makeFile('b.txt')).subscribe();

      component.onExtraInfoFileProcessingCancelled('a.txt');
      component.onExtraInfoFileProcessingCancelled('b.txt');

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should tolerate a cancel for a filename with nothing in flight', () => {
      expect(() =>
        component.onExtraInfoFileProcessingCancelled('never-started.txt')
      ).not.toThrow();
    });
  });

  describe('processing scenarios across the two widgets', () => {
    it('should track both scenarios independently even when the two widgets upload a same-named file', () => {
      component
        .processExtraInfoUploadedFile(makeFile('report.csv'))
        .subscribe();
      component.processDisabledUploadedFile(makeFile('report.csv')).subscribe();

      expect(scenarioTelemetry.getActive()).toHaveLength(2);
    });

    it("should cancel only the widget that fired the cancel, not the other widget's same-named file", () => {
      component
        .processExtraInfoUploadedFile(makeFile('report.csv'))
        .subscribe();
      component.processDisabledUploadedFile(makeFile('report.csv')).subscribe();

      component.onExtraInfoFileProcessingCancelled('report.csv');

      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      component.onDisabledFileProcessingCancelled('report.csv');

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });
  });

  describe('successful processing', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should settle the scenario as success, even wrapped in take(1) the way CpsFileUploadComponent consumes it', async () => {
      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component
        .processExtraInfoUploadedFile(makeFile('a.txt'))
        .pipe(take(1))
        .subscribe();

      await jest.advanceTimersByTimeAsync(3000);

      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' })
      );
      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });
  });

  describe('onFailingFileProcessingCancelled', () => {
    it('should cancel the failing-widget scenario, not leave it open until its timeout', () => {
      component.processFailingUploadedFile().subscribe();
      expect(scenarioTelemetry.getActive()).toHaveLength(1);

      component.onFailingFileProcessingCancelled();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should settle it as abandoned, not let it self-settle as a timeout', () => {
      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component.processFailingUploadedFile().subscribe();
      component.onFailingFileProcessingCancelled();

      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'abandoned' })
      );
    });

    it('should tolerate a cancel with nothing in flight', () => {
      expect(() => component.onFailingFileProcessingCancelled()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should cancel every widget still processing when the page is destroyed', () => {
      component.processExtraInfoUploadedFile(makeFile('a.txt')).subscribe();
      component.processDisabledUploadedFile(makeFile('b.txt')).subscribe();
      component.processFailingUploadedFile().subscribe();

      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should not throw when nothing is in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
