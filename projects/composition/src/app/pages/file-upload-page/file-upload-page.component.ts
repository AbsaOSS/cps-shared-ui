import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CpsFileUploadComponent,
  CpsButtonToggleComponent,
  CpsButtonToggleOption,
  CpsIconComponent,
  CpsDividerComponent
} from 'cps-ui-kit';
import { Observable, catchError, from, map, of } from 'rxjs';

import ComponentData from '../../api-data/cps-file-upload.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  selector: 'app-file-upload-page',
  standalone: true,
  imports: [
    CommonModule,
    CpsIconComponent,
    CpsButtonToggleComponent,
    CpsFileUploadComponent,
    ComponentDocsViewerComponent,
    CpsDividerComponent
  ],
  templateUrl: './file-upload-page.component.html',
  styleUrls: ['./file-upload-page.component.scss'],
  host: { class: 'composition-page' }
})
export class FileUploadPageComponent {
  componentData = ComponentData;
  fileUploadOptions: CpsButtonToggleOption[] = [
    { label: 'JPG image', value: '.jpg' },
    { label: 'PDF document', value: '.pdf' },
    { label: 'PNG image', value: '.png' }
  ];

  selectedFileUploadType: CpsButtonToggleOption = this.fileUploadOptions[0];

  processUploadedFile(file: File): Observable<boolean> {
    return from(file.text()).pipe(
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

  onUploadedFileRemoved(fileName: string) {
    console.log('File removed: ', fileName);
  }

  onFileExtensionChanged(event: string) {
    const foundSelectedItem = this.fileUploadOptions.find(
      (item) => item.value === event
    );
    if (foundSelectedItem) {
      this.selectedFileUploadType = foundSelectedItem;
    }
  }
}
