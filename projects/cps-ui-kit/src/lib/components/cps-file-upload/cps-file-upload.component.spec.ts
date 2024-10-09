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
    const fileUploadInput: HTMLInputElement =
      fixture.nativeElement.querySelector('input[type="file"]');
    // Create a mock DataTransfer object
    const dataTransfer = {
      files: [file],
      items: {
        add: (item: File) => {
          dataTransfer.files.push(item);
        }
      }
    };

    // Simulate file upload
    Object.defineProperty(fileUploadInput, 'files', {
      value: dataTransfer.files,
      writable: false
    });
    fileUploadInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fileUploadInput.files && fileUploadInput.files[0]).toBe(file);
  });

  it('should convert extensions to lowercase and format them correctly', () => {
    component.extensions = ['.JPG', 'PNG', 'gif'];
    component.updateExtensionsString();

    expect(component.extensions).toEqual(['.jpg', '.png', '.gif']);
    expect(component.extensionsString).toBe('.jpg, .png, .gif');
    expect(component.extensionsStringAsterisks).toBe('*.jpg, *.png, *.gif');
  });
});
