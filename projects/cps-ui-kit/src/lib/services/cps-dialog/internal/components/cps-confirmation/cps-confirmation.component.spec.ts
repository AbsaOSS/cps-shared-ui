import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsConfirmationComponent } from './cps-confirmation.component';
import { CpsDialogRef } from '../../../utils/cps-dialog-ref';
import { CpsDialogConfig } from '../../../utils/cps-dialog-config';

describe('CpsConfirmationComponent', () => {
  let component: CpsConfirmationComponent;
  let fixture: ComponentFixture<CpsConfirmationComponent>;
  let mockDialogRef: Partial<CpsDialogRef>;
  let mockDialogConfig: Partial<CpsDialogConfig>;

  function createComponent(subtitle: string) {
    mockDialogRef = { close: jest.fn() };
    mockDialogConfig = { data: { subtitle } };

    TestBed.configureTestingModule({
      imports: [CpsConfirmationComponent],
      providers: [
        { provide: CpsDialogRef, useValue: mockDialogRef },
        { provide: CpsDialogConfig, useValue: mockDialogConfig }
      ]
    });

    fixture = TestBed.createComponent(CpsConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent('plain text');
    expect(component).toBeTruthy();
  });

  it('should render plain text subtitle', () => {
    createComponent('Are you sure?');
    const subtitleEl: HTMLElement =
      fixture.nativeElement.querySelector('.cps-confirmation-subtitle');
    expect(subtitleEl.textContent).toContain('Are you sure?');
  });

  it('should render HTML in subtitle', () => {
    createComponent('Delete <b>my-resource</b>?');
    const subtitleEl: HTMLElement =
      fixture.nativeElement.querySelector('.cps-confirmation-subtitle');
    expect(subtitleEl.innerHTML).toContain('<b>my-resource</b>');
  });

  it('should close with true when Yes is clicked', () => {
    createComponent('Confirm?');
    component.close(true);
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false when No is clicked', () => {
    createComponent('Confirm?');
    component.close(false);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
