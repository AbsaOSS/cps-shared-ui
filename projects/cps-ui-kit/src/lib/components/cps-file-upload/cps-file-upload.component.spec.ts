import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync
} from '@angular/core/testing';
import { CpsFileUploadComponent } from './cps-file-upload.component';
import { Observable, of, throwError } from 'rxjs';

function makeFileList(files: File[]): FileList {
  const list: Record<number, File> & {
    length: number;
    item: (i: number) => File | null;
  } = {
    length: files.length,
    item: (i: number) => files[i] ?? null
  };
  files.forEach((file, i) => (list[i] = file));
  return list as unknown as FileList;
}

function makeChangeEvent(file: File | null): Event {
  const input = document.createElement('input');
  Object.defineProperty(input, 'files', {
    value: makeFileList(file ? [file] : []),
    writable: false
  });
  const event = new Event('change');
  Object.defineProperty(event, 'target', { value: input, writable: false });
  return event;
}

describe('CpsFileUploadComponent', () => {
  let component: CpsFileUploadComponent;
  let fixture: ComponentFixture<CpsFileUploadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CpsFileUploadComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsFileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should upload a file', async () => {
    fixture.autoDetectChanges();
    const file = new File([''], 'testFile.JPG', { type: 'image/jpeg' });
    component.extensions = ['.jpg'];
    // Create a mock DataTransfer object
    const dataTransfer = {
      files: {
        item: (index: number): any => dataTransfer.files.files[index],
        files: [file]
      }
    };
    const event = new Event('drop');
    Object.defineProperty(event, 'dataTransfer', {
      value: dataTransfer,
      writable: false
    });
    // define dropzone element
    const dropzone = fixture.nativeElement.querySelector(
      '.cps-file-upload-dropzone'
    );
    dropzone.dispatchEvent(event);

    await fixture.whenStable();

    expect(component.uploadedFile).toBe(file);
  });

  it('should convert extensions to lowercase and format them correctly', () => {
    component.extensions = ['.JPG', 'PNG', 'gif'];
    component.updateExtensionsString();

    expect(component.extensions).toEqual(['.jpg', '.png', '.gif']);
    expect(component.extensionsString).toBe('.jpg, .png, .gif');
    expect(component.extensionsStringAsterisks).toBe('*.jpg, *.png, *.gif');
  });

  describe('extension validation', () => {
    it('should reject a file with an unsupported extension', () => {
      const file = new File([''], 'document.pdf');
      component.extensions = ['.jpg'];
      component.tryUploadFile(makeChangeEvent(file));

      expect(component.uploadedFile).toBeUndefined();
      expect(component.errorMessage).toBe('Unsupported file type');
    });

    it('should emit fileUploadFailed with the file name when the extension is rejected', () => {
      const file = new File([''], 'document.pdf');
      component.extensions = ['.jpg'];
      jest.spyOn(component.fileUploadFailed, 'emit');

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.fileUploadFailed.emit).toHaveBeenCalledWith(
        'document.pdf'
      );
    });

    it('should accept any file when no extensions are configured', () => {
      const file = new File([''], 'anything.xyz');
      component.extensions = [];

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.uploadedFile).toBe(file);
    });

    it('should accept a file regardless of extension case', () => {
      const file = new File([''], 'PHOTO.JPG');
      component.extensions = ['.jpg'];

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.uploadedFile).toBe(file);
    });
  });

  describe('file selection via the native file input', () => {
    it('should upload a file selected through the change event', () => {
      const file = new File([''], 'photo.jpg');
      component.extensions = ['.jpg'];

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.uploadedFile).toBe(file);
    });

    it('should do nothing when the change event has no files', () => {
      component.tryUploadFile(makeChangeEvent(null));

      expect(component.uploadedFile).toBeUndefined();
    });

    it('should emit fileUploaded when a file is accepted', () => {
      const file = new File([''], 'photo.jpg');
      jest.spyOn(component.fileUploaded, 'emit');

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.fileUploaded.emit).toHaveBeenCalledWith(file);
    });
  });

  describe('guards', () => {
    it('should not process a new file while one is already being processed', () => {
      component.isProcessingFile = true;
      const file = new File([''], 'photo.jpg');

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.uploadedFile).toBeUndefined();
    });

    it('should open the file picker when not processing', () => {
      const clickSpy = jest.spyOn(component.fileInput!.nativeElement, 'click');

      component.openFilePicker();

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not open the file picker while processing', () => {
      component.isProcessingFile = true;
      const clickSpy = jest.spyOn(component.fileInput!.nativeElement, 'click');

      component.openFilePicker();

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('drag state', () => {
    it('should set isDragoverFile on drag enter', () => {
      component.onDragEnter();

      expect(component.isDragoverFile).toBe(true);
    });

    it('should keep isDragoverFile true while nested drag enters/leaves are unbalanced', () => {
      component.onDragEnter();
      component.onDragEnter();
      component.onDragLeave();

      expect(component.isDragoverFile).toBe(true);
    });

    it('should clear isDragoverFile once every drag enter has a matching drag leave', () => {
      component.onDragEnter();
      component.onDragEnter();
      component.onDragLeave();
      component.onDragLeave();

      expect(component.isDragoverFile).toBe(false);
    });

    it('should reset drag state on drag end', () => {
      component.onDragEnter();

      component.onDragEnd();

      expect(component.isDragoverFile).toBe(false);
    });

    it('should prevent default and set isDragoverFile on drag over', () => {
      const event = new Event('dragover') as unknown as DragEvent;
      const preventSpy = jest.spyOn(event, 'preventDefault');

      component.onDragOver(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(component.isDragoverFile).toBe(true);
    });
  });

  describe('removeUploadedFile', () => {
    it('should clear the uploaded file and emit uploadedFileRemoved', () => {
      component.uploadedFile = new File([''], 'photo.jpg');
      jest.spyOn(component.uploadedFileRemoved, 'emit');

      component.removeUploadedFile();

      expect(component.uploadedFile).toBeUndefined();
      expect(component.uploadedFileRemoved.emit).toHaveBeenCalledWith(
        'photo.jpg'
      );
    });

    it('should not emit uploadedFileRemoved when there is no uploaded file', () => {
      jest.spyOn(component.uploadedFileRemoved, 'emit');

      component.removeUploadedFile();

      expect(component.uploadedFileRemoved.emit).not.toHaveBeenCalled();
    });

    it('should reset the file input value', () => {
      component.uploadedFile = new File([''], 'photo.jpg');
      const setSpy = jest.spyOn(
        component.fileInput!.nativeElement,
        'value',
        'set'
      );

      component.removeUploadedFile();

      expect(setSpy).toHaveBeenCalledWith('');
    });
  });

  describe('resetState', () => {
    it('should clear the error message, drag state, processing state and uploaded file', () => {
      component.errorMessage = 'Unsupported file type';
      component.isDragoverFile = true;
      component.isProcessingFile = true;
      component.uploadedFile = new File([''], 'photo.jpg');

      component.resetState();

      expect(component.errorMessage).toBe('');
      expect(component.isDragoverFile).toBe(false);
      expect(component.isProcessingFile).toBe(false);
      expect(component.uploadedFile).toBeUndefined();
    });
  });

  describe('focus restoration', () => {
    it('should prevent default and stop propagation when removing the uploaded file', () => {
      const event = new Event('click');
      const preventSpy = jest.spyOn(event, 'preventDefault');
      const stopSpy = jest.spyOn(event, 'stopPropagation');

      component.onRemoveUploadedFile(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should focus the dropzone button after removing the uploaded file', fakeAsync(() => {
      component.uploadedFile = new File([''], 'photo.jpg');
      fixture.detectChanges();
      const focusSpy = jest.spyOn(
        component.dropzoneButton!.nativeElement,
        'focus'
      );

      component.onRemoveUploadedFile(new Event('click'));
      tick();

      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should prevent default and stop propagation when cancelling processing', () => {
      const event = new Event('click');
      const preventSpy = jest.spyOn(event, 'preventDefault');
      const stopSpy = jest.spyOn(event, 'stopPropagation');

      component.onCancelFileProcessing(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should focus the dropzone button after cancelling processing', fakeAsync(() => {
      component.uploadedFile = new File([''], 'photo.jpg');
      component.isProcessingFile = true;
      fixture.detectChanges();
      const focusSpy = jest.spyOn(
        component.dropzoneButton!.nativeElement,
        'focus'
      );

      component.onCancelFileProcessing(new Event('click'));
      tick();

      expect(focusSpy).toHaveBeenCalled();
    }));
  });

  describe('cancelFileProcessing', () => {
    it('should emit fileProcessingCancelled with the file name', () => {
      component.uploadedFile = new File([''], 'photo.jpg');
      jest.spyOn(component.fileProcessingCancelled, 'emit');

      component.cancelFileProcessing();

      expect(component.fileProcessingCancelled.emit).toHaveBeenCalledWith(
        'photo.jpg'
      );
    });

    it('should not emit fileProcessingCancelled when there is no uploaded file', () => {
      jest.spyOn(component.fileProcessingCancelled, 'emit');

      component.cancelFileProcessing();

      expect(component.fileProcessingCancelled.emit).not.toHaveBeenCalled();
    });

    it('should remove the uploaded file', () => {
      component.uploadedFile = new File([''], 'photo.jpg');

      component.cancelFileProcessing();

      expect(component.uploadedFile).toBeUndefined();
    });

    it('should set isProcessingFile to false', () => {
      component.isProcessingFile = true;

      component.cancelFileProcessing();

      expect(component.isProcessingFile).toBe(false);
    });
  });

  describe('fileProcessingCallback pipeline', () => {
    it('should not enter a processing state when no callback is provided', () => {
      const file = new File([''], 'photo.jpg');

      component.tryUploadFile(makeChangeEvent(file));

      expect(component.isProcessingFile).toBe(false);
    });

    it('should set isProcessingFile while pending and emit fileProcessed on success', fakeAsync(() => {
      const file = new File([''], 'photo.jpg');
      let resolveCallback!: (value: boolean) => void;
      const pending$ = new Observable<boolean>((subscriber) => {
        resolveCallback = (value: boolean) => {
          subscriber.next(value);
          subscriber.complete();
        };
      });
      component.fileProcessingCallback = () => pending$;
      jest.spyOn(component.fileProcessed, 'emit');

      component.tryUploadFile(makeChangeEvent(file));
      expect(component.isProcessingFile).toBe(true);

      resolveCallback(true);
      tick();

      expect(component.isProcessingFile).toBe(false);
      expect(component.fileProcessed.emit).toHaveBeenCalledWith(file);
    }));

    it('should show a failure error, emit fileProcessingFailed and remove the file when the callback resolves false', fakeAsync(() => {
      const file = new File([''], 'photo.jpg');
      component.fileProcessingCallback = () => of(false);
      jest.spyOn(component.fileProcessingFailed, 'emit');

      component.tryUploadFile(makeChangeEvent(file));
      tick();

      expect(component.isProcessingFile).toBe(false);
      expect(component.errorMessage).toBe('File processing failed');
      expect(component.fileProcessingFailed.emit).toHaveBeenCalledWith(
        'photo.jpg'
      );
      expect(component.uploadedFile).toBeUndefined();
    }));

    it('should treat a thrown/errored callback the same as a resolved-false result', fakeAsync(() => {
      const file = new File([''], 'photo.jpg');
      component.fileProcessingCallback = () =>
        throwError(() => new Error('boom'));
      jest.spyOn(component.fileProcessingFailed, 'emit');

      component.tryUploadFile(makeChangeEvent(file));
      tick();

      expect(component.errorMessage).toBe('File processing failed');
      expect(component.fileProcessingFailed.emit).toHaveBeenCalledWith(
        'photo.jpg'
      );
    }));

    it('should stop a pending callback from completing after it is cancelled', fakeAsync(() => {
      const file = new File([''], 'photo.jpg');
      let subscriberRef!: {
        next: (value: boolean) => void;
        complete: () => void;
      };
      const pending$ = new Observable<boolean>((subscriber) => {
        subscriberRef = subscriber;
      });
      component.fileProcessingCallback = () => pending$;
      jest.spyOn(component.fileProcessed, 'emit');
      jest.spyOn(component.fileProcessingFailed, 'emit');

      component.tryUploadFile(makeChangeEvent(file));
      component.cancelFileProcessing();

      subscriberRef.next(true);
      subscriberRef.complete();
      tick();

      expect(component.fileProcessed.emit).not.toHaveBeenCalled();
      expect(component.fileProcessingFailed.emit).not.toHaveBeenCalled();
    }));
  });

  describe('ngOnChanges', () => {
    it('should recompute extensionsString when the extensions input changes', () => {
      component.extensions = ['.png'];

      component.ngOnChanges({
        extensions: {
          currentValue: ['.png'],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.extensionsString).toBe('.png');
    });

    it('should not recompute extensionsString when an unrelated input changes', () => {
      component.extensions = ['.jpg'];
      component.updateExtensionsString();
      const before = component.extensionsString;

      component.ngOnChanges({
        disabled: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.extensionsString).toBe(before);
    });
  });
});
