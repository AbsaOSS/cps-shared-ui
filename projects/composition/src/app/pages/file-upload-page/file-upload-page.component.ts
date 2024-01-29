import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsFileUploadComponent } from 'cps-ui-kit';
import { Observable, catchError, from, map, of } from 'rxjs';

import ComponentData from '../../api-data/cps-file-upload.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  selector: 'app-file-upload-page',
  standalone: true,
  imports: [CommonModule, CpsFileUploadComponent, ComponentDocsViewerComponent],
  templateUrl: './file-upload-page.component.html',
  styleUrls: ['./file-upload-page.component.scss'],
  host: { class: 'composition-page' }
})
export class FileUploadPageComponent {
  componentData = ComponentData;

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
}
