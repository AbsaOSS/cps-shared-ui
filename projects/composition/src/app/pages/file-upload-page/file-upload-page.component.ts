import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsFileUploadComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-file-upload-page',
  standalone: true,
  imports: [CommonModule, CpsFileUploadComponent],
  templateUrl: './file-upload-page.component.html',
  styleUrls: ['./file-upload-page.component.scss'],
  host: { class: 'composition-page' }
})
export class FileUploadPageComponent {
  isProcessingFile = false;

  async processUploadedFile(file: any) {
    this.isProcessingFile = true;
    const fileContentsAsText = await file.text();
    console.log(fileContentsAsText);
    this.isProcessingFile = false;
  }

  onFileUploadFailed(fileName: string) {
    console.log('File upload failed', fileName);
  }

  onUploadedFileRemoved(fileName: string) {
    console.log('File removed: ', fileName);
  }
}
