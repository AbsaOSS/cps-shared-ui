import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  Input,
  input,
  numberAttribute,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { catchError, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils';
import { focusElement } from '../../utils/internal/accessibility-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import {
  CpsTooltipDirective,
  CpsTooltipPosition
} from '../../directives/cps-tooltip/cps-tooltip.directive';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';

/**
 * CpsFileUploadComponent is an advanced uploader with dragdrop support.
 * @group Components
 */
@Component({
  selector: 'cps-file-upload',
  imports: [
    CommonModule,
    CpsIconComponent,
    CpsProgressLinearComponent,
    CpsTooltipDirective
  ],
  templateUrl: './cps-file-upload.component.html',
  styleUrls: ['./cps-file-upload.component.scss']
})
export class CpsFileUploadComponent implements OnInit, OnChanges, OnDestroy {
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
   * Aria label for the component, used for accessibility.
   * @group Props
   */
  @Input() ariaLabel = 'Upload file';

  /**
   * Expected file info block, explaining some extra stuff about file.
   * @group Props
   */
  @Input() fileInfo: string = '';

  /**
   * Whether the component is disabled.
   * @group Props
   */
  @Input({ transform: booleanAttribute }) disabled = false;

  /**
   * Callback for uploaded file processing.
   * @group Props
   */
  @Input() fileProcessingCallback?: (file: File) => Observable<boolean> =
    undefined;

  /**
   * Position of file name tooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() fileNameTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * File name tooltip offset for styling.
   * @group Props
   */
  @Input({ transform: numberAttribute }) fileNameTooltipOffset: number = 12;

  /**
   * Width of the component, a number denoting pixels or a string.
   * @group Props
   * @default 100%
   */
  width = input<number | string>('100%');

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
   * Callback to invoke when file is processed.
   * @param {File} File
   * @group Emits
   */
  @Output() fileProcessed = new EventEmitter<File>();

  /**
   * Callback to invoke when file processing fails.
   * @param {string} - file name
   * @group Emits
   */
  @Output() fileProcessingFailed = new EventEmitter<string>();

  /**
   * Callback to invoke when file processing is cancelled.
   * @param {string} - file name
   * @group Emits
   */
  @Output() fileProcessingCancelled = new EventEmitter<string>();

  /**
   * Callback to invoke when uploaded file is removed.
   * @param {string} - file name
   * @group Emits
   */
  @Output() uploadedFileRemoved = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dropzoneButton') dropzoneButton?: ElementRef<HTMLButtonElement>;

  isDragoverFile = false;
  uploadedFile?: File;
  extensionsString = '';
  extensionsStringAsterisks = '';
  cvtWidth = computed(() => convertSize(this.width()));

  isProcessingFile = false;
  errorMessage = '';

  private dragCounter = 0;
  private readonly cancelProcessing$ = new Subject<void>();

  ngOnInit(): void {
    this.updateExtensionsString();
  }

  ngOnDestroy(): void {
    this.cancelProcessing$.next();
    this.cancelProcessing$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.extensions) {
      this.updateExtensionsString();
    }
  }

  resetState() {
    this.cancelFileProcessing();
    this.errorMessage = '';
    this.dragCounter = 0;
    this.isDragoverFile = false;
  }

  openFilePicker(): void {
    if (this.isProcessingFile) return;
    this.fileInput?.nativeElement.click();
  }

  onDragEnter() {
    this.dragCounter++;
    this.isDragoverFile = true;
  }

  onDragLeave() {
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.isDragoverFile = false;
      this.dragCounter = 0;
    }
  }

  onDragEnd() {
    this.dragCounter = 0;
    this.isDragoverFile = false;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragoverFile = true;
  }

  onDrop(event: Event) {
    event.preventDefault();
    this.dragCounter = 0;
    this.isDragoverFile = false;
    this.tryUploadFile(event);
  }

  updateExtensionsString(): void {
    this.extensions = this.extensions.map((ext) =>
      ext.startsWith('.') ? ext.toLowerCase() : '.' + ext.toLowerCase()
    );
    this.extensionsString = this.extensions.join(', ');
    this.extensionsStringAsterisks = this.extensions
      .map((ext) => '*' + ext)
      .join(', ');
  }

  tryUploadFile(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessingFile) return;

    this.isDragoverFile = false;
    this.errorMessage = '';
    let file: File | undefined;

    if (event.type === 'drop') {
      file = (event as DragEvent).dataTransfer?.files.item(0) ?? undefined;
    } else {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length < 1) return;
      file = files.item(0) ?? undefined;
    }

    if (!this._isFileExtensionValid(file)) {
      this.errorMessage = 'Unsupported file type';
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
            takeUntil(this.cancelProcessing$),
            catchError(() => {
              return of(false);
            })
          )
          .subscribe((res) => {
            this.isProcessingFile = false;
            if (res) {
              this.fileProcessed.emit(this.uploadedFile);
            } else {
              this.errorMessage = 'File processing failed';
              this.fileProcessingFailed.emit(this.uploadedFile?.name ?? '');
              this.removeUploadedFile();
            }
          });
      }
    }
  }

  onRemoveUploadedFile(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.removeUploadedFile();
    focusElement(this.dropzoneButton?.nativeElement);
  }

  onCancelFileProcessing(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.cancelFileProcessing();
    focusElement(this.dropzoneButton?.nativeElement);
  }

  cancelFileProcessing() {
    this.cancelProcessing$.next();
    this.isProcessingFile = false;
    const name = this.uploadedFile?.name;
    if (name) {
      this.fileProcessingCancelled.emit(name);
    }
    this.removeUploadedFile();
  }

  removeUploadedFile() {
    const name = this.uploadedFile?.name;
    this.uploadedFile = undefined;
    if (name) {
      this.uploadedFileRemoved.emit(name);
    }

    const inputEl = this.fileInput?.nativeElement;
    if (inputEl) {
      inputEl.value = '';
    }
  }

  private _isFileExtensionValid(file?: File) {
    if (!file) return false;

    if (this.extensions.length < 1) return true;
    const fileNameLowerCase = file.name.toLowerCase();

    return this.extensions.some((ext) => fileNameLowerCase.endsWith(ext));
  }
}
