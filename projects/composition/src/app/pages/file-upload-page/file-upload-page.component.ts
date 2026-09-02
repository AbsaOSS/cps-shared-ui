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

  /**
   * Processing scenarios in flight, keyed by filename — two
   * `<cps-file-upload>` widgets share this callback, and filename is what
   * {@link onFileProcessingCancelled} correlates by.
   */
  private uploadScenarios = new Map<string, CpsScenario>();

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

  processUploadedFile = (file: File): Observable<boolean> => {
    const scenario = this._startUploadScenario('process');
    this.uploadScenarios.set(file.name, scenario);

    return from(file.text()).pipe(
      delay(3000),
      traceScenario(scenario, () => ({
        metadata: { fileSize: file.size }
      })),
      map((fileContentsAsText) => {
        console.log(fileContentsAsText);
        this.uploadScenarios.delete(file.name);
        return true;
      }),
      catchError((error) => {
        this.logger.error('Error reading file', {
          error,
          context: 'FileUpload',
          correlationId: scenario.id
        });
        this.uploadScenarios.delete(file.name);
        return of(false);
      })
    );
  };

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

  onFileProcessingCancelled(fileName: string) {
    console.log('File processing cancelled', fileName);
    this.uploadScenarios.get(fileName)?.cancel({ reason: 'user-cancelled' });
    this.uploadScenarios.delete(fileName);
  }

  ngOnDestroy(): void {
    for (const scenario of this.uploadScenarios.values()) {
      scenario.cancel({ reason: 'component-destroyed' });
    }
    this.uploadScenarios.clear();
    this.failingUploadScenario?.cancel({ reason: 'component-destroyed' });
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
