import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsFileUploadComponent } from 'cps-ui-kit';
import { Observable, catchError, from, map, of } from 'rxjs';

@Component({
  selector: 'app-file-upload-page',
  standalone: true,
  imports: [CommonModule, CpsFileUploadComponent],
  templateUrl: './file-upload-page.component.html',
  styleUrls: ['./file-upload-page.component.scss'],
  host: { class: 'composition-page' }
})
export class FileUploadPageComponent {
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
