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
export class FileUploadPageComponent {}
