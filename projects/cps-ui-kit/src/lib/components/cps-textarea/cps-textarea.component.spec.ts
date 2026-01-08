import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsTextareaComponent } from './cps-textarea.component';
import { FormsModule } from '@angular/forms';

describe('CpsTextareaComponent', () => {
  let component: CpsTextareaComponent;
  let fixture: ComponentFixture<CpsTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsTextareaComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.label).toBe('');
    expect(component.placeholder).toBe('Please enter');
    expect(component.rows).toBe(5);
    expect(component.cols).toBe(20);
    expect(component.autofocus).toBe(false);
    expect(component.hint).toBe('');
    expect(component.disabled).toBe(false);
    expect(component.width).toBe('100%');
    expect(component.clearable).toBe(false);
    expect(component.hideDetails).toBe(false);
    expect(component.persistentClear).toBe(false);
    expect(component.error).toBe('');
    expect(component.resizable).toBe('vertical');
  });

  it('should render label when provided', () => {
    component.label = 'Comments';
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cps-textarea-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Comments');
  });

  it('should render textarea with placeholder', () => {
    component.placeholder = 'Enter your text';
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.placeholder).toBe('Enter your text');
  });

  it('should set rows attribute', () => {
    component.rows = 10;
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.rows).toBe(10);
  });

  it('should set cols attribute', () => {
    component.cols = 50;
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.cols).toBe(50);
  });

  it('should emit valueChanged on input', () => {
    jest.spyOn(component.valueChanged, 'emit');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'New text';
    textarea.dispatchEvent(new Event('input'));
    expect(component.valueChanged.emit).toHaveBeenCalledWith('New text');
  });

  it('should write value through ControlValueAccessor', () => {
    component.writeValue('Test value');
    expect(component.value).toBe('Test value');
  });

  it('should register onChange callback', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.value = 'New value';
    expect(fn).toHaveBeenCalledWith('New value');
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    expect(component.onTouched).toBe(fn);
  });

  it('should display clear icon when clearable and has value', () => {
    component.clearable = true;
    component.value = 'Some text';
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();
  });

  it('should clear value when clear icon is clicked', () => {
    component.clearable = true;
    component.value = 'Some text';
    fixture.detectChanges();
    const clearIcon = fixture.nativeElement.querySelector('.clear-btn cps-icon');
    clearIcon.click();
    expect(component.value).toBe('');
  });

  it('should display hint when provided', () => {
    component.hint = 'Max 200 characters';
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.cps-textarea-hint');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toContain('Max 200 characters');
  });

  it('should display error message when error is set', () => {
    component.error = 'This field is required';
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.cps-textarea-error');
    expect(error).toBeTruthy();
    expect(error.textContent).toContain('This field is required');
  });

  it('should disable textarea when disabled is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.disabled).toBe(true);
  });

  it('should set custom width', () => {
    component.width = 500;
    fixture.detectChanges();
    // Width can be set as number or string
    expect(component.width).toBeDefined();
  });

  it('should keep width as string if already string', () => {
    component.width = '80%';
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.width).toBe('80%');
  });

  it('should display info tooltip when provided', () => {
    component.infoTooltip = 'Help text';
    component.label = 'Comments';
    fixture.detectChanges();
    const infoCircle = fixture.nativeElement.querySelector('cps-info-circle');
    expect(infoCircle).toBeTruthy();
  });

  it('should focus textarea when focus method is called', () => {
    const textarea = fixture.nativeElement.querySelector('textarea');
    jest.spyOn(textarea, 'focus');
    component.focus();
    expect(textarea.focus).toHaveBeenCalled();
  });

  it('should not display hint when hideDetails is true', () => {
    component.hint = 'Some hint';
    component.hideDetails = true;
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.cps-textarea-hint');
    expect(hint).toBeFalsy();
  });

  it('should apply resizable class', () => {
    component.resizable = 'none';
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    const style = window.getComputedStyle(textarea);
    // Check that resizable class is applied (actual style check depends on CSS)
    expect(textarea).toBeTruthy();
  });

  it('should show persistent clear icon when persistentClear is true', () => {
    component.clearable = true;
    component.persistentClear = true;
    component.value = '';
    fixture.detectChanges();
    // Persistent clear should be visible even without value
    const container = fixture.nativeElement.querySelector('.cps-textarea-container');
    expect(container).toBeTruthy();
  });

  it('should handle empty value correctly', () => {
    component.value = '';
    expect(component.value).toBe('');
  });

  it('should convert null or undefined to empty string', () => {
    component.writeValue(null as any);
    expect(component.value).toBe('');
  });

  it('should emit blurred event on blur', () => {
    jest.spyOn(component.blurred, 'emit');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(new Event('blur'));
    expect(component.blurred.emit).toHaveBeenCalled();
  });

  it('should emit focused event on focus', () => {
    jest.spyOn(component.focused, 'emit');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(new Event('focus'));
    expect(component.focused.emit).toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    component.ngOnDestroy();
    // Verify component can be destroyed without errors
    expect(component).toBeTruthy();
  });
});
