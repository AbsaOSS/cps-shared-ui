import {
  Component,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import {
  CpsFileUploadComponent,
  CpsButtonToggleComponent,
  CpsButtonToggleOption,
  CpsButtonComponent
} from 'cps-ui-kit';
import { Observable, catchError, delay, from, map, of } from 'rxjs';
import {
  CpsLoggerService,
  CpsScenario,
  CpsScenarioTelemetryService,
  traceScenario
} from 'cps-telemetry';
import '../../services/telemetry.schema';

import ComponentData from '../../api-data/cps-file-upload.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { fileUploadExamples } from './file-upload-page.examples';

@Component({
  selector: 'app-file-upload-page',
  imports: [
    CpsButtonToggleComponent,
    CpsButtonComponent,
    CpsFileUploadComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './file-upload-page.component.html',
  styleUrls: ['./file-upload-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'composition-page' }
})
export class FileUploadPageComponent implements OnDestroy {
  @ViewChild('fileUpload') fileUpload?: CpsFileUploadComponent;

  private readonly scenarioTelemetry = inject(CpsScenarioTelemetryService);
  private readonly logger = inject(CpsLoggerService).getLogger('file-upload');

  /** Processing scenarios in flight for the "extra info" widget, keyed by filename. */
  private extraInfoUploadScenarios = new Map<string, CpsScenario>();

  /** Same as {@link extraInfoUploadScenarios}, for the "disabled" widget. */
  private disabledUploadScenarios = new Map<string, CpsScenario>();

  /**
   * The processing scenario for the failing-upload demo widget, which has no
   * `fileProcessingCancelled` wiring of its own and whose callback receives
   * no `File` to key a map entry by.
   */
  private failingUploadScenario?: CpsScenario;

  componentData = ComponentData;
  readonly examples = fileUploadExamples;

  fileUploadOptions: CpsButtonToggleOption[] = [
    { label: 'JPG image', value: '.jpg' },
    { label: 'PDF document', value: '.pdf' },
    { label: 'PNG image', value: '.png' }
  ];

  selectedFileUploadType: CpsButtonToggleOption = this.fileUploadOptions[0];

  isDisabled = true;

  fileInfo: string =
    'The file should be a small sample file to infer the schema, which will be shown in the next step';

  processExtraInfoUploadedFile = (file: File): Observable<boolean> =>
    this._processUploadedFile(file, this.extraInfoUploadScenarios);

  processDisabledUploadedFile = (file: File): Observable<boolean> =>
    this._processUploadedFile(file, this.disabledUploadScenarios);

  private _processUploadedFile(
    file: File,
    scenarios: Map<string, CpsScenario>
  ): Observable<boolean> {
    const scenario = this._startUploadScenario('process');
    scenarios.set(file.name, scenario);

    return from(file.text()).pipe(
      delay(3000),
      traceScenario(scenario, () => ({
        metadata: { fileSize: file.size }
      })),
      map((fileContentsAsText) => {
        console.log(fileContentsAsText);
        scenarios.delete(file.name);
        return true;
      }),
      catchError((error) => {
        this.logger.error('Error reading file', {
          error,
          context: 'FileUpload',
          correlationId: scenario.id
        });
        scenarios.delete(file.name);
        return of(false);
      })
    );
  }

  processFailingUploadedFile = (): Observable<boolean> => {
    const scenario = this._startUploadScenario('process-failing');
    this.failingUploadScenario = scenario;

    return of(false).pipe(
      delay(500),
      map((result) => {
        scenario.fail();
        this.failingUploadScenario = undefined;
        return result;
      })
    );
  };

  /** Starts a `file-upload` scenario and opens its `process` step. */
  private _startUploadScenario(operation: string): CpsScenario {
    const scenario = this.scenarioTelemetry.start({
      name: 'file-upload',
      feature: 'file-upload',
      operation
    });
    scenario.step('process');
    return scenario;
  }

  onFileUploaded(file: File) {
    console.log('File uploaded', file?.name);
  }

  onFileUploadFailed(fileName: string) {
    console.log('File upload failed', fileName);
  }

  onFileProcessed(file: File) {
    console.log('File processed', file?.name);
  }

  onFileProcessingFailed(fileName: string) {
    console.log('File processing failed', fileName);
  }

  onExtraInfoFileProcessingCancelled(fileName: string) {
    console.log('File processing cancelled', fileName);
    this._cancel(this.extraInfoUploadScenarios, fileName, 'user-cancelled');
  }

  onDisabledFileProcessingCancelled(fileName: string) {
    console.log('File processing cancelled', fileName);
    this._cancel(this.disabledUploadScenarios, fileName, 'user-cancelled');
  }

  onFailingFileProcessingCancelled(): void {
    this.failingUploadScenario?.cancel({ reason: 'user-cancelled' });
    this.failingUploadScenario = undefined;
  }

  private _cancel(
    scenarios: Map<string, CpsScenario>,
    fileName: string,
    reason: string
  ): void {
    scenarios.get(fileName)?.cancel({ reason });
    scenarios.delete(fileName);
  }

  ngOnDestroy(): void {
    this._cancelAll(this.extraInfoUploadScenarios);
    this._cancelAll(this.disabledUploadScenarios);
    this.failingUploadScenario?.cancel({ reason: 'component-destroyed' });
  }

  private _cancelAll(scenarios: Map<string, CpsScenario>): void {
    for (const scenario of scenarios.values()) {
      scenario.cancel({ reason: 'component-destroyed' });
    }
    scenarios.clear();
  }

  onUploadedFileRemoved(fileName: string) {
    console.log('File removed: ', fileName);
  }

  onFileExtensionChanged(event: string) {
    this.fileUpload?.resetState();
    const foundSelectedItem = this.fileUploadOptions.find(
      (item) => item.value === event
    );
    if (foundSelectedItem) {
      this.selectedFileUploadType = foundSelectedItem;
    }
  }

  toggleDisabled() {
    this.isDisabled = !this.isDisabled;
  }
}
