import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { catchError, Observable, of, take } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';

/**
 * CpsFileUploadComponent is an advanced uploader with dragdrop support.
 * @group Components
 */
@Component({
  selector: 'cps-file-upload',
  standalone: true,
  imports: [CommonModule, CpsIconComponent, CpsProgressLinearComponent],
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
   * Expected file info block, explaining some extra stuff about file.
   * @group Props
   */
  @Input() fileInfo: string = '';

  /**
   * Callback for uploaded file processing.
   * @group Props
   */
  @Input() fileProcessingCallback?: (file: File) => Observable<boolean> =
    undefined;

  /**
   * Callback to invoke when file is uploaded.
   * @param {File} File
   * @group Emits
   */
  @Output() fileUploaded = new EventEmitter<File>();

  /**
   * Callback to invoke when file upload fails.
   * @param {string} - file name
   * @group Emits
   */
  @Output() fileUploadFailed = new EventEmitter<string>();

  /**
   * Callback to invoke when uploaded file is removed.
   * @param {string} - file name
   * @group Emits
   */
  @Output() uploadedFileRemoved = new EventEmitter<string>();

  isDragoverFile = false;
  uploadedFile?: File;
  extensionsString = '';
  extensionsStringAsterisks = '';
  cvtWidth = '';

  isProcessingFile = false;

  ngOnInit(): void {
    this.updateExtensionsString();
    this.cvtWidth = convertSize(this.width);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.extensions) {
      this.updateExtensionsString();
    }
  }

  updateExtensionsString(): void {
    this.extensions = this.extensions.map((ext) =>
      ext.startsWith('.') ? ext : '.' + ext
    );
    this.extensionsString = this.extensions.join(', ');
    this.extensionsStringAsterisks = this.extensions
      .map((ext) => '*' + ext)
      .join(', ');
  }

  tryUploadFile(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.isDragoverFile = false;
    let file: File | undefined;

    if (event.type === 'drop') {
      file = (event as DragEvent).dataTransfer?.files.item(0) ?? undefined;
    } else {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length < 1) return;
      file = files.item(0) ?? undefined;
    }

    if (!this._isFileExtensionValid(file)) {
      this.fileUploadFailed.emit(file?.name ?? '');
      return;
    }

    this.uploadedFile = file;
    if (this.uploadedFile) {
      this.fileUploaded.emit(this.uploadedFile);
      if (this.fileProcessingCallback) {
        this.isProcessingFile = true;
        this.fileProcessingCallback(this.uploadedFile)
          .pipe(
            take(1),
            catchError(() => {
              return of(false);
            })
          )
          .subscribe((res) => {
            if (!res) this.removeUploadedFile();
            this.isProcessingFile = false;
          });
      }
    }
  }

  removeUploadedFile() {
    const name = this.uploadedFile?.name ?? '';
    this.uploadedFile = undefined;
    this.uploadedFileRemoved.emit(name);
  }

  private _isFileExtensionValid(file?: File) {
    if (!file) return false;

    if (this.extensions.length < 1) return true;

    for (const ext of this.extensions) {
      if (file.name.endsWith(ext)) return true;
    }

    return false;
  }
}
