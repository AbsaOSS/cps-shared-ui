const fileUploadHandlersTs = `
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
}`;

export const fileUploadExamples: Record<string, { html: string; ts?: string }> =
  {
    dependentOnSelectedExtension: {
      html: `
<cps-button-toggle
  label="File extension"
  [options]="fileUploadOptions"
  [value]="selectedFileUploadType.value"
  (valueChanged)="onFileExtensionChanged($event)">
</cps-button-toggle>
<cps-file-upload
  #fileUpload
  [extensions]="[selectedFileUploadType.value]"
  [fileDesc]="selectedFileUploadType!.label || ''"
  width="25rem"
  fileNameTooltipPosition="bottom"
  (fileUploadFailed)="onFileUploadFailed($event)"
  (fileUploaded)="onFileUploaded($event)"
  (uploadedFileRemoved)="onUploadedFileRemoved($event)">
</cps-file-upload>`,
      ts: `
@ViewChild('fileUpload') fileUpload?: CpsFileUploadComponent;

fileUploadOptions: CpsButtonToggleOption[] = [
  { label: 'JPG image', value: '.jpg' },
  { label: 'PDF document', value: '.pdf' },
  { label: 'PNG image', value: '.png' }
];

selectedFileUploadType: CpsButtonToggleOption = this.fileUploadOptions[0];

onFileUploadFailed(fileName: string) {
  console.log('File upload failed', fileName);
}

onFileUploaded(file: File) {
  console.log('File uploaded', file?.name);
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
}`
    },

    withExtraInfo: {
      html: `
<cps-file-upload
  [extensions]="['.jpg', '.png', 'pdf']"
  [fileInfo]="fileInfo"
  fileDesc="Pictures or PDFs"
  ariaLabel="Upload pictures or PDFs"
  width="31.25rem"
  fileNameTooltipOffset="0.9375rem"
  [fileProcessingCallback]="processUploadedFile"
  (fileProcessingFailed)="onFileProcessingFailed($event)"
  (fileProcessingCancelled)="onFileProcessingCancelled($event)"
  (fileUploadFailed)="onFileUploadFailed($event)"
  (fileUploaded)="onFileUploaded($event)"
  (fileProcessed)="onFileProcessed($event)"
  (uploadedFileRemoved)="onUploadedFileRemoved($event)">
</cps-file-upload>`,
      ts: fileUploadHandlersTs
    },

    disabledFileUpload: {
      html: `
<cps-file-upload
  [extensions]="['.jpg', '.png', 'pdf']"
  [fileInfo]="fileInfo"
  fileDesc="Pictures or PDFs"
  width="31.25rem"
  fileNameTooltipOffset="0.9375rem"
  [disabled]="isDisabled"
  [fileProcessingCallback]="processUploadedFile"
  (fileProcessingFailed)="onFileProcessingFailed($event)"
  (fileProcessingCancelled)="onFileProcessingCancelled($event)"
  (fileUploadFailed)="onFileUploadFailed($event)"
  (fileUploaded)="onFileUploaded($event)"
  (fileProcessed)="onFileProcessed($event)"
  (uploadedFileRemoved)="onUploadedFileRemoved($event)">
</cps-file-upload>
<cps-button
  label="Toggle disabled"
  (clicked)="toggleDisabled()"
  size="small">
</cps-button>`,
      ts: `
${fileUploadHandlersTs.trim()}

isDisabled = true;

toggleDisabled() {
  this.isDisabled = !this.isDisabled;
}`
    }
  };
