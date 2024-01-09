import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { convertSize } from '../../utils/internal/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';

@Component({
  selector: 'cps-file-upload',
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  templateUrl: './cps-file-upload.component.html',
  styleUrls: ['./cps-file-upload.component.scss']
})
export class CpsFileUploadComponent implements OnInit {
  /**
   * Expected extensions of a file to be uploaded. E.g. 'doc or .doc'.
   * @group Props
   */
  @Input() extensions: string[] = [];

  /**
   * Expected file description. E.g. 'Word document'.
   * @group Props
   */
  @Input() fileDesc = 'Any file';

  /**
   * Width of the component, a number denoting pixels or a string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * When enabled, a loading spinner is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Callback to invoke when file is uploaded.
   * @param {File} File
   * @group Emits
   */
  @Output() fileUploaded = new EventEmitter<File>();

  /**
   * Callback to invoke when file upload fails.
   * @param {void}
   * @group Emits
   */
  @Output() uploadFailed = new EventEmitter();

  isDragoverFile = false;
  uploadedFile?: File;
  extensionsString = '';
  extensionsStringAsterisks = '';

  ngOnInit(): void {
    this.width = convertSize(this.width);
    this.extensions = this.extensions.map((ext) =>
      ext.startsWith('.') ? ext : '.' + ext
    );
    this.extensionsString = this.extensions.join(', ');
    this.extensionsStringAsterisks = this.extensions
      .map((ext) => '*' + ext)
      .join(', ');
  }

  tryUploadFile(event: Event) {
    this.isDragoverFile = false;
    if (event.type === 'drop') {
      this.uploadedFile =
        (event as DragEvent).dataTransfer?.files.item(0) ?? undefined;
    } else {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length < 1) return;
      this.uploadedFile = files.item(0) ?? undefined;
    }

    if (!this._isFileValid(this.uploadedFile)) {
      this.uploadFailed.emit();
      alert('UPLOAD FAILED');
      return;
    }

    this.fileUploaded.emit(this.uploadedFile);
  }

  removeUploadedFile() {
    this.uploadedFile = undefined;
  }

  private _isFileValid(file?: File) {
    if (!file) return false;

    if (this.extensions.length < 1) return true;

    for (const ext of this.extensions) {
      if (file.name.endsWith(ext)) return true;
    }

    return false;
  }
}
