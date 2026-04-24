import { Component, ViewChild } from '@angular/core';
import {
  CpsFileUploadComponent,
  CpsButtonToggleComponent,
  CpsButtonToggleOption,
  CpsDividerComponent,
  CpsButtonComponent
} from 'cps-ui-kit';
import { Observable, catchError, delay, from, map, of } from 'rxjs';

import ComponentData from '../../api-data/cps-file-upload.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  selector: 'app-file-upload-page',
  imports: [
    CpsButtonToggleComponent,
    CpsButtonComponent,
    CpsFileUploadComponent,
    ComponentDocsViewerComponent,
    CpsDividerComponent
  ],
  templateUrl: './file-upload-page.component.html',
  styleUrls: ['./file-upload-page.component.scss'],
  host: { class: 'composition-page' }
})
export class FileUploadPageComponent {
  @ViewChild('fileUpload') fileUpload?: CpsFileUploadComponent;

  componentData = ComponentData;

  fileUploadOptions: CpsButtonToggleOption[] = [
    { label: 'JPG image', value: '.jpg' },
    { label: 'PDF document', value: '.pdf' },
    { label: 'PNG image', value: '.png' }
  ];

  selectedFileUploadType: CpsButtonToggleOption = this.fileUploadOptions[0];

  isDisabled = true;

  fileInfo: string =
    'The file should be a small sample file to infer the schema, which will be shown in the next step';

  processUploadedFile(file: File): Observable<boolean> {
    return from(file.text()).pipe(
      delay(3000),
      map((fileContentsAsText) => {
        console.log(fileContentsAsText);
        return true;
      }),
      catchError((error) => {
        console.error('Error reading file', error);
        return of(false);
      })
    );
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
