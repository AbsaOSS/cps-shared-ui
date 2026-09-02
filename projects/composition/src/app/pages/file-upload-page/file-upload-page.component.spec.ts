import { TestBed } from '@angular/core/testing';
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
          environment: 'test'
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

  describe('two widgets sharing processUploadedFile', () => {
    it("should track each widget instance's scenario independently by filename", () => {
      component.processUploadedFile(makeFile('a.txt')).subscribe();
      component.processUploadedFile(makeFile('b.txt')).subscribe();

      expect(scenarioTelemetry.getActive()).toHaveLength(2);
    });

    it('should cancel only the widget that fired the cancel, not a different one still in flight', () => {
      component.processUploadedFile(makeFile('a.txt')).subscribe();
      component.processUploadedFile(makeFile('b.txt')).subscribe();

      const settled = jest.fn();
      scenarioTelemetry.settled$.subscribe(settled);

      component.onFileProcessingCancelled('a.txt');

      expect(settled).toHaveBeenCalledTimes(1);
      expect(settled).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'abandoned' })
      );
      expect(scenarioTelemetry.getActive()).toHaveLength(1);
    });

    it('should not leave either scenario open once both are cancelled', () => {
      component.processUploadedFile(makeFile('a.txt')).subscribe();
      component.processUploadedFile(makeFile('b.txt')).subscribe();

      component.onFileProcessingCancelled('a.txt');
      component.onFileProcessingCancelled('b.txt');

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should tolerate a cancel for a filename with nothing in flight', () => {
      expect(() =>
        component.onFileProcessingCancelled('never-started.txt')
      ).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should cancel every widget still processing when the page is destroyed', () => {
      component.processUploadedFile(makeFile('a.txt')).subscribe();
      component.processUploadedFile(makeFile('b.txt')).subscribe();
      component.processFailingUploadedFile().subscribe();

      component.ngOnDestroy();

      expect(scenarioTelemetry.getActive()).toHaveLength(0);
    });

    it('should not throw when nothing is in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
