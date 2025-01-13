import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CpsFileUploadComponent } from './cps-file-upload.component';

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
      },
      items: {
        add: (item: File) => {
          dataTransfer.files.files.push(item);
        }
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
});
